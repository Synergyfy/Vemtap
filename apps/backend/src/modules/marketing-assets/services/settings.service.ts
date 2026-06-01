import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingSetting } from '../entities/marketing-setting.entity';
import { SaveSettingDto } from '../dto/save-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(MarketingSetting)
    private readonly settingRepo: Repository<MarketingSetting>,
  ) {}

  async findAll(): Promise<MarketingSetting[]> {
    return this.settingRepo.find({ order: { key: 'ASC' } });
  }

  async findByKey(key: string): Promise<MarketingSetting | null> {
    return this.settingRepo.findOne({ where: { key } });
  }

  async upsert(dto: SaveSettingDto): Promise<MarketingSetting> {
    let setting = await this.settingRepo.findOne({ where: { key: dto.key } });
    if (setting) {
      Object.assign(setting, dto);
    } else {
      setting = this.settingRepo.create(dto);
    }
    return this.settingRepo.save(setting);
  }

  async remove(key: string): Promise<void> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }
    await this.settingRepo.remove(setting);
  }
}
