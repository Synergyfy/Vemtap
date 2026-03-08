import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotFoundException } from '@nestjs/common';

describe('BranchesService', () => {
  let service: BranchesService;

  const mockBranchRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockBusinessRepository = {
    findOne: jest.fn(),
  };

  const mockSubscriptionsService = {
    getCapabilities: jest.fn().mockResolvedValue({
      capabilities: {
        branches: { limit: 10, used: 1 },
      },
    }),
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
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should fallback to business contact if branch contact is missing', async () => {
      const ownerId = 'owner-1';
      const business = {
        id: 'bus-1',
        officialEmail: 'bus@example.com',
        phone: '+1234567890',
      };
      const dto = { name: 'New Branch' };

      mockBusinessRepository.findOne.mockResolvedValue(business);
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
      expect(mockBranchRepository.create).toHaveBeenCalledWith({
        ...dto,
        businessId: business.id,
        phone: business.phone,
        officialEmail: business.officialEmail,
      });
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
});
