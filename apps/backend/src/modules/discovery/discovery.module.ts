import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { Partnership } from '../partnerships/entities/partnership.entity';
import { Business } from '../businesses/entities/business.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { SponsoredCampaign } from './entities/sponsored-campaign.entity';
import { SponsoredCampaignTransaction } from './entities/sponsored-campaign-transaction.entity';
import { DiscoveryInvoice } from './entities/discovery-invoice.entity';
import { InvoiceLineItem } from './entities/invoice-line-item.entity';
import { FraudAlert } from './entities/fraud-alert.entity';
import { Report } from './entities/report.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { OfferCategoryType } from './entities/offer-category-type.entity';
import { AuditLog } from '../administration/entities/audit-log.entity';
import { Setting } from '../settings/entities/setting.entity';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Branch,
      Visit,
      Partnership,
      CatalogueOffer,
      Business,
      Subscription,
      Plan,
      Notification,
      User,
      SponsoredCampaign,
      SponsoredCampaignTransaction,
      DiscoveryInvoice,
      InvoiceLineItem,
      FraudAlert,
      Report,
      NotificationLog,
      OfferCategoryType,
      AuditLog,
      Setting,
    ]),
    BranchesModule,
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
