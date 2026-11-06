import { Module } from '@nestjs/common';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { BusinessAnalyticsController } from './business-analytics.controller';
import { BusinessAnalyticsService } from './business-analytics.service';
import { BusinessAnalyticsExportService } from './business-analytics-export.service';
import { BusinessQrController } from './business-qr.controller';
import { BusinessQrService } from './business-qr.service';

@Module({
  imports: [LoyaltyModule],
  controllers: [BusinessAnalyticsController, BusinessQrController],
  providers: [
    BusinessAnalyticsService,
    BusinessAnalyticsExportService,
    BusinessQrService,
  ],
  exports: [BusinessAnalyticsService],
})
export class BusinessAnalyticsModule {}
