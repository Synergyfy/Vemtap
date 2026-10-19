import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SegmentsService } from './segments.service';
import { Segment } from '../entities/segment.entity';
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SegmentCriteriaService } from './segment-criteria.service';
import { SegmentType } from '../entities/segment.entity';

describe('SegmentsService', () => {
  let service: SegmentsService;
  let segmentRepo: any;
  let userRepo: any;
  let branchRepo: any;
  let criteriaService: any;

  beforeEach(async () => {
    criteriaService = {
      memberIds: jest.fn().mockResolvedValue(['u1', 'u2', 'u3']),
      preview: jest.fn(),
      insights: jest.fn().mockResolvedValue({ size: 3, totalSpend: 1000 }),
      criteriaOptions: jest.fn(),
    };
    segmentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    userRepo = {
      find: jest.fn(),
    };
    branchRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SegmentsService,
        { provide: getRepositoryToken(Segment), useValue: segmentRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Branch), useValue: branchRepo },
        { provide: SegmentCriteriaService, useValue: criteriaService },
      ],
    }).compile();

    service = module.get<SegmentsService>(SegmentsService);
  });

  describe('createSegment', () => {
    it('should create a segment when branch context is provided', async () => {
      const mockUser = { branchId: 'branch-1' } as User;
      const mockBranch = { id: 'branch-1', businessId: 'biz-1' } as Branch;
      const dto = { name: 'VIP', description: 'Top tier' };
      const mockSegment = {
        id: 'seg-1',
        ...dto,
        branchId: 'branch-1',
        businessId: 'biz-1',
      };

      branchRepo.findOne.mockResolvedValue(mockBranch);
      segmentRepo.create.mockReturnValue(mockSegment);
      segmentRepo.save.mockResolvedValue(mockSegment);

      const result = await service.createSegment(dto, mockUser);

      expect(result).toEqual(mockSegment);
      expect(segmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'VIP' }),
      );
    });

    it('should throw ForbiddenException if no branchId context is available', async () => {
      const mockUser = { branchId: null } as any;
      const dto = { name: 'VIP' };

      await expect(service.createSegment(dto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addMembers', () => {
    it('should add users to a segment', async () => {
      const branchId = 'branch-1';
      const segmentId = 'seg-1';
      const userIds = ['user-1', 'user-2'];
      const mockSegment = { id: segmentId, branchId, users: [] } as any;
      const mockUsers = [{ id: 'user-1' }, { id: 'user-2' }] as User[];

      segmentRepo.findOne.mockResolvedValue(mockSegment);
      userRepo.find.mockResolvedValue(mockUsers);
      segmentRepo.save.mockImplementation((s) => s);

      const result = await service.addMembers(segmentId, userIds, branchId);

      expect(result.users).toHaveLength(2);
      expect(segmentRepo.save).toHaveBeenCalled();
    });

    it('should avoid adding duplicate users', async () => {
      const branchId = 'branch-1';
      const segmentId = 'seg-1';
      const userIds = ['user-1'];
      const mockSegment = {
        id: segmentId,
        branchId,
        users: [{ id: 'user-1' }],
      } as any;
      const mockUsers = [{ id: 'user-1' }] as User[];

      segmentRepo.findOne.mockResolvedValue(mockSegment);
      userRepo.find.mockResolvedValue(mockUsers);
      segmentRepo.save.mockImplementation((s) => s);

      const result = await service.addMembers(segmentId, userIds, branchId);

      expect(result.users).toHaveLength(1);
    });
  });

  describe('removeMembers', () => {
    it('should remove users from a segment', async () => {
      const branchId = 'branch-1';
      const segmentId = 'seg-1';
      const userIds = ['user-1'];
      const mockSegment = {
        id: segmentId,
        branchId,
        users: [{ id: 'user-1' }, { id: 'user-2' }],
      } as any;

      segmentRepo.findOne.mockResolvedValue(mockSegment);
      segmentRepo.save.mockImplementation((s) => s);

      const result = await service.removeMembers(segmentId, userIds, branchId);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe('user-2');
    });
  });

  describe('business scoping', () => {
    it('refuses to list segments without any scope', async () => {
      await expect(service.getSegments(undefined, undefined)).rejects.toThrow(
        ForbiddenException,
      );
      expect(segmentRepo.find).not.toHaveBeenCalled();
    });

    it("lists an owner's segments by business when they have no branch", async () => {
      segmentRepo.find.mockResolvedValue([]);
      await service.getSegments(undefined, 'biz-1');
      expect(segmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { businessId: 'biz-1' } }),
      );
    });

    it('bounds a branch filter by the business so another business cannot be read', async () => {
      segmentRepo.findOne.mockResolvedValue(null);
      await expect(
        service.getSegmentWithMembers('seg-1', 'other-branch', 'biz-1'),
      ).rejects.toThrow(NotFoundException);
      expect(segmentRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'seg-1', branchId: 'other-branch', businessId: 'biz-1' },
        }),
      );
    });
  });

  describe('dynamic segments', () => {
    const owner = { id: 'owner-1', businessId: 'biz-1', branchId: null } as any;

    beforeEach(() => {
      branchRepo.findOne.mockResolvedValue({
        id: 'branch-1',
        businessId: 'biz-1',
      });
      segmentRepo.create.mockImplementation((dto: any) => ({ ...dto }));
      segmentRepo.save.mockImplementation((segment: any) =>
        Promise.resolve(segment),
      );
      segmentRepo.update = jest.fn();
    });

    it('requires criteria', async () => {
      await expect(
        service.createSegment(
          { name: 'Regulars', branchId: 'branch-1', type: SegmentType.DYNAMIC },
          owner,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('computes its size from the criteria on create', async () => {
      const criteria = { recency: { minVisits: 3 } };
      const segment = await service.createSegment(
        {
          name: 'Regulars',
          branchId: 'branch-1',
          type: SegmentType.DYNAMIC,
          criteria,
        },
        owner,
      );
      expect(criteriaService.memberIds).toHaveBeenCalledWith('biz-1', criteria);
      expect(segment).toMatchObject({ size: 3, criteria, businessId: 'biz-1' });
      expect(segment.lastComputedAt).toBeInstanceOf(Date);
    });

    it('refuses a branch of another business', async () => {
      branchRepo.findOne.mockResolvedValue({
        id: 'branch-9',
        businessId: 'biz-9',
      });
      await expect(
        service.createSegment({ name: 'X', branchId: 'branch-9' }, owner),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refreshes stale sizes when listing', async () => {
      const stale = {
        id: 'seg-1',
        businessId: 'biz-1',
        type: SegmentType.DYNAMIC,
        criteria: {},
        size: 1,
        lastComputedAt: new Date(Date.now() - 60 * 60 * 1000),
      };
      const fresh = { ...stale, id: 'seg-2', lastComputedAt: new Date() };
      segmentRepo.find.mockResolvedValue([stale, fresh]);

      const result = await service.getSegments(undefined, 'biz-1');

      expect(criteriaService.memberIds).toHaveBeenCalledTimes(1);
      expect(result[0].size).toBe(3);
      expect(segmentRepo.update).toHaveBeenCalledWith(
        'seg-1',
        expect.objectContaining({ size: 3 }),
      );
    });

    it('does not allow hand-editing members of a dynamic segment', async () => {
      segmentRepo.findOne.mockResolvedValue({
        id: 'seg-1',
        type: SegmentType.DYNAMIC,
        users: [],
      });
      await expect(
        service.addMembers('seg-1', ['u9'], undefined, 'biz-1'),
      ).rejects.toThrow(/dynamic segment/);
    });

    it('builds insights from criteria members or static members', async () => {
      segmentRepo.update = jest.fn();
      segmentRepo.findOne.mockResolvedValueOnce({
        id: 'seg-1',
        name: 'Regulars',
        businessId: 'biz-1',
        type: SegmentType.DYNAMIC,
        criteria: {},
        size: 3,
        users: [],
      });
      await service.insights('seg-1', undefined, 'biz-1');
      expect(criteriaService.insights).toHaveBeenCalledWith('biz-1', [
        'u1',
        'u2',
        'u3',
      ]);

      segmentRepo.findOne.mockResolvedValueOnce({
        id: 'seg-2',
        name: 'VIP',
        businessId: 'biz-1',
        type: SegmentType.STATIC,
        size: 1,
        users: [{ id: 'u7' }],
      });
      const result = await service.insights('seg-2', undefined, 'biz-1');
      expect(criteriaService.insights).toHaveBeenLastCalledWith('biz-1', [
        'u7',
      ]);
      expect(result).toMatchObject({
        segmentId: 'seg-2',
        name: 'VIP',
        type: 'static',
      });
    });
  });
});
