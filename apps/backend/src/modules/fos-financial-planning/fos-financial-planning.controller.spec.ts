import { Test, TestingModule } from '@nestjs/testing';
import { FosFinancialPlanningController } from './fos-financial-planning.controller';
import { FosFinancialPlanningService } from './fos-financial-planning.service';
import { TargetPeriodType } from './entities/financial-target.entity';

describe('FosFinancialPlanningController', () => {
  let controller: FosFinancialPlanningController;
  let service: FosFinancialPlanningService;

  const mockService = {
    createTarget: jest.fn(),
    getTargets: jest.fn(),
    simulateScenario: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FosFinancialPlanningController],
      providers: [
        {
          provide: FosFinancialPlanningService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FosFinancialPlanningController>(
      FosFinancialPlanningController,
    );
    service = module.get<FosFinancialPlanningService>(
      FosFinancialPlanningService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTarget', () => {
    it('should create a new budget target', async () => {
      const dto = {
        periodType: TargetPeriodType.MONTHLY,
        targetRevenue: 5000000,
        targetBusinesses: 500,
        targetSmsUsage: 10000,
        targetEmailUsage: 5000,
        profitMargin: 30,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      };
      const result = {
        id: 'target-1',
        ...dto,
        achievedRevenuePercentage: 0,
        achievedProfitPercentage: 0,
        createdAt: new Date(),
      };
      mockService.createTarget.mockResolvedValue(result);

      expect(await controller.createTarget(dto)).toEqual(result);
      expect(service.createTarget).toHaveBeenCalledWith(dto);
    });
  });

  describe('getTargets', () => {
    it('should list all targets', async () => {
      const filter = {};
      const result = [
        {
          id: 'target-1',
          periodType: TargetPeriodType.MONTHLY,
          targetRevenue: 5000000,
          targetBusinesses: 500,
          targetSmsUsage: 10000,
          targetEmailUsage: 5000,
          profitMargin: 30,
          achievedRevenuePercentage: 45.5,
          achievedProfitPercentage: 38.2,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          createdAt: new Date(),
        },
      ];
      mockService.getTargets.mockResolvedValue(result);

      expect(await controller.getTargets(filter)).toEqual(result);
      expect(service.getTargets).toHaveBeenCalledWith(filter);
    });
  });

  describe('simulateScenario', () => {
    it('should simulate scenarios', async () => {
      const dto = {
        currentBusinesses: 340,
        growthRate: 10,
        churnRate: 5,
        pricing: 5000,
        agentFactor: 1.5,
        projectionMonths: 12,
        profitMargin: 30,
      };
      const result = {
        best: { totalProfit: 5000000, monthlyBreakdown: [] },
        expected: { totalProfit: 3000000, monthlyBreakdown: [] },
        worst: { totalProfit: 1000000, monthlyBreakdown: [] },
      };
      mockService.simulateScenario.mockResolvedValue(result);

      expect(await controller.simulateScenario(dto)).toEqual(result);
      expect(service.simulateScenario).toHaveBeenCalledWith(dto);
    });
  });
});
