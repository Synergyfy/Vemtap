import { Test, TestingModule } from '@nestjs/testing';
import { PlansService } from './plans.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Repository } from 'typeorm';

describe('PlansService', () => {
  let service: PlansService;
  let repository: Repository<Plan>;

  const mockPlan = {
    id: '1',
    name: 'Test Plan',
    monthlyPrice: 1000,
    isActive: true,
  };

  const mockPlanRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((plan) => Promise.resolve({ id: '1', ...plan })),
    find: jest.fn().mockResolvedValue([mockPlan]),
    findOne: jest.fn().mockResolvedValue(mockPlan),
    remove: jest.fn().mockResolvedValue(undefined),
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

  it('should create a new plan', async () => {
    const dto = { name: 'New Plan', monthlyPrice: 2000, isActive: true };
    const plan = await service.create(dto as any);
    expect(plan).toEqual({ id: '1', ...dto });
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

  it('should update a plan', async () => {
    const dto = { name: 'Updated Plan' };
    const updatedPlan = await service.update('1', dto);
    expect(updatedPlan).toEqual({ ...mockPlan, ...dto });
    expect(mockPlanRepository.save).toHaveBeenCalled();
  });

  it('should remove a plan', async () => {
    await service.remove('1');
    expect(mockPlanRepository.remove).toHaveBeenCalledWith(mockPlan);
  });
});
