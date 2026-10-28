import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { User, UserRole } from '../users/entities/user.entity';
import { BusinessesService } from '../businesses/businesses.service';
import { AffiliatesService } from '../affiliates/affiliates.service';
import { ExternalAffiliateService } from '../affiliates/external-affiliate.service';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
  createQueryBuilder: jest.fn(),
};

const mockBusinessRepository = {
  find: jest.fn().mockResolvedValue([]),
};

const mockManager = {
  findOne: jest.fn().mockResolvedValue(null),
  insert: jest.fn().mockResolvedValue(undefined),
};

const mockDataSource = {
  manager: mockManager,
  getRepository: jest.fn().mockReturnValue(mockBusinessRepository),
};

const mockBusinessesService = {
  findByOwner: jest.fn().mockResolvedValue(null),
  update: jest.fn().mockResolvedValue(undefined),
};

const mockAffiliatesService = {
  findByReferralCode: jest.fn().mockResolvedValue(null),
  getOrCreateProfile: jest.fn(),
  recordReferral: jest.fn().mockResolvedValue(undefined),
};

const mockExternalAffiliateService = {
  validateReferralCode: jest
    .fn()
    .mockResolvedValue({ valid: false, affiliateId: null }),
};

/** Chainable query builder standing in for `findUsersByCode`. */
const mockQueryBuilder = (users: any[] = []) => ({
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(users),
});

const customer = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    firstName: 'Ada',
    lastName: 'Obi',
    role: UserRole.CUSTOMER,
    referralCode: null,
    myReferralCode: null,
    createdAt: new Date(),
    ...overrides,
  }) as User;

