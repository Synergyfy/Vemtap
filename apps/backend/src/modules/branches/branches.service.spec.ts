import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryBuilder, SelectQueryBuilder } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from '../catalogue/entities/catalogue-offer.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DevicesService } from '../devices/devices.service';
import { QrThriveService } from '../qr-thrive/qr-thrive.service';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('BranchesService', () => {
  let service: BranchesService;

  const mockBranchRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    })),
    manager: {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    },
  };

  const mockBusinessRepository = {
    findOne: jest.fn(),
  };

  const mockCatalogueOfferRepository = {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockSubscriptionsService = {
    getCapabilities: jest.fn().mockResolvedValue({
      capabilities: {
        branches: { enabled: true, limit: 10, used: 1 },
      },
    }),
  };

  const mockDevicesService = {
    createAutoDevice: jest.fn().mockResolvedValue({}),
  };

  const mockQrThriveService = {
    createMainQRCode: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepository,
        },
        {
          provide: getRepositoryToken(CatalogueOffer),
          useValue: mockCatalogueOfferRepository,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: DevicesService,
          useValue: mockDevicesService,
        },
        {
          provide: QrThriveService,
          useValue: mockQrThriveService,
        },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should fallback to business contact and inherit from main branch', async () => {
      const ownerId = 'owner-1';
      const business = {
        id: 'bus-1',
        officialEmail: 'bus@example.com',
        phone: '+1234567890',
        logoUrl: 'bus-logo.png',
      };
      const mainBranch = {
        id: 'main-1',
        isMainBranch: true,
        businessHours: { monday: { open: '08:00' } },
        welcomeMessage: 'Welcome!',
        engagement: { twitter: '@test' },
      };
      const dto = { name: 'New Branch' };

      mockBusinessRepository.findOne.mockResolvedValue(business);
      mockBranchRepository.findOne.mockResolvedValue(mainBranch);
      mockBranchRepository.create.mockImplementation((data) => ({
        id: 'branch-1',
        ...data,
      }));
      mockBranchRepository.save.mockImplementation((branch) =>
        Promise.resolve(branch),
      );

      const result = await service.create(ownerId, dto);

      expect(result.officialEmail).toBe(business.officialEmail);
      expect(result.phone).toBe(business.phone);
      expect(result.businessHours).toEqual(mainBranch.businessHours);
      expect(result.welcomeMessage).toBe(mainBranch.welcomeMessage);
      expect(result.logoUrl).toBe(business.logoUrl);
      expect(mockBranchRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...dto,
          businessId: business.id,
          businessHours: mainBranch.businessHours,
          engagement: mainBranch.engagement,
        }),
      );
    });

    it('should NOT fallback if branch contact is provided', async () => {
      const ownerId = 'owner-1';
      const business = {
        id: 'bus-1',
        officialEmail: 'bus@example.com',
        phone: '+1234567890',
      };
      const dto = {
        name: 'New Branch',
        officialEmail: 'branch@example.com',
        phone: '+0987654321',
      };

      mockBusinessRepository.findOne.mockResolvedValue(business);
      mockBranchRepository.findOne.mockResolvedValue(null);
      mockBranchRepository.create.mockImplementation((data) => ({
        id: 'branch-1',
        ...data,
      }));
      mockBranchRepository.save.mockImplementation((branch) =>
        Promise.resolve(branch),
      );

      const result = await service.create(ownerId, dto);

      expect(result.officialEmail).toBe(dto.officialEmail);
      expect(result.phone).toBe(dto.phone);
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException if trying to remove main branch', async () => {
      const ownerId = 'owner-1';
      const branchId = 'main-1';
      const business = { id: 'bus-1', ownerId };
      const mainBranch = {
        id: branchId,
        isMainBranch: true,
        businessId: 'bus-1',
      };

      mockBusinessRepository.findOne.mockResolvedValue(business);
      mockBranchRepository.findOne.mockResolvedValue(mainBranch);

      await expect(service.remove(ownerId, branchId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should remove a non-main branch', async () => {
      const ownerId = 'owner-1';
      const branchId = 'branch-2';
      const business = { id: 'bus-1', ownerId };
      const branch = { id: branchId, isMainBranch: false, businessId: 'bus-1' };

      mockBusinessRepository.findOne.mockResolvedValue(business);
      mockBranchRepository.findOne.mockResolvedValue(branch);

      await service.remove(ownerId, branchId);
      expect(mockBranchRepository.remove).toHaveBeenCalled();
    });
  });

  describe('findByUsername', () => {
    it('should return branch when username exists', async () => {
      const branch = {
        id: 'branch-1',
        username: 'main-office',
        isActive: true,
      };
      mockBranchRepository.findOne.mockResolvedValue(branch);

      const result = await service.findByUsername('main-office');
      expect(result).toEqual(branch);
      expect(mockBranchRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'main-office', isActive: true },
        relations: ['business'],
      });
    });

    it('should return null when username does not exist', async () => {
      mockBranchRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('validateUsername', () => {
    it('should return error for too short username', async () => {
      const result = await service.validateUsername('ab');
      expect(result).toContain('3-30');
    });

    it('should return error for too long username', async () => {
      const longUsername = 'a'.repeat(31);
      const result = await service.validateUsername(longUsername);
      expect(result).toContain('30');
    });

    it('should return error for invalid format', async () => {
      const result = await service.validateUsername('Invalid-Username');
      expect(result).toContain('lowercase');
    });

    it('should return error for reserved username', async () => {
      const result = await service.validateUsername('admin');
      expect(result).toContain('reserved');
    });

    it('should return null for valid username', async () => {
      mockBranchRepository.createQueryBuilder.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }));

      const result = await service.validateUsername('valid-username');
      expect(result).toBeNull();
    });

    it('should return error for duplicate username', async () => {
      const existingBranch = { id: 'branch-1', username: 'taken' };
      mockBranchRepository.createQueryBuilder.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingBranch),
      }));

      const result = await service.validateUsername('taken');
      expect(result).toContain('already taken');
    });
  });

  describe('generateUniqueUsername', () => {
    it('should generate username from branch name', async () => {
      mockBranchRepository.createQueryBuilder.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }));

      const result = await service.generateUniqueUsername('Main Office');
      expect(result).toBe('main-office');
    });

    it('should add suffix if username exists', async () => {
      let callCount = 0;
      mockBranchRepository.createQueryBuilder.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockImplementation(() => {
          callCount++;
          return callCount === 1 ? { id: 'branch-1' } : null;
        }),
      }));

      const result = await service.generateUniqueUsername('Main Office');
      expect(result).toBe('main-office-1');
    });
  });

  describe('create with username', () => {
    it('should auto-generate username if not provided', async () => {
      const ownerId = 'owner-1';
      const business = { id: 'bus-1' };

      mockBusinessRepository.findOne.mockResolvedValue(business);
      mockBranchRepository.find.mockResolvedValue([]);
      mockBranchRepository.create.mockImplementation((data) => data);
      mockBranchRepository.save.mockImplementation((branch) =>
        Promise.resolve(branch),
      );

      mockBranchRepository.createQueryBuilder.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }));

      const dto = { name: 'New Branch' };
      const result = await service.create(ownerId, dto);

      expect(result.username).toBeDefined();
      expect(result.username).toMatch(/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/);
    });

    it('should validate provided username', async () => {
      const ownerId = 'owner-1';
      const business = { id: 'bus-1' };

      mockBusinessRepository.findOne.mockResolvedValue(business);
      mockBranchRepository.find.mockResolvedValue([]);
      mockBranchRepository.create.mockImplementation((data) => data);
      mockBranchRepository.save.mockImplementation((branch) =>
        Promise.resolve(branch),
      );

      mockBranchRepository.createQueryBuilder.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }));

      const dto = { name: 'New Branch', username: 'valid-branch' };
      const result = await service.create(ownerId, dto);

      expect(result.username).toBe('valid-branch');
    });

    it('should throw error for invalid username', async () => {
      const ownerId = 'owner-1';
      const business = { id: 'bus-1' };

      mockBusinessRepository.findOne.mockResolvedValue(business);
      mockBranchRepository.find.mockResolvedValue([]);

      const dto = { name: 'New Branch', username: 'AB' };

      await expect(service.create(ownerId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findNearbyBranches', () => {
    const sourceBranchId = 'source-branch-1';
    const sourceBranch = {
      id: sourceBranchId,
      name: 'Source Branch',
      latitude: 6.5243793,
      longitude: 3.3792057,
    };

    const nearbyBranch = {
      id: 'nearby-1',
      name: 'Nearby Branch',
      address: '42 Test Street',
      city: 'Lagos',
      state: 'Lagos',
      latitude: 6.5278,
      longitude: 3.3812,
      businessId: 'bus-2',
      businessName: 'Other Business',
      businessLogoUrl: 'https://example.com/logo.png',
      distanceMeters: 410.5,
    };

    const fartherBranch = {
      id: 'farther-1',
      name: 'Farther Branch',
      address: '100 Test Avenue',
      city: 'Lagos',
      state: 'Lagos',
      latitude: 6.53,
      longitude: 3.385,
      businessId: 'bus-3',
      businessName: 'Far Business',
      businessLogoUrl: null,
      distanceMeters: 820.3,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw NotFoundException when source branch does not exist', async () => {
      mockBranchRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findNearbyBranches('nonexistent', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when source branch has null lat/lng', async () => {
      mockBranchRepository.findOne.mockResolvedValue({
        ...sourceBranch,
        latitude: null,
        longitude: null,
      });

      await expect(
        service.findNearbyBranches(sourceBranchId, {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return empty results when no branches are nearby', async () => {
      mockBranchRepository.findOne.mockResolvedValue(sourceBranch);
      mockBranchRepository.query.mockResolvedValue([]);

      const result = await service.findNearbyBranches(sourceBranchId, {});

      expect(result.source).toEqual({
        id: sourceBranchId,
        name: 'Source Branch',
      });
      expect(result.distanceMeters).toBe(500);
      expect(result.results).toEqual([]);
    });

    it('should return nearby branches ordered by distance (closest first)', async () => {
      mockBranchRepository.findOne.mockResolvedValue(sourceBranch);
      mockBranchRepository.query.mockResolvedValue([
        nearbyBranch,
        fartherBranch,
      ]);

      const result = await service.findNearbyBranches(sourceBranchId, {});

      expect(result.results).toHaveLength(2);
      expect(result.results[0].id).toBe('nearby-1');
      expect(result.results[0].distanceMeters).toBe(410.5);
      expect(result.results[1].id).toBe('farther-1');
      expect(result.results[1].distanceMeters).toBe(820.3);
    });

    it('should pass custom distance and limit to the query', async () => {
      mockBranchRepository.findOne.mockResolvedValue(sourceBranch);
      mockBranchRepository.query.mockResolvedValue([nearbyBranch]);

      const result = await service.findNearbyBranches(sourceBranchId, {
        distance: 300,
        limit: 5,
        withPromotions: false,
      });

      expect(result.distanceMeters).toBe(300);
      expect(mockBranchRepository.query).toHaveBeenCalledWith(
        expect.any(String),
        [sourceBranchId, 300, 5],
      );
    });

    it('should default distance to 500 and limit to 20', async () => {
      mockBranchRepository.findOne.mockResolvedValue(sourceBranch);
      mockBranchRepository.query.mockResolvedValue([nearbyBranch]);

      await service.findNearbyBranches(sourceBranchId, {});

      expect(mockBranchRepository.query).toHaveBeenCalledWith(
        expect.any(String),
        [sourceBranchId, 500, 20],
      );
    });

    it('should include results without offers when withPromotions is false', async () => {
      mockBranchRepository.findOne.mockResolvedValue(sourceBranch);
      mockBranchRepository.query.mockResolvedValue([nearbyBranch]);

      const result = await service.findNearbyBranches(sourceBranchId, {});

      expect(result.results[0]).not.toHaveProperty('offers');
      expect(
        mockCatalogueOfferRepository.createQueryBuilder,
      ).not.toHaveBeenCalled();
    });

    it('should fetch and attach offers when withPromotions is true', async () => {
      const offer1 = {
        id: 'offer-1',
        name: 'Summer Deal',
        branchId: 'nearby-1',
        status: CatalogueOfferStatus.ACTIVE,
      };
      const offer2 = {
        id: 'offer-2',
        name: 'Happy Hour',
        branchId: 'nearby-1',
        status: CatalogueOfferStatus.ACTIVE,
      };

      mockBranchRepository.findOne.mockResolvedValue(sourceBranch);
      mockBranchRepository.query.mockResolvedValue([nearbyBranch]);
      mockCatalogueOfferRepository.createQueryBuilder.mockImplementation(
        () => ({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([offer1, offer2]),
        }),
      );

      const result = await service.findNearbyBranches(sourceBranchId, {
        withPromotions: true,
      });

      expect(result.results[0]).toHaveProperty('offers');
      expect(result.results[0].offers).toHaveLength(2);
      expect(result.results[0].offers[0].name).toBe('Summer Deal');
      expect(result.results[0].offers[1].name).toBe('Happy Hour');
    });

    it('should return empty offers array when withPromotions true but no active offers', async () => {
      mockBranchRepository.findOne.mockResolvedValue(sourceBranch);
      mockBranchRepository.query.mockResolvedValue([nearbyBranch]);
      mockCatalogueOfferRepository.createQueryBuilder.mockImplementation(
        () => ({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
      );

      const result = await service.findNearbyBranches(sourceBranchId, {
        withPromotions: true,
      });

      expect(result.results[0].offers).toEqual([]);
    });

    it('should only attach offers to matching branches when withPromotions is true', async () => {
      const offer1 = {
        id: 'offer-1',
        name: 'Nearby Special',
        branchId: 'nearby-1',
        status: CatalogueOfferStatus.ACTIVE,
      };

      mockBranchRepository.findOne.mockResolvedValue(sourceBranch);
      mockBranchRepository.query.mockResolvedValue([
        nearbyBranch,
        fartherBranch,
      ]);
      mockCatalogueOfferRepository.createQueryBuilder.mockImplementation(
        () => ({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([offer1]),
        }),
      );

      const result = await service.findNearbyBranches(sourceBranchId, {
        withPromotions: true,
      });

      expect(result.results[0].offers).toHaveLength(1);
      expect(result.results[1].offers).toEqual([]);
    });

    it('should not fetch offers when results are empty', async () => {
      mockBranchRepository.findOne.mockResolvedValue(sourceBranch);
      mockBranchRepository.query.mockResolvedValue([]);

      await service.findNearbyBranches(sourceBranchId, {
        withPromotions: true,
      });

      expect(
        mockCatalogueOfferRepository.createQueryBuilder,
      ).not.toHaveBeenCalled();
    });

    it('should return source info in response', async () => {
      mockBranchRepository.findOne.mockResolvedValue(sourceBranch);
      mockBranchRepository.query.mockResolvedValue([nearbyBranch]);

      const result = await service.findNearbyBranches(sourceBranchId, {});

      expect(result.source).toEqual({
        id: sourceBranchId,
        name: 'Source Branch',
      });
    });
  });

  describe('getLastTopRecentCustomer', () => {
    it('should return null if no customer visits exist', async () => {
      mockBranchRepository.findOne.mockResolvedValue({ id: 'branch-1' });
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };

      mockBranchRepository.manager.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getLastTopRecentCustomer('branch-1');
      expect(result).toBeNull();
    });

    it('should return the top customer when visits exist', async () => {
      mockBranchRepository.findOne.mockResolvedValue({ id: 'branch-1' });
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          customerId: 'cust-1',
          visitCount: '5',
          lastVisitAt: '2026-06-24T10:00:00Z',
        }),
      };
      mockBranchRepository.manager.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const mockCustomer = { id: 'cust-1', firstName: 'John', lastName: 'Doe' };
      mockBranchRepository.manager.findOne.mockResolvedValue(
        mockCustomer as any,
      );

      const result = await service.getLastTopRecentCustomer('branch-1');
      expect(result).toEqual({
        customer: mockCustomer,
        visitCount: 5,
        lastVisitAt: new Date('2026-06-24T10:00:00Z'),
      });
    });
  });
});
