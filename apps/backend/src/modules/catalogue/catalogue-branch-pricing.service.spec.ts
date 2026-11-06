import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CatalogueBranchPricingService } from './catalogue-branch-pricing.service';
import {
  CatalogueItem,
  CatalogueItemPricingMode,
} from './entities/catalogue-item.entity';
import { CatalogueItemBranchPricing } from './entities/catalogue-item-branch-pricing.entity';
import { Branch } from '../branches/entities/branch.entity';

describe('CatalogueBranchPricingService', () => {
  let service: CatalogueBranchPricingService;
  let itemRepo: any;
  let branchRepo: any;
  let pricingRepo: any;
  let manager: any;

  const wuse = { id: 'b-wuse', name: 'Wuse', isMainBranch: true };
  const garki = { id: 'b-garki', name: 'Garki', isMainBranch: false };
  const maitama = { id: 'b-maitama', name: 'Maitama', isMainBranch: false };

  const item = (overrides: Partial<CatalogueItem> = {}) =>
    ({
      id: 'item-1',
      businessId: 'biz-1',
      price: 10000,
      compareAtPrice: 12000,
      stockQuantity: 50,
      pricingMode: CatalogueItemPricingMode.PER_BRANCH,
      branches: [wuse, garki],
      ...overrides,
    }) as unknown as CatalogueItem;

  beforeEach(async () => {
    manager = {
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      upsert: jest.fn().mockResolvedValue(undefined),
    };
    itemRepo = {
      findOne: jest.fn(),
      manager: { transaction: jest.fn((cb) => cb(manager)) },
    };
    branchRepo = { find: jest.fn() };
    pricingRepo = { find: jest.fn().mockResolvedValue([]) };

    const module = await Test.createTestingModule({
      providers: [
        CatalogueBranchPricingService,
        { provide: getRepositoryToken(CatalogueItem), useValue: itemRepo },
        { provide: getRepositoryToken(Branch), useValue: branchRepo },
        {
          provide: getRepositoryToken(CatalogueItemBranchPricing),
          useValue: pricingRepo,
        },
      ],
    }).compile();
    service = module.get(CatalogueBranchPricingService);
  });

  describe('getItemBranchPricing', () => {
    it('lists every branch with availability and the effective price', async () => {
      itemRepo.findOne.mockResolvedValue(item());
      branchRepo.find.mockResolvedValue([wuse, garki, maitama]);
      pricingRepo.find.mockResolvedValue([
        {
          itemId: 'item-1',
          branchId: 'b-garki',
          price: 9000,
          compareAtPrice: null,
          stockQuantity: 5,
        },
      ]);

      const result = await service.getItemBranchPricing('item-1', 'biz-1');

      expect(result.pricingMode).toBe('per_branch');
      expect(result.branches).toEqual([
        expect.objectContaining({
          branchId: 'b-wuse',
          isAvailable: true,
          price: 10000,
          hasOverride: false,
        }),
        expect.objectContaining({
          branchId: 'b-garki',
          isAvailable: true,
          price: 9000,
          compareAtPrice: 12000,
          stockQuantity: 5,
          hasOverride: true,
        }),
        expect.objectContaining({ branchId: 'b-maitama', isAvailable: false }),
      ]);
    });

    it('ignores stored overrides while the item is priced uniformly', async () => {
      itemRepo.findOne.mockResolvedValue(
        item({ pricingMode: CatalogueItemPricingMode.UNIFORM }),
      );
      branchRepo.find.mockResolvedValue([garki]);
      pricingRepo.find.mockResolvedValue([
        { itemId: 'item-1', branchId: 'b-garki', price: 9000 },
      ]);

      const result = await service.getItemBranchPricing('item-1', 'biz-1');
      expect(result.branches[0]).toMatchObject({
        price: 10000,
        hasOverride: false,
      });
    });

    it('404s for an item of another business', async () => {
      itemRepo.findOne.mockResolvedValue(null);
      await expect(
        service.getItemBranchPricing('item-1', 'biz-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setItemBranchPricing', () => {
    beforeEach(() => {
      itemRepo.findOne.mockResolvedValue(item());
    });

    it('adds and removes branches and stores overrides', async () => {
      branchRepo.find
        .mockResolvedValueOnce([garki, maitama]) // validation
        .mockResolvedValue([wuse, garki, maitama]); // re-read for the response

      await service.setItemBranchPricing(
        'item-1',
        {
          pricingMode: CatalogueItemPricingMode.PER_BRANCH,
          branches: [
            { branchId: 'b-garki', isAvailable: false },
            {
              branchId: 'b-maitama',
              isAvailable: true,
              price: 11000,
              stockQuantity: 7.9,
            },
          ],
        },
        'biz-1',
      );

      const saved = manager.save.mock.calls[0][1];
      expect(saved.branches.map((b: any) => b.id).sort()).toEqual([
        'b-maitama',
        'b-wuse',
      ]);
      expect(manager.delete).toHaveBeenCalledWith(
        CatalogueItemBranchPricing,
        expect.objectContaining({ itemId: 'item-1' }),
      );
      expect(manager.upsert).toHaveBeenCalledWith(
        CatalogueItemBranchPricing,
        [
          {
            itemId: 'item-1',
            branchId: 'b-maitama',
            price: 11000,
            compareAtPrice: null,
            stockQuantity: 7,
          },
        ],
        ['itemId', 'branchId'],
      );
    });

    it('refuses to remove the last branch', async () => {
      branchRepo.find.mockResolvedValue([wuse, garki]);
      await expect(
        service.setItemBranchPricing(
          'item-1',
          {
            pricingMode: CatalogueItemPricingMode.UNIFORM,
            branches: [
              { branchId: 'b-wuse', isAvailable: false },
              { branchId: 'b-garki', isAvailable: false },
            ],
          },
          'biz-1',
        ),
      ).rejects.toThrow(/one branch at least/);
    });

    it('rejects a branch price above its compare-at price', async () => {
      branchRepo.find.mockResolvedValue([garki]);
      await expect(
        service.setItemBranchPricing(
          'item-1',
          {
            pricingMode: CatalogueItemPricingMode.PER_BRANCH,
            branches: [
              { branchId: 'b-garki', isAvailable: true, price: 15000 },
            ],
          },
          'biz-1',
        ),
      ).rejects.toThrow(/Garki: compareAtPrice/);
    });

    it('rejects branches of another business', async () => {
      branchRepo.find.mockResolvedValue([]);
      await expect(
        service.setItemBranchPricing(
          'item-1',
          {
            pricingMode: CatalogueItemPricingMode.UNIFORM,
            branches: [{ branchId: 'b-other', isAvailable: true }],
          },
          'biz-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('does not write overrides in uniform mode', async () => {
      branchRepo.find
        .mockResolvedValueOnce([garki])
        .mockResolvedValue([wuse, garki]);
      await service.setItemBranchPricing(
        'item-1',
        {
          pricingMode: CatalogueItemPricingMode.UNIFORM,
          branches: [{ branchId: 'b-garki', isAvailable: true, price: 1 }],
        },
        'biz-1',
      );
      expect(manager.save).toHaveBeenCalled();
      expect(manager.upsert).not.toHaveBeenCalled();
      expect(manager.delete).not.toHaveBeenCalled();
    });
  });

  describe('applyBranchPrices', () => {
    it('swaps in branch prices only for per-branch items with an override', async () => {
      pricingRepo.find.mockResolvedValue([
        {
          itemId: 'a',
          branchId: 'b-garki',
          price: 900,
          compareAtPrice: null,
          stockQuantity: null,
        },
      ]);
      const items = [
        {
          id: 'a',
          price: 1000,
          compareAtPrice: 1200,
          stockQuantity: 3,
          pricingMode: CatalogueItemPricingMode.PER_BRANCH,
        },
        {
          id: 'b',
          price: 500,
          pricingMode: CatalogueItemPricingMode.PER_BRANCH,
        },
        { id: 'c', price: 700, pricingMode: CatalogueItemPricingMode.UNIFORM },
      ];

      const priced = await service.applyBranchPrices(items, 'b-garki');

      expect(priced[0]).toMatchObject({
        price: 900,
        compareAtPrice: 1200,
        stockQuantity: 3,
      });
      expect(priced[1]).toBe(items[1]);
      expect(priced[2]).toBe(items[2]);
      // Input is not mutated.
      expect(items[0].price).toBe(1000);
    });

    it('skips the lookup when nothing is priced per branch', async () => {
      const items = [
        { id: 'c', price: 700, pricingMode: CatalogueItemPricingMode.UNIFORM },
      ];
      expect(await service.applyBranchPrices(items, 'b-garki')).toBe(items);
      expect(pricingRepo.find).not.toHaveBeenCalled();
    });
  });
});