describe('ReferralsService', () => {
  let service: ReferralsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUserRepository.save.mockReset().mockImplementation((u) => Promise.resolve(u));
    mockDataSource.getRepository.mockReturnValue(mockBusinessRepository);
    mockManager.findOne.mockResolvedValue(null);
    mockManager.insert.mockResolvedValue(undefined);
    mockBusinessRepository.find.mockResolvedValue([]);
    mockBusinessesService.findByOwner.mockResolvedValue(null);
    mockAffiliatesService.findByReferralCode.mockResolvedValue(null);
    mockAffiliatesService.getOrCreateProfile.mockResolvedValue({
      id: 'aff-1',
      referralCode: 'VEM-8OGUU4',
    });
    mockExternalAffiliateService.validateReferralCode.mockResolvedValue({
      valid: false,
      affiliateId: null,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: DataSource, useValue: mockDataSource },
        { provide: BusinessesService, useValue: mockBusinessesService },
        { provide: AffiliatesService, useValue: mockAffiliatesService },
        {
          provide: ExternalAffiliateService,
          useValue: mockExternalAffiliateService,
        },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  // ==================== GET /referrals/me ====================
  describe('getMe', () => {
    it('issues a personal code on first call and reuses it afterwards', async () => {
      const user = customer();
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.createQueryBuilder.mockImplementation(() =>
        mockQueryBuilder(),
      );

      const first = await service.getMe('user-1');
      expect(first.audience).toBe('customer');
      expect(first.code).toHaveLength(8);
      expect(first.code).toMatch(new RegExp(`^[${CODE_ALPHABET}]{8}$`));
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ myReferralCode: first.code }),
      );

      // Second call: same stored code, nothing saved again
      mockUserRepository.save.mockClear();
      mockUserRepository.findOne.mockResolvedValue(
        customer({ myReferralCode: first.code }),
      );
      const second = await service.getMe('user-1');
      expect(second.code).toBe(first.code);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('retries when the generated code collides with an existing one', async () => {
      const user = customer();
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.createQueryBuilder.mockImplementation(() =>
        mockQueryBuilder(),
      );
      mockUserRepository.save
        .mockRejectedValueOnce(new Error('duplicate key value'))
        .mockResolvedValue(user);

      const result = await service.getMe('user-1');

      expect(result.code).toHaveLength(8);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
    });

    it('returns an empty code after exhausting all collision retries', async () => {
      const user = customer();
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.createQueryBuilder.mockImplementation(() =>
        mockQueryBuilder(),
      );
      mockUserRepository.save.mockRejectedValue(
        new Error('duplicate key value'),
      );

      const result = await service.getMe('user-1');

      expect(result.code).toBe('');
      expect(mockUserRepository.save).toHaveBeenCalledTimes(5);
    });

    it('an owner gets the business uniqueCode with both business and customer referrals', async () => {
      mockUserRepository.findOne.mockResolvedValue(
        customer({ role: UserRole.OWNER, id: 'owner-1' }),
      );
      mockBusinessesService.findByOwner.mockResolvedValue({
        id: 'biz-1',
        uniqueCode: 'SHOPLAG9X',
      });
      mockBusinessRepository.find.mockResolvedValue([
        {
          id: 'referred-biz',
          name: 'Ref Biz',
          referralCode: 'SHOPLAG9X',
          createdAt: new Date('2026-01-02'),
        },
      ]);
      mockUserRepository.createQueryBuilder.mockImplementation(() =>
        mockQueryBuilder([
          {
            id: 'referred-cust',
            firstName: 'Ada',
            lastName: 'Obi',
            referralCode: 'shoplag9x',
            createdAt: new Date('2026-01-01'),
          },
        ]),
      );

      const result = await service.getMe('owner-1');

      expect(result.code).toBe('SHOPLAG9X');
      expect(result.audience).toBe('business');
      expect(result.totalReferrals).toBe(2);
      expect(result.referrals).toEqual([
        {
          id: 'referred-biz',
          name: 'Ref Biz',
          type: 'business',
          joinedAt: new Date('2026-01-02'),
        },
        {
          id: 'referred-cust',
          name: 'Ada O.',
          type: 'customer',
          joinedAt: new Date('2026-01-01'),
        },
      ]);
    });

    it('an owner without a business yet gets an empty code', async () => {
      mockUserRepository.findOne.mockResolvedValue(
        customer({ role: UserRole.OWNER, id: 'owner-1' }),
      );
      mockUserRepository.createQueryBuilder.mockImplementation(() =>
        mockQueryBuilder(),
      );

      const result = await service.getMe('owner-1');

      expect(result.code).toBe('');
      expect(result.audience).toBe('business');
      expect(result.totalReferrals).toBe(0);
      expect(result.referrals).toEqual([]);
    });

    it('an agent gets their affiliate code', async () => {
      mockUserRepository.findOne.mockResolvedValue(
        customer({ role: UserRole.AGENT, id: 'agent-1' }),
      );
      mockUserRepository.createQueryBuilder.mockImplementation(() =>
        mockQueryBuilder(),
      );

      const result = await service.getMe('agent-1');

      expect(result.code).toBe('VEM-8OGUU4');
      expect(result.audience).toBe('business');
    });

    it('shows referred names as first name plus last initial only', async () => {
      const user = customer();
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.createQueryBuilder.mockImplementation(() =>
        mockQueryBuilder([
          {
            id: 'r1',
            firstName: 'Chidi',
            lastName: 'Okonkwo',
            referralCode: 'KLTQP2X8',
            createdAt: new Date('2026-01-01'),
          },
          {
            id: 'r2',
            firstName: 'Ngozi',
            lastName: '',
            referralCode: 'KLTQP2X8',
            createdAt: new Date('2026-01-02'),
          },
        ]),
      );
      user.myReferralCode = 'KLTQP2X8';

      const result = await service.getMe('user-1');

      expect(result.totalReferrals).toBe(2);
      expect(result.referrals[0]).toMatchObject({ name: 'Chidi O.' });
      expect(result.referrals[1]).toMatchObject({ name: 'Ngozi' });
    });
  });

  // ==================== resolveAndApplyReferral ====================
  describe('resolveAndApplyReferral', () => {
    it('records the inbound code and prefers the affiliate lookup', async () => {
      mockUserRepository.findOne.mockResolvedValue(customer());
      mockAffiliatesService.findByReferralCode.mockResolvedValue({
        id: 'aff-1',
      });

      await service.resolveAndApplyReferral('vem-8oguu4', 'user-1');

      expect(mockAffiliatesService.findByReferralCode).toHaveBeenCalledWith(
        'VEM-8OGUU4',
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ referralCode: 'VEM-8OGUU4' }),
      );
      expect(mockAffiliatesService.recordReferral).toHaveBeenCalledWith(
        'aff-1',
        undefined,
        'user-1',
      );
      expect(mockManager.findOne).not.toHaveBeenCalled();
      expect(mockExternalAffiliateService.validateReferralCode).not.toHaveBeenCalled();
    });

    it('resolves a business uniqueCode next and links the referred business', async () => {
      mockUserRepository.findOne.mockResolvedValue(
        customer({ branchId: 'br-mine' }),
      );
      mockBusinessesService.findByOwner.mockResolvedValue({
        id: 'biz-1',
        branchId: 'br-mine',
      });
      mockManager.findOne
        .mockResolvedValueOnce({
          id: 'biz-ref',
          branches: [{ id: 'br-ref' }],
        })
        .mockResolvedValueOnce(null); // no existing partnership

      await service.resolveAndApplyReferral('SHOPLAG9X', 'user-1');

      expect(mockAffiliatesService.recordReferral).not.toHaveBeenCalled();
      expect(mockBusinessesService.update).toHaveBeenCalledWith('biz-1', {
        referralCode: 'SHOPLAG9X',
      });
      expect(mockManager.insert).toHaveBeenCalledWith(
        'partnerships',
        expect.objectContaining({
          initiatorBranchId: 'br-ref',
          recipientBranchId: 'br-mine',
        }),
      );
    });

    it('resolves a personal code last without touching businesses or external affiliates', async () => {
      mockUserRepository.findOne.mockResolvedValue(customer());
      mockBusinessesService.findByOwner.mockResolvedValue({ id: 'biz-1' });
      mockManager.findOne.mockImplementation(({ where }: any) =>
        Promise.resolve(where.myReferralCode ? customer() : null),
      );

      await service.resolveAndApplyReferral('KLTQP2X8', 'user-1');

      expect(mockBusinessesService.update).not.toHaveBeenCalled();
      expect(mockExternalAffiliateService.validateReferralCode).not.toHaveBeenCalled();
    });

    it('ignores unknown codes silently', async () => {
      mockUserRepository.findOne.mockResolvedValue(customer());

      await expect(
        service.resolveAndApplyReferral('NOPE1234', 'user-1'),
      ).resolves.toBeUndefined();

      expect(mockBusinessesService.update).not.toHaveBeenCalled();
      expect(mockAffiliatesService.recordReferral).not.toHaveBeenCalled();
    });
  });

  // ==================== POST /referrals/claim ====================
  describe('claim', () => {
    it('applies a valid code for a fresh account', async () => {
      const user = customer();
      mockUserRepository.findOne.mockResolvedValue(user);
      mockAffiliatesService.findByReferralCode.mockResolvedValue({
        id: 'aff-1',
      });

      const result = await service.claim('VEM-8OGUU4', 'user-1');

      expect(result).toEqual({ message: 'Referral code applied' });
      expect(user.referralCode).toBe('VEM-8OGUU4');
      expect(mockAffiliatesService.recordReferral).toHaveBeenCalledWith(
        'aff-1',
        undefined,
        'user-1',
      );
    });

    it('rejects an account older than the 24 hour claim window', async () => {
      mockUserRepository.findOne.mockResolvedValue(
        customer({ createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) }),
      );

      await expect(
        service.claim('VEM-8OGUU4', 'user-1'),
      ).rejects.toThrow(
        new BadRequestException(
          'Referral codes can only be claimed in the first 24 hours after signing up',
        ),
      );
    });

    it('rejects an account that already applied a code', async () => {
      mockUserRepository.findOne.mockResolvedValue(
        customer({ referralCode: 'KLTQP2X8' }),
      );

      await expect(
        service.claim('VEM-8OGUU4', 'user-1'),
      ).rejects.toThrow(
        new BadRequestException(
          'A referral code has already been applied to this account',
        ),
      );
    });

    it('rejects the caller’s own personal code', async () => {
      mockUserRepository.findOne.mockResolvedValue(
        customer({ myReferralCode: 'KLTQP2X8' }),
      );

      await expect(
        service.claim('KLTQP2X8', 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('rejects the caller’s own business uniqueCode', async () => {
      mockUserRepository.findOne.mockResolvedValue(
        customer({ role: UserRole.OWNER, id: 'owner-1' }),
      );
      mockBusinessesService.findByOwner.mockResolvedValue({
        id: 'biz-1',
        uniqueCode: 'SHOPLAG9X',
      });

      await expect(
        service.claim('shoplag9x', 'owner-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('rejects a code that does not resolve', async () => {
      mockUserRepository.findOne.mockImplementation(({ where }: any) =>
        Promise.resolve(where.id ? customer() : null),
      );

      await expect(
        service.claim('NOPE1234', 'user-1'),
      ).rejects.toThrow(
        new BadRequestException('That referral code is not valid'),
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});
