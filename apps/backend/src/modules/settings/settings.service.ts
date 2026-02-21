import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async onModuleInit() {
    // Ensure we have at least one setting record globally
    const count = await this.settingRepository.count();
    if (count === 0) {
      const defaultSettings = this.settingRepository.create({
        platformName: 'VemTap',
        supportEmail: 'support@VemTap.com',
        defaultCurrency: 'NGN',
        timezone: 'Africa/Lagos',
        enforce2FA: true,
        passwordExpiry: false,
        messagingCostSms: 0.05,
        messagingCostWhatsapp: 0.08,
        messagingCostEmail: 0.01,
      });
      await this.settingRepository.save(defaultSettings);
    }
  }

  async getGlobalSettings(): Promise<Setting> {
    const settings = await this.settingRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    return settings[0];
  }

  async updateSettings(updateDto: UpdateSettingDto): Promise<Setting> {
    const settings = await this.getGlobalSettings();
    Object.assign(settings, updateDto);
    return this.settingRepository.save(settings);
  }
}
