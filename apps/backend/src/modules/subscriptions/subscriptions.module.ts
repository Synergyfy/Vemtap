import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessesModule } from '../businesses/businesses.module';
import { HttpModule } from '@nestjs/axios';
import { PlansController } from './plans.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { PlansService } from './plans.service';
import { SubscriptionsService } from './subscriptions.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Plan, Subscription, Business]),
        BusinessesModule,
        HttpModule,
    ],
    controllers: [PlansController, SubscriptionsController],
    providers: [PlansService, SubscriptionsService],
    exports: [PlansService, SubscriptionsService],
})
export class SubscriptionsModule { }
