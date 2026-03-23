import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SegmentsService } from './segments.service';
import { Segment } from '../entities/segment.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('SegmentsService', () => {
  let service: SegmentsService;
  let segmentRepo: any;
  let userRepo: any;
  let branchRepo: any;

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<SegmentsService>(SegmentsService);
  });

  describe('createSegment', () => {
    it('should create a segment when branch context is provided', async () => {
      const mockUser = { branchId: 'branch-1' } as User;
      const mockBranch = { id: 'branch-1', businessId: 'biz-1' } as Branch;
      const dto = { name: 'VIP', description: 'Top tier' };
      const mockSegment = { id: 'seg-1', ...dto, branchId: 'branch-1', businessId: 'biz-1' };

      branchRepo.findOne.mockResolvedValue(mockBranch);
      segmentRepo.create.mockReturnValue(mockSegment);
      segmentRepo.save.mockResolvedValue(mockSegment);

      const result = await service.createSegment(dto, mockUser);

      expect(result).toEqual(mockSegment);
      expect(segmentRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'VIP' }));
    });

    it('should throw ForbiddenException if no branchId context is available', async () => {
      const mockUser = { branchId: null } as any;
      const dto = { name: 'VIP' };

      await expect(service.createSegment(dto, mockUser)).rejects.toThrow(ForbiddenException);
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
      segmentRepo.save.mockImplementation(s => s);

      const result = await service.addMembers(segmentId, userIds, branchId);

      expect(result.users).toHaveLength(2);
      expect(segmentRepo.save).toHaveBeenCalled();
    });

    it('should avoid adding duplicate users', async () => {
      const branchId = 'branch-1';
      const segmentId = 'seg-1';
      const userIds = ['user-1'];
      const mockSegment = { id: segmentId, branchId, users: [{ id: 'user-1' }] } as any;
      const mockUsers = [{ id: 'user-1' }] as User[];

      segmentRepo.findOne.mockResolvedValue(mockSegment);
      userRepo.find.mockResolvedValue(mockUsers);
      segmentRepo.save.mockImplementation(s => s);

      const result = await service.addMembers(segmentId, userIds, branchId);

      expect(result.users).toHaveLength(1);
    });
  });

  describe('removeMembers', () => {
    it('should remove users from a segment', async () => {
      const branchId = 'branch-1';
      const segmentId = 'seg-1';
      const userIds = ['user-1'];
      const mockSegment = { id: segmentId, branchId, users: [{ id: 'user-1' }, { id: 'user-2' }] } as any;

      segmentRepo.findOne.mockResolvedValue(mockSegment);
      segmentRepo.save.mockImplementation(s => s);

      const result = await service.removeMembers(segmentId, userIds, branchId);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe('user-2');
    });
  });
});
