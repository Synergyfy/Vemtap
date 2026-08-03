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
  CatalogueItemType,
  DiscountType,
} from './entities/catalogue-item.entity';
import {
  CreateCatalogueCategoryDto,
  UpdateCatalogueCategoryDto,
} from './dto/category.dto';
import {
  CreateCatalogueItemDto,
  UpdateCatalogueItemDto,
  CatalogueQueryDto,
  BulkImportItemsDto,
} from './dto/item.dto';
import { Branch } from '../branches/entities/branch.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';

@Injectable()
export class CatalogueService {
  constructor(
    @InjectRepository(CatalogueCategory)
    private readonly categoryRepository: Repository<CatalogueCategory>,
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // --- Categories ---

  async createCategory(dto: CreateCatalogueCategoryDto, businessId: string) {
    const caps = await this.subscriptionsService.getCapabilities(businessId);
    if (!caps.capabilities.catalogueCategories.enabled) {
      throw new ForbiddenException(
        'Catalogue feature is not enabled for your plan',
      );
    }

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
    if (!branch)
      throw new BadRequestException('Branch not found or unauthorized');

    const caps = await this.subscriptionsService.getCapabilities(businessId);
    if (!caps.capabilities.catalogueItems.enabled) {
      throw new ForbiddenException(
        'Catalogue feature is not enabled for your plan',
      );
    }

    if (
      caps.capabilities.catalogueItems.limit !== 'unlimited' &&
      typeof caps.capabilities.catalogueItems.remaining === 'number' &&
      caps.capabilities.catalogueItems.remaining <= 0
    ) {
      throw new ForbiddenException(
        'You have reached the limit for catalogue items',
      );
    }

    // Auto-generate SKU if not provided
    if (!dto.sku) {
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      dto.sku = `SKU-${randomPart}`;
    }

    const item = this.itemRepository.create({
      ...dto,
      businessId,
      branches: [branch],
    });

    return this.itemRepository.save(item);
  }

  async updateItem(
    id: string,
    dto: UpdateCatalogueItemDto,
    businessId: string,
  ) {
    const item = await this.itemRepository.findOne({
      where: { id, businessId },
      relations: ['branches'],
    });
    if (!item) throw new NotFoundException('Item not found');

    // cloning logic
    if (!dto.applyGlobally && dto.branchId && item.branches.length > 1) {
      const branchToIsolate = item.branches.find((b) => b.id === dto.branchId);
      if (!branchToIsolate)
        throw new BadRequestException('Item not found in specified branch');

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
    if (!targetBranch)
      throw new BadRequestException('Target branch not found or unauthorized');

    if (item.branches.some((b) => b.id === targetBranchId)) {
      throw new BadRequestException('Item already exists in target branch');
    }

    item.branches.push(targetBranch);
    return this.itemRepository.save(item);
  }

  async bulkImportItems(
    dto: BulkImportItemsDto,
    businessId: string,
    userBranchId?: string,
  ) {
    if (!dto.items || dto.items.length === 0 || dto.items.length > 1000) {
      throw new BadRequestException(
        'Items array must contain between 1 and 1000 items',
      );
    }

    const targetBranchId = dto.branchId || userBranchId;
    if (!targetBranchId) {
      throw new BadRequestException('Branch ID is required');
    }

    const branch = await this.branchRepository.findOne({
      where: { id: targetBranchId, businessId },
    });
    if (!branch) {
      throw new BadRequestException('Branch not found or unauthorized');
    }

    let createdCount = 0;
    let failedCount = 0;
    const results: Array<{
      row: number;
      success: boolean;
      itemId?: string;
      error?: string;
    }> = [];

    const categoryMap = new Map<string, CatalogueCategory>();
    const seenSkusInBatch = new Set<string>();
    const seenBarcodesInBatch = new Set<string>();

    for (let i = 0; i < dto.items.length; i++) {
      const itemDto = dto.items[i];
      const rowNumber = i + 2; // Data starts at row 2 after header

      // Validate required fields
      if (
        !itemDto.name ||
        typeof itemDto.name !== 'string' ||
        !itemDto.name.trim()
      ) {
        failedCount++;
        results.push({
          row: rowNumber,
          success: false,
          error: 'Missing or invalid item name',
        });
        continue;
      }

      if (
        itemDto.price === undefined ||
        itemDto.price === null ||
        typeof itemDto.price !== 'number' ||
        isNaN(itemDto.price) ||
        itemDto.price < 0
      ) {
        failedCount++;
        results.push({
          row: rowNumber,
          success: false,
          error: 'Invalid price',
        });
        continue;
      }

      // Check SKU duplicate
      if (itemDto.sku && itemDto.sku.trim()) {
        const skuTrimmed = itemDto.sku.trim();
        if (seenSkusInBatch.has(skuTrimmed)) {
          failedCount++;
          results.push({
            row: rowNumber,
            success: false,
            error: `Duplicate SKU in request: ${skuTrimmed}`,
          });
          continue;
        }
        const existingSkuItem = await this.itemRepository.findOne({
          where: { sku: skuTrimmed, businessId },
        });
        if (existingSkuItem) {
          failedCount++;
          results.push({
            row: rowNumber,
            success: false,
            error: `Duplicate SKU: ${skuTrimmed}`,
          });
          continue;
        }
        seenSkusInBatch.add(skuTrimmed);
      }

      // Check Barcode duplicate
      if (itemDto.barcode && itemDto.barcode.trim()) {
        const barcodeTrimmed = itemDto.barcode.trim();
        if (seenBarcodesInBatch.has(barcodeTrimmed)) {
          failedCount++;
          results.push({
            row: rowNumber,
            success: false,
            error: `Duplicate barcode in request: ${barcodeTrimmed}`,
          });
          continue;
        }
        const existingBarcodeItem = await this.itemRepository.findOne({
          where: { barcode: barcodeTrimmed, businessId },
        });
        if (existingBarcodeItem) {
          failedCount++;
          results.push({
            row: rowNumber,
            success: false,
            error: `Duplicate barcode: ${barcodeTrimmed}`,
          });
          continue;
        }
        seenBarcodesInBatch.add(barcodeTrimmed);
      }

      // Category Find or Create
      let categoryId: string | null = null;
      if (itemDto.category && itemDto.category.trim()) {
        const catName = itemDto.category.trim();
        const catKey = catName.toLowerCase();
        if (categoryMap.has(catKey)) {
          categoryId = categoryMap.get(catKey)!.id;
        } else {
          let category = await this.categoryRepository.findOne({
            where: { name: catName, businessId },
          });
          if (!category) {
            category = await this.categoryRepository.save(
              this.categoryRepository.create({
                name: catName,
                businessId,
              }),
            );
          }
          categoryMap.set(catKey, category);
          categoryId = category.id;
        }
      }

      try {
        const newItem = this.itemRepository.create({
          name: itemDto.name.trim(),
          price: itemDto.price,
          shortDescription: itemDto.shortDescription || '',
          description: itemDto.description || '',
          categoryId: categoryId || undefined,
          stockQuantity: itemDto.stockQuantity,
          sku: itemDto.sku ? itemDto.sku.trim() : undefined,
          barcode: itemDto.barcode ? itemDto.barcode.trim() : undefined,
          status: CatalogueItemStatus.ACTIVE,
          itemType: CatalogueItemType.PRODUCT,
          mainImage: undefined,
          galleryImages: [],
          allowBackOrder: false,
          discountType: DiscountType.NONE,
          businessId,
          branches: [branch],
        } as Partial<CatalogueItem>);

        const savedItem = await this.itemRepository.save(newItem);
        createdCount++;
        results.push({
          row: rowNumber,
          success: true,
          itemId: savedItem.id,
        });
      } catch (err: any) {
        failedCount++;
        results.push({
          row: rowNumber,
          success: false,
          error: err?.message || 'Failed to save item',
        });
      }
    }

    return {
      created: createdCount,
      failed: failedCount,
      results,
    };
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

  private async resolveBranchId(branchIdOrCode: string): Promise<string> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        branchIdOrCode,
      );
    if (isUuid) {
      const branch = await this.branchRepository.findOne({
        where: { id: branchIdOrCode, isActive: true },
      });
      if (!branch) {
        throw new NotFoundException(`Branch not found`);
      }
      return branch.id;
    }
    const branch = await this.branchRepository.findOne({
      where: { uniqueCode: branchIdOrCode, isActive: true },
    });
    if (!branch) {
      throw new NotFoundException(
        `Branch with code ${branchIdOrCode} not found`,
      );
    }
    return branch.id;
  }

  // --- Public Listing ---

  async findAllItemsPublic(branchId: string, query: CatalogueQueryDto) {
    const resolvedBranchId = await this.resolveBranchId(branchId);
    const qb = this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.branches', 'branch', 'branch.id = :branchId', {
        branchId: resolvedBranchId,
      })
      .leftJoinAndSelect('item.category', 'category')
      .where('item.status = :status', { status: CatalogueItemStatus.ACTIVE })
      .andWhere('item.isSuspended = :isSuspended', { isSuspended: false });

