import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { QrThriveService } from './qr-thrive.service';
import { QrThriveController } from './qr-thrive.controller';
import { QrThriveCallbackController } from './qr-thrive-callback.controller';
import { QrThriveUserMapping } from './entities/qr-thrive-user-mapping.entity';
import { QrThriveCodeMapping } from './entities/qr-thrive-code-mapping.entity';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QrThriveUserMapping, QrThriveCodeMapping]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    forwardRef(() => BranchesModule),
  ],
  providers: [QrThriveService],
  controllers: [QrThriveController, QrThriveCallbackController],
  exports: [QrThriveService],
})
export class QrThriveModule {}
