import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingTemplateStyle } from '../entities/marketing-template-style.entity';
import { CreateTemplateStyleDto } from '../dto/create-template-style.dto';
import { UpdateTemplateStyleDto } from '../dto/update-template-style.dto';

@Injectable()
export class TemplateStylesService {
  constructor(
    @InjectRepository(MarketingTemplateStyle)
    private readonly styleRepo: Repository<MarketingTemplateStyle>,
  ) {}

  async create(dto: CreateTemplateStyleDto): Promise<MarketingTemplateStyle> {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const style = this.styleRepo.create({ ...dto, slug });
    return this.styleRepo.save(style);
  }

  async findAll(all = false): Promise<MarketingTemplateStyle[]> {
    const where = all ? {} : { isActive: true };
    return this.styleRepo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<MarketingTemplateStyle> {
    const style = await this.styleRepo.findOne({ where: { id } });
    if (!style) {
      throw new NotFoundException(`Template style with ID ${id} not found`);
    }
    return style;
  }

  async update(id: string, dto: UpdateTemplateStyleDto): Promise<MarketingTemplateStyle> {
    const style = await this.findOne(id);
    if (dto.name && !dto.slug) {
      (dto as any).slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    Object.assign(style, dto);
    return this.styleRepo.save(style);
  }

  async remove(id: string): Promise<void> {
    const style = await this.findOne(id);
    await this.styleRepo.remove(style);
  }
}
