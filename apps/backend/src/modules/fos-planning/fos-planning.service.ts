import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FosBudgetItem,
  FosBudgetCategory,
  FosForecastAspect,
} from './entities/planning.entity';
import {
  CreateBudgetItemDto,
  UpdateBudgetItemDto,
  CreateBudgetCategoryDto,
  CreateAspectDto,
  UpdateAspectDto,
} from './dto/planning.dto';

const DEFAULT_CATEGORIES = [
  'Revenue',
  'Salaries & Wages',
  'Commissions',
  'Marketing',
  'Operations',
  'Technology',
  'Office & Admin',
  'Other',
];

@Injectable()
export class FosPlanningService {
  constructor(
    @InjectRepository(FosBudgetItem)
    private readonly itemRepo: Repository<FosBudgetItem>,
    @InjectRepository(FosBudgetCategory)
    private readonly categoryRepo: Repository<FosBudgetCategory>,
    @InjectRepository(FosForecastAspect)
    private readonly aspectRepo: Repository<FosForecastAspect>,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  private async ensureDefaultCategories() {
    const count = await this.categoryRepo.count();
    if (count === 0) {
      await this.categoryRepo.save(
        DEFAULT_CATEGORIES.map((name) => this.categoryRepo.create({ name })),
      );
    }
  }

  // ---- Budget items ----

  private toItemDto(i: FosBudgetItem) {
    const planned = this.toNumber(i.planned);
    const actual = this.toNumber(i.actual);
    return {
      id: i.id,
      category: i.category,
      item: i.item,
      planned,
      actual,
      variance: Math.round((actual - planned) * 100) / 100,
      notes: i.notes,
    };
  }

  async getBudgetItems() {
    await this.ensureDefaultCategories();
    const [items, categories] = await Promise.all([
      this.itemRepo.find({ order: { createdAt: 'ASC' } }),
      this.categoryRepo.find({ order: { name: 'ASC' } }),
    ]);

    const totalPlanned = items.reduce(
      (sum, i) => sum + this.toNumber(i.planned),
      0,
    );
    const totalActual = items.reduce(
      (sum, i) => sum + this.toNumber(i.actual),
      0,
    );

    return {
      items: items.map((i) => this.toItemDto(i)),
      categories: categories.map((c) => c.name),
      totalPlanned: Math.round(totalPlanned * 100) / 100,
      totalActual: Math.round(totalActual * 100) / 100,
    };
  }

  async createBudgetItem(dto: CreateBudgetItemDto) {
    const item = this.itemRepo.create({
      category: dto.category,
      item: dto.item,
      planned: dto.planned,
      actual: dto.actual ?? 0,
      notes: dto.notes ?? undefined,
    });
    const saved = await this.itemRepo.save(item);
    return this.toItemDto(saved);
  }

  async updateBudgetItem(id: string, dto: UpdateBudgetItemDto) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Budget item with id ${id} not found`);
    }
    if (dto.category !== undefined) item.category = dto.category;
    if (dto.item !== undefined) item.item = dto.item;
    if (dto.planned !== undefined) item.planned = dto.planned;
    if (dto.actual !== undefined) item.actual = dto.actual;
    if (dto.notes !== undefined) item.notes = dto.notes;
    const saved = await this.itemRepo.save(item);
    return this.toItemDto(saved);
  }

  async removeBudgetItem(id: string) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Budget item with id ${id} not found`);
    }
    await this.itemRepo.remove(item);
    return { success: true };
  }

  // ---- Budget categories ----

  async createCategory(dto: CreateBudgetCategoryDto) {
    const existing = await this.categoryRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      return { name: existing.name };
    }
    const created = await this.categoryRepo.save(
      this.categoryRepo.create({ name: dto.name }),
    );
    return { name: created.name };
  }

  async removeCategory(name: string) {
    const category = await this.categoryRepo.findOne({ where: { name } });
    if (!category) {
      throw new NotFoundException(`Budget category "${name}" not found`);
    }
    await this.categoryRepo.remove(category);
    return { success: true };
  }

  // ---- Forecast aspects ----

  private toAspectDto(a: FosForecastAspect) {
    return {
      id: a.id,
      label: a.label,
      baseValue: this.toNumber(a.baseValue),
      growthRate: this.toNumber(a.growthRate),
    };
  }

  async getAspects() {
    const aspects = await this.aspectRepo.find({ order: { createdAt: 'ASC' } });
    return { aspects: aspects.map((a) => this.toAspectDto(a)) };
  }

  async createAspect(dto: CreateAspectDto) {
    const aspect = this.aspectRepo.create({
      label: dto.label,
      baseValue: dto.baseValue,
      growthRate: dto.growthRate ?? 0,
    });
    const saved = await this.aspectRepo.save(aspect);
    return this.toAspectDto(saved);
  }

  async updateAspect(id: string, dto: UpdateAspectDto) {
    const aspect = await this.aspectRepo.findOne({ where: { id } });
    if (!aspect) {
      throw new NotFoundException(`Forecast aspect with id ${id} not found`);
    }
    if (dto.label !== undefined) aspect.label = dto.label;
    if (dto.baseValue !== undefined) aspect.baseValue = dto.baseValue;
    if (dto.growthRate !== undefined) aspect.growthRate = dto.growthRate;
    const saved = await this.aspectRepo.save(aspect);
    return this.toAspectDto(saved);
  }

  async removeAspect(id: string) {
    const aspect = await this.aspectRepo.findOne({ where: { id } });
    if (!aspect) {
      throw new NotFoundException(`Forecast aspect with id ${id} not found`);
    }
    await this.aspectRepo.remove(aspect);
    return { success: true };
  }
}