    if (query.search) {
      qb.andWhere(
        new Brackets((inner) => {
          inner
            .where('item.name ILIKE :search', { search: `%${query.search}%` })
            .orWhere('item.shortDescription ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('item.description ILIKE :search', {
              search: `%${query.search}%`,
            });
        }),
      );
    }

    if (query.categoryId) {
      qb.andWhere('item.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.itemType) {
      qb.andWhere('item.itemType = :itemType', { itemType: query.itemType });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('item.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('item.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    // Sorting
    let sortField = 'createdAt';
    let sortOrder: 'ASC' | 'DESC' = 'DESC';

    switch (query.sortBy) {
      case 'oldest':
        sortField = 'createdAt';
        sortOrder = 'ASC';
        break;
      case 'price_asc':
        sortField = 'price';
        sortOrder = 'ASC';
        break;
      case 'price_desc':
        sortField = 'price';
        sortOrder = 'DESC';
        break;
      case 'most_popular':
      case 'newest':
      default:
        sortField = 'createdAt';
        sortOrder = 'DESC';
        break;
    }

    const cursorStr = (query as any).cursor || (query as any).nextCursor;

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor: cursorStr,
      page: query.page,
      limit: query.limit,
      sortField,
      sortOrder,
      entityAlias: 'item',
    });

    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
    };
  }

  async findAllCategoriesByBranch(branchId: string) {
    const resolvedBranchId = await this.resolveBranchId(branchId);
    // Return categories that have at least one active, non-suspended item in this branch
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .innerJoin('category.items', 'item')
      .innerJoin('item.branches', 'branch', 'branch.id = :branchId', {
        branchId: resolvedBranchId,
      })
      .where('item.status = :status', { status: CatalogueItemStatus.ACTIVE })
      .andWhere('item.isSuspended = :isSuspended', { isSuspended: false })
      .select(['category.id', 'category.name'])
      .distinct(true)
      .getMany();

    return categories;
  }

  async findOneItem(id: string, branchId?: string) {
    if (branchId) {
      // Verification that it belongs to the branch
      const resolvedBranchId = await this.resolveBranchId(branchId);
      const item = await this.itemRepository.findOne({
        where: { id },
        relations: ['branches', 'category'],
      });
      if (!item || !item.branches.some((b) => b.id === resolvedBranchId)) {
        throw new NotFoundException('Item not found in this branch');
      }
      return item;
    }
    return this.itemRepository.findOne({
      where: { id },
      relations: ['branches', 'category'],
    });
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

  async countItemsByType(branchId: string, itemType: CatalogueItemType) {
    return this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.branches', 'branch', 'branch.id = :branchId', {
        branchId,
      })
      .where('item.itemType = :itemType', { itemType })
      .andWhere('item.status = :status', { status: CatalogueItemStatus.ACTIVE })
      .andWhere('item.isSuspended = :isSuspended', { isSuspended: false })
      .getCount();
  }
}
