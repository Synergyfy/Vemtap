import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { FosProfileService } from './fos-profile.service';
import { User } from '../users/entities/user.entity';
import { FosAuditLog } from '../fos-settings/entities/fos-config.entity';

describe('FosProfileService', () => {
  let service: FosProfileService;

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn((user: User) => Promise.resolve(user)),
  };
  const mockAuditLogRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const baseUser = {
    id: 'usr-1',
    email: 'admin@vemtap.com',
    firstName: 'Admin',
    lastName: 'User',
    avatar: null,
    role: 'SUPER_ADMIN',
    status: 'Active',
  } as unknown as User;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosProfileService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(FosAuditLog),
          useValue: mockAuditLogRepo,
        },
      ],
    }).compile();

    service = module.get<FosProfileService>(FosProfileService);
  });

  describe('getProfile', () => {
    it('should return profile shape', () => {
      const result = service.getProfile(baseUser);
      expect(result.email).toBe('admin@vemtap.com');
      expect(result.id).toBe('usr-1');
    });
  });

  describe('updateProfile', () => {
    it('should update name and write an audit entry', async () => {
      mockAuditLogRepo.create.mockReturnValue({});
      mockAuditLogRepo.save.mockResolvedValue({});

      const result = await service.updateProfile(baseUser, {
        firstName: 'New',
      });

      expect(result.firstName).toBe('New');
      expect(mockAuditLogRepo.save).toHaveBeenCalled();
    });

    it('should reject a conflicting email', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'other', email: 'x@y.com' });

      await expect(
        service.updateProfile(baseUser, { email: 'x@y.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getActivity', () => {
    it('should return matching activity entries', async () => {
      mockAuditLogRepo.find.mockResolvedValue([
        {
          id: 'a1',
          timestamp: new Date(),
          user: 'Admin User',
          action: 'Profile Updated',
          details: 'Changed first name',
        },
      ]);

      const result = await service.getActivity(baseUser, 20);
      expect(result.entries[0].action).toBe('Profile Updated');
    });
  });
});
