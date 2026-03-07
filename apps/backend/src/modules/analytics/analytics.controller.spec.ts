import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { JwtService } from '@nestjs/jwt';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            getDashboardAnalytics: jest.fn(),
            getFootfallAnalytics: jest.fn(),
            getPeakTimesAnalytics: jest.fn(),
            getAdminSummary: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardAnalytics', () => {
    it('should return dashboard analytics data', async () => {
      const result = { test: 'data' } as any;
      jest.spyOn(service, 'getDashboardAnalytics').mockResolvedValue(result);

      expect(await controller.getDashboardAnalytics({} as any, {} as any)).toBe(
        result,
      );
      expect(service.getDashboardAnalytics).toHaveBeenCalled();
    });
  });

  describe('getFootfallAnalytics', () => {
    it('should return footfall analytics data', async () => {
      const result = { test: 'data' } as any;
      jest.spyOn(service, 'getFootfallAnalytics').mockResolvedValue(result);

      expect(await controller.getFootfallAnalytics({} as any, {} as any)).toBe(
        result,
      );
      expect(service.getFootfallAnalytics).toHaveBeenCalled();
    });
  });

  describe('getPeakTimesAnalytics', () => {
    it('should return peak times analytics data', async () => {
      const result = { test: 'data' } as any;
      jest.spyOn(service, 'getPeakTimesAnalytics').mockResolvedValue(result);

      expect(await controller.getPeakTimesAnalytics({} as any, {} as any)).toBe(
        result,
      );
      expect(service.getPeakTimesAnalytics).toHaveBeenCalled();
    });
  });
});
