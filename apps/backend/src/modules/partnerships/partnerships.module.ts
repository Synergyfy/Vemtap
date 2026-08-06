import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partnership } from './entities/partnership.entity';
import { PartnershipsService } from './partnerships.service';
import { PartnershipsController } from './partnerships.controller';
import { BranchesModule } from '../branches/branches.module';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partnership]),
    BranchesModule,
    BusinessesModule,
  ],
  controllers: [PartnershipsController],
  providers: [PartnershipsService],
  exports: [PartnershipsService],
})
export class PartnershipsModule {}
