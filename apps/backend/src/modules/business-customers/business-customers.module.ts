import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { BusinessCustomerNote } from './entities/business-customer-note.entity';
import { BusinessCustomersController } from './business-customers.controller';
import { BusinessCustomersService } from './business-customers.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessCustomerNote]), LoyaltyModule],
  controllers: [BusinessCustomersController],
  providers: [BusinessCustomersService],
})
export class BusinessCustomersModule {}
