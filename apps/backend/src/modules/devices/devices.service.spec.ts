import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Device, DeviceStatus } from './entities/device.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Order, OrderStatus } from '../products/entities/order.entity';

describe('DevicesService', () => {
  let service: DevicesService;
  let deviceRepository: any;
  let orderRepository: any;

  const mockDevice = {
    id: 'device-1',
    name: 'Tag 1',
    code: 'LT-123',
    status: DeviceStatus.ACTIVE,
    businessId: 'biz-1',
    totalScans: 10,
  };

  const mockDeviceRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockResolvedValue(mockDevice),
    find: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  const mockOrderRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: getRepositoryToken(Device), useValue: mockDeviceRepository },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
    deviceRepository = module.get(getRepositoryToken(Device));
    orderRepository = module.get(getRepositoryToken(Order));
  });

  it('should create a device', async () => {
    mockDeviceRepository.findOneBy.mockResolvedValue(null);
    const result = await service.create('biz-1', {
      name: 'Tag 1',
      code: 'LT-123',
    });
    expect(result).toEqual(mockDevice);
  });

  it('should throw ConflictException if code exists', async () => {
    mockDeviceRepository.findOneBy.mockResolvedValue(mockDevice);
    await expect(
      service.create('biz-1', { name: 'Tag 1', code: 'LT-123' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should return stats', async () => {
    mockDeviceRepository.find.mockResolvedValue([
      { ...mockDevice, status: DeviceStatus.ACTIVE, totalScans: 10 },
      {
        ...mockDevice,
        id: 'device-2',
        status: DeviceStatus.INACTIVE,
        totalScans: 5,
      },
    ]);
    const stats = await service.getStats('biz-1');
    expect(stats.totalDevices).toBe(2);
    expect(stats.activeNow).toBe(1);
    expect(stats.totalScans).toBe(15);
    expect(stats.offline).toBe(1);
  });

  describe('generateDevicesForReadyOrders', () => {
    it('should generate devices correctly based on ready orders amount not yet generated', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.READY,
        userId: 'user-1',
        quote: { quantity: 5 },
        devices: [{}, {}], // 2 already generated
      };

      mockOrderRepository.find.mockResolvedValue([mockOrder]);
      mockDeviceRepository.findOneBy.mockResolvedValue(null); // Ensure unique code is found on first try
      mockDeviceRepository.create.mockImplementation((dto) => dto);
      mockDeviceRepository.save.mockResolvedValue([]);

      const result = await service.generateDevicesForReadyOrders(
        'user-1',
        'biz-1',
      );

      expect(result.length).toBe(3); // 5 - 2 = 3
      expect(mockDeviceRepository.save).toHaveBeenCalled();
      expect(result[0].businessId).toBe('biz-1');
      expect(result[0].orderId).toBe('order-1');
      expect(result[0].code.length).toBe(9);
    });

    it('should handle missing quote or no remaining devices gracefully', async () => {
      const mockOrderNoQuote = {
        id: 'order-1',
        status: OrderStatus.READY,
        userId: 'user-1',
      };
      const mockOrderFulfilled = {
        id: 'order-2',
        status: OrderStatus.READY,
        userId: 'user-1',
        quote: { quantity: 1 },
        devices: [{}],
      };

      mockOrderRepository.find.mockResolvedValue([
        mockOrderNoQuote,
        mockOrderFulfilled,
      ]);

      const result = await service.generateDevicesForReadyOrders(
        'user-1',
        'biz-1',
      );
      expect(result.length).toBe(0);
      expect(mockDeviceRepository.save).not.toHaveBeenCalled(); // No new devices to save
    });
  });

  describe('updateAssetNames', () => {
    it('should update name for matching assets', async () => {
      mockDeviceRepository.findOneBy.mockImplementation(({ id }) => {
        if (id === 'dev-1') return { id: 'dev-1', name: '' };
        return null;
      });
      mockDeviceRepository.save.mockImplementation((d) => d);

      const result = await service.updateAssetNames('biz-1', {
        assets: [
          { id: 'dev-1', name: 'New Name 1' },
          { id: 'dev-2', name: 'New Name 2' }, // Not found
        ],
      });

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('New Name 1');
      expect(mockDeviceRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
