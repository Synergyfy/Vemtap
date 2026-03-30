import { Test, TestingModule } from '@nestjs/testing';
import { CatalogueOrderService } from './catalogue-orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogueOrder, CatalogueOrderStatus } from './entities/catalogue-order.entity';
import { CatalogueOrderItem } from './entities/catalogue-order-item.entity';
import { CatalogueItem, CatalogueItemStatus } from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { PushNotificationService } from '../notifications/push-notification.service';
import { Device } from '../devices/entities/device.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { LoyaltyService } from '../loyalty/loyalty.service';
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

  const mockOfferRepo = {
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((user) => Promise.resolve({ id: 'cust-1', ...user })),
  };

  const mockBranchRepo = {
    findOne: jest.fn(),
  };

  const mockLoyaltyService = {
    awardPoints: jest.fn(),
    generateRedemptionCode: jest.fn(),
  };

  const mockStaff: User = { id: 'staff-1', businessId: 'bus-1', role: UserRole.STAFF } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PushNotificationService, useValue: { sendToBranchStaff: jest.fn().mockResolvedValue({}), sendNotification: jest.fn().mockResolvedValue({}) } },
        { provide: getRepositoryToken(Device), useValue: {} },
        { provide: getRepositoryToken(Visit), useValue: { findOne: jest.fn(), count: jest.fn().mockResolvedValue(0), create: jest.fn(), save: jest.fn() } },
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
          provide: getRepositoryToken(CatalogueOffer),
          useValue: mockOfferRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepo,
        },
        {
          provide: LoyaltyService,
          useValue: mockLoyaltyService,
        },
      ],
    }).compile();

    service = module.get<CatalogueOrderService>(CatalogueOrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order with items successfully', async () => {
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
        loyaltyPoints: 5,
        status: CatalogueItemStatus.ACTIVE,
        isSuspended: false,
        branches: [{ id: 'br-1' }],
        stockQuantity: 10,
        allowBackOrder: false,
      });

      const result = await service.createOrder(dto);

      expect(result.totalAmount).toBe(20);
      expect(result.items[0].loyaltyPointsAtOrder).toBe(5);
      expect(mockOrderRepo.save).toHaveBeenCalled();
    });

    it('should create an order with offers successfully', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '12345678',
        branchId: 'br-1',
        items: [{ offerId: 'offer-1', quantity: 1 }],
      };

      mockBranchRepo.findOne.mockResolvedValue({ id: 'br-1', businessId: 'bus-1' });
      mockUserRepo.findOne.mockResolvedValue({ id: 'cust-1', phone: '12345678' });
      mockOfferRepo.findOne.mockResolvedValue({ items: [{ stockQuantity: 10, allowBackOrder: true }],
        id: 'offer-1',
        name: 'Combo',
        calculatedPrice: 15,
        loyaltyPoints: 20,
        branchId: 'br-1',
      });

      const result = await service.createOrder(dto);

      expect(result.totalAmount).toBe(15);
      expect(result.items[0].loyaltyPointsAtOrder).toBe(20);
      expect(mockOrderRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should award points on COMPLETED status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: CatalogueOrderStatus.NEW,
        customerId: 'cust-1',
        businessId: 'bus-1',
        branchId: 'br-1',
        loyaltyAwarded: false,
        items: [
          {
            itemId: 'item-1',
            quantity: 2,
            loyaltyPointsAtOrder: 10,
            item: { id: 'item-1', stockQuantity: 10 }
          }
        ]
      };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      await service.updateStatus('order-1', CatalogueOrderStatus.COMPLETED, 'bus-1', mockStaff);

      expect(mockLoyaltyService.awardPoints).toHaveBeenCalledWith(
        'cust-1',
        20,
        'bus-1',
        'br-1',
        expect.any(String),
        'staff-1'
      );
      expect(mockOrder.loyaltyAwarded).toBe(true);
      // expect(mockItemRepo.save).toHaveBeenCalled(); // stock deduction
    });

    it('should award rewards on COMPLETED status if offer has reward', async () => {
      const mockOrder = {
        id: 'order-1',
        status: CatalogueOrderStatus.NEW,
        customerId: 'cust-1',
        businessId: 'bus-1',
        branchId: 'br-1',
        loyaltyAwarded: false,
        items: [
          {
            offerId: 'offer-1',
            quantity: 2,
            loyaltyPointsAtOrder: 0,
            offer: {
              id: 'offer-1',
              rewardId: 'rew-1',
              items: [{ id: 'item-1', stockQuantity: 10 }]
            }
          }
        ]
      };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      await service.updateStatus('order-1', CatalogueOrderStatus.COMPLETED, 'bus-1', mockStaff);

      expect(mockLoyaltyService.generateRedemptionCode).toHaveBeenCalledTimes(2); // quantity is 2
    });
  });
});
