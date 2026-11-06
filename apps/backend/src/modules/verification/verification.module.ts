import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  VerificationController,
  VerificationWebhookController,
} from './verification.controller';
import { VerificationService } from './verification.service';
import { BytidClient } from './bytid/bytid.client';
import { VerificationCheck } from './entities/verification-check.entity';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationCheck, Business, User])],
  controllers: [VerificationController, VerificationWebhookController],
  providers: [VerificationService, BytidClient],
  exports: [VerificationService],
})
export class VerificationModule {}
