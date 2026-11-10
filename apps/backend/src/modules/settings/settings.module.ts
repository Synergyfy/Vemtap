import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import {
  PublicSettingsController,
  SettingsController,
} from './settings.controller';
import { Setting } from './entities/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [SettingsController, PublicSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
