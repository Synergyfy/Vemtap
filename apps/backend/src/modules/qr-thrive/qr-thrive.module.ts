import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { QrThriveService } from './qr-thrive.service';
import { QrThriveEncryptionService } from './qr-thrive-encryption.service';
import { QrThriveController } from './qr-thrive.controller';
import { QrThriveCallbackController } from './qr-thrive-callback.controller';
import { QrThriveUserMapping } from './entities/qr-thrive-user-mapping.entity';

import { ExternalLeadStatusEntity } from './entities/external-lead-status.entity';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QrThriveUserMapping,

      ExternalLeadStatusEntity,
    ]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    JwtModule.register({}),
    forwardRef(() => BranchesModule),
  ],
  providers: [QrThriveService, QrThriveEncryptionService],
  controllers: [QrThriveController, QrThriveCallbackController],
  exports: [QrThriveService],
})
export class QrThriveModule {}
