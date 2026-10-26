import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { PasswordResetHistory } from './entities/password-reset-history.entity';
import { UserSession } from './entities/user-session.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { Cluster, ClusterType } from '../clusters/entities/cluster.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let mailService: any;
  let clusterRepository: { findOne: jest.Mock };

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
    clusterRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Cluster), useValue: clusterRepository },
        {
          provide: getRepositoryToken(PasswordResetHistory),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserSession),
          useValue: {
            create: jest.fn().mockImplementation((session) => session),
            save: jest
              .fn()
              .mockImplementation((session) =>
                Promise.resolve({ id: 'session-1', ...session }),
              ),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
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

  describe('new-device alerts', () => {
    const sessionRepo = () =>
      (service as unknown as { userSessionRepository: any })
        .userSessionRepository;
    const seen = (exists: boolean) => {
      const qb = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getExists: jest.fn().mockResolvedValue(exists),
      };
      sessionRepo().createQueryBuilder.mockReturnValue(qb);
    };

    beforeEach(() => {
      mailService.sendGenericEmail = jest.fn().mockResolvedValue(true);
      sessionRepo().save.mockImplementation((session: object) =>
        Promise.resolve({ id: 'session-9', createdAt: new Date(), ...session }),
      );
    });

    it('emails an opted-in user signing in from an unseen device', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'u1',
        email: 'owner@biz.ng',
        firstName: 'Ada',
        securityPreferences: { deviceAlerts: true },
      });
      seen(false);
      await service.createSession('u1', {
        userAgent: 'Firefox/130',
        ipAddress: '1.2.3.4',
      });
      expect(mailService.sendGenericEmail).toHaveBeenCalledWith(
        'owner@biz.ng',
        'New sign-in to your VemTap account',
        expect.stringContaining('Firefox/130'),
      );
    });

    it('stays quiet for a device seen before', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'u1',
        email: 'owner@biz.ng',
        securityPreferences: { deviceAlerts: true },
      });
      seen(true);
      await service.createSession('u1', { userAgent: 'Firefox/130' });
      expect(mailService.sendGenericEmail).not.toHaveBeenCalled();
    });

    it('stays quiet when alerts are off or there is no user agent', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'u1',
        email: 'owner@biz.ng',
        securityPreferences: null,
      });
      seen(false);
      await service.createSession('u1', { userAgent: 'Firefox/130' });
      await service.createSession('u1');
      expect(mailService.sendGenericEmail).not.toHaveBeenCalled();
    });
  });

  describe('linked devices', () => {
    const sessions = () =>
      (
        service as unknown as {
          userSessionRepository: Record<string, jest.Mock>;
        }
      ).userSessionRepository;

    it('names the current session from what the app reports', async () => {
      const repo = sessions();
      repo.findOne = jest.fn().mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        deviceName: 'Web browser',
        platform: 'web',
        userAgent: null,
        ipAddress: null,
      });

      const saved = await service.describeSession('user-1', 'session-1', {
        deviceName: 'iPhone 15 Pro',
        platform: 'ios',
        userAgent: 'VemTap/1.0',
        ipAddress: '10.0.0.2',
      });

      expect(repo.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({ id: 'session-1', userId: 'user-1' }),
      });
      expect(saved).toEqual(
        expect.objectContaining({
          deviceName: 'iPhone 15 Pro',
          platform: 'ios',
          userAgent: 'VemTap/1.0',
          ipAddress: '10.0.0.2',
        }),
      );
    });

    it('refuses a revoked or unknown session', async () => {
      sessions().findOne = jest.fn().mockResolvedValue(null);
      await expect(
        service.describeSession('user-1', 'gone', {
          deviceName: 'x',
          platform: 'ios',
        }),
      ).rejects.toThrow('Linked device not found');
    });

    it('marks which listed session is this device', async () => {
      sessions().find = jest
        .fn()
        .mockResolvedValue([{ id: 'session-1' }, { id: 'session-2' }]);

      const list = await service.listSessions('user-1', 'session-2');

      expect(list.map((row) => row.isCurrent)).toEqual([false, true]);
    });
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
        undefined,
        undefined,
      );
    });

    it('should use the PIN the owner set and email it to the new member', async () => {
      const dto = {
        email: 'staff@example.com',
        firstName: 'Staff',
        lastName: 'User',
        role: 'Staff',
        pin: '482913',
      };

      userRepository.findOne.mockResolvedValue(null);

      await service.inviteStaff('br-1', dto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('482913', 10);
      expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(
        dto.email,
        dto.firstName,
        '482913',
        undefined,
        undefined,
      );
    });

    it('should pass businessName and branchName to sendWelcomeEmail when available', async () => {
      const dto = {
        email: 'staff@example.com',
        firstName: 'Staff',
        lastName: 'User',
        role: 'Staff',
        permissions: ['dashboard'],
      };
      const branchId = 'br-1';

      userRepository.findOne.mockResolvedValue(null);
      userRepository.manager.getRepository.mockReturnValue({
        findOne: jest.fn().mockResolvedValue({
          id: branchId,
          name: 'Lekki Branch',
          business: { name: 'Azure Bistro' },
        }),
      });

      await service.inviteStaff(branchId, dto as any);

      const expectedPassword = (bcrypt.hash as jest.Mock).mock.calls[0][0];
      expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(
        dto.email,
        dto.firstName,
        expectedPassword,
        'Azure Bistro',
        'Lekki Branch',
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

  describe('resendTeamInvite', () => {
    const invited = {
      id: 'user-2',
      email: 'kemi.d@example.com',
      firstName: 'Kemi',
      status: UserStatus.INVITED,
    };

    it('should issue a fresh password and re-send the invitation email', async () => {
      userRepository.findOne.mockResolvedValue({ ...invited });
      userRepository.manager.getRepository.mockReturnValue({
        findOne: jest.fn().mockResolvedValue({
          id: 'br-1',
          name: 'Wuse Branch',
          business: { name: 'Urban Grill' },
        }),
      });

      const result = await service.resendTeamInvite('user-2', 'br-1');

      expect(result.password).toBe('hashed_password');
      const expectedPassword = (bcrypt.hash as jest.Mock).mock.calls[0][0];
      expect(expectedPassword).toMatch(/^\d{6}$/);
      expect(userRepository.save).toHaveBeenCalled();
      expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(
        invited.email,
        invited.firstName,
        expectedPassword,
        'Urban Grill',
        'Wuse Branch',
      );
    });

    it('should refuse to resend an accepted invitation', async () => {
      userRepository.findOne.mockResolvedValue({
        ...invited,
        status: UserStatus.ACTIVE,
      });

      await expect(service.resendTeamInvite('user-2', 'br-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should 404 when the member is not in the given branch', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.resendTeamInvite('user-2', 'br-9')).rejects.toThrow(
        NotFoundException,
      );
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

  describe('updateProfile home district', () => {
    beforeEach(() => {
      userRepository.update = jest.fn().mockResolvedValue(undefined);
      userRepository.findOne.mockResolvedValue({ id: 'u-1' });
    });

    it('saves an active district', async () => {
      clusterRepository.findOne.mockResolvedValue({ id: 'd-1' });

      await service.updateProfile('u-1', { homeDistrictId: 'd-1' });

      expect(clusterRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'd-1', type: ClusterType.DISTRICT, isActive: true },
        }),
      );
      expect(userRepository.update).toHaveBeenCalledWith('u-1', {
        homeDistrictId: 'd-1',
      });
    });

    it('rejects a cluster that is not an active district', async () => {
      clusterRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('u-1', { homeDistrictId: 'market-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('clears the district with null without a lookup', async () => {
      await service.updateProfile('u-1', { homeDistrictId: null });

      expect(clusterRepository.findOne).not.toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith('u-1', {
        homeDistrictId: null,
      });
    });
  });
});
