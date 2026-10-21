import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Business } from '../businesses/entities/business.entity';
import { MailModule } from '../mail/mail.module';
import { DataRequest } from './entities/data-request.entity';
import { AccountPrivacyService } from './account-privacy.service';
import { AccountPrivacyController } from './account-privacy.controller';
import { ProcessingConsentGuard } from './processing-consent.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Business, DataRequest]),
    MailModule,
  ],
  controllers: [AccountPrivacyController],
  providers: [AccountPrivacyService, ProcessingConsentGuard],
  exports: [AccountPrivacyService, ProcessingConsentGuard],
})
export class AccountPrivacyModule {}
