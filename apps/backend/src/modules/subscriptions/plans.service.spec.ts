import { Test, TestingModule } from '@nestjs/testing';
import { PlansService } from './plans.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Repository } from 'typeorm';
import { PricingUtil } from './utils/pricing.util';

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

  const mockPlanRepository = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })), // Mock create returning object similar to DTO
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
    const plan = await service.create(dto as any);

    expect(plan.quarterlyPrice).toBe(PricingUtil.calculateQuarterlyPrice(2000));
    expect(plan.yearlyPrice).toBe(PricingUtil.calculateYearlyPrice(2000));
    expect(mockPlanRepository.create).toHaveBeenCalledWith(dto);
    expect(mockPlanRepository.save).toHaveBeenCalled();
  });

  it('should return all plans', async () => {
    const plans = await service.findAll();
    expect(plans).toEqual([mockPlan]);
    expect(mockPlanRepository.find).toHaveBeenCalled();
  });

  it('should return one plan by id', async () => {
    const plan = await service.findOne('1');
    expect(plan).toEqual(mockPlan);
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
});
