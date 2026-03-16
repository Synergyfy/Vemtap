import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private subcategoryRepository: Repository<Subcategory>,
  ) {}

  // --- Category CRUD ---

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Category not found');
  }

  async findAllCategories(dto: CategoryPaginationDto) {
    const { page = 1, limit = 10, search } = dto;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { description: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.categoryRepository.findAndCount({
      where,
      relations: ['subcategories'],
      take: limit,
      skip,
      order: { name: 'ASC' },
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['subcategories'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  // --- Subcategory CRUD ---

  async createSubcategory(dto: CreateSubcategoryDto): Promise<Subcategory> {
    const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Parent category not found');

    const subcategory = this.subcategoryRepository.create(dto);
    return this.subcategoryRepository.save(subcategory);
  }

  async updateSubcategory(id: string, dto: UpdateSubcategoryDto): Promise<Subcategory> {
    const subcategory = await this.subcategoryRepository.findOne({ where: { id } });
    if (!subcategory) throw new NotFoundException('Subcategory not found');

    Object.assign(subcategory, dto);
    return this.subcategoryRepository.save(subcategory);
  }

  async deleteSubcategory(id: string): Promise<void> {
    const result = await this.subcategoryRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Subcategory not found');
  }

  async findAllSubcategories(dto: SubcategoryPaginationDto) {
    const { page = 1, limit = 10, search, categoryId } = dto;
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

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
