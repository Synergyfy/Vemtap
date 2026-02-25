import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { PasswordResetHistory } from './entities/password-reset-history.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;

  const mockRepository = {
    findOneBy: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((user) => Promise.resolve({ id: '1', ...user })),
    count: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: getRepositoryToken(PasswordResetHistory), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
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
      const existingUser = { id: '1', businessId: 'biz-1', firstName: 'Old' };
      userRepository.findOneBy.mockResolvedValue(existingUser);

      const updates = { firstName: 'New' };
      const result = await service.updateStaff('1', 'biz-1', updates);

      expect(result.firstName).toBe('New');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      await expect(service.updateStaff('1', 'biz-1', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user belongs to another business', async () => {
      userRepository.findOneBy.mockResolvedValue({ id: '1', businessId: 'other-biz' });
      await expect(service.updateStaff('1', 'biz-1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove staff member', async () => {
      userRepository.findOneBy.mockResolvedValue({ id: '1', businessId: 'biz-1', role: UserRole.STAFF });
      await service.remove('1', 'biz-1');
      expect(userRepository.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to remove OWNER', async () => {
      userRepository.findOneBy.mockResolvedValue({ id: '1', businessId: 'biz-1', role: UserRole.OWNER });
      await expect(service.remove('1', 'biz-1')).rejects.toThrow(BadRequestException);
    });
  });
});
