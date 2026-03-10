import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { Order } from '../products/entities/order.entity';
import { Branch } from '../branches/entities/branch.entity';
import { BranchesModule } from '../branches/branches.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, Order, Branch]),
    forwardRef(() => BranchesModule),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
