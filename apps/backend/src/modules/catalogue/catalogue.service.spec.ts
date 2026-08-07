import { Test, TestingModule } from '@nestjs/testing';
import { CatalogueService } from './catalogue.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogueCategory } from './entities/catalogue-category.entity';
import {
  CatalogueItem,
  CatalogueItemStatus,
} from './entities/catalogue-item.entity';
import { Branch } from '../branches/entities/branch.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CatalogueService', () => {
  let service: CatalogueService;

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockCategoryRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((cat) => Promise.resolve({ id: 'cat-1', ...cat })),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockItemRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((item) =>
        Promise.resolve({ id: item.id || 'item-1', ...item }),
      ),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    remove: jest.fn(),
  };

  const mockBranchRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SubscriptionsService,
          useValue: {
            getCapabilities: jest.fn().mockResolvedValue({
              capabilities: {
                catalogueCategories: { enabled: true },
                catalogueItems: { enabled: true },
              },
            }),
          },
        },
        CatalogueService,
        {
          provide: getRepositoryToken(CatalogueCategory),
          useValue: mockCategoryRepo,
        },
        {
          provide: getRepositoryToken(CatalogueItem),
          useValue: mockItemRepo,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepo,
        },
      ],
    }).compile();

    service = module.get<CatalogueService>(CatalogueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Categories', () => {
    it('should create a category', async () => {
      const dto = { name: 'Food' };
      const result = await service.createCategory(dto, 'bus-1');
      expect(result.name).toBe('Food');
      expect(mockCategoryRepo.save).toHaveBeenCalled();
    });

    it('should update a category', async () => {
      mockCategoryRepo.findOne.mockResolvedValue({ id: 'cat-1', name: 'Old' });
      const result = await service.updateCategory(
        'cat-1',
        { name: 'New' },
        'bus-1',
      );
      expect(result.name).toBe('New');
    });

    it('should throw NotFound if category not found on update', async () => {
      mockCategoryRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateCategory('1', { name: 'X' }, 'B'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Items', () => {
    it('should create an item linked to a branch', async () => {
      const dto = {
        name: 'Burger',
        price: 10,
        shortDescription: 'S',
        description: 'D',
        mainImage: 'img',
        categoryId: 'cat-1',
        branchId: 'br-1',
      };
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });

      const result = await service.createItem(dto, 'bus-1');
      expect(result.name).toBe('Burger');
      expect(result.branches).toHaveLength(1);
      expect(result.branches[0].id).toBe('br-1');
    });

    it('should clone item when updating specifically for one branch', async () => {
      const existingItem = {
        id: 'item-1',
        name: 'Shared Burger',
        branches: [{ id: 'br-1' }, { id: 'br-2' }],
        businessId: 'bus-1',
      };
      mockItemRepo.findOne.mockResolvedValue(existingItem);

      const updateDto = {
        name: 'Unique Burger',
        branchId: 'br-1',
        applyGlobally: false,
      };

      const result = await service.updateItem('item-1', updateDto, 'bus-1');

      expect(result.id).not.toBe('item-1');
      expect(result.name).toBe('Unique Burger');
      expect(result.branches).toHaveLength(1);
      expect(result.branches[0].id).toBe('br-1');
      // Original item should have lost br-1
      expect(existingItem.branches).toHaveLength(1);
      expect(existingItem.branches[0].id).toBe('br-2');
    });

    it('should apply update globally when requested', async () => {
      const existingItem = {
        id: 'item-1',
        name: 'Shared Burger',
        branches: [{ id: 'br-1' }, { id: 'br-2' }],
        businessId: 'bus-1',
      };
      mockItemRepo.findOne.mockResolvedValue(existingItem);

      const updateDto = {
        name: 'Global Burger',
        applyGlobally: true,
      };

      const result = await service.updateItem('item-1', updateDto, 'bus-1');

      expect(result.id).toBe('item-1');
      expect(result.name).toBe('Global Burger');
      expect(result.branches).toHaveLength(2);
    });

    it('should import item to another branch', async () => {
      mockItemRepo.findOne.mockResolvedValue({
        id: 'i1',
        branches: [{ id: 'br-1' }],
      });
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-2',
        businessId: 'bus-1',
      });

      const result = await service.importItem('i1', 'br-2', 'bus-1');
      expect(result.branches).toHaveLength(2);
      expect(result.branches.some((b) => b.id === 'br-2')).toBeTruthy();
    });

    it('should throw error if importing to a branch where it already exists', async () => {
      mockItemRepo.findOne.mockResolvedValue({
        id: 'i1',
        branches: [{ id: 'br-1' }],
      });
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });

      await expect(service.importItem('i1', 'br-1', 'bus-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Listing', () => {
    it('should query active items for a branch with UUID', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: '3f8a427d-94c0-4f51-b0db-6e6a17b2b0de',
      });
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([
        [{ id: 'item-1' }],
        1,
      ]);
      const result = await service.findAllItemsPublic(
        '3f8a427d-94c0-4f51-b0db-6e6a17b2b0de',
        {
          page: 1,
          limit: 10,
        },
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockBranchRepo.findOne).toHaveBeenCalledWith({
        where: { id: '3f8a427d-94c0-4f51-b0db-6e6a17b2b0de', isActive: true },
      });
    });

    it('should throw NotFoundException if UUID branch does not exist', async () => {
      mockBranchRepo.findOne.mockResolvedValue(null);
      await expect(
        service.findAllItemsPublic('3f8a427d-94c0-4f51-b0db-6e6a17b2b0de', {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should query active items for a branch with unique code', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: '3f8a427d-94c0-4f51-b0db-6e6a17b2b0de',
        uniqueCode: 'BR-CODE99',
      });
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([
        [{ id: 'item-1' }],
        1,
      ]);
      const result = await service.findAllItemsPublic('BR-CODE99', {
        page: 1,
        limit: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockBranchRepo.findOne).toHaveBeenCalledWith({
        where: { uniqueCode: 'BR-CODE99', isActive: true },
      });
    });

    it('should throw NotFoundException if branch code is not found', async () => {
      mockBranchRepo.findOne.mockResolvedValue(null);
      await expect(
        service.findAllItemsPublic('INVALID-CODE', { page: 1, limit: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkImportItems', () => {
    it('should throw BadRequestException if items array is empty or exceeds 1000', async () => {
      await expect(
        service.bulkImportItems({ items: [] }, 'bus-1', 'br-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should bulk import valid items and report row errors for invalid ones', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });
      mockCategoryRepo.findOne.mockResolvedValue(null);
      mockItemRepo.findOne.mockResolvedValue(null);
      mockItemRepo.save.mockImplementation((item) =>
        Promise.resolve({ id: 'item-uuid-1', ...item }),
      );

      const result = await service.bulkImportItems(
        {
          branchId: 'br-1',
          items: [
            {
              name: 'Item 1',
              price: 10,
              category: 'Tech',
              sku: 'SKU-1',
            },
            {
              name: '',
              price: -5,
            },
          ],
        },
        'bus-1',
      );

      expect(result.created).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        row: 2,
        success: true,
        itemId: 'item-uuid-1',
      });
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].row).toBe(3);
    });
  });
});
