import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { PasswordResetHistory } from './entities/password-reset-history.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let mailService: any;

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
      manager: {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue({ businessId: 'biz-1' }),
        }),
      },
    };

    mailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
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
        { provide: MailService, useValue: mailService },
        {
          provide: EventsGateway,
          useValue: {
            emitUserUpdated: jest.fn(),
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

  describe('inviteStaff', () => {
    it('should invite a staff member and send welcome email', async () => {
      const dto = {
        email: 'staff@example.com',
        firstName: 'Staff',
        lastName: 'User',
        role: 'Staff',
        permissions: ['dashboard'],
      };
      const branchId = 'br-1';

      userRepository.findOne.mockResolvedValue(null);

      const result = await service.inviteStaff(branchId, dto as any);

      expect(result.email).toBe(dto.email.toLowerCase());
      expect(result.password).toBe('hashed_password');
      expect(result.role).toBe(UserRole.STAFF);
      expect(result.roleTag).toBe('Staff');

      const expectedPassword = (bcrypt.hash as jest.Mock).mock.calls[0][0];
      expect(expectedPassword).toMatch(/^\d{6}$/);
      expect(bcrypt.hash).toHaveBeenCalledWith(expectedPassword, 10);
      expect(userRepository.save).toHaveBeenCalled();
      expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(
        dto.email,
        dto.firstName,
        expectedPassword,
      );
    });

    it('should map custom role "Cashier" to UserRole.STAFF and store "Cashier" as roleTag', async () => {
      const dto = {
        email: 'cashier@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'Cashier',
        permissions: ['pos'],
      };
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.inviteStaff('br-1', dto as any);
      expect(result.role).toBe(UserRole.STAFF);
      expect(result.roleTag).toBe('Cashier');
    });

    it('should map custom role "Manager" case-insensitively to UserRole.MANAGER and store "Manager" as roleTag', async () => {
      const dto = {
        email: 'manager@example.com',
        firstName: 'Bob',
        lastName: 'Smith',
        role: 'mAnAgEr',
        permissions: ['staff'],
      };
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.inviteStaff('br-1', dto as any);
      expect(result.role).toBe(UserRole.MANAGER);
      expect(result.roleTag).toBe('mAnAgEr');
    });

    it('should throw BadRequestException if email already exists', async () => {
      userRepository.findOne.mockResolvedValue({ id: '1' });
      const dto = {
        email: 'staff@example.com',
        firstName: 'Staff',
        role: 'Staff',
      };
      await expect(service.inviteStaff('br-1', dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept compound permission keys like pos:pos-home', async () => {
      const dto = {
        email: 'pos-staff@example.com',
        firstName: 'POS',
        lastName: 'Staff',
        role: 'Staff',
        permissions: ['pos', 'pos:pos-home', 'pos:orders'],
      };
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.inviteStaff('br-1', dto as any);
      expect(result.permissions).toEqual(['pos', 'pos:pos-home', 'pos:orders']);
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateStaff', () => {
    it('should update staff details including custom role', async () => {
      const existingUser = {
        id: '1',
        branchId: 'br-1',
        firstName: 'Old',
        role: UserRole.STAFF,
        roleTag: 'Staff',
      };
      userRepository.findOne.mockResolvedValue(existingUser);

      const updates: any = { name: 'New Name', role: 'Supervisor' };
      const result = await service.updateStaff('1', 'br-1', updates);

      expect(result.firstName).toBe('New');
      expect(result.lastName).toBe('Name');
      expect(result.role).toBe(UserRole.STAFF);
      expect(result.roleTag).toBe('Supervisor');
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

    it('should update staff with compound permission keys', async () => {
      const existingUser = {
        id: '1',
        branchId: 'br-1',
        firstName: 'Old',
        role: UserRole.STAFF,
        roleTag: 'Staff',
        permissions: ['pos'],
      };
      userRepository.findOne.mockResolvedValue(existingUser);

      const updates: any = {
        name: 'New Name',
        role: 'Supervisor',
        permissions: ['pos', 'pos:pos-home', 'pos:orders', 'pos:settings'],
      };
      const result = await service.updateStaff('1', 'br-1', updates);

      expect(result.permissions).toEqual([
        'pos',
        'pos:pos-home',
        'pos:orders',
        'pos:settings',
      ]);
      expect(userRepository.save).toHaveBeenCalled();
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
