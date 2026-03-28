import { Test, TestingModule } from '@nestjs/testing';
import { CatalogueOrderService } from './catalogue-orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogueOrder, CatalogueOrderStatus } from './entities/catalogue-order.entity';
import { CatalogueOrderItem } from './entities/catalogue-order-item.entity';
import { CatalogueItem, CatalogueItemStatus } from '../catalogue/entities/catalogue-item.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CatalogueOrderService', () => {
  let service: CatalogueOrderService;

  const mockOrderRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((order) => Promise.resolve({ id: 'order-1', ...order })),
    findOne: jest.fn(),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  const mockOrderItemRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn(),
  };

  const mockItemRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((user) => Promise.resolve({ id: 'cust-1', ...user })),
  };

  const mockBranchRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogueOrderService,
        {
          provide: getRepositoryToken(CatalogueOrder),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOrderItem),
          useValue: mockOrderItemRepo,
        },
        {
          provide: getRepositoryToken(CatalogueItem),
          useValue: mockItemRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepo,
        },
      ],
    }).compile();

    service = module.get<CatalogueOrderService>(CatalogueOrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '12345678',
        branchId: 'br-1',
        items: [{ itemId: 'item-1', quantity: 2 }],
      };

      mockBranchRepo.findOne.mockResolvedValue({ id: 'br-1', businessId: 'bus-1' });
      mockUserRepo.findOne.mockResolvedValue({ id: 'cust-1', phone: '12345678' });
      mockItemRepo.findOne.mockResolvedValue({
        id: 'item-1',
        name: 'Burger',
        price: 10,
        status: CatalogueItemStatus.ACTIVE,
        isSuspended: false,
        branches: [{ id: 'br-1' }],
        stockQuantity: 10,
        allowBackOrder: false,
      });

      const result = await service.createOrder(dto);

      expect(result.totalAmount).toBe(20);
      expect(result.items).toHaveLength(1);
      expect(mockOrderRepo.save).toHaveBeenCalled();
      expect(mockItemRepo.save).toHaveBeenCalled(); // Stock decrement
    });

    it('should throw error if item is not available in branch', async () => {
      const dto = {
        firstName: 'John',
        phone: '12345678',
        branchId: 'br-1',
        items: [{ itemId: 'item-1', quantity: 1 }],
      };

      mockBranchRepo.findOne.mockResolvedValue({ id: 'br-1' });
      mockUserRepo.findOne.mockResolvedValue({ id: 'cust-1' });
      mockItemRepo.findOne.mockResolvedValue({
        id: 'item-1',
        branches: [{ id: 'br-2' }], // Mismatch
      });

      await expect(service.createOrder(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if item is suspended', async () => {
        const dto = {
            firstName: 'John',
            phone: '12345678',
            branchId: 'br-1',
            items: [{ itemId: 'item-1', quantity: 1 }],
        };
  
        mockBranchRepo.findOne.mockResolvedValue({ id: 'br-1' });
        mockUserRepo.findOne.mockResolvedValue({ id: 'cust-1' });
        mockItemRepo.findOne.mockResolvedValue({
          id: 'item-1',
          branches: [{ id: 'br-1' }],
          isSuspended: true,
        });
  
        await expect(service.createOrder(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if insufficient stock and backorder disabled', async () => {
        const dto = {
            firstName: 'John',
            phone: '12345678',
            branchId: 'br-1',
            items: [{ itemId: 'item-1', quantity: 5 }],
        };
  
        mockBranchRepo.findOne.mockResolvedValue({ id: 'br-1' });
        mockUserRepo.findOne.mockResolvedValue({ id: 'cust-1' });
        mockItemRepo.findOne.mockResolvedValue({
          id: 'item-1',
          name: 'Limited Item',
          branches: [{ id: 'br-1' }],
          stockQuantity: 2,
          allowBackOrder: false,
        });
  
        await expect(service.createOrder(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      mockOrderRepo.findOne.mockResolvedValue({ id: 'order-1', status: CatalogueOrderStatus.NEW });
      const result = await service.updateStatus('order-1', CatalogueOrderStatus.COMPLETED, 'bus-1');
      expect(result.status).toBe(CatalogueOrderStatus.COMPLETED);
    });
  });
});
