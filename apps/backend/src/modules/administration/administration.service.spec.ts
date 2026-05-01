import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdministrationService } from './administration.service';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { ImpersonationToken } from './entities/impersonation-token.entity';
import { CustomerImpersonationToken } from './entities/customer-impersonation-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import {
  AdminCreateAgentDto,
  GenerateImpersonationTokenDto,
  GenerateCustomerImpersonationTokenDto,
} from './dto/administration.dto';
import { BackendModule } from '../../common/enums/backend-module.enum';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AdministrationService', () => {
  let service: AdministrationService;
  let userRepository: Repository<User>;
  let tokenRepository: Repository<ImpersonationToken>;
  let customerTokenRepository: Repository<CustomerImpersonationToken>;
  let auditLogRepository: Repository<AuditLog>;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockTokenRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockCustomerTokenRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdministrationService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(ImpersonationToken),
          useValue: mockTokenRepository,
        },
        {
          provide: getRepositoryToken(CustomerImpersonationToken),
          useValue: mockCustomerTokenRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<AdministrationService>(AdministrationService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    tokenRepository = module.get<Repository<ImpersonationToken>>(
      getRepositoryToken(ImpersonationToken),
    );
    customerTokenRepository = module.get<
      Repository<CustomerImpersonationToken>
    >(getRepositoryToken(CustomerImpersonationToken));
    auditLogRepository = module.get<Repository<AuditLog>>(
      getRepositoryToken(AuditLog),
    );

    process.env.MAX_IMPERSONATION_HOURS = '72';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAgent', () => {
    it('should throw if email exists', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ id: 'existing' });
      await expect(
        service.createAgent({
          email: 'test@example.com',
        } as AdminCreateAgentDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash password and create agent', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockUserRepository.create.mockReturnValue({ id: 'new-agent' });
      mockUserRepository.save.mockResolvedValue({ id: 'new-agent' });

      const dto: AdminCreateAgentDto = {
        email: 'agent@vemtap.com',
        firstName: 'Agent',
        lastName: 'Smith',
        password: 'password123',
        phone: '+1234567890',
        permissions: [BackendModule.LOYALTY],
      };

      const result = await service.createAgent(dto);
      expect(result).toEqual({ id: 'new-agent' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.AGENT,
          status: UserStatus.ACTIVE,
          permissions: [BackendModule.LOYALTY],
        }),
      );
    });
  });

  describe('generateToken', () => {
    it('should throw if actor not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(
        service.generateToken('actor', {} as GenerateImpersonationTokenDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if actor is not admin or agent', async () => {
      mockUserRepository.findOne.mockResolvedValue({ role: UserRole.CUSTOMER });
      await expect(
        service.generateToken('actor', {} as GenerateImpersonationTokenDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if expiresAt is in the past', async () => {
      mockUserRepository.findOne.mockResolvedValue({ role: UserRole.ADMIN });
      await expect(
        service.generateToken('actor', {
          expiresAt: '2000-01-01T00:00:00Z',
        } as GenerateImpersonationTokenDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if expiresAt exceeds MAX_HOURS', async () => {
      mockUserRepository.findOne.mockResolvedValue({ role: UserRole.ADMIN });
      // expires in 100 hours
      const future = new Date(Date.now() + 100 * 60 * 60 * 1000).toISOString();
      await expect(
        service.generateToken('actor', {
          expiresAt: future,
        } as GenerateImpersonationTokenDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create and save token', async () => {
      mockUserRepository.findOne.mockResolvedValue({ role: UserRole.ADMIN });
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
      const dto = { targetBranchId: 'branch', expiresAt };
      mockTokenRepository.create.mockReturnValue({ id: 'token' });
      mockTokenRepository.save.mockResolvedValue({ id: 'token' });

      const result = await service.generateToken('actor', dto);
      expect(mockTokenRepository.update).toHaveBeenCalledWith(
        { actorId: 'actor', targetBranchId: 'branch', isActive: true },
        { isActive: false },
      );
      expect(result).toEqual({ id: 'token' });
    });
  });

  describe('getActorPermissions', () => {
    it('should return implicitly full permissions for admin', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 'admin',
        role: UserRole.ADMIN,
        permissions: null,
      });

      const result = await service.getActorPermissions('admin');
      expect(result.permissions).toEqual(Object.values(BackendModule));
      expect(result.hasFullAccess).toBe(true);
    });

    it('should return exact permissions for agent', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 'agent',
        role: UserRole.AGENT,
        permissions: [BackendModule.LOYALTY],
      });

      const result = await service.getActorPermissions('agent');
      expect(result.permissions).toEqual([BackendModule.LOYALTY]);
      expect(result.hasFullAccess).toBe(false);
    });
  });

  describe('generateCustomerToken', () => {
    it('should throw if target customer not found', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce({ role: UserRole.ADMIN }) // actor
        .mockResolvedValueOnce(null); // customer

      await expect(
        service.generateCustomerToken('actor', {
          targetCustomerId: 'c',
        } as GenerateCustomerImpersonationTokenDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and save customer token', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce({ role: UserRole.ADMIN })
        .mockResolvedValueOnce({ role: UserRole.CUSTOMER });

      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      mockCustomerTokenRepository.create.mockReturnValue({ id: 'ctoken' });
      mockCustomerTokenRepository.save.mockResolvedValue({ id: 'ctoken' });

      const result = await service.generateCustomerToken('actor', {
        targetCustomerId: 'c',
        targetBranchId: 'b',
        expiresAt,
      });
      expect(result).toEqual({ id: 'ctoken' });
      expect(mockCustomerTokenRepository.update).toHaveBeenCalled();
    });
  });
});
