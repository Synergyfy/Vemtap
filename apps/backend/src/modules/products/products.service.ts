import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
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
import { User, UserRole } from '../users/entities/user.entity';
import {
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import {
  PaymentPurpose,
  PaymentStatus,
} from '../payments/entities/payment.entity';
import { PaymentStatus as OrderPaymentStatus } from './entities/order.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(QuoteNegotiation)
    private negotiationRepository: Repository<QuoteNegotiation>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ProductType)
    private productTypeRepository: Repository<ProductType>,
    private readonly paymentsService: PaymentsService,
  ) { }

  async create(createProductDto: CreateProductDto): Promise<Product> {
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

    let paymentStatus = OrderPaymentStatus.PENDING;

    if (createOrderDto.paymentReference) {
      // Idempotency check: Ensure reference isn't already used for another order
      const existingOrder = await this.orderRepository.findOneBy({
        paymentReference: createOrderDto.paymentReference,
      });
      if (existingOrder) {
        throw new ConflictException(
          'Order with this payment reference already exists',
        );
      }

      const isPaymentValid = await this.paymentsService.verifyTransaction(
        createOrderDto.paymentReference,
      );

      if (!isPaymentValid) {
        throw new BadRequestException('Invalid payment reference');
      }

      await this.paymentsService.recordPayment({
        reference: createOrderDto.paymentReference,
        amount: totalPrice,
        purpose: PaymentPurpose.ORDER,
        status: PaymentStatus.SUCCESS,
        metadata: {
          productId: product.id,
          quantity: createOrderDto.quantity,
        },
        businessId: user.businessId,
        userId: user.id,
      });

      paymentStatus = OrderPaymentStatus.PAID;
    } else {
      throw new BadRequestException('Payment is required for direct orders');
    }

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

  async findAllPublished(productTypeId?: string): Promise<Product[]> {
    const where: any = { status: ProductStatus.PUBLISHED };
    if (productTypeId) {
      where.productTypeId = productTypeId;
    }
    return this.productRepository.find({
      where,
      relations: ['productType'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllAdmin(): Promise<Product[]> {
    return this.productRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
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
    await this.productRepository.remove(product);
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

  async getAdminStats() {
    const total = await this.productRepository.count();
    const published = await this.productRepository.count({
      where: { status: ProductStatus.PUBLISHED },
    });

    // Strategy for Low Stock: Count product types that have very few unlinked devices
    const lowStockThreshold = 10;
    const productTypes = await this.productTypeRepository.find({
      relations: ['devices'],
    });

    let lowStockCount = 0;
    for (const type of productTypes) {
      const availableDevices = type.devices?.filter((d) => !d.businessId).length || 0;
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
}
