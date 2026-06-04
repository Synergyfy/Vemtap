import { Test, TestingModule } from '@nestjs/testing';
import { FosDashboardController } from './fos-dashboard.controller';
import { FosDashboardService } from './fos-dashboard.service';

describe('FosDashboardController', () => {
  let controller: FosDashboardController;
  let service: FosDashboardService;

  const mockService = {
    getStats: jest.fn(),
    getSnapshots: jest.fn(),
    getInsights: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FosDashboardController],
      providers: [
        {
          provide: FosDashboardService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FosDashboardController>(FosDashboardController);
    service = module.get<FosDashboardService>(FosDashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return dashboard stats', async () => {
      const result = {
        totalRevenue: 1250000,
        netProfit: 450000,
        totalBusinesses: 340,
        activeAgents: 28,
        smsSent: 15200,
        vemtapRevenue: 850000,
        qrthriveRevenue: 400000,
        commissionsPaid: 175000,
        cashBalance: 2500000,
        churnRate: 5.2,
        conversionRate: 12.8,
      };
      mockService.getStats.mockResolvedValue(result);

      expect(await controller.getStats()).toEqual(result);
      expect(service.getStats).toHaveBeenCalled();
    });
  });

  describe('getSnapshots', () => {
    it('should return daily snapshots', async () => {
      const result = [
        {
          date: '2026-01-15',
          totalRevenue: 1250000,
          totalProfit: 450000,
          totalBusinesses: 340,
          churnRate: 5.2,
          conversionRate: 12.8,
        },
      ];
      mockService.getSnapshots.mockResolvedValue(result);

      expect(await controller.getSnapshots()).toEqual(result);
      expect(service.getSnapshots).toHaveBeenCalled();
    });

    it('should return empty array when no snapshots', async () => {
      mockService.getSnapshots.mockResolvedValue([]);

      expect(await controller.getSnapshots()).toEqual([]);
    });
  });

  describe('getInsights', () => {
    it('should return insights array', async () => {
      const result = [
        {
          type: 'HIGH_PERFORMANCE',
          title: 'Best Performing Agent',
          message: 'Agent test-abc generated NGN 250,000 in MRR',
          severity: 'SUCCESS',
        },
      ];
      mockService.getInsights.mockResolvedValue(result);

      expect(await controller.getInsights()).toEqual(result);
      expect(service.getInsights).toHaveBeenCalled();
    });

    it('should return empty array when no insights', async () => {
      mockService.getInsights.mockResolvedValue([]);

      expect(await controller.getInsights()).toEqual([]);
    });
  });
});
