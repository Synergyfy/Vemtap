import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Quote } from './entities/quote.entity';
import { Order } from './entities/order.entity';
import { QuoteNegotiation } from './entities/quote-negotiation.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('ProductsService - Pricing & Direct Order', () => {
  let service: ProductsService;
  let productRepo: Repository<Product>;
  let orderRepo: Repository<Order>;

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
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    orderRepo = module.get<Repository<Order>>(getRepositoryToken(Order));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDirectOrder', () => {
    const user = { id: 'user-1', role: UserRole.OWNER } as User;
    const productId = 'prod-1';

    it('should create order with base price if no tiers match', async () => {
      const product = {
        id: productId,
        price: 1000,
        priceTiers: [],
        requestQuoteThreshold: 1000,
      } as unknown as Product;

      mockProductRepo.findOne.mockResolvedValue(product);
      mockOrderRepo.create.mockImplementation((dto) => dto);
      mockOrderRepo.save.mockImplementation((order) => Promise.resolve({ id: 'order-1', ...order }));

      const dto = { productId, quantity: 50 };
      const result = await service.createDirectOrder(user, dto);

      expect(result.unitPrice).toBe(1000);
      expect(result.totalPrice).toBe(50000);
      expect(mockOrderRepo.save).toHaveBeenCalled();
    });

    it('should create order with tiered price if tier matches', async () => {
      const product = {
        id: productId,
        price: 1000,
        priceTiers: [
            { min: 1, max: 99, price: 1000 },
            { min: 100, max: 200, price: 800 }
        ],
        requestQuoteThreshold: 1000,
      } as unknown as Product;

      mockProductRepo.findOne.mockResolvedValue(product);
      mockOrderRepo.create.mockImplementation((dto) => dto);
      mockOrderRepo.save.mockImplementation((order) => Promise.resolve({ id: 'order-1', ...order }));

      const dto = { productId, quantity: 150 };
      const result = await service.createDirectOrder(user, dto);

      expect(result.unitPrice).toBe(800);
      expect(result.totalPrice).toBe(150 * 800);
    });

    it('should throw error if quantity exceeds threshold', async () => {
      const product = {
        id: productId,
        price: 1000,
        requestQuoteThreshold: 100,
      } as unknown as Product;

      mockProductRepo.findOne.mockResolvedValue(product);

      const dto = { productId, quantity: 101 };

      await expect(service.createDirectOrder(user, dto)).rejects.toThrow(BadRequestException);
    });
  });
});
