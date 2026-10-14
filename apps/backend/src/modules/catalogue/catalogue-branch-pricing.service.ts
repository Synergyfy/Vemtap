import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Branch } from '../branches/entities/branch.entity';
import {
  CatalogueItem,
  CatalogueItemPricingMode,
} from './entities/catalogue-item.entity';
import { CatalogueItemBranchPricing } from './entities/catalogue-item-branch-pricing.entity';
import { SetItemBranchPricingDto } from './dto/branch-pricing.dto';
import { assertCompareAtPrice } from './utils/catalogue-item.utils';

/** What a branch row on the pricing screen shows. */
export interface ItemBranchPricingRow {
  branchId: string;
  branchName: string;
  isMainBranch: boolean;
  isAvailable: boolean;
  /** Effective price at this branch (override, else the item price). */
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number | null;
  /** Whether this branch has its own price/stock rather than the item's. */
  hasOverride: boolean;
}

type PriceBearing = {
  id: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity?: number | null;
  pricingMode?: CatalogueItemPricingMode;
};

@Injectable()
export class CatalogueBranchPricingService {
  constructor(
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(CatalogueItemBranchPricing)
    private readonly pricingRepository: Repository<CatalogueItemBranchPricing>,
  ) {}

  private async ownedItem(itemId: string, businessId: string) {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, businessId },
      relations: ['branches'],
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  /** Every branch of the business with the item's availability and price there. */
  async getItemBranchPricing(itemId: string, businessId: string) {
    const item = await this.ownedItem(itemId, businessId);
    const [branches, overrides] = await Promise.all([
      this.branchRepository.find({
        where: { businessId },
        order: { isMainBranch: 'DESC', name: 'ASC' },
      }),
      this.pricingRepository.find({ where: { itemId } }),
    ]);
    const overrideByBranch = new Map(
      overrides.map((row) => [row.branchId, row]),
    );
    const carried = new Set(item.branches.map((branch) => branch.id));
    const perBranch = item.pricingMode === CatalogueItemPricingMode.PER_BRANCH;

    const rows: ItemBranchPricingRow[] = branches.map((branch) => {
      const override = perBranch ? overrideByBranch.get(branch.id) : undefined;
      return {
        branchId: branch.id,
        branchName: branch.name,
        isMainBranch: Boolean(branch.isMainBranch),
        isAvailable: carried.has(branch.id),
        price: override?.price ?? Number(item.price),
        compareAtPrice: override?.compareAtPrice ?? item.compareAtPrice ?? null,
        stockQuantity: override?.stockQuantity ?? item.stockQuantity ?? null,
        hasOverride: Boolean(
          override &&
          (override.price !== null ||
            override.compareAtPrice !== null ||
            override.stockQuantity !== null),
        ),
      };
    });

    return {
      itemId: item.id,
      pricingMode: item.pricingMode,
      basePrice: Number(item.price),
      baseCompareAtPrice: item.compareAtPrice ?? null,
      branches: rows,
    };
  }

  /**
   * Set where the item is sold and, in `per_branch` mode, each branch's price
   * and stock. Branches not listed keep their current state. Switching back to
   * `uniform` keeps stored overrides (so switching again restores them) but
   * stops applying them.
   */
  async setItemBranchPricing(
    itemId: string,
    dto: SetItemBranchPricingDto,
    businessId: string,
  ) {
    const item = await this.ownedItem(itemId, businessId);

    const branchIds = [...new Set(dto.branches.map((entry) => entry.branchId))];
    if (branchIds.length !== dto.branches.length) {
      throw new BadRequestException('Each branch may appear only once');
    }
    const branches = await this.branchRepository.find({
      where: { id: In(branchIds), businessId },
    });
    if (branches.length !== branchIds.length) {
      throw new BadRequestException('Branch not found or unauthorized');
    }
    const branchById = new Map(branches.map((branch) => [branch.id, branch]));

    const carried = new Map(item.branches.map((branch) => [branch.id, branch]));
    for (const entry of dto.branches) {
      if (entry.isAvailable) {
        carried.set(entry.branchId, branchById.get(entry.branchId)!);
      } else {
        carried.delete(entry.branchId);
      }
    }
    if (carried.size === 0) {
      throw new BadRequestException(
        'An item must stay available at one branch at least',
      );
    }

    const perBranch = dto.pricingMode === CatalogueItemPricingMode.PER_BRANCH;
    if (perBranch) {
      for (const entry of dto.branches) {
        if (!entry.isAvailable) continue;
        const branch = branchById.get(entry.branchId)!;
        try {
          assertCompareAtPrice(
            entry.price ?? item.price,
            entry.compareAtPrice ?? item.compareAtPrice,
          );
        } catch {
          throw new BadRequestException(
            `${branch.name}: compareAtPrice must be greater than or equal to price`,
          );
        }
      }
    }

    await this.itemRepository.manager.transaction(async (manager) => {
      item.branches = [...carried.values()];
      item.pricingMode = dto.pricingMode;
      await manager.save(CatalogueItem, item);

      if (!perBranch) return;

      const removed = dto.branches
        .filter(
          (entry) =>
            !entry.isAvailable ||
            (entry.price == null &&
              entry.compareAtPrice == null &&
              entry.stockQuantity == null),
        )
        .map((entry) => entry.branchId);
      if (removed.length) {
        await manager.delete(CatalogueItemBranchPricing, {
          itemId,
          branchId: In(removed),
        });
      }

      const upserts = dto.branches
        .filter(
          (entry) => entry.isAvailable && !removed.includes(entry.branchId),
        )
        .map((entry) => ({
          itemId,
          branchId: entry.branchId,
          price: entry.price ?? null,
          compareAtPrice: entry.compareAtPrice ?? null,
          stockQuantity:
            entry.stockQuantity == null
              ? null
              : Math.floor(entry.stockQuantity),
        }));
      if (upserts.length) {
        await manager.upsert(CatalogueItemBranchPricing, upserts, [
          'itemId',
          'branchId',
        ]);
      }
    });

    return this.getItemBranchPricing(itemId, businessId);
  }

  /**
   * Swap in each branch's own price/stock for items priced per branch. Items
   * in `uniform` mode, and branches without an override, are returned as-is.
   * Returns new objects; entities passed in are not mutated.
   */
  async applyBranchPrices<T extends PriceBearing>(
    items: T[],
    branchId: string,
  ): Promise<T[]> {
    const perBranch = items.filter(
      (item) => item.pricingMode === CatalogueItemPricingMode.PER_BRANCH,
    );
    if (perBranch.length === 0) return items;

    const overrides = await this.pricingRepository.find({
      where: { branchId, itemId: In(perBranch.map((item) => item.id)) },
    });
    if (overrides.length === 0) return items;
    const byItem = new Map(overrides.map((row) => [row.itemId, row]));

    return items.map((item) => {
      const override = byItem.get(item.id);
      if (
        !override ||
        item.pricingMode !== CatalogueItemPricingMode.PER_BRANCH
      ) {
        return item;
      }
      return Object.assign(Object.create(Object.getPrototypeOf(item)), item, {
        price: override.price ?? item.price,
        compareAtPrice: override.compareAtPrice ?? item.compareAtPrice ?? null,
        stockQuantity: override.stockQuantity ?? item.stockQuantity ?? null,
      }) as T;
    });
  }
}
