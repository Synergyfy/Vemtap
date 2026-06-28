import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AddonsService } from './addons.service';
import { AddOn, AddOnType } from '../entities/addon.entity';
import {
  BusinessAddOn,
  BusinessAddOnStatus,
} from '../entities/business-addon.entity';
import { Business } from '../../businesses/entities/business.entity';
import { PaymentsService } from '../../payments/payments.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AddonsService', () => {
  let service: AddonsService;

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
    imageUrl: null,
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
      deliverables: ['Weekly report', '24/7 support'],
    },
    isOneTime: false,
    isRecurring: true,
    imageUrl: null,
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
    paystackAuthorizationCode: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAddonRepository = {
    create: jest
      .fn()
      .mockImplementation((dto) => ({ ...dto, id: 'new-addon-id' })),
    save: jest
      .fn()
      .mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 'new-addon-id' }),
      ),
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    count: jest.fn().mockResolvedValue(5),
  };

  const mockBusinessAddonRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'new-ba-id' }),
      ),
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    count: jest.fn().mockResolvedValue(12),
  };

  const mockBusinessRepository = {
    findOne: jest.fn(),
  };

  const mockPaymentsService = {
    verifyTransaction: jest.fn().mockResolvedValue({
      status: 'success',
      authorization: { authorization_code: 'AUTH_123' },
    }),
    recordPayment: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddonsService,
        { provide: getRepositoryToken(AddOn), useValue: mockAddonRepository },
        {
          provide: getRepositoryToken(BusinessAddOn),
          useValue: mockBusinessAddonRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepository,
        },
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    service = module.get<AddonsService>(AddonsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new add-on', async () => {
      const dto = {
        name: 'New Add-on',
        type: AddOnType.RESOURCE,
        price: 10000,
      };
      const savedEntity = {
        id: 'new-addon-id',
        name: 'New Add-on',
        type: AddOnType.RESOURCE,
        price: 10000,
        durationDays: 30,
        currency: 'NGN',
        isActive: true,
        targetCapability: '',
        additionalLimit: null,
        serviceDetails: null,
        isOneTime: false,
        isRecurring: false,
        imageUrl: '',
        description: '',
      };
      mockAddonRepository.save.mockResolvedValue(savedEntity);
      const result = await service.create(dto);
      expect(mockAddonRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('new-addon-id');
      expect(result.name).toBe('New Add-on');
      expect(result.type).toBe(AddOnType.RESOURCE);
    });
  });

  describe('findAll', () => {
    it('should return only active add-ons when onlyActive=true', async () => {
      mockAddonRepository.find.mockResolvedValue([mockAddon]);
      const result = await service.findAll(true);
      expect(mockAddonRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { price: 'ASC' },
      });
      expect(result).toEqual([mockAddon]);
    });

    it('should return all add-ons when onlyActive=false', async () => {
      mockAddonRepository.find.mockResolvedValue([mockAddon, mockServiceAddon]);
      const result = await service.findAll(false);
      expect(mockAddonRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { price: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return an add-on by id', async () => {
      mockAddonRepository.findOne.mockResolvedValue(mockAddon);
      const result = await service.findOne('addon-1');
      expect(result).toEqual(mockAddon);
    });

    it('should throw NotFoundException if add-on not found', async () => {
      mockAddonRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an add-on', async () => {
      mockAddonRepository.findOne.mockResolvedValue({ ...mockAddon });
      mockAddonRepository.save.mockResolvedValue({
        ...mockAddon,
        name: 'Updated Name',
      });
      const result = await service.update('addon-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should soft-delete add-on by setting isActive=false', async () => {
      mockAddonRepository.findOne.mockResolvedValue({ ...mockAddon });
      mockAddonRepository.save.mockResolvedValue({
        ...mockAddon,
        isActive: false,
      });
      await service.remove('addon-1');
      expect(mockAddonRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });
  });

  describe('purchaseAddons', () => {
    it('should throw BadRequestException if no addonIds provided', async () => {
      await expect(
        service.purchaseAddons(
          { addonIds: [], paymentReference: 'TRF_123' } as any,
          'b1',
          'u1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if addons not found', async () => {
      mockAddonRepository.findBy.mockResolvedValue([]);
      await expect(
        service.purchaseAddons(
          { addonIds: ['non-existent'] } as any,
          'b1',
          'u1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create business add-on records and record payment', async () => {
      mockAddonRepository.findBy.mockResolvedValue([mockAddon]);
      mockBusinessAddonRepository.create.mockImplementation((dto) => dto);
      mockBusinessAddonRepository.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'new-ba-id' }),
      );
      mockPaymentsService.verifyTransaction.mockResolvedValue({
        status: 'success',
      });

      const result = await service.purchaseAddons(
        { addonIds: ['addon-1'], paymentReference: 'TRF_123', quantity: 2 },
        'b1',
        'u1',
      );

      expect(result).toHaveLength(1);
      expect(result[0].totalPaid).toBe(30000);
      expect(result[0].quantity).toBe(2);
      expect(mockPaymentsService.recordPayment).toHaveBeenCalled();
    });

    it('should handle one-time add-ons with far future expiry', async () => {
      const oneTimeAddon = { ...mockAddon, isOneTime: true };
      mockAddonRepository.findBy.mockResolvedValue([oneTimeAddon]);
      mockBusinessAddonRepository.create.mockImplementation((dto) => dto);
      mockBusinessAddonRepository.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'new-ba-id' }),
      );

      const result = await service.purchaseAddons(
        { addonIds: ['addon-1'], quantity: 1 },
        'b1',
        'u1',
      );

      const expiresYear = new Date(result[0].expiresAt).getFullYear();
      expect(expiresYear).toBe(2099);
    });
  });

  describe('getAddonCapabilities', () => {
    it('should return summed additional limits per capability', async () => {
      mockBusinessAddonRepository.find.mockResolvedValue([
        { ...mockBusinessAddon, quantity: 2 },
      ]);
      const result = await service.getAddonCapabilities('b1');
      expect(result['branches']).toBe(6);
    });

    it('should return empty object if no active add-ons', async () => {
      mockBusinessAddonRepository.find.mockResolvedValue([]);
      const result = await service.getAddonCapabilities('b1');
      expect(result).toEqual({});
    });

    it('should sum multiple add-ons of same capability', async () => {
      mockBusinessAddonRepository.find.mockResolvedValue([
        mockBusinessAddon,
        {
          ...mockBusinessAddon,
          id: 'ba-2',
          addon: { ...mockAddon, id: 'addon-2', additionalLimit: 5 },
        },
      ]);
      const result = await service.getAddonCapabilities('b1');
      expect(result['branches']).toBe(8);
    });

    it('should ignore service add-ons in capability map', async () => {
      mockBusinessAddonRepository.find.mockResolvedValue([
        { ...mockBusinessAddon, addon: mockServiceAddon },
      ]);
      const result = await service.getAddonCapabilities('b1');
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('getServiceAddons', () => {
    it('should return only service-type active add-ons', async () => {
      mockBusinessAddonRepository.find.mockResolvedValue([
        { ...mockBusinessAddon, addon: mockServiceAddon },
      ]);
      const result = await service.getServiceAddons('b1');
      expect(result).toHaveLength(1);
      expect(result[0].addon.type).toBe(AddOnType.SERVICE);
    });
  });

  describe('cancelAddon', () => {
    it('should cancel a recurring service add-on', async () => {
      mockBusinessAddonRepository.findOne.mockResolvedValue({
        ...mockBusinessAddon,
        addon: mockServiceAddon,
      });
      mockBusinessAddonRepository.save.mockResolvedValue({
        ...mockBusinessAddon,
        status: BusinessAddOnStatus.CANCELED,
      });

      const result = await service.cancelAddon('ba-1', 'b1');
      expect(result.status).toBe(BusinessAddOnStatus.CANCELED);
    });

    it('should throw NotFoundException if business add-on not found', async () => {
      mockBusinessAddonRepository.findOne.mockResolvedValue(null);
      await expect(service.cancelAddon('non-existent', 'b1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for non-recurring add-ons', async () => {
      mockBusinessAddonRepository.findOne.mockResolvedValue({
        ...mockBusinessAddon,
        addon: mockAddon,
      });
      await expect(service.cancelAddon('ba-1', 'b1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateAddons', () => {
    it('should return add-ons when all found and active', async () => {
      mockAddonRepository.findBy.mockResolvedValue([mockAddon]);
      const result = await service.validateAddons(['addon-1']);
      expect(result).toHaveLength(1);
    });

    it('should throw BadRequestException if any add-on not found or inactive', async () => {
      mockAddonRepository.findBy.mockResolvedValue([mockAddon]);
      await expect(
        service.validateAddons(['addon-1', 'non-existent']),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAdminStats', () => {
    it('should return aggregated statistics', async () => {
      mockAddonRepository.find.mockResolvedValue([mockAddon, mockServiceAddon]);
      mockBusinessAddonRepository.find.mockResolvedValue([mockBusinessAddon]);
      mockBusinessAddonRepository.count.mockResolvedValue(10);

      const result = await service.getAdminStats();
      expect(result.totalAddons).toBe(2);
      expect(result.activeAddons).toBe(2);
      expect(result.resourceAddons).toBe(1);
      expect(result.serviceAddons).toBe(1);
      expect(result.totalPurchases).toBe(10);
    });
  });

  describe('getBusinessAddons', () => {
    it('should return all add-ons for a business with addon relation', async () => {
      mockBusinessAddonRepository.find.mockResolvedValue([mockBusinessAddon]);
      const result = await service.getBusinessAddons('b1');
      expect(mockBusinessAddonRepository.find).toHaveBeenCalledWith({
        where: { businessId: 'b1' },
        relations: ['addon'],
        order: { purchasedAt: 'DESC' },
      });
      expect(result).toEqual([mockBusinessAddon]);
    });
  });

  describe('getActiveBusinessAddons', () => {
    it('should return only active add-ons not expired', async () => {
      mockBusinessAddonRepository.find.mockResolvedValue([mockBusinessAddon]);
      const result = await service.getActiveBusinessAddons('b1');
      expect(mockBusinessAddonRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});
