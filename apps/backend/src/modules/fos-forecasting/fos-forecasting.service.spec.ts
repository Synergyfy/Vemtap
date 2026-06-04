import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FosForecastingService } from './fos-forecasting.service';
import { ForecastScenario } from './entities/forecast-scenario.entity';

describe('FosForecastingService', () => {
  let service: FosForecastingService;
  let scenarioRepo: Repository<ForecastScenario>;

  const mockScenarioRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosForecastingService,
        {
          provide: getRepositoryToken(ForecastScenario),
          useValue: mockScenarioRepo,
        },
      ],
    }).compile();

    service = module.get<FosForecastingService>(FosForecastingService);
    scenarioRepo = module.get<Repository<ForecastScenario>>(
      getRepositoryToken(ForecastScenario),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('project', () => {
    it('should compute forecast projection', async () => {
      const dto = {
        baseBusinesses: 100,
        arpu: 5000,
        fixedCosts: 200000,
        grossRevenue: 500000,
        variableCostMargin: 0.5,
        cashBalance: 1000000,
        qrThriveLeadsPerMonth: 10,
        period: 3,
        growthRate: 10,
        churnRate: 5,
        conversionRate: 20,
      };

      const result = await service.project(dto);

      expect(result.monthlyData).toHaveLength(3);
      expect(result.summary).toBeDefined();
      expect(result.summary.projectedMrr).toBeGreaterThan(0);
    });

    it('should handle decline detection', async () => {
      const dto = {
        baseBusinesses: 100,
        arpu: 5000,
        fixedCosts: 1000000,
        grossRevenue: 500000,
        variableCostMargin: 0.3,
        cashBalance: 500000,
        qrThriveLeadsPerMonth: 0,
        period: 6,
        growthRate: 2,
        churnRate: 15,
        conversionRate: 5,
      };

      const result = await service.project(dto);

      expect(result.summary.isDeclining).toBe(true);
      expect(result.summary.healthAlert).toBe('HIGH_RISK');
    });

    it('should handle zero businesses gracefully', async () => {
      const dto = {
        baseBusinesses: 0,
        arpu: 5000,
        fixedCosts: 200000,
        grossRevenue: 0,
        variableCostMargin: 0.5,
        cashBalance: 0,
        qrThriveLeadsPerMonth: 0,
        period: 3,
        growthRate: 10,
        churnRate: 5,
        conversionRate: 20,
      };

      const result = await service.project(dto);

      expect(result.monthlyData).toHaveLength(3);
      expect(result.monthlyData[0].businesses).toBe(0);
    });
  });

  describe('persist', () => {
    it('should save a forecast scenario', async () => {
      const dto = {
        scenarioName: 'Test Scenario',
        parameters: { growthRate: 10, churnRate: 5, conversionRate: 15, period: 12 },
        result: { summary: { projectedMrr: 1800000, mrrGrowthPercent: 44, totalProjectedProfit: 7200000, isDeclining: false, healthAlert: 'HEALTHY' as const }, monthlyData: [] },
      };

      const saved = {
        id: 'forecast-1',
        scenarioName: 'Test Scenario',
        createdAt: new Date(),
        parameters: dto.parameters,
        result: dto.result,
      };

      mockScenarioRepo.create.mockReturnValue(saved);
      mockScenarioRepo.save.mockResolvedValue(saved);

      const result = await service.persist(dto);

      expect(result.id).toBe('forecast-1');
      expect(result.scenarioName).toBe('Test Scenario');
      expect(mockScenarioRepo.create).toHaveBeenCalled();
      expect(mockScenarioRepo.save).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should return saved scenarios', async () => {
      const scenarios = [
        {
          id: 'forecast-1',
          scenarioName: 'Test',
          createdAt: new Date(),
          parameters: { growthRate: 10, churnRate: 5, conversionRate: 15, period: 12 },
          result: { summary: { projectedMrr: 1800000, mrrGrowthPercent: 44, totalProjectedProfit: 7200000, isDeclining: false, healthAlert: 'HEALTHY' } },
        },
      ];

      mockScenarioRepo.find.mockResolvedValue(scenarios);

      const result = await service.getHistory();

      expect(result).toHaveLength(1);
      expect(result[0].scenarioName).toBe('Test');
    });

    it('should return empty array', async () => {
      mockScenarioRepo.find.mockResolvedValue([]);

      const result = await service.getHistory();

      expect(result).toEqual([]);
    });
  });
});
