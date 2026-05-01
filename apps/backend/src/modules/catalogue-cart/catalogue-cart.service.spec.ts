import { Test, TestingModule } from '@nestjs/testing';
import { CatalogueCartService } from './catalogue-cart.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogueCart } from './entities/catalogue-cart.entity';
import { CatalogueCartItem } from './entities/catalogue-cart-item.entity';
import {
  CatalogueItem,
  CatalogueItemStatus,
} from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueOrderService } from '../catalogue-orders/catalogue-orders.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CatalogueCartService', () => {
  let service: CatalogueCartService;

  const mockCartRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCartItemRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  const mockItemRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockOfferRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockBranchRepository = {
    findOne: jest.fn(),
  };

  const mockOrderService = {
    createOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogueCartService,
        {
          provide: getRepositoryToken(CatalogueCart),
          useValue: mockCartRepository,
        },
        {
          provide: getRepositoryToken(CatalogueCartItem),
          useValue: mockCartItemRepository,
        },
        {
          provide: getRepositoryToken(CatalogueItem),
          useValue: mockItemRepository,
        },
        {
          provide: getRepositoryToken(CatalogueOffer),
          useValue: mockOfferRepository,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepository,
        },
        {
          provide: CatalogueOrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    service = module.get<CatalogueCartService>(CatalogueCartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart if found', async () => {
      const mockCart = {
        id: 'cart-1',
        customerId: 'cust-1',
        branchId: 'branch-1',
        items: [],
      };
      mockCartRepository.findOne.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart('cust-1', 'branch-1');
      expect(result).toEqual(mockCart);
      expect(mockCartRepository.create).not.toHaveBeenCalled();
    });

    it('should create a new cart if not found', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);
      mockBranchRepository.findOne.mockResolvedValue({
        id: 'branch-1',
        businessId: 'bus-1',
      });
      const newCart = {
        id: 'cart-1',
        customerId: 'cust-1',
        branchId: 'branch-1',
        businessId: 'bus-1',
        items: [],
      };
      mockCartRepository.create.mockReturnValue(newCart);
      mockCartRepository.save.mockResolvedValue(newCart);

      const result = await service.getOrCreateCart('cust-1', 'branch-1');
      expect(result).toEqual(newCart);
      expect(mockBranchRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'branch-1' },
      });
      expect(mockCartRepository.create).toHaveBeenCalledWith({
        customerId: 'cust-1',
        branchId: 'branch-1',
        businessId: 'bus-1',
        items: [],
      });
      expect(mockCartRepository.save).toHaveBeenCalledWith(newCart);
    });

    it('should throw NotFoundException if branch is not found when creating cart', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);
      mockBranchRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getOrCreateCart('cust-1', 'branch-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCartSummary', () => {
    it('should return 0 itemCount and total if cart not found', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);
      const result = await service.getCartSummary('cust-1', 'branch-1');
      expect(result).toEqual({ itemCount: 0, total: 0 });
    });

    it('should calculate itemCount and total correctly', async () => {
      const mockCart = {
        items: [
          { quantity: 2, snapshotPrice: 10 },
          { quantity: 1, snapshotPrice: 20 },
        ],
      };
      mockCartRepository.findOne.mockResolvedValue(mockCart);
      const result = await service.getCartSummary('cust-1', 'branch-1');
      expect(result).toEqual({ itemCount: 3, total: 40 });
    });
  });
});
