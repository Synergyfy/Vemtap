import { Test, TestingModule } from '@nestjs/testing';
import { PlansService } from './plans.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Repository } from 'typeorm';
import { PricingUtil } from './utils/pricing.util';

import { SubscriptionTaxService } from './services/subscription-tax.service';
import { TaxType } from './entities/subscription-tax-config.entity';

describe('PlansService', () => {
  let service: PlansService;
  let repository: Repository<Plan>;

  const mockPlan = {
    id: '1',
    name: 'Test Plan',
    monthlyPrice: 1000,
    quarterlyPrice: PricingUtil.calculateQuarterlyPrice(1000),
    yearlyPrice: PricingUtil.calculateYearlyPrice(1000),
    isActive: true,
    features: ['basic'],
    trialDurationDays: 30,
    smsCredits: 100,
    emailCredits: 100,
    whatsappCredits: 100,
  };

  const mockTaxConfig = {
    id: 'tax-1',
    name: 'VAT',
    taxType: TaxType.PERCENTAGE,
    rate: 10,
    isEnabled: true,
    isActive: true,
  };

  const mockSubscriptionTaxService = {
    getActiveConfig: jest.fn().mockResolvedValue(mockTaxConfig),
    calculateTax: jest.fn().mockImplementation((subtotal, config) => {
      if (!config?.isEnabled) {
        return {
          subtotal,
          taxAmount: 0,
          total: subtotal,
          taxRule: { name: 'VAT', taxType: TaxType.PERCENTAGE, rate: 10, isEnabled: false },
        };
      }
      const taxAmount = (subtotal * config.rate) / 100;
      return {
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        taxRule: { name: config.name, taxType: config.taxType, rate: config.rate, isEnabled: true },
      };
    }),
  };

  const mockPlanRepository = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest
      .fn()
      .mockImplementation((plan) => Promise.resolve({ id: '1', ...plan })),
    find: jest.fn().mockResolvedValue([mockPlan]),
    findOne: jest.fn().mockResolvedValue(mockPlan),
    remove: jest.fn().mockResolvedValue(undefined),
    softRemove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        {
          provide: getRepositoryToken(Plan),
          useValue: mockPlanRepository,
        },
        {
          provide: SubscriptionTaxService,
          useValue: mockSubscriptionTaxService,
        },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
    repository = module.get<Repository<Plan>>(getRepositoryToken(Plan));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new plan and calculate derived prices', async () => {
    const dto = {
      name: 'New Plan',
      monthlyPrice: 2000,
      isActive: true,
      features: ['feature1'],
      trialDurationDays: 30,
    };
    const plan = await service.create(dto);

    expect(plan.quarterlyPrice).toBe(PricingUtil.calculateQuarterlyPrice(2000));
    expect(plan.yearlyPrice).toBe(PricingUtil.calculateYearlyPrice(2000));
    expect(mockPlanRepository.create).toHaveBeenCalledWith(dto);
    expect(mockPlanRepository.save).toHaveBeenCalled();
  });

  it('should return all plans with tax breakdown and price with tax included', async () => {
    const plans = await service.findAll();
    expect(plans).toHaveLength(1);
    expect(plans[0].id).toBe('1');
    expect(plans[0].monthlyPrice).toBe(1000);
    expect(plans[0].monthlyTax).toBe(100);
    expect(plans[0].monthlyPriceWithTax).toBe(1100);
    expect(plans[0].pricing.monthly.totalPrice).toBe(1100);
    expect(mockPlanRepository.find).toHaveBeenCalled();
  });

  it('should return one plan by id with tax breakdown', async () => {
    const plan = await service.findOne('1');
    expect(plan.id).toBe('1');
    expect(plan.monthlyPrice).toBe(1000);
    expect(plan.monthlyTax).toBe(100);
    expect(plan.monthlyPriceWithTax).toBe(1100);
    expect(mockPlanRepository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('should update a plan and recalculate prices', async () => {
    const dto = { name: 'Updated Plan', monthlyPrice: 5000 };

    // We expect the service to call findOne (returning mockPlan), then update it.
    // mockPlan has monthlyPrice 1000.
    // update overwrites with 5000.
    // service recalculates derived prices based on 5000.

    const updatedPlan = await service.update('1', dto);

    expect(updatedPlan.monthlyPrice).toBe(5000);
    expect(updatedPlan.quarterlyPrice).toBe(
      PricingUtil.calculateQuarterlyPrice(5000),
    );
    expect(updatedPlan.yearlyPrice).toBe(
      PricingUtil.calculateYearlyPrice(5000),
    );

    expect(mockPlanRepository.save).toHaveBeenCalled();
  });

  it('should remove a plan', async () => {
    await service.remove('1');
    expect(mockPlanRepository.softRemove).toHaveBeenCalledWith(mockPlan);
  });

  it('should return a free plan', async () => {
    mockPlanRepository.findOne.mockResolvedValueOnce({
      ...mockPlan,
      isFree: true,
    });
    const plan = await service.findFreePlan();
    expect(plan).toBeDefined();
    expect(plan!.isFree).toBe(true);

    expect(mockPlanRepository.findOne).toHaveBeenCalledWith({
      where: { isFree: true, isActive: true },
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions and set permissionsConfiguredAt', async () => {
      const dto = {
        inventoryEnabled: true,
        inventoryLimit: 10,
        posEnabled: false,
        formsEnabled: true,
        formsLimit: 5,
      };
      const mockPlanWithPerms = { ...mockPlan };
      mockPlanRepository.findOne.mockResolvedValue(mockPlanWithPerms);

      const beforeUpdate = new Date();
      const result = await service.updatePermissions('1', dto);

      expect(result.inventoryEnabled).toBe(true);
      expect(result.inventoryLimit).toBe(10);
      expect(result.posEnabled).toBe(false);
      expect(result.formsEnabled).toBe(true);
      expect(result.formsLimit).toBe(5);
      expect(result.permissionsConfiguredAt).toBeInstanceOf(Date);
      expect(result.permissionsConfiguredAt!.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(mockPlanRepository.save).toHaveBeenCalled();
    });
  });

  describe('getPermissions', () => {
    it('should return only permission columns', async () => {
      mockPlanRepository.findOne.mockResolvedValue({
        ...mockPlan,
        inventoryEnabled: true,
        inventoryLimit: 10,
        permissionsConfiguredAt: new Date(),
      });

      const result = await service.getPermissions('1');

      expect(result.id).toBe('1');
      expect(result).toHaveProperty('inventoryEnabled');
      expect(result).toHaveProperty('inventoryLimit');
      expect(result).toHaveProperty('permissionsConfiguredAt');
      expect(result).toHaveProperty('messagingEnabled');
      expect(result).toHaveProperty('smsCredits');
      expect(result).toHaveProperty('branchesEnabled');
      expect(result).toHaveProperty('branchLimit');
      expect(result).toHaveProperty('teamMembersEnabled');
      expect(result).toHaveProperty('teamMembersLimit');
      expect(result).toHaveProperty('loyaltyEnabled');
      expect(result).toHaveProperty('loyaltyLimit');
      expect(result).toHaveProperty('analyticsEnabled');
      expect(result).toHaveProperty('analyticsLevel');
      expect(result).toHaveProperty('catalogueEnabled');
      expect(result).toHaveProperty('maxCatalogueItems');
      expect(result).toHaveProperty('maxCatalogueCategories');
      expect(result).toHaveProperty('maxCatalogueOffers');
      expect(result).toHaveProperty('automationsEnabled');
      expect(result).toHaveProperty('maxAutomations');
      expect(result).toHaveProperty('posEnabled');
      expect(result).toHaveProperty('posTerminalLimit');
      expect(result).toHaveProperty('visitorsEnabled');
      expect(result).toHaveProperty('inAppChatEnabled');
      expect(result).toHaveProperty('formsLimit');
      expect(result).toHaveProperty('businessQrEnabled');
      expect(result).toHaveProperty('marketingKitEnabled');
      expect(result).toHaveProperty('marketingKitLimit');
      expect(result).toHaveProperty('discoveryEnabled');
      expect(result).toHaveProperty('staffRolesEnabled');
      expect(result).toHaveProperty('staffRolesLimit');
      expect(result).toHaveProperty('activityLogEnabled');
      expect(result).toHaveProperty('qrCodesEnabled');
      expect(result).toHaveProperty('qrCodesLimit');
    });
  });
});
