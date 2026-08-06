import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { PasswordResetHistory } from './entities/password-reset-history.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { IntegrationUsersController } from './integration-users.controller';

import { BusinessesModule } from '../businesses/businesses.module';
import { BranchesModule } from '../branches/branches.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MailModule } from '../mail/mail.module';
import { QrThriveModule } from '../qr-thrive/qr-thrive.module';
import { EventsModule } from '../../common/gateways/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession, PasswordResetHistory]),
    BusinessesModule,
    BranchesModule,
    MailModule,
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => QrThriveModule),
    EventsModule,
  ],

  providers: [UsersService],
  controllers: [UsersController, IntegrationUsersController],
  exports: [UsersService],
})
export class UsersModule {}
