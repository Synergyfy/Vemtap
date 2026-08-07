import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingCategory } from '../entities/marketing-category.entity';
import { MarketingTemplate } from '../entities/marketing-template.entity';
import { CreateMarketingCategoryDto } from '../dto/create-category.dto';
import { UpdateMarketingCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(MarketingCategory)
    private readonly categoryRepo: Repository<MarketingCategory>,
    @InjectRepository(MarketingTemplate)
    private readonly templateRepo: Repository<MarketingTemplate>,
  ) {}

  async create(dto: CreateMarketingCategoryDto): Promise<MarketingCategory> {
    const slug =
      dto.slug ||
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const category = this.categoryRepo.create({ ...dto, slug });
    return this.categoryRepo.save(category);
  }

  async findAll(all = false): Promise<any[]> {
    const where = all ? {} : { isActive: true };
    const categories = await this.categoryRepo.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['templates'],
    });
    return categories.map((c) => ({
      ...c,
      templateCount: c.templates?.length || 0,
      templates: undefined,
    }));
  }

  async findOne(id: string): Promise<MarketingCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['templates'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    id: string,
    dto: UpdateMarketingCategoryDto,
  ): Promise<MarketingCategory> {
    const category = await this.findOne(id);
    if (dto.name && !dto.slug) {
      (dto as any).slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['templates'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    if (category.templates && category.templates.length > 0) {
      throw new BadRequestException(
        `Category "${category.name}" cannot be deleted because ${category.templates.length} template(s) are assigned to it. Remove the category from templates first.`,
      );
    }
    await this.categoryRepo.remove(category);
  }
}
