import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { CatalogueCategory } from './entities/catalogue-category.entity';
import {
  CatalogueItem,
  CatalogueItemStatus,
} from './entities/catalogue-item.entity';
import {
  CreateCatalogueCategoryDto,
  UpdateCatalogueCategoryDto,
} from './dto/category.dto';
import {
  CreateCatalogueItemDto,
  UpdateCatalogueItemDto,
  CatalogueQueryDto,
} from './dto/item.dto';
import { Branch } from '../branches/entities/branch.entity';

@Injectable()
export class CatalogueService {
  constructor(
    @InjectRepository(CatalogueCategory)
    private readonly categoryRepository: Repository<CatalogueCategory>,
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  // --- Categories ---

  async createCategory(dto: CreateCatalogueCategoryDto, businessId: string) {
    const category = this.categoryRepository.create({
      ...dto,
      businessId,
    });
    return this.categoryRepository.save(category);
  }

  async updateCategory(
    id: string,
    dto: UpdateCatalogueCategoryDto,
    businessId: string,
  ) {
    const category = await this.categoryRepository.findOne({
      where: { id, businessId },
    });
    if (!category) throw new NotFoundException('Category not found');

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: string, businessId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id, businessId },
    });
    if (!category) throw new NotFoundException('Category not found');
    return this.categoryRepository.remove(category);
  }

  async findAllCategories(businessId: string) {
    return this.categoryRepository.find({
      where: { businessId },
      order: { name: 'ASC' },
    });
  }

  // --- Items ---

  async createItem(dto: CreateCatalogueItemDto, businessId: string) {
    const branch = await this.branchRepository.findOne({
      where: { id: dto.branchId, businessId },
    });
    if (!branch) throw new BadRequestException('Branch not found or unauthorized');

    const item = this.itemRepository.create({
      ...dto,
      businessId,
      branches: [branch],
    });

    return this.itemRepository.save(item);
  }

  async updateItem(id: string, dto: UpdateCatalogueItemDto, businessId: string) {
    const item = await this.itemRepository.findOne({
      where: { id, businessId },
      relations: ['branches'],
    });
    if (!item) throw new NotFoundException('Item not found');

    // cloning logic
    if (!dto.applyGlobally && dto.branchId && item.branches.length > 1) {
      const branchToIsolate = item.branches.find((b) => b.id === dto.branchId);
      if (!branchToIsolate) throw new BadRequestException('Item not found in specified branch');

      // Remove branch from original item
      item.branches = item.branches.filter((b) => b.id !== dto.branchId);
      await this.itemRepository.save(item);

      // Create new instance for this branch
      const newItem = this.itemRepository.create({
        ...item,
        id: undefined, // TypeORM will generate new ID
        branches: [branchToIsolate],
      });
      delete (newItem as any).createdAt;
      delete (newItem as any).updatedAt;

      // Apply updates to the new instance
      const { branchId, applyGlobally, ...updates } = dto;
      Object.assign(newItem, updates);

      return this.itemRepository.save(newItem);
    }

    // Global update or single-branch item update
    const { branchId, applyGlobally, ...updates } = dto;
    Object.assign(item, updates);
    return this.itemRepository.save(item);
  }

  async deleteItem(
    id: string,
    businessId: string,
    branchId?: string,
    applyGlobally: boolean = false,
  ) {
    const item = await this.itemRepository.findOne({
      where: { id, businessId },
      relations: ['branches'],
    });
    if (!item) throw new NotFoundException('Item not found');

    if (applyGlobally) {
      return this.itemRepository.remove(item);
    }

    if (branchId) {
      item.branches = item.branches.filter((b) => b.id !== branchId);
      if (item.branches.length === 0) {
        // If no branches left, we could either delete it or keep it unassigned.
        // The requirement says "the branch is simply unrelated from the product".
        return this.itemRepository.save(item);
      }
      return this.itemRepository.save(item);
    }

    throw new BadRequestException('Specify branchId or applyGlobally=true');
  }

  async importItem(id: string, targetBranchId: string, businessId: string) {
    const item = await this.itemRepository.findOne({
      where: { id, businessId },
      relations: ['branches'],
    });
    if (!item) throw new NotFoundException('Item not found');

    const targetBranch = await this.branchRepository.findOne({
      where: { id: targetBranchId, businessId },
    });
    if (!targetBranch) throw new BadRequestException('Target branch not found or unauthorized');

    if (item.branches.some((b) => b.id === targetBranchId)) {
      throw new BadRequestException('Item already exists in target branch');
    }

    item.branches.push(targetBranch);
    return this.itemRepository.save(item);
  }

  async suspendItem(id: string, reason: string) {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');

    item.isSuspended = true;
    item.suspensionNote = reason;
    item.status = CatalogueItemStatus.SUSPENDED;
    return this.itemRepository.save(item);
  }

  async unsuspendItem(id: string) {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');

    item.isSuspended = false;
    item.suspensionNote = null;
    item.status = CatalogueItemStatus.ACTIVE;
    return this.itemRepository.save(item);
  }

  // --- Public Listing ---

  async findAllItemsPublic(branchId: string, query: CatalogueQueryDto) {
    const qb = this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.branches', 'branch', 'branch.id = :branchId', { branchId })
      .where('item.status = :status', { status: CatalogueItemStatus.ACTIVE })
      .andWhere('item.isSuspended = :isSuspended', { isSuspended: false });

    if (query.search) {
      qb.andWhere(
        new Brackets((inner) => {
          inner.where('item.name ILIKE :search', { search: `%${query.search}%` })
            .orWhere('item.shortDescription ILIKE :search', { search: `%${query.search}%` });
        }),
      );
    }

    if (query.categoryId) {
      qb.andWhere('item.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    // Sorting
    switch (query.sortBy) {
      case 'oldest':
        qb.orderBy('item.createdAt', 'ASC');
        break;
      case 'most_popular':
        // Placeholder for popularity logic, defaulting to newest for now
        qb.orderBy('item.createdAt', 'DESC');
        break;
      case 'newest':
      default:
        qb.orderBy('item.createdAt', 'DESC');
        break;
    }

    const [data, total] = await qb
      .skip(((query.page ?? 1) - 1) * (query.limit ?? 10))
      .take(query.limit ?? 10)
      .getManyAndCount();

    return { data, total, page: query.page ?? 1, limit: query.limit ?? 10 };
  }

  async findOneItem(id: string, branchId?: string) {
    const where: any = { id };
    const relations = ['category'];
    if (branchId) {
        // Verification that it belongs to the branch
        const item = await this.itemRepository.findOne({
            where: { id },
            relations: ['branches', 'category']
        });
        if (!item || !item.branches.some(b => b.id === branchId)) {
            throw new NotFoundException('Item not found in this branch');
        }
        return item;
    }
    return this.itemRepository.findOne({ where, relations: ['branches', 'category'] });
  }

  async findAllItemsAdmin(businessId: string, branchId?: string) {
    const qb = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.branches', 'branch')
      .leftJoinAndSelect('item.category', 'category')
      .where('item.businessId = :businessId', { businessId });

    if (branchId) {
      qb.andWhere('branch.id = :branchId', { branchId });
    }

    return qb.getMany();
  }
}
