import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardAnalytics', () => {
    it('should return dashboard analytics data', () => {
      const result = service.getDashboardAnalytics();
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.peakTimes).toBeDefined();
      expect(result.messagingRoi).toBeDefined();
      expect(result.engagementQuality).toBeDefined();
      expect(result.topPerformers).toBeDefined();
    });
  });

  describe('getFootfallAnalytics', () => {
    it('should return footfall analytics data', () => {
      const result = service.getFootfallAnalytics();
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.hourlyData).toBeDefined();
      expect(result.trafficByEntrance).toBeDefined();
      expect(result.visitDuration).toBeDefined();
    });
  });

  describe('getPeakTimesAnalytics', () => {
    it('should return peak times analytics data', () => {
      const result = service.getPeakTimesAnalytics();
      expect(result).toBeDefined();
      expect(result.weeklyData).toBeDefined();
      expect(result.hoursLabels).toBeDefined();
      expect(result.smartSuggestion).toBeDefined();
    });
  });
});
