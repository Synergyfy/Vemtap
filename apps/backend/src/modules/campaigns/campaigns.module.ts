import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { MessagingModule } from '../messaging/messaging.module';
import { UsersModule } from '../users/users.module';
import { ContactsModule } from '../contacts/contacts.module';
import { BranchesModule } from '../branches/branches.module';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { BannersModule } from '../banners/banners.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, CampaignTemplate, User, Contact]),
    forwardRef(() => MessagingModule),
    forwardRef(() => UsersModule),
    ContactsModule,
    forwardRef(() => BranchesModule),
    BannersModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
