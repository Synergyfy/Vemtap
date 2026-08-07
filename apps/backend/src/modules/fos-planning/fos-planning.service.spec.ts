import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FosPlanningService } from './fos-planning.service';
import {
  FosBudgetItem,
  FosBudgetCategory,
  FosForecastAspect,
} from './entities/planning.entity';

describe('FosPlanningService', () => {
  let service: FosPlanningService;

  const mockItemRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const mockCategoryRepo = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const mockAspectRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosPlanningService,
        { provide: getRepositoryToken(FosBudgetItem), useValue: mockItemRepo },
        {
          provide: getRepositoryToken(FosBudgetCategory),
          useValue: mockCategoryRepo,
        },
        {
          provide: getRepositoryToken(FosForecastAspect),
          useValue: mockAspectRepo,
        },
      ],
    }).compile();

    service = module.get<FosPlanningService>(FosPlanningService);
  });

  describe('getBudgetItems', () => {
    it('should return items, categories, and totals', async () => {
      mockCategoryRepo.count.mockResolvedValue(1);
      mockItemRepo.find.mockResolvedValue([
        {
          id: 'bi-1',
          category: 'Revenue',
          item: 'Subscription Revenue',
          planned: '2800000',
          actual: '0',
          notes: '',
        },
      ]);
      mockCategoryRepo.find.mockResolvedValue([{ name: 'Revenue' }]);

      const result = await service.getBudgetItems();

      expect(result.items).toHaveLength(1);
      expect(result.totalPlanned).toBe(2800000);
      expect(result.totalActual).toBe(0);
      expect(result.items[0].variance).toBe(-2800000);
    });

    it('should seed default categories when empty', async () => {
      mockCategoryRepo.count.mockResolvedValue(0);
      mockItemRepo.find.mockResolvedValue([]);
      mockCategoryRepo.find.mockResolvedValue([]);
      mockCategoryRepo.save.mockResolvedValue([]);

      await service.getBudgetItems();
      expect(mockCategoryRepo.save).toHaveBeenCalled();
    });
  });

  describe('removeBudgetItem', () => {
    it('should throw when missing', async () => {
      mockItemRepo.findOne.mockResolvedValue(null);
      await expect(service.removeBudgetItem('x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAspects', () => {
    it('should return forecast aspects', async () => {
      mockAspectRepo.find.mockResolvedValue([
        {
          id: 'sales',
          label: 'Sales Revenue',
          baseValue: '2847500',
          growthRate: '12',
        },
      ]);

      const result = await service.getAspects();

      expect(result.aspects[0].baseValue).toBe(2847500);
    });
  });
});
