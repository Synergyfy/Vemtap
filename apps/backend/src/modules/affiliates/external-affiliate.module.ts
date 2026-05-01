import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ExternalAffiliateService } from './external-affiliate.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [ExternalAffiliateService],
  exports: [ExternalAffiliateService],
})
export class ExternalAffiliateModule {}
