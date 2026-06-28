import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

  async create(
    createDto: CreateTemplateDto,
    user?: User,
  ): Promise<MarketingTemplate> {
    const { categoryIds, ...rest } = createDto;
    const template = this.templateRepo.create(rest);
    if (categoryIds && categoryIds.length > 0) {
      template.categories = await this.categoryRepo.findBy({
        id: In(categoryIds),
      });
    }
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
    return this.findOne(saved.id);
  }

  async findAll(
    category?: string,
    type?: string,
    activeOnly = true,
    categoryIds?: string[],
  ): Promise<MarketingTemplate[]> {
    const query = this.templateRepo
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.categories', 'categories');

    if (activeOnly) {
      query.andWhere('template.isActive = :isActive', { isActive: true });
    }
    if (category) {
      query.andWhere('template.category = :category', { category });
    }
    if (categoryIds && categoryIds.length > 0) {
      query
        .innerJoin(
          'marketing_template_categories',
          'mtc',
          'mtc."templateId" = template.id',
        )
        .andWhere('mtc."categoryId" IN (:...categoryIds)', { categoryIds });
    }
    if (type) {
      query.andWhere('template.type = :type', { type });
    }

    return query.orderBy('template.name', 'ASC').getMany();
  }

  async findOne(id: string): Promise<MarketingTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['categories'],
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async update(
    id: string,
    updateDto: UpdateTemplateDto,
    user?: User,
  ): Promise<MarketingTemplate> {
    const template = await this.findOne(id);
    const { categoryIds, ...rest } = updateDto;
    Object.assign(template, rest);
    if (categoryIds !== undefined) {
      template.categories = await this.categoryRepo.findBy({
        id: In(categoryIds),
      });
    }
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
    return this.findOne(saved.id);
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
