import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { MailModule } from '../mail/mail.module';
import { ContactsModule } from '../contacts/contacts.module';
import { Business } from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { BusinessCustomerNote } from './entities/business-customer-note.entity';
import { CustomerInvite } from './entities/customer-invite.entity';
import { BusinessCustomersController } from './business-customers.controller';
import { BusinessCustomersService } from './business-customers.service';
import {
  CustomerInvitesController,
  PublicCustomerInvitesController,
} from './customer-invites.controller';
import { CustomerInvitesService } from './customer-invites.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessCustomerNote,
      CustomerInvite,
      Business,
      Branch,
      Contact,
    ]),
    LoyaltyModule,
    MailModule,
    ContactsModule,
  ],
  // The invites controller is listed first so `POST /business-customers/invites`
  // is never shadowed by the directory's `/business-customers/:userId` routes.
  controllers: [
    CustomerInvitesController,
    PublicCustomerInvitesController,
    BusinessCustomersController,
  ],
  providers: [BusinessCustomersService, CustomerInvitesService],
  exports: [BusinessCustomersService],
})
export class BusinessCustomersModule {}
