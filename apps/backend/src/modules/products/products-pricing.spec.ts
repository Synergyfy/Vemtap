import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Quote } from './entities/quote.entity';
import { Order, PaymentStatus } from './entities/order.entity';
import { QuoteNegotiation } from './entities/quote-negotiation.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';

describe('ProductsService - Pricing & Payment', () => {
  let service: ProductsService;
  let productRepo: Repository<Product>;
  let orderRepo: Repository<Order>;
  let paymentsService: PaymentsService;

  const mockProductRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(Quote), useValue: mockQuoteRepo },
        { provide: getRepositoryToken(QuoteNegotiation), useValue: mockNegotiationRepo },
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    orderRepo = module.get<Repository<Order>>(getRepositoryToken(Order));
    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDirectOrder', () => {
    const user = { id: 'user-1', role: UserRole.OWNER, businessId: 'biz-1' } as User;
    const productId = 'prod-1';
    const product = {
        id: productId,
        price: 1000,
        priceTiers: [],
        requestQuoteThreshold: 1000,
      } as unknown as Product;

    it('should create PAID order if payment verified', async () => {
      mockProductRepo.findOne.mockResolvedValue(product);
      mockOrderRepo.findOneBy.mockResolvedValue(null); // No duplicate order
      mockPaymentsService.verifyTransaction.mockResolvedValue(true);
      mockPaymentsService.recordPayment.mockResolvedValue({ id: 'pay-1' });
      mockOrderRepo.create.mockImplementation((dto) => dto);
      mockOrderRepo.save.mockImplementation((order) => Promise.resolve({ id: 'order-1', ...order }));

      const dto = { productId, quantity: 50, paymentReference: 'ref_valid' };
      const result = await service.createDirectOrder(user, dto);

      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
      expect(mockPaymentsService.recordPayment).toHaveBeenCalled();
      expect(mockOrderRepo.save).toHaveBeenCalled();
    });

    it('should throw error if payment reference missing', async () => {
      mockProductRepo.findOne.mockResolvedValue(product);
      const dto = { productId, quantity: 50 }; // No ref

      await expect(service.createDirectOrder(user, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if payment verification fails', async () => {
      mockProductRepo.findOne.mockResolvedValue(product);
      mockOrderRepo.findOneBy.mockResolvedValue(null);
      mockPaymentsService.verifyTransaction.mockResolvedValue(false);

      const dto = { productId, quantity: 50, paymentReference: 'ref_invalid' };

      await expect(service.createDirectOrder(user, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw conflict if order with same reference exists', async () => {
       mockProductRepo.findOne.mockResolvedValue(product);
       mockOrderRepo.findOneBy.mockResolvedValue({ id: 'existing_order' });

       const dto = { productId, quantity: 50, paymentReference: 'ref_used' };

       await expect(service.createDirectOrder(user, dto)).rejects.toThrow(ConflictException);
    });
  });
});
