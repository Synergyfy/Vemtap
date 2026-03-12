import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitorsService } from './visitors.service';
import { VisitorsController } from './visitors.controller';
import { Visit } from './entities/visit.entity';
import { User } from '../users/entities/user.entity';
import { Device } from '../devices/entities/device.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { MessagingModule } from '../messaging/messaging.module';
import { ContactsModule } from '../contacts/contacts.module';
import { MailModule } from '../mail/mail.module';
import { DevicesModule } from '../devices/devices.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visit, User, Device, Branch]),
    CampaignsModule,
    MessagingModule,
    ContactsModule,
    MailModule,
    forwardRef(() => DevicesModule),
    BranchesModule,
  ],
  controllers: [VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService],
})
export class VisitorsModule {}
