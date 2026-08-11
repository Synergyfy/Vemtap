import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductReview } from './entities/product-review.entity';
import { Quote } from './entities/quote.entity';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { QuoteNegotiation } from './entities/quote-negotiation.entity';
import { ProductType } from './entities/product-type.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';

describe('ProductsService - Pricing & Payment', () => {
  let service: ProductsService;

  const reviewQb = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([{ avg: null }]),
  };

  const mockProductRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockProductReviewRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(reviewQb),
  };

  const mockOrderRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockPaymentsService = {
    verifyTransaction: jest.fn(),
    recordPayment: jest.fn(),
  };

  const mockQuoteRepo = {};
  const mockNegotiationRepo = {};
  const mockProductTypeRepo = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        {
          provide: getRepositoryToken(ProductReview),
          useValue: mockProductReviewRepo,
        },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(Quote), useValue: mockQuoteRepo },
        {
          provide: getRepositoryToken(QuoteNegotiation),
          useValue: mockNegotiationRepo,
        },
        {
          provide: getRepositoryToken(ProductType),
          useValue: mockProductTypeRepo,
        },
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDirectOrder', () => {
    const user = {
      id: 'user-1',
      role: UserRole.OWNER,
      businessId: 'biz-1',
    } as User;
    const productId = 'prod-1';
    const product = {
      id: productId,
      price: 1000,
      priceTiers: [],
      requestQuoteThreshold: 1000,
    } as unknown as Product;

    it('should create PENDING order (online payment skipped for MVP)', async () => {
      mockProductRepo.findOne.mockResolvedValue(product);
      mockOrderRepo.findOneBy.mockResolvedValue(null);
      mockOrderRepo.create.mockImplementation((dto) => ({
        id: 'order-1',
        ...dto,
      }));
      mockOrderRepo.save.mockImplementation((order) => Promise.resolve(order));

      const dto = { productId, quantity: 50, paymentReference: 'ref_valid' };
      const result = await service.createDirectOrder(user, dto);

      expect(result.status).toBe(OrderStatus.PENDING);
      expect(result.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(mockOrderRepo.save).toHaveBeenCalled();
    });

    it('should throw error if quantity exceeds threshold', async () => {
      const productWithThreshold = { ...product, requestQuoteThreshold: 10 };
      mockProductRepo.findOne.mockResolvedValue(productWithThreshold);
      const dto = { productId, quantity: 50 };

      await expect(service.createDirectOrder(user, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
