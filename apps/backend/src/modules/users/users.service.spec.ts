import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: any;

  const mockUser = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: UserRole.STAFF,
    businessId: 'biz-1',
    jobTitle: 'Sales',
    permissions: [],
    status: UserStatus.ACTIVE,
  };

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((user) => Promise.resolve({ ...user, id: 'user-1' })),
    find: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    it('should allow creating a STAFF user', async () => {
      const dto = { ...mockUser, role: UserRole.STAFF };
      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should allow creating a MANAGER user', async () => {
      const dto = { ...mockUser, role: UserRole.MANAGER };
      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to create OWNER', async () => {
      const dto = { ...mockUser, role: UserRole.OWNER };
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to create ADMIN', async () => {
      const dto = { ...mockUser, role: UserRole.ADMIN };
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByBusiness', () => {
    it('should return users for a business', async () => {
      repository.find.mockResolvedValue([mockUser]);
      const result = await service.findByBusiness('biz-1');
      expect(result).toEqual([mockUser]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { businessId: 'biz-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('updateStaff', () => {
    it('should update staff details', async () => {
      repository.findOneBy.mockResolvedValue({ ...mockUser });

      const updates = {
        role: UserRole.MANAGER,
        jobTitle: 'Senior Manager',
        permissions: ['dashboard', 'visitors'],
        status: UserStatus.INACTIVE,
      };

      const result = await service.updateStaff('user-1', 'biz-1', updates);

      expect(result.role).toBe(UserRole.MANAGER);
      expect(result.jobTitle).toBe('Senior Manager');
      expect(result.permissions).toEqual(['dashboard', 'visitors']);
      expect(result.status).toBe(UserStatus.INACTIVE);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOneBy.mockResolvedValue(null);
      await expect(service.updateStaff('user-1', 'biz-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user belongs to another business', async () => {
      repository.findOneBy.mockResolvedValue({
        ...mockUser,
        businessId: 'other-biz',
      });
      await expect(service.updateStaff('user-1', 'biz-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove staff member', async () => {
      repository.findOneBy.mockResolvedValue({ ...mockUser });
      await service.remove('user-1', 'biz-1');
      expect(repository.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1' }),
      );
    });

    it('should throw BadRequestException when trying to remove OWNER', async () => {
      repository.findOneBy.mockResolvedValue({
        ...mockUser,
        role: UserRole.OWNER,
      });
      await expect(service.remove('user-1', 'biz-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
