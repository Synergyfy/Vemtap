import { Test, TestingModule } from '@nestjs/testing';
import { PartnershipsService } from './partnerships.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Partnership, PartnershipStatus } from './entities/partnership.entity';
import { BranchesService } from '../branches/branches.service';
import { User, UserRole } from '../users/entities/user.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BusinessStatus } from '../businesses/entities/business.entity';

describe('PartnershipsService', () => {
  let service: PartnershipsService;

  const mockPartnershipRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
    manager: {
      createQueryBuilder: jest.fn(() => ({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawAndEntities: jest
          .fn()
          .mockResolvedValue({ entities: [], raw: [] }),
        getCount: jest.fn().mockResolvedValue(0),
      })),
    },
  };

  const mockBranchesService = {
    findById: jest.fn(),
    checkBranchAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnershipsService,
        {
          provide: getRepositoryToken(Partnership),
          useValue: mockPartnershipRepository,
        },
        {
          provide: BranchesService,
          useValue: mockBranchesService,
        },
      ],
    }).compile();

    service = module.get<PartnershipsService>(PartnershipsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('invitePartnership', () => {
    const user = { id: 'user-1', role: UserRole.OWNER } as User;

    it('should throw BadRequestException if inviting itself', async () => {
      await expect(
        service.invitePartnership(
          { initiatorBranchId: 'branch-1', recipientBranchId: 'branch-1' },
          user,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if initiator business is not active', async () => {
      mockBranchesService.findById
        .mockResolvedValueOnce({
          id: 'branch-1',
          businessId: 'bus-1',
          business: { status: BusinessStatus.PENDING },
        })
        .mockResolvedValueOnce({
          id: 'branch-2',
          businessId: 'bus-2',
          business: { status: BusinessStatus.ACTIVE },
        });

      await expect(
        service.invitePartnership(
          { initiatorBranchId: 'branch-1', recipientBranchId: 'branch-2' },
          user,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if branches are of the same business', async () => {
      mockBranchesService.findById
        .mockResolvedValueOnce({
          id: 'branch-1',
          businessId: 'bus-1',
          business: { status: BusinessStatus.ACTIVE },
        })
        .mockResolvedValueOnce({
          id: 'branch-2',
          businessId: 'bus-1',
          business: { status: BusinessStatus.ACTIVE },
        });

      await expect(
        service.invitePartnership(
          { initiatorBranchId: 'branch-1', recipientBranchId: 'branch-2' },
          user,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user has no access to initiator branch', async () => {
      mockBranchesService.findById
        .mockResolvedValueOnce({
          id: 'branch-1',
          businessId: 'bus-1',
          business: { status: BusinessStatus.ACTIVE },
        })
        .mockResolvedValueOnce({
          id: 'branch-2',
          businessId: 'bus-2',
          business: { status: BusinessStatus.ACTIVE },
        });
      mockBranchesService.checkBranchAccess.mockResolvedValue(false);

      await expect(
        service.invitePartnership(
          { initiatorBranchId: 'branch-1', recipientBranchId: 'branch-2' },
          user,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create a new partnership invitation if valid', async () => {
      mockBranchesService.findById
        .mockResolvedValueOnce({
          id: 'branch-1',
          businessId: 'bus-1',
          business: { status: BusinessStatus.ACTIVE },
        })
        .mockResolvedValueOnce({
          id: 'branch-2',
          businessId: 'bus-2',
          business: { status: BusinessStatus.ACTIVE },
        });
      mockBranchesService.checkBranchAccess.mockResolvedValue(true);
      mockPartnershipRepository.findOne.mockResolvedValue(null);
      mockPartnershipRepository.create.mockReturnValue({
        initiatorBranchId: 'branch-1',
        recipientBranchId: 'branch-2',
        status: PartnershipStatus.PENDING,
      });
      mockPartnershipRepository.save.mockResolvedValue({ id: 'part-1' });

      const result = await service.invitePartnership(
        { initiatorBranchId: 'branch-1', recipientBranchId: 'branch-2' },
        user,
      );

      expect(result).toEqual({ id: 'part-1' });
    });
  });

  describe('getInvitations', () => {
    const user = { id: 'user-1', role: UserRole.OWNER } as User;

    it('should throw ForbiddenException if the business is not active', async () => {
      mockBranchesService.findById.mockResolvedValue({
        id: 'branch-1',
        businessId: 'bus-1',
        business: { status: BusinessStatus.PENDING },
      });

      await expect(
        service.getInvitations({ branchId: 'branch-1' }, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if the branch has no business', async () => {
      mockBranchesService.findById.mockResolvedValue({
        id: 'branch-1',
        businessId: null,
        business: null,
      });

      await expect(
        service.getInvitations({ branchId: 'branch-1' }, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should not call branch access check when business is not active', async () => {
      mockBranchesService.findById.mockResolvedValue({
        id: 'branch-1',
        businessId: 'bus-1',
        business: { status: BusinessStatus.SUSPENDED },
      });

      await expect(
        service.getInvitations({ branchId: 'branch-1' }, user),
      ).rejects.toThrow(ForbiddenException);

      expect(mockBranchesService.checkBranchAccess).not.toHaveBeenCalled();
    });
  });
});
