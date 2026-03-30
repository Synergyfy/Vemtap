import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { DeviceTapController } from './device-tap.controller';
import { Order } from '../products/entities/order.entity';
import { Branch } from '../branches/entities/branch.entity';
import { BranchesModule } from '../branches/branches.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { VisitorsModule } from '../visitors/visitors.module';
import { CatalogueModule } from '../catalogue/catalogue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, Order, Branch]),
    forwardRef(() => BranchesModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => VisitorsModule),
    CatalogueModule,
  ],
  controllers: [DevicesController, DeviceTapController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
