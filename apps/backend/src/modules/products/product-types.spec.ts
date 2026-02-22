import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductType } from './entities/product-type.entity';
import { Product } from './entities/product.entity';
import { Quote } from './entities/quote.entity';
import { Order } from './entities/order.entity';
import { QuoteNegotiation } from './entities/quote-negotiation.entity';
import { Repository } from 'typeorm';
import { PaymentsService } from '../payments/payments.service';
import { ConflictException } from '@nestjs/common';

describe('ProductsService - Product Types', () => {
  let service: ProductsService;
  let productTypeRepo: Repository<ProductType>;

  const mockProductTypeRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  const mockProductRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const mockOrderRepo = {};
  const mockQuoteRepo = {};
  const mockNegotiationRepo = {};
  const mockPaymentsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(ProductType),
          useValue: mockProductTypeRepo,
        },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(Quote), useValue: mockQuoteRepo },
        {
          provide: getRepositoryToken(QuoteNegotiation),
          useValue: mockNegotiationRepo,
        },
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productTypeRepo = module.get<Repository<ProductType>>(
      getRepositoryToken(ProductType),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProductType', () => {
    it('should create a product type', async () => {
      const dto = { name: 'Card', slug: 'card' };
      mockProductTypeRepo.findOne.mockResolvedValue(null);
      mockProductTypeRepo.create.mockReturnValue(dto);
      mockProductTypeRepo.save.mockResolvedValue({ id: 'type-1', ...dto });

      const result = await service.createProductType(dto);
      expect(result.id).toBe('type-1');
    });

    it('should throw conflict if exists', async () => {
      mockProductTypeRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(
        service.createProductType({ name: 'Card', slug: 'card' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllProductTypes', () => {
    it('should return all types', async () => {
      mockProductTypeRepo.find.mockResolvedValue([{ name: 'Card' }]);
      const result = await service.findAllProductTypes();
      expect(result).toHaveLength(1);
    });
  });
});
