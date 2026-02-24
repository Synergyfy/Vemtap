import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product, ProductStatus } from './entities/product.entity';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
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
      const createProductDto: CreateProductDto = {
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
});
