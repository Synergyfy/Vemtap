import { Test, TestingModule } from '@nestjs/testing';
import { FosForecastingController } from './fos-forecasting.controller';
import { FosForecastingService } from './fos-forecasting.service';

describe('FosForecastingController', () => {
  let controller: FosForecastingController;
  let service: FosForecastingService;

  const mockService = {
    project: jest.fn(),
    persist: jest.fn(),
    getHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FosForecastingController],
      providers: [
        {
          provide: FosForecastingService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FosForecastingController>(FosForecastingController);
    service = module.get<FosForecastingService>(FosForecastingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('project', () => {
    it('should run forecast projection', async () => {
      const dto = {
        baseBusinesses: 340,
        arpu: 3676.47,
        fixedCosts: 250000,
        grossRevenue: 1250000,
        variableCostMargin: 0.6,
        cashBalance: 2500000,
        qrThriveLeadsPerMonth: 0,
        period: 12,
        growthRate: 10,
        churnRate: 5,
        conversionRate: 15,
      };
      const result = {
        summary: {
          projectedMrr: 1800000,
          mrrGrowthPercent: 44,
          totalProjectedProfit: 7200000,
          isDeclining: false,
          healthAlert: 'HEALTHY' as const,
        },
        monthlyData: [],
      };
      mockService.project.mockResolvedValue(result);

      expect(await controller.project(dto)).toEqual(result);
      expect(service.project).toHaveBeenCalledWith(dto);
    });
  });

  describe('persist', () => {
    it('should save a forecast', async () => {
      const dto = {
        scenarioName: 'Q1 2026',
        parameters: {
          growthRate: 10,
          churnRate: 5,
          conversionRate: 15,
          period: 12,
        },
        result: { summary: { projectedMrr: 1800000 }, monthlyData: [] },
      };
      const result = {
        id: 'forecast-1',
        scenarioName: 'Q1 2026',
        createdAt: new Date(),
        parameters: dto.parameters,
        summary: { projectedMrr: 1800000 },
      };
      mockService.persist.mockResolvedValue(result);

      expect(await controller.persist(dto as any)).toEqual(result);
      expect(service.persist).toHaveBeenCalledWith(dto);
    });
  });

  describe('getHistory', () => {
    it('should return saved forecasts', async () => {
      const result = [
        {
          id: 'forecast-1',
          scenarioName: 'Q1 2026',
          createdAt: new Date(),
          parameters: {
            growthRate: 10,
            churnRate: 5,
            conversionRate: 15,
            period: 12,
          },
          summary: {
            projectedMrr: 1800000,
            mrrGrowthPercent: 44,
            totalProjectedProfit: 7200000,
            isDeclining: false,
            healthAlert: 'HEALTHY',
          },
        },
      ];
      mockService.getHistory.mockResolvedValue(result);

      expect(await controller.getHistory()).toEqual(result);
      expect(service.getHistory).toHaveBeenCalled();
    });

    it('should return empty array when no saved forecasts', async () => {
      mockService.getHistory.mockResolvedValue([]);

      expect(await controller.getHistory()).toEqual([]);
    });
  });
});
