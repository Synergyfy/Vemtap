import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { LoyaltyProfile } from './entities/loyalty-profile.entity';
import { PointTransaction } from './entities/point-transaction.entity';
import { LoyaltyRule } from './entities/loyalty-rule.entity';
import { Reward } from './entities/reward.entity';
import { Redemption } from './entities/redemption.entity';
import { LoyaltyTemplate } from './entities/loyalty-template.entity';
import { MessagingModule } from '../messaging/messaging.module';
import { UsersModule } from '../users/users.module';
import { ContactsModule } from '../contacts/contacts.module';
import { BranchesModule } from '../branches/branches.module';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      CampaignTemplate,
      LoyaltyProfile,
      PointTransaction,
      LoyaltyRule,
      Reward,
      Redemption,
      LoyaltyTemplate,
      User,
      Contact,
    ]),
    MessagingModule,
    forwardRef(() => UsersModule),
    ContactsModule,
    BranchesModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
