import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
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
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { ProductType } from './entities/product-type.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { RequestQuoteDto } from './dto/request-quote.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { NegotiateQuoteDto } from './dto/negotiate-quote.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { PaymentsService } from '../payments/payments.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

const mockProductRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockProductReviewRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockQuoteRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockNegotiationRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockOrderRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
};

const mockProductTypeRepository = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockPaymentsService = {
  verifyTransaction: jest.fn(),
  recordPayment: jest.fn(),
};

describe('ProductsService', () => {
  let service: ProductsService;
  let reviewAvgQb: Record<string, jest.Mock>;
  let productListQb: Record<string, jest.Mock>;

  const makeReviewQb = () => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([{ avg: null }]),
  });

  const makeProductQb = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(2),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    reviewAvgQb = makeReviewQb();
    productListQb = makeProductQb();

    mockProductRepository.createQueryBuilder.mockReturnValue(productListQb);
    mockProductReviewRepository.createQueryBuilder.mockReturnValue(reviewAvgQb);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(ProductReview),
          useValue: mockProductReviewRepository,
        },
        {
          provide: getRepositoryToken(Quote),
          useValue: mockQuoteRepository,
        },
        {
          provide: getRepositoryToken(QuoteNegotiation),
          useValue: mockNegotiationRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(ProductType),
          useValue: mockProductTypeRepository,
        },
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDirectOrder', () => {
    it('should create order with PENDING payment status for Owner (skipping payment)', async () => {
      const user = {
        id: 'user-1',
        role: UserRole.OWNER,
        businessId: 'biz-1',
      } as User;
      const dto: CreateOrderDto = {
        productId: 'prod-1',
        quantity: 5,
        paymentReference: 'ref-123', // Even if provided, verification is skipped
      };

      const product = { id: 'prod-1', price: 100, requestQuoteThreshold: 100 };
      mockProductRepository.findOne.mockResolvedValue(product);

      mockOrderRepository.create.mockReturnValue({
        id: 'order-1',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      });
      mockOrderRepository.save.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      });

      const result = await service.createDirectOrder(user, dto);

      expect(mockPaymentsService.verifyTransaction).not.toHaveBeenCalled(); // Ensure skipped
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: PaymentStatus.PENDING,
          status: OrderStatus.PENDING,
          userId: user.id,
        }),
      );
      expect(result.status).toBe(OrderStatus.PENDING);
    });
  });

  describe('markOrderCompleted', () => {
    it('should mark order as COMPLETED and PAID', async () => {
      const order = {
        id: 'order-1',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      };
      mockOrderRepository.findOne.mockResolvedValue(order);
      mockOrderRepository.save.mockImplementation((o) => Promise.resolve(o));

      const result = await service.markOrderCompleted('order-1');

      expect(result.status).toBe(OrderStatus.COMPLETED);
      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
        }),
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);
      await expect(service.markOrderCompleted('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Keep existing tests...
  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: any = {
        name: 'Test Product',
        description: 'Test Desc',
        price: 100,
        images: ['img.png'],
        tag: 'Hardware',
        stock: 10,
        requestQuoteThreshold: 50,
      };
      const product = new Product();
      Object.assign(product, createProductDto);

      mockProductRepository.create.mockReturnValue(product);
      mockProductRepository.save.mockResolvedValue(product);

      const result = await service.create(createProductDto);

      expect(mockProductRepository.create).toHaveBeenCalledWith(
        createProductDto,
      );
      expect(mockProductRepository.save).toHaveBeenCalledWith(product);
      expect(result).toEqual(product);
    });
  });

  describe('markOrderReady', () => {
    it('should mark order as ready', async () => {
      const order = new Order();
      order.id = 'order-1';
      order.status = OrderStatus.PENDING;

      mockOrderRepository.findOne.mockResolvedValue(order);
      mockOrderRepository.save.mockResolvedValue({
        ...order,
        status: OrderStatus.READY,
      });

      const result = await service.markOrderReady('order-1');
      expect(result.status).toBe(OrderStatus.READY);
    });
  });

  describe('findAllPublished', () => {
    it('returns a paginated envelope and applies search/sort query', async () => {
      const product = { id: 'p1', name: 'NFC Card', rating: 5 } as Product;
      productListQb.getMany.mockResolvedValue([product]);

      const result = await service.findAllPublished({
        page: 1,
        limit: 10,
        search: 'NFC',
      });

      expect(result.data).toEqual([product]);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('createReview', () => {
    it('creates a pending review and returns the public shape', async () => {
      const product = { id: 'p1' } as Product;
      mockProductRepository.findOne.mockResolvedValue(product);
      mockProductReviewRepository.findOne.mockResolvedValue(null);

      const review = {
        id: 'r1',
        productId: 'p1',
        reviewerName: 'John Doe',
        rating: 5,
        comment: 'Great product',
        createdAt: new Date(),
        status: ProductReviewStatus.PENDING,
      };
      mockProductReviewRepository.create.mockReturnValue(review);
      mockProductReviewRepository.save.mockResolvedValue(review);

      const result = await service.createReview(
        { id: 'u1', firstName: 'John', lastName: 'Doe' } as User,
        'p1',
        { rating: 5, comment: 'Great product' },
      );

      expect(result).toEqual(
        expect.objectContaining({
          user: 'John Doe',
          status: ProductReviewStatus.PENDING,
        }),
      );
      expect(result).not.toHaveProperty('userId');
    });

    it('rejects a duplicate review from the same authenticated user', async () => {
      const product = { id: 'p1' } as Product;
      mockProductRepository.findOne.mockResolvedValue(product);
      mockProductReviewRepository.findOne.mockResolvedValue({ id: 'r1' });

      await expect(
        service.createReview(
          { id: 'u1', firstName: 'John', lastName: 'Doe' } as User,
          'p1',
          { rating: 5, comment: 'Again' },
        ),
      ).rejects.toThrow('already reviewed');
    });
  });

  describe('findApprovedReviews', () => {
    it('returns approved reviews mapped for the public page', async () => {
      const product = { id: 'p1' } as Product;
      mockProductRepository.findOne.mockResolvedValue(product);

      const review = {
        id: 'r1',
        reviewerName: 'Samuel O.',
        rating: 5,
        comment: 'Excellent',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      mockProductReviewRepository.findAndCount.mockResolvedValue([[review], 1]);

      const result = await service.findApprovedReviews('p1', 1, 10);

      expect(result.total).toBe(1);
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          user: 'Samuel O.',
          rating: 5,
          comment: 'Excellent',
        }),
      );
    });
  });

  describe('updateReviewStatus', () => {
    it('approves a review and syncs reviewCount + rating', async () => {
      const review = {
        id: 'r1',
        productId: 'p1',
        status: ProductReviewStatus.PENDING,
      };
      mockProductReviewRepository.findOne.mockResolvedValue(review);
      mockProductReviewRepository.save.mockResolvedValue(review);
      mockProductReviewRepository.count.mockResolvedValue(1);
      mockProductRepository.update.mockResolvedValue({ affected: 1 });
      reviewAvgQb.getRawMany.mockResolvedValue([{ avg: '4.5' }]);

      const result = await service.updateReviewStatus(
        'r1',
        ProductReviewStatus.APPROVED,
      );

      expect(result.status).toBe(ProductReviewStatus.APPROVED);
      expect(mockProductReviewRepository.count).toHaveBeenCalledWith({
        where: { productId: 'p1', status: ProductReviewStatus.APPROVED },
      });
    });

    it('throws NotFoundException when the review does not exist', async () => {
      mockProductReviewRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateReviewStatus('missing', ProductReviewStatus.APPROVED),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
