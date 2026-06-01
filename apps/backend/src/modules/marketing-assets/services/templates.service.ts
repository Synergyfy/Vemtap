import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingTemplate } from '../entities/marketing-template.entity';
import { MarketingCategory } from '../entities/marketing-category.entity';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { AuditLogService } from './audit-log.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(MarketingTemplate)
    private readonly templateRepo: Repository<MarketingTemplate>,
    @InjectRepository(MarketingCategory)
    private readonly categoryRepo: Repository<MarketingCategory>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createDto: CreateTemplateDto, user?: User): Promise<MarketingTemplate> {
    if (createDto.categoryId === '') {
      createDto.categoryId = null as any;
    }
    const template = this.templateRepo.create(createDto);
    const saved = await this.templateRepo.save(template);
    if (user) {
      await this.auditLogService.log({
        businessId: user.businessId || user.ownedBusiness?.id || '',
        userId: user.id,
        action: 'create',
        entityType: 'template',
        entityId: saved.id,
        details: { name: saved.name },
      });
    }
    return saved;
  }

  async findAll(category?: string, type?: string, activeOnly = true, categoryId?: string): Promise<MarketingTemplate[]> {
    const query = this.templateRepo.createQueryBuilder('template')
      .leftJoinAndSelect('template.categoryRelation', 'categoryRelation');

    if (activeOnly) {
      query.andWhere('template.isActive = :isActive', { isActive: true });
    }
    if (category) {
      query.andWhere('template.category = :category', { category });
    }
    if (categoryId) {
      query.andWhere('template.categoryId = :categoryId', { categoryId });
    }
    if (type) {
      query.andWhere('template.type = :type', { type });
    }

    return query.orderBy('template.name', 'ASC').getMany();
  }

  async findOne(id: string): Promise<MarketingTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['categoryRelation'],
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async update(id: string, updateDto: UpdateTemplateDto, user?: User): Promise<MarketingTemplate> {
    const template = await this.findOne(id);
    if (updateDto.categoryId === '') {
      updateDto.categoryId = null as any;
    }
    Object.assign(template, updateDto);
    const saved = await this.templateRepo.save(template);
    if (user) {
      await this.auditLogService.log({
        businessId: user.businessId || user.ownedBusiness?.id || '',
        userId: user.id,
        action: 'update',
        entityType: 'template',
        entityId: saved.id,
        details: { changes: Object.keys(updateDto) },
      });
    }
    return saved;
  }

  async remove(id: string, user?: User): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepo.remove(template);
    if (user) {
      await this.auditLogService.log({
        businessId: user.businessId || user.ownedBusiness?.id || '',
        userId: user.id,
        action: 'delete',
        entityType: 'template',
        entityId: id,
        details: { name: template.name },
      });
    }
  }

  async getCategories(): Promise<string[]> {
    const result = await this.templateRepo
      .createQueryBuilder('template')
      .select('DISTINCT template.category', 'category')
      .getRawMany();
    return result.map((r) => r.category);
  }
}
