import { Test, TestingModule } from '@nestjs/testing';
import { BusinessesService } from './businesses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Business, BusinessStatus } from './entities/business.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { Reward } from '../loyalty/entities/reward.entity';
import { MailService } from '../mail/mail.service';
import { DevicesService } from '../devices/devices.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RotatorInvalidationService } from '../rotator/rotator-invalidation.service';

describe('BusinessesService', () => {
  let service: BusinessesService;
  let repository: any;
  let usersRepository: any;
  let rotatorInvalidation: any;

  const mockBusiness = {
    id: 'biz-1',
    name: 'Original Name',
    logoUrl: 'old-logo.png',
    ownerId: 'owner-1',
    owner: { id: 'owner-1' },
    status: BusinessStatus.ACTIVE,
    branches: [],
    save: jest.fn(),
  };

  const mockRepository = {
    findOneBy: jest.fn().mockResolvedValue(mockBusiness),
    create: jest
      .fn()
      .mockImplementation((dto) => ({ ...dto, id: 'biz-1', save: jest.fn() })),
    save: jest
      .fn()
      .mockImplementation((biz) => Promise.resolve({ id: 'biz-1', ...biz })),
    findOne: jest.fn().mockResolvedValue(mockBusiness),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ avgSeconds: 0 }),
      getCount: jest.fn().mockResolvedValue(0),
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
    })),
    count: jest.fn().mockResolvedValue(0),
    remove: jest.fn(),
  };

  const mockUsersRepository = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'user-1' })),
    save: jest
      .fn()
      .mockImplementation((user) => Promise.resolve({ id: 'user-1', ...user })),
    update: jest.fn(),
  };

  const mockBranchRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((branch) =>
        Promise.resolve({ id: 'branch-1', ...branch }),
      ),
    find: jest.fn().mockResolvedValue([]),
  };

  const mockVisitRepository = {
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
    })),
  };

  const mockRewardRepository = {
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn(),
  };

  const mockMailService = {
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  };

  const mockDevicesService = {
    createAutoDevice: jest.fn().mockResolvedValue({}),
  };

  const mockSubscriptionsService = {
    subscribeToFreePlan: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        {
          provide: getRepositoryToken(Business),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepository,
        },
        {
          provide: getRepositoryToken(Visit),
          useValue: mockVisitRepository,
        },
        {
          provide: getRepositoryToken(Reward),
          useValue: mockRewardRepository,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: DevicesService,
          useValue: mockDevicesService,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Plan),
          useValue: mockRepository,
        },
        {
          provide: getQueueToken('geocoding'),
          useValue: { add: jest.fn() },
        },
        {
          provide: RotatorInvalidationService,
          useValue: {
            invalidateClusters: jest.fn().mockResolvedValue(undefined),
            invalidateForBranch: jest.fn().mockResolvedValue(undefined),
            invalidateForOffer: jest.fn().mockResolvedValue(undefined),
            invalidateForBusiness: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<BusinessesService>(BusinessesService);
    repository = module.get(getRepositoryToken(Business));
    usersRepository = module.get(getRepositoryToken(User));
    rotatorInvalidation = module.get(RotatorInvalidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should update business name and logo', async () => {
      const updateDto = {
        name: 'Updated Name',
        logoUrl: 'new-logo.png',
      };

      const result = await service.update('biz-1', updateDto);

      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'biz-1' } }),
      );
      expect(result.name).toBe(updateDto.name);
      expect(result.logoUrl).toBe(updateDto.logoUrl);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if business not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.update('invalid-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adminCreate', () => {
    it('should create a new user and business successfully', async () => {
      const dto = {
        name: 'New Admin Business',
        ownerFirstName: 'Admin',
        ownerLastName: 'User',
        ownerEmail: 'admin@newbiz.com',
        ownerPassword: 'Password123!',
        ownerPhone: '1234567890',
        businessNumber: '0987654321',
        engagement: { linkedin: 'url' },
      };

      usersRepository.findOne.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null); // findByOwner

      const result = await service.adminCreate(dto);

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.ownerEmail,
          role: UserRole.OWNER,
        }),
      );
      expect(usersRepository.save).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(mockSubscriptionsService.subscribeToFreePlan).toHaveBeenCalled();
      expect(result.name).toBe(dto.name);
    });

    it('should throw ConflictException if user email already exists', async () => {
      const dto = {
        ownerEmail: 'existing@user.com',
        ownerPassword: 'Password123!',
      };

      usersRepository.findOne.mockResolvedValue({
        id: 'existing',
        status: UserStatus.ACTIVE,
      });

      await expect(service.adminCreate(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('suspend/reactivate', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockRepository.findOne.mockResolvedValue(mockBusiness);
      mockRepository.save.mockImplementation((biz) =>
        Promise.resolve({ id: 'biz-1', ...biz }),
      );
    });

    it('suspends the business and invalidates its clusters rotator caches', async () => {
      const result = await service.suspend('biz-1', 'fraud');

      expect(result.status).toBe(BusinessStatus.SUSPENDED);
      expect(rotatorInvalidation.invalidateForBusiness).toHaveBeenCalledWith(
        'biz-1',
      );
    });

    it('reactivates the business and invalidates its clusters rotator caches', async () => {
      mockBusiness.status = BusinessStatus.SUSPENDED;

      const result = await service.reactivate('biz-1');

      expect(result.status).toBe(BusinessStatus.ACTIVE);
      expect(rotatorInvalidation.invalidateForBusiness).toHaveBeenCalledWith(
        'biz-1',
      );
    });
  });
});
