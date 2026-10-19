import { Module } from '@nestjs/common';
import { CustomerActivityController } from './customer-activity.controller';
import { CustomerActivityService } from './customer-activity.service';

@Module({
  controllers: [CustomerActivityController],
  providers: [CustomerActivityService],
})
export class CustomerActivityModule {}
