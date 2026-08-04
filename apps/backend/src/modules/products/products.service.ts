import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, SelectQueryBuilder } from 'typeorm';
import { createHash } from 'crypto';
import { Product, ProductStatus } from './entities/product.entity';
import {
  ProductReview,
  ProductReviewStatus,
} from './entities/product-review.entity';
import { Quote, QuoteStatus } from './entities/quote.entity';
import {
  QuoteNegotiation,
  OfferedByRole,
} from './entities/quote-negotiation.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { ProductType } from './entities/product-type.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { RequestQuoteDto } from './dto/request-quote.dto';
import { NegotiateQuoteDto } from './dto/negotiate-quote.dto';
import {
  AdminProductQueryDto,
  ProductQueryDto,
  ProductSortField,
  ProductSortOrder,
} from './dto/product-query.dto';
import { CreateProductReviewDto } from './dto/product-review.dto';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';
import { User, UserRole } from '../users/entities/user.entity';
import {
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import { PaymentStatus as OrderPaymentStatus } from './entities/order.entity';

const PRODUCT_ALIAS = 'product';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductReview)
    private productReviewRepository: Repository<ProductReview>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(QuoteNegotiation)
    private negotiationRepository: Repository<QuoteNegotiation>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ProductType)
    private productTypeRepository: Repository<ProductType>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    if (!createProductDto.sku) {
      // Generate a unique SKU if not provided
      createProductDto.sku = `PROD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }
    const product = this.productRepository.create(createProductDto);

    if (createProductDto.productTypeId) {
      const type = await this.productTypeRepository.findOneBy({
        id: createProductDto.productTypeId,
      });
      if (!type) throw new NotFoundException('Product type not found');
      product.productType = type;
    }

    return this.productRepository.save(product);
  }

  // --- Product Type Methods ---

  async createProductType(dto: CreateProductTypeDto): Promise<ProductType> {
    const existing = await this.productTypeRepository.findOne({
      where: [{ name: dto.name }, { slug: dto.slug }],
    });
    if (existing) {
      throw new ConflictException(
        'Product type with name or slug already exists',
      );
    }
    const productType = this.productTypeRepository.create(dto);
    return this.productTypeRepository.save(productType);
  }

  async findAllProductTypes(): Promise<ProductType[]> {
    return this.productTypeRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOneProductType(id: string): Promise<ProductType> {
    const productType = await this.productTypeRepository.findOneBy({ id });
    if (!productType) {
      throw new NotFoundException('Product type not found');
    }
    return productType;
  }

  async updateProductType(
    id: string,
    dto: UpdateProductTypeDto,
  ): Promise<ProductType> {
    const productType = await this.findOneProductType(id);
    Object.assign(productType, dto);
    return this.productTypeRepository.save(productType);
  }

  async removeProductType(id: string): Promise<void> {
    const productType = await this.findOneProductType(id);
    await this.productTypeRepository.remove(productType);
  }

  // --- End Product Type Methods ---

  async createDirectOrder(
    user: User,
    createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    const product = await this.findOne(createOrderDto.productId);

    if (
      product.requestQuoteThreshold &&
      createOrderDto.quantity > product.requestQuoteThreshold
    ) {
      throw new BadRequestException(
        `Quantity exceeds limit for direct order. Please request a quote.`,
      );
    }

    let unitPrice = Number(product.price);

    if (product.priceTiers && Array.isArray(product.priceTiers)) {
      const tier = product.priceTiers.find(
        (t) =>
          createOrderDto.quantity >= t.min &&
          (t.max === null || createOrderDto.quantity <= t.max),
      );
      if (tier) {
        unitPrice = Number(tier.price);
      }
    }

    const totalPrice = unitPrice * createOrderDto.quantity;

    const paymentStatus = OrderPaymentStatus.PENDING;

    const order = this.orderRepository.create({
      product,
      productId: product.id,
      quantity: createOrderDto.quantity,
      unitPrice,
      totalPrice,
      user,
      userId: user.id,
      status: OrderStatus.PENDING,
      paymentStatus,
      paymentReference: createOrderDto.paymentReference,
    });

    return this.orderRepository.save(order);
  }

  async findAllPublished(query: ProductQueryDto = {}) {
    const qb = this.productRepository
      .createQueryBuilder(PRODUCT_ALIAS)
      .leftJoinAndSelect(`${PRODUCT_ALIAS}.productType`, 'productType')
      .where(`${PRODUCT_ALIAS}.status = :status`, {
        status: ProductStatus.PUBLISHED,
      });

    this.applyProductFilters(qb, query);

    const result = await paginateWithCursor<Product>({
      queryBuilder: qb,
      cursor: query.cursor,
      nextCursor: query.nextCursor,
      page: query.page,
      limit: query.limit,
      sortField: query.sortBy || ProductSortField.CREATED_AT,
      sortOrder: query.sortOrder || ProductSortOrder.DESC,
      idField: 'id',
      entityAlias: PRODUCT_ALIAS,
    });

    await this.attachReviewStats(result.data);

    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.meta.lastPage,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    };
  }

  async findAllAdmin(query: AdminProductQueryDto = {}) {
    const qb = this.productRepository
      .createQueryBuilder(PRODUCT_ALIAS)
      .leftJoinAndSelect(`${PRODUCT_ALIAS}.productType`, 'productType');

    if (query.status) {
      qb.andWhere(`${PRODUCT_ALIAS}.status = :status`, {
        status: query.status,
      });
    }

    this.applyProductFilters(qb, query);

    const result = await paginateWithCursor<Product>({
      queryBuilder: qb,
      cursor: query.cursor,
      nextCursor: query.nextCursor,
      page: query.page,
      limit: query.limit,
      sortField: query.sortBy || ProductSortField.CREATED_AT,
      sortOrder: query.sortOrder || ProductSortOrder.DESC,
      idField: 'id',
      entityAlias: PRODUCT_ALIAS,
    });

    await this.attachReviewStats(result.data);

    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.meta.lastPage,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    };
  }

  private applyProductFilters(
    qb: SelectQueryBuilder<Product>,
    query: ProductQueryDto,
  ) {
    if (query.search) {
      qb.andWhere(
        `(${PRODUCT_ALIAS}.name ILIKE :search OR ${PRODUCT_ALIAS}.description ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    if (query.minPrice !== undefined) {
      qb.andWhere(`${PRODUCT_ALIAS}.price >= :minPrice`, {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere(`${PRODUCT_ALIAS}.price <= :maxPrice`, {
        maxPrice: query.maxPrice,
      });
    }

    const categoryId = query.productTypeId || query.category;
    if (categoryId) {
      qb.andWhere(
        `(${PRODUCT_ALIAS}.productTypeId = :category OR productType.name = :category OR productType.slug = :category)`,
        { category: categoryId },
      );
    }
  }

  private async attachReviewStats(products: Product[]): Promise<void> {
    if (!products.length) return;

    const ids = products.map((p) => p.id);
    const rows: { productId: string; avg: string | number }[] =
      await this.productReviewRepository
        .createQueryBuilder('review')
        .select('review.productId', 'productId')
        .addSelect('AVG(review.rating)', 'avg')
        .where('review.productId IN (:...ids)', { ids })
        .andWhere('review.status = :status', {
          status: ProductReviewStatus.APPROVED,
        })
        .groupBy('review.productId')
        .getRawMany();

    const avgMap = new Map<string, number>();
    for (const row of rows) {
      avgMap.set(row.productId, Number(row.avg));
    }

    for (const product of products) {
      if (avgMap.has(product.id)) {
        product.rating = avgMap.get(product.id) as number;
      }
    }
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['productType'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const [{ avg }] = await this.productReviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.productId = :id', { id })
      .andWhere('review.status = :status', {
        status: ProductReviewStatus.APPROVED,
      })
      .getRawMany<{ avg: string | null }>();

    if (avg !== null && avg !== undefined && Number(avg) > 0) {
      product.rating = Number(avg);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.softDelete(product.id);
  }

  async countByProductType(productTypeId: string): Promise<number> {
    return this.productRepository.count({ where: { productTypeId } });
  }

  async requestQuote(
    user: User,
    productId: string,
    requestQuoteDto: RequestQuoteDto,
  ): Promise<Quote> {
    const product = await this.findOne(productId);

    const quote = this.quoteRepository.create({
      ...requestQuoteDto,
      user,
      product,
      userId: user.id,
      productId: product.id,
    });

    return this.quoteRepository.save(quote);
  }

  async getAllQuotesAdmin(): Promise<Quote[]> {
    return this.quoteRepository.find({
      relations: ['product', 'user', 'negotiations'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMyQuotes(userId: string): Promise<Quote[]> {
    return this.quoteRepository.find({
      where: { userId },
      relations: ['product', 'negotiations'],
      order: { createdAt: 'DESC' },
    });
  }

  async negotiateQuote(
    quoteId: string,
    user: User,
    dto: NegotiateQuoteDto,
  ): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id: quoteId },
      relations: ['negotiations'],
    });

    if (!quote) throw new NotFoundException('Quote not found');

    if (
      quote.status === QuoteStatus.ACCEPTED ||
      quote.status === QuoteStatus.REJECTED
    ) {
      throw new BadRequestException('Cannot negotiate a finalized quote');
    }

    if (!quote.isNegotiable && user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Quote is marked as not negotiable');
    }

    if (user.role !== UserRole.ADMIN && quote.userId !== user.id) {
      throw new ForbiddenException('Not your quote');
    }

    const offeredBy =
      user.role === UserRole.ADMIN ? OfferedByRole.ADMIN : OfferedByRole.OWNER;

    const negotiation = this.negotiationRepository.create({
      quote,
      quoteId: quote.id,
      priceOffered: dto.priceOffered,
      message: dto.message,
      offeredBy,
      user,
      userId: user.id,
    });

    await this.negotiationRepository.save(negotiation);

    quote.currentPrice = dto.priceOffered;
    quote.status =
      user.role === UserRole.ADMIN
        ? QuoteStatus.ADMIN_OFFERED
        : QuoteStatus.OWNER_OFFERED;

    if (user.role === UserRole.ADMIN && dto.isNegotiable !== undefined) {
      quote.isNegotiable = dto.isNegotiable;
    }

    return this.quoteRepository.save(quote);
  }

  async acceptQuote(quoteId: string, user: User): Promise<Order> {
    const quote = await this.quoteRepository.findOne({
      where: { id: quoteId },
    });

    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.userId !== user.id)
      throw new ForbiddenException('Not your quote');

    if (quote.status === QuoteStatus.ACCEPTED) {
      throw new BadRequestException('Quote is already accepted');
    }
    if (quote.status === QuoteStatus.REJECTED) {
      throw new BadRequestException('Quote is already rejected');
    }

    if (!quote.currentPrice) {
      throw new BadRequestException('Quote needs a price before acceptance');
    }

    quote.status = QuoteStatus.ACCEPTED;
    await this.quoteRepository.save(quote);

    const order = this.orderRepository.create({
      quote,
      quoteId: quote.id,
      agreedPrice: quote.currentPrice,
      user,
      userId: user.id,
      status: OrderStatus.PENDING,
    });

    return this.orderRepository.save(order);
  }

  async rejectQuote(quoteId: string, user: User): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id: quoteId },
    });

    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.userId !== user.id)
      throw new ForbiddenException('Not your quote');

    quote.status = QuoteStatus.REJECTED;
    return this.quoteRepository.save(quote);
  }

  async getAllOrdersAdmin(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['quote', 'quote.product', 'user', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMyOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: ['quote', 'quote.product', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  async markOrderReady(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    order.status = OrderStatus.READY;
    return this.orderRepository.save(order);
  }

  async markOrderCompleted(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    order.status = OrderStatus.COMPLETED;
    order.paymentStatus = OrderPaymentStatus.PAID;
    return this.orderRepository.save(order);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    order.status = status;
    if (status === OrderStatus.COMPLETED) {
      order.paymentStatus = OrderPaymentStatus.PAID;
    }
    return this.orderRepository.save(order);
  }

  async getAdminStats() {
    const total = await this.productRepository.count();
    const published = await this.productRepository.count({
      where: { status: ProductStatus.PUBLISHED },
    });

    const lowStockThreshold = 10;
    const productTypes = await this.productTypeRepository.find({
      relations: ['devices'],
    });

    let lowStockCount = 0;
    for (const type of productTypes) {
      const availableDevices =
        type.devices?.filter((d) => !d.branchId).length || 0;
      if (availableDevices < lowStockThreshold) {
        lowStockCount++;
      }
    }

    return {
      total,
      published,
      lowStock: lowStockCount,
    };
  }

  // --- Product Reviews ---

  async createReview(
    user: User | undefined,
    productId: string,
    dto: CreateProductReviewDto,
    ip?: string,
  ): Promise<Record<string, unknown>> {
    const product = await this.findOne(productId);

    const reviewerName =
      dto.name?.trim() ||
      (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '') ||
      'Anonymous';

    // Anti-spam: one review per authenticated user per product; anonymous
    // reviews are limited to one per IP per product within 24h.
    let reviewIpHash: string | null = null;
    if (user?.id) {
      const existing = await this.productReviewRepository.findOne({
        where: { productId: product.id, userId: user.id },
      });
      if (existing) {
        throw new BadRequestException('You have already reviewed this product');
      }
    } else if (ip) {
      reviewIpHash = createHash('sha256').update(ip).digest('hex');
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await this.productReviewRepository
        .createQueryBuilder('review')
        .where('review.productId = :productId', { productId: product.id })
        .andWhere('review.ipHash = :ipHash', { ipHash: reviewIpHash })
        .andWhere('review.createdAt >= :since', { since })
        .getOne();
      if (existing) {
        throw new BadRequestException(
          'A review from this device was already submitted in the last 24 hours',
        );
      }
    }

    const review = this.productReviewRepository.create({
      product,
      productId: product.id,
      userId: user?.id,
      ipHash: reviewIpHash ?? null,
      reviewerName,
      rating: dto.rating,
      comment: dto.comment,
      status: ProductReviewStatus.PENDING,
    });

    const saved = await this.productReviewRepository.save(review);

    return {
      id: saved.id,
      user: saved.reviewerName,
      rating: saved.rating,
      comment: saved.comment,
      date: saved.createdAt,
      status: saved.status,
    };
  }

  async findApprovedReviews(productId: string, page = 1, limit = 10) {
    await this.findOne(productId);

    const [data, total] = await this.productReviewRepository.findAndCount({
      where: { productId, status: ProductReviewStatus.APPROVED },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: data.map((r) => ({
        id: r.id,
        user: r.reviewerName,
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findReviewsAdmin(
    status: ProductReviewStatus | undefined,
    page = 1,
    limit = 10,
  ) {
    const where: FindOptionsWhere<ProductReview> = {};
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.productReviewRepository.findAndCount({
      where,
      relations: ['product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateReviewStatus(
    reviewId: string,
    status: ProductReviewStatus,
  ): Promise<ProductReview> {
    if (
      status !== ProductReviewStatus.APPROVED &&
      status !== ProductReviewStatus.REJECTED &&
      status !== ProductReviewStatus.PENDING
    ) {
      throw new BadRequestException('Invalid review status');
    }

    const review = await this.productReviewRepository.findOne({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const previousStatus = review.status;
    review.status = status;
    await this.productReviewRepository.save(review);

    await this.syncReviewCount(review.productId);

    if (status === ProductReviewStatus.APPROVED) {
      await this.syncProductRating(review.productId);
    } else if (previousStatus === ProductReviewStatus.APPROVED) {
      await this.syncProductRating(review.productId);
    }

    return review;
  }

  private async syncReviewCount(productId: string): Promise<void> {
    const count = await this.productReviewRepository.count({
      where: { productId, status: ProductReviewStatus.APPROVED },
    });
    await this.productRepository.update(productId, { reviewCount: count });
  }

  private async syncProductRating(productId: string): Promise<void> {
    const [{ avg }] = await this.productReviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.productId = :productId', { productId })
      .andWhere('review.status = :status', {
        status: ProductReviewStatus.APPROVED,
      })
      .getRawMany<{ avg: string | null }>();

    if (avg !== null && avg !== undefined && Number(avg) > 0) {
      await this.productRepository.update(productId, {
        rating: Number(avg),
      });
    }
  }
}
