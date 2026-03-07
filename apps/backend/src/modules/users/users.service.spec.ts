import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { PasswordResetHistory } from './entities/password-reset-history.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((user) => Promise.resolve({ id: '1', ...user })),
      count: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(PasswordResetHistory),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const userData = { email: 'test@example.com', firstName: 'John' };
      const result = await service.create(userData);
      expect(result).toMatchObject(userData);
      expect(userRepository.create).toHaveBeenCalledWith(userData);
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateStaff', () => {
    it('should update staff details', async () => {
      const existingUser = { id: '1', branchId: 'br-1', firstName: 'Old' };
      userRepository.findOne.mockResolvedValue(existingUser);

      const updates: any = { name: 'New Name' };
      const result = await service.updateStaff('1', 'br-1', updates);

      expect(result.firstName).toBe('New');
      expect(result.lastName).toBe('Name');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.updateStaff('1', 'br-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user belongs to another branch', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.updateStaff('1', 'other-br', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove staff member', async () => {
      userRepository.findOne.mockResolvedValue({
        id: '1',
        branchId: 'br-1',
        role: UserRole.STAFF,
      });
      await service.remove('1', 'br-1');
      expect(userRepository.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to remove OWNER', async () => {
      userRepository.findOne.mockResolvedValue({
        id: '1',
        branchId: 'br-1',
        role: UserRole.OWNER,
      });
      await expect(service.remove('1', 'br-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
