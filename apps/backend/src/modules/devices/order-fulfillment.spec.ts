import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Device, DeviceStatus } from './entities/device.entity';
import { Order, OrderStatus } from '../products/entities/order.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('DevicesService - Order Fulfillment', () => {
  let service: DevicesService;
  let deviceRepo: Repository<Device>;
  let orderRepo: Repository<Order>;
  let branchRepo: Repository<Branch>;

  const mockDeviceRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockOrderRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockBranchRepo = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: getRepositoryToken(Device), useValue: mockDeviceRepo },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(Branch), useValue: mockBranchRepo },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
    deviceRepo = module.get<Repository<Device>>(getRepositoryToken(Device));
    orderRepo = module.get<Repository<Order>>(getRepositoryToken(Order));
    branchRepo = module.get<Repository<Branch>>(getRepositoryToken(Branch));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fulfillOrder', () => {
    const orderId = 'order-1';
    const businessId = 'biz-1';

    it('should generate devices for order with correct type', async () => {
      const order = {
        id: orderId,
        quantity: 2,
        user: { businessId },
        product: {
          name: 'Product A',
          productType: { id: 'type-1', name: 'NFC Card' },
        },
        status: OrderStatus.PENDING,
      } as unknown as Order;

      mockOrderRepo.findOne.mockResolvedValue(order);
      mockDeviceRepo.count.mockResolvedValue(0); // No existing devices
      mockDeviceRepo.find.mockResolvedValue([]); // Unique codes in bulk check
      mockDeviceRepo.create.mockImplementation((dto) => dto);
      mockDeviceRepo.save.mockImplementation((dto) => dto);
      mockOrderRepo.save.mockResolvedValue(order);

      const result = await service.fulfillOrder(orderId);

      expect(result).toHaveLength(2);
      expect(result[0].productTypeId).toBe('type-1');
      expect(result[0].type).toBe('NFC Card');
      expect(mockDeviceRepo.save).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.save).toHaveBeenCalled();
      expect(order.status).toBe(OrderStatus.READY);
    });

    it('should throw error if order not found', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);
      await expect(service.fulfillOrder(orderId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if devices already exist', async () => {
      const order = { id: orderId } as Order;
      mockOrderRepo.findOne.mockResolvedValue(order);
      mockDeviceRepo.count.mockResolvedValue(1);
      await expect(service.fulfillOrder(orderId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw error if user has no business', async () => {
      const order = {
        id: orderId,
        quantity: 2,
        user: { businessId: null },
      } as unknown as Order;
      mockOrderRepo.findOne.mockResolvedValue(order);
      mockDeviceRepo.count.mockResolvedValue(0);
      await expect(service.fulfillOrder(orderId)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
