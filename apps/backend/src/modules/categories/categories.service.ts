import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';
import { Repository, Like, ILike } from 'typeorm';
import { Category } from '../businesses/entities/category.entity';
import { Subcategory } from '../businesses/entities/subcategory.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
  CategoryPaginationDto,
  SubcategoryPaginationDto,
} from './dto/category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private subcategoryRepository: Repository<Subcategory>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async clearCache() {
    try {
      const cacheMgr = this.cacheManager as any;
      const store =
        cacheMgr.store || (cacheMgr.stores ? cacheMgr.stores[0] : null);

      if (store && typeof store.keys === 'function') {
        const keys = await store.keys('*categories:*');
        for (const key of keys) {
          if (typeof store.del === 'function') {
            await store.del(key);
          } else {
            await this.cacheManager.del(key);
          }
        }
      } else if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      } else {
        this.logger.warn(
          'Cache store does not support keys() or reset(). Cache might not be cleared correctly.',
        );
      }
    } catch (error) {
      this.logger.error(`Failed to clear cache: ${error.message}`);
    }
  }

  // --- Category CRUD ---

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(dto);
    const saved = await this.categoryRepository.save(category);
    await this.clearCache();
    return saved;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    Object.assign(category, dto);
    const saved = await this.categoryRepository.save(category);
    await this.clearCache();
    return saved;
  }

  async deleteCategory(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Category not found');
    await this.clearCache();
  }

  async findAllCategories(
    dto: CategoryPaginationDto,
  ): Promise<{ items: Category[]; meta: any }> {
    const { page = 1, limit = 10, search } = dto;
    const cacheKey = `categories:all:${page}:${limit}:${search || 'none'}`;

    const cached = await this.cacheManager.get<{
      items: Category[];
      meta: any;
    }>(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;

    const where = search
      ? [{ name: ILike(`%${search}%`) }, { description: ILike(`%${search}%`) }]
      : {};

    const [items, total] = await this.categoryRepository.findAndCount({
      where,
      relations: ['subcategories'],
      take: limit,
      skip,
      order: { name: 'ASC' },
    });

    const result = {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async findCategoryById(id: string): Promise<Category> {
    const cacheKey = `categories:id:${id}`;
    const cached = await this.cacheManager.get<Category>(cacheKey);
    if (cached) return cached;

    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['subcategories'],
    });
    if (!category) throw new NotFoundException('Category not found');

    await this.cacheManager.set(cacheKey, category);
    return category;
  }

  // --- Subcategory CRUD ---

  async createSubcategory(dto: CreateSubcategoryDto): Promise<Subcategory> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Parent category not found');

    const subcategory = this.subcategoryRepository.create(dto);
    const saved = await this.subcategoryRepository.save(subcategory);
    await this.clearCache();
    return saved;
  }

  async updateSubcategory(
    id: string,
    dto: UpdateSubcategoryDto,
  ): Promise<Subcategory> {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
    });
    if (!subcategory) throw new NotFoundException('Subcategory not found');

    Object.assign(subcategory, dto);
    const saved = await this.subcategoryRepository.save(subcategory);
    await this.clearCache();
    return saved;
  }

  async deleteSubcategory(id: string): Promise<void> {
    const result = await this.subcategoryRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Subcategory not found');
    await this.clearCache();
  }

  async findAllSubcategories(
    dto: SubcategoryPaginationDto,
  ): Promise<{ items: Subcategory[]; meta: any }> {
    const { page = 1, limit = 10, search, categoryId } = dto;
    const cacheKey = `categories:sub:all:${page}:${limit}:${categoryId || 'none'}:${search || 'none'}`;

    const cached = await this.cacheManager.get<{
      items: Subcategory[];
      meta: any;
    }>(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;

    let whereClause: any = where;
    if (search) {
      whereClause = [
        { ...where, name: ILike(`%${search}%`) },
        { ...where, description: ILike(`%${search}%`) },
      ];
    }

    const [items, total] = await this.subcategoryRepository.findAndCount({
      where: whereClause,
      relations: ['category'],
      take: limit,
      skip,
      order: { name: 'ASC' },
    });

    const result = {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async findSubcategoryById(id: string): Promise<Subcategory> {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!subcategory) throw new NotFoundException('Subcategory not found');
    return subcategory;
  }
}
