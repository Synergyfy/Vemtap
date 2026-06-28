import { Test, TestingModule } from '@nestjs/testing';
import { AddonsController } from './addons.controller';
import { AddonsService } from './services/addons.service';
import { AddOn, AddOnType } from './entities/addon.entity';
import {
  BusinessAddOn,
  BusinessAddOnStatus,
} from './entities/business-addon.entity';
import { UserRole } from '../users/entities/user.entity';

describe('AddonsController', () => {
  let controller: AddonsController;

  const mockAddon = {
    id: 'addon-1',
    name: '3 Extra Branches',
    description: 'Adds 3 branch slots',
    type: AddOnType.RESOURCE,
    price: 15000,
    durationDays: 30,
    currency: 'NGN',
    isActive: true,
    targetCapability: 'branches',
    additionalLimit: 3,
    serviceDetails: null,
    isOneTime: false,
    isRecurring: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockServiceAddon = {
    id: 'addon-2',
    name: 'Dashboard Manager Agent',
    description: 'Dedicated agent for dashboard management',
    type: AddOnType.SERVICE,
    price: 50000,
    durationDays: 30,
    currency: 'NGN',
    isActive: true,
    targetCapability: null,
    additionalLimit: null,
    serviceDetails: {
      agentType: 'dashboard_manager',
      description: 'Manages your dashboard',
      deliverables: ['Weekly report'],
    },
    isOneTime: false,
    isRecurring: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBusinessAddon = {
    id: 'ba-1',
    addonId: 'addon-1',
    businessId: 'b1',
    addon: mockAddon,
    status: BusinessAddOnStatus.ACTIVE,
    purchasedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    quantity: 1,
    totalPaid: 15000,
    paymentReference: 'TRF_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAddonsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    purchaseAddons: jest.fn(),
    getBusinessAddons: jest.fn(),
    cancelAddon: jest.fn(),
    create: jest.fn(),
    findAllAdmin: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getAdminStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddonsController],
      providers: [{ provide: AddonsService, useValue: mockAddonsService }],
    }).compile();

    controller = module.get<AddonsController>(AddonsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return active add-ons', async () => {
      mockAddonsService.findAll.mockResolvedValue([
        mockAddon,
        mockServiceAddon,
      ]);
      const result = await controller.findAll();
      expect(mockAddonsService.findAll).toHaveBeenCalledWith(true);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return an add-on by id', async () => {
      mockAddonsService.findOne.mockResolvedValue(mockAddon);
      const result = await controller.findOne('addon-1');
      expect(mockAddonsService.findOne).toHaveBeenCalledWith('addon-1');
      expect(result).toEqual(mockAddon);
    });
  });

  describe('purchaseAddons', () => {
    it('should call service to purchase add-ons for user business', async () => {
      mockAddonsService.purchaseAddons.mockResolvedValue([mockBusinessAddon]);
      const req = {
        user: { id: 'u1', businessId: 'b1', role: UserRole.OWNER },
      } as any;
      const dto = { addonIds: ['addon-1'], paymentReference: 'TRF_123' };

      const result = await controller.purchaseAddons(req, dto);

      expect(mockAddonsService.purchaseAddons).toHaveBeenCalledWith(
        dto,
        'b1',
        'u1',
      );
      expect(result).toEqual([mockBusinessAddon]);
    });
  });

  describe('getMyAddons', () => {
    it('should return purchased add-ons for current business', async () => {
      mockAddonsService.getBusinessAddons.mockResolvedValue([
        mockBusinessAddon,
      ]);
      const req = { user: { businessId: 'b1' } } as any;

      const result = await controller.getMyAddons(req);

      expect(mockAddonsService.getBusinessAddons).toHaveBeenCalledWith('b1');
      expect(result).toEqual([mockBusinessAddon]);
    });
  });

  describe('cancelAddon', () => {
    it('should cancel an add-on for business', async () => {
      mockAddonsService.cancelAddon.mockResolvedValue({
        ...mockBusinessAddon,
        status: BusinessAddOnStatus.CANCELED,
      });
      const req = { user: { businessId: 'b1' } } as any;

      const result = await controller.cancelAddon(req, 'ba-1');

      expect(mockAddonsService.cancelAddon).toHaveBeenCalledWith('ba-1', 'b1');
      expect(result.status).toBe(BusinessAddOnStatus.CANCELED);
    });
  });

  describe('create (Admin)', () => {
    it('should create a new add-on', async () => {
      mockAddonsService.create.mockResolvedValue(mockAddon);
      const dto = {
        name: 'New Add-on',
        type: AddOnType.RESOURCE,
        price: 15000,
      };

      const result = await controller.create(dto);

      expect(mockAddonsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAddon);
    });
  });

  describe('findAllAdmin', () => {
    it('should return all add-ons for admin', async () => {
      mockAddonsService.findAllAdmin.mockResolvedValue([
        mockAddon,
        mockServiceAddon,
      ]);
      const result = await controller.findAllAdmin();
      expect(mockAddonsService.findAllAdmin).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOneAdmin', () => {
    it('should return single add-on for admin', async () => {
      mockAddonsService.findOne.mockResolvedValue(mockServiceAddon);
      const result = await controller.findOneAdmin('addon-2');
      expect(result).toEqual(mockServiceAddon);
    });
  });

  describe('update (Admin)', () => {
    it('should update an add-on', async () => {
      const updated = { ...mockAddon, name: 'Updated' };
      mockAddonsService.update.mockResolvedValue(updated);
      const result = await controller.update('addon-1', { name: 'Updated' });
      expect(mockAddonsService.update).toHaveBeenCalledWith('addon-1', {
        name: 'Updated',
      });
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove (Admin)', () => {
    it('should deactivate an add-on', async () => {
      mockAddonsService.remove.mockResolvedValue(undefined);
      await controller.remove('addon-1');
      expect(mockAddonsService.remove).toHaveBeenCalledWith('addon-1');
    });
  });

  describe('getAdminStats', () => {
    it('should return admin statistics', async () => {
      const stats = {
        totalAddons: 5,
        activeAddons: 4,
        resourceAddons: 3,
        serviceAddons: 2,
        totalPurchases: 20,
        activePurchases: 15,
      };
      mockAddonsService.getAdminStats.mockResolvedValue(stats);
      const result = await controller.getAdminStats();
      expect(result).toEqual(stats);
    });
  });
});
