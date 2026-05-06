import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryBuilder, SelectQueryBuilder } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DevicesService } from '../devices/devices.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('BranchesService', () => {
  let service: BranchesService;

  const mockBranchRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    })),
  };

  const mockBusinessRepository = {
    findOne: jest.fn(),
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
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: DevicesService,
          useValue: mockDevicesService,
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
      const branch = { id: 'branch-1', username: 'main-office', isActive: true };
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
      mockBranchRepository.save.mockImplementation((branch) => Promise.resolve(branch));

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
      mockBranchRepository.save.mockImplementation((branch) => Promise.resolve(branch));

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
      
      await expect(service.create(ownerId, dto)).rejects.toThrow(BadRequestException);
    });
  });
});
