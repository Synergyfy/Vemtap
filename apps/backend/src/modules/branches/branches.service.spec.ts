import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DevicesService } from '../devices/devices.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('BranchesService', () => {
  let service: BranchesService;

  const mockBranchRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
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
});
