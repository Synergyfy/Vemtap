import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { QuoteNegotiation, OfferedByRole } from './entities/quote-negotiation.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RequestQuoteDto } from './dto/request-quote.dto';
import { NegotiateQuoteDto } from './dto/negotiate-quote.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

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
  ) { }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAllPublished(): Promise<Product[]> {
    return this.productRepository.find({
      where: { status: ProductStatus.PUBLISHED },
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

    if (quote.status === QuoteStatus.ACCEPTED || quote.status === QuoteStatus.REJECTED) {
      throw new BadRequestException('Cannot negotiate a finalized quote');
    }

    if (!quote.isNegotiable && user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Quote is marked as not negotiable');
    }

    if (user.role !== UserRole.ADMIN && quote.userId !== user.id) {
      throw new ForbiddenException('Not your quote');
    }

    const offeredBy = user.role === UserRole.ADMIN ? OfferedByRole.ADMIN : OfferedByRole.OWNER;

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
    quote.status = user.role === UserRole.ADMIN ? QuoteStatus.ADMIN_OFFERED : QuoteStatus.OWNER_OFFERED;

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
    if (quote.userId !== user.id) throw new ForbiddenException('Not your quote');

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
    if (quote.userId !== user.id) throw new ForbiddenException('Not your quote');

    quote.status = QuoteStatus.REJECTED;
    return this.quoteRepository.save(quote);
  }

  async getAllOrdersAdmin(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['quote', 'quote.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMyOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: ['quote', 'quote.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async markOrderReady(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) throw new NotFoundException('Order not found');

    order.status = OrderStatus.READY;
    return this.orderRepository.save(order);
  }
}
