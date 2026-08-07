import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosSettingsController } from './fos-settings.controller';
import { FosSettingsService } from './fos-settings.service';
import { FosConfigController } from './fos-config.controller';
import { FosConfigService } from './fos-config.service';
import { Setting } from '../settings/entities/setting.entity';
import { User } from '../users/entities/user.entity';
import {
  FosSettingsCategory,
  FosAccount,
  FosFiscalPeriod,
  FosCurrency,
  FosPermission,
  FosApprovalRule,
  FosNotificationRule,
  FosAuditLog,
} from './entities/fos-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Setting,
      User,
      FosSettingsCategory,
      FosAccount,
      FosFiscalPeriod,
      FosCurrency,
      FosPermission,
      FosApprovalRule,
      FosNotificationRule,
      FosAuditLog,
    ]),
  ],
  controllers: [FosSettingsController, FosConfigController],
  providers: [FosSettingsService, FosConfigService],
  exports: [FosSettingsService, FosConfigService],
})
export class FosSettingsModule {}
