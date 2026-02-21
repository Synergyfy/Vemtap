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
                AnalyticsService,
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
        it('should return dashboard analytics data', () => {
            const result = { test: 'data' } as any;
            jest.spyOn(service, 'getDashboardAnalytics').mockReturnValue(result);

            expect(controller.getDashboardAnalytics({})).toBe(result);
            expect(service.getDashboardAnalytics).toHaveBeenCalled();
        });
    });

    describe('getFootfallAnalytics', () => {
        it('should return footfall analytics data', () => {
            const result = { test: 'data' } as any;
            jest.spyOn(service, 'getFootfallAnalytics').mockReturnValue(result);

            expect(controller.getFootfallAnalytics({})).toBe(result);
            expect(service.getFootfallAnalytics).toHaveBeenCalled();
        });
    });

    describe('getPeakTimesAnalytics', () => {
        it('should return peak times analytics data', () => {
            const result = { test: 'data' } as any;
            jest.spyOn(service, 'getPeakTimesAnalytics').mockReturnValue(result);

            expect(controller.getPeakTimesAnalytics({})).toBe(result);
            expect(service.getPeakTimesAnalytics).toHaveBeenCalled();
        });
    });
});
