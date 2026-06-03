import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingTemplateFormat } from '../entities/marketing-template-format.entity';
import { CreateTemplateFormatDto } from '../dto/create-template-format.dto';
import { UpdateTemplateFormatDto } from '../dto/update-template-format.dto';

@Injectable()
export class TemplateFormatsService {
  constructor(
    @InjectRepository(MarketingTemplateFormat)
    private readonly formatRepo: Repository<MarketingTemplateFormat>,
  ) {}

  async create(dto: CreateTemplateFormatDto): Promise<MarketingTemplateFormat> {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const format = this.formatRepo.create({ ...dto, slug });
    return this.formatRepo.save(format);
  }

  async findAll(all = false): Promise<MarketingTemplateFormat[]> {
    const where = all ? {} : { isActive: true };
    return this.formatRepo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<MarketingTemplateFormat> {
    const format = await this.formatRepo.findOne({ where: { id } });
    if (!format) {
      throw new NotFoundException(`Template format with ID ${id} not found`);
    }
    return format;
  }

  async update(id: string, dto: UpdateTemplateFormatDto): Promise<MarketingTemplateFormat> {
    const format = await this.findOne(id);
    if (dto.name && !dto.slug) {
      (dto as any).slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    Object.assign(format, dto);
    return this.formatRepo.save(format);
  }

  async remove(id: string): Promise<void> {
    const format = await this.findOne(id);
    await this.formatRepo.remove(format);
  }
}
