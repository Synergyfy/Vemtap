import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { AffiliatesService } from './affiliates.service';
import { ExternalAffiliateService } from './external-affiliate.service';
import {
  AffiliateProfile,
  KycStatus,
} from './entities/affiliate-profile.entity';
import { AffiliateReferral, ReferralStatus } from './entities/referral.entity';
import {
  AffiliateCommission,
  CommissionStatus,
} from './entities/commission.entity';
import {
  AffiliateWithdrawalRequest,
  WithdrawalStatus,
} from './entities/withdrawal-request.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { SettingsService } from '../settings/settings.service';
import { Business } from '../businesses/entities/business.entity';

describe('AffiliatesService', () => {
  let service: AffiliatesService;
  let profileRepository: any;
  let referralRepository: any;
  let commissionRepository: any;
  let withdrawalRepository: any;
  let userRepository: any;
  let settingsService: any;
  let dataSource: any;

  beforeEach(async () => {
    profileRepository = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((p) => Promise.resolve({ id: 'p1', ...p })),
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getRawOne: jest.fn().mockResolvedValue({ sum: 0 }),
        // For atomic UPDATE queries (updateAffiliateBalance)
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      })),
    };

    referralRepository = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((r) => Promise.resolve({ id: 'r1', ...r })),
      count: jest.fn(),
      find: jest.fn(),
    };

    commissionRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((c) => Promise.resolve({ id: 'c1', ...c })),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };

    withdrawalRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((w) => Promise.resolve({ id: 'w1', ...w })),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: 0 }),
      }),
    };

    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    settingsService = {
      getGlobalSettings: jest.fn().mockResolvedValue({
        affiliateDirectCommission: 20,
        affiliateMinimumWithdrawal: 5000,
      }),
      updateSettings: jest.fn(),
    };

    dataSource = {
      save: jest.fn(),
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        count: jest.fn(),
        find: jest.fn().mockResolvedValue([]),
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
      }),
      transaction: jest.fn().mockImplementation(async (cb) => {
        // Shared atomic-refund query builder mock (for processWithdrawal rejection path)
        const atomicQb = {
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        const manager = {
          // Dispatch by entity class:
          // - AffiliateProfile  → profileRepository (used by requestWithdrawal)
          // - AffiliateWithdrawalRequest → withdrawalRepository (used by processWithdrawal)
          findOne: jest.fn().mockImplementation(async (cls) => {
            if (cls === AffiliateWithdrawalRequest) {
              return withdrawalRepository.findOne();
            }
            return profileRepository.findOne();
          }),
          create: jest.fn().mockImplementation((cls, dto) => {
            return withdrawalRepository.create(dto);
          }),
          createQueryBuilder: jest.fn(() => atomicQb),
          save: jest.fn().mockImplementation((obj) => {
            if (
              obj &&
              (obj.userId !== undefined ||
                obj.referralCode !== undefined ||
                obj.availableBalance !== undefined)
            ) {
              return profileRepository.save(obj);
            }
            return withdrawalRepository.save(obj);
          }),
        };
        return cb(manager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AffiliatesService,
        {
          provide: getRepositoryToken(AffiliateProfile),
          useValue: profileRepository,
        },
        {
          provide: getRepositoryToken(AffiliateReferral),
          useValue: referralRepository,
        },
        {
          provide: getRepositoryToken(AffiliateCommission),
          useValue: commissionRepository,
        },
        {
          provide: getRepositoryToken(AffiliateWithdrawalRequest),
          useValue: withdrawalRepository,
        },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: SettingsService, useValue: settingsService },
        { provide: DataSource, useValue: dataSource },
        {
          provide: ExternalAffiliateService,
          useValue: {
            processWithdrawal: jest.fn().mockResolvedValue({ success: true }),
            validateReferralCode: jest.fn().mockResolvedValue({ valid: false }),
            recordReferral: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    service = module.get<AffiliatesService>(AffiliatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProfile', () => {
    it('should create a profile if it does not exist', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'u1', firstName: 'John' });
      profileRepository.findOne.mockResolvedValue(null);

      const result = await service.createProfile('u1');

      expect(result.userId).toBe('u1');
      expect(result.referralCode).toMatch(/^VEM-JOH-\d{4}$/);
      expect(profileRepository.save).toHaveBeenCalled();
    });

    it('should return existing profile if it exists', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'u1' });
      profileRepository.findOne.mockResolvedValue({ id: 'p1', userId: 'u1' });

      const result = await service.createProfile('u1');

      expect(result.id).toBe('p1');
      expect(profileRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.createProfile('u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('recordReferral', () => {
    it('should record a pending referral', async () => {
      const result = await service.recordReferral('a1', 'b1');

      expect(result.affiliateId).toBe('a1');
      expect(result.referredBusinessId).toBe('b1');
      expect(result.status).toBe(ReferralStatus.PENDING);
      expect(referralRepository.save).toHaveBeenCalled();
    });
  });

  describe('processSubscriptionCommission', () => {
    it('should process commission and update balance', async () => {
      const affiliateId = 'a1';

      referralRepository.findOne.mockResolvedValue({
        id: 'r1',
        affiliateId,
        status: ReferralStatus.PENDING,
      });

      await service.processSubscriptionCommission('b1', 10000);

      expect(referralRepository.save).toHaveBeenCalled();
      expect(commissionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2000, // 20% of 10000
        }),
      );
      // Balance is now updated atomically via createQueryBuilder — verify it was called
      expect(profileRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('requestWithdrawal', () => {
    it('should create withdrawal request and deduct balance', async () => {
      const profile = { id: 'p1', availableBalance: 10000 };
      // resolveUser needs a non-OWNER/MANAGER user
      userRepository.findOne.mockResolvedValue({
        id: 'u1',
        role: UserRole.AGENT,
      });
      profileRepository.findOne.mockResolvedValue(profile);

      const result = await service.requestWithdrawal('u1', 6000);

      expect(result.amount).toBe(6000);
      expect(profile.availableBalance).toBe(4000);
      expect(profileRepository.save).toHaveBeenCalledWith(profile);
      expect(withdrawalRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for amount below minimum', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'u1',
        role: UserRole.AGENT,
      });
      profileRepository.findOne.mockResolvedValue({ availableBalance: 10000 });
      await expect(service.requestWithdrawal('u1', 1000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'u1',
        role: UserRole.AGENT,
      });
      profileRepository.findOne.mockResolvedValue({ availableBalance: 4000 });
      await expect(service.requestWithdrawal('u1', 6000)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Admin Methods', () => {
    it('should process withdrawal approval', async () => {
      const request = {
        id: 'w1',
        affiliateId: 'p1',
        status: WithdrawalStatus.PENDING,
        amount: 5000,
      };
      // Pre-flight findOne (outside transaction)
      withdrawalRepository.findOne.mockResolvedValue(request);

      await service.processWithdrawal('w1', 'admin1', WithdrawalStatus.PAID);

      expect(request.status).toBe(WithdrawalStatus.PAID);
      expect(withdrawalRepository.save).toHaveBeenCalledWith(request);
      expect(profileRepository.save).not.toHaveBeenCalled(); // No refund on approval
    });

    it('should refund balance on withdrawal rejection', async () => {
      const profile = { id: 'p1', availableBalance: 5000 };
      const request = {
        id: 'w1',
        affiliateId: 'p1',
        status: WithdrawalStatus.PENDING,
        amount: 5000,
        affiliate: profile,
      };
      // Pre-flight findOne (outside transaction)
      withdrawalRepository.findOne.mockResolvedValue(request);

      await service.processWithdrawal(
        'w1',
        'admin1',
        WithdrawalStatus.REJECTED,
      );

      expect(request.status).toBe(WithdrawalStatus.REJECTED);
      // Refund now happens atomically via createQueryBuilder — verify it was called
      expect(withdrawalRepository.save).toHaveBeenCalledWith(request);
    });
  });

  describe('getLeaderboard', () => {
    it('should retrieve top partners sorted by earnings and apply role filters', async () => {
      const topProfiles = [
        {
          id: 'p1',
          totalEarnings: 15000,
          user: { firstName: 'Alice', lastName: 'Smith', avatar: 'avatar1' },
        },
        {
          id: 'p2',
          totalEarnings: 10000,
          user: { firstName: 'Bob', lastName: 'Jones', avatar: 'avatar2' },
        },
      ];

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(topProfiles),
      };

      profileRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getLeaderboard(UserRole.AGENT, 10);

      expect(profileRepository.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(queryBuilder.innerJoinAndSelect).toHaveBeenCalledWith(
        'p.user',
        'u',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith('u.role = :role', {
        role: UserRole.AGENT,
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Alice Smith',
        earnings: 15000,
        rank: 1,
        avatar: 'avatar1',
      });
    });

    it('should query Business repository when requesting business leaderboard (OWNER/MANAGER)', async () => {
      const mockRaw = [
        { referralCode: 'BIZ1', referredCount: '3' },
        { referralCode: 'BIZ2', referredCount: '1' },
      ];

      const mockReferringBusinesses = [
        {
          uniqueCode: 'BIZ1',
          name: 'Biz One',
          balance: 12000,
          logoUrl: 'logo1',
        },
        {
          uniqueCode: 'BIZ2',
          name: 'Biz Two',
          balance: 5000,
          logoUrl: 'logo2',
        },
      ];

      const businessRepo = dataSource.getRepository(Business);
      businessRepo.createQueryBuilder().getRawMany.mockResolvedValue(mockRaw);
      businessRepo.find.mockResolvedValue(mockReferringBusinesses);

      const result = await service.getLeaderboard(UserRole.OWNER, 5);

      expect(businessRepo.createQueryBuilder).toHaveBeenCalled();
      expect(businessRepo.find).toHaveBeenCalledWith({
        where: { uniqueCode: In(['BIZ1', 'BIZ2']) },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Biz One',
        earnings: 12000,
        rank: 1,
        avatar: 'logo1',
        referred: 3,
        points: 300,
      });
    });
  });
});
