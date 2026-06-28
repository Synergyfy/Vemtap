import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';
import { DevicesService } from '../devices/devices.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AffiliatesService } from '../affiliates/affiliates.service';
import { ExternalAffiliateService } from '../affiliates/external-affiliate.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import {
  UserRole,
  UserStatus,
  AuthProvider,
} from '../users/entities/user.entity';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let businessesService: any;
  let devicesService: any;
  let mailService: any;
  let jwtService: any;
  let otpRepository: any;
  let subscriptionsService: any;
  let affiliatesService: any;
  let externalAffiliateService: any;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
    findByGoogleId: jest.fn(),
    findByIdentifier: jest.fn(),
    findOne: jest.fn(),
    create: jest
      .fn()
      .mockImplementation((u) => Promise.resolve({ ...u, id: 'user-1' })),
    updatePassword: jest.fn().mockResolvedValue(true),
    update: jest
      .fn()
      .mockImplementation((_id, updates) =>
        Promise.resolve({ id: _id, email: 'test@test.com', ...updates }),
      ),
  };

  const mockBusinessesService = {
    create: jest
      .fn()
      .mockImplementation((b) => Promise.resolve({ ...b, id: 'biz-1' })),
    findById: jest.fn().mockResolvedValue({
      id: 'biz-1',
      branches: [{ id: 'br-1', isMainBranch: true }],
    }),
    findByOwner: jest.fn().mockResolvedValue(null),
    findMainBranch: jest
      .fn()
      .mockResolvedValue({ id: 'br-1', isMainBranch: true }),
    update: jest
      .fn()
      .mockImplementation((_id, dto) => Promise.resolve({ id: _id, ...dto })),
  };

  const mockDevicesService = {
    createAutoDevice: jest
      .fn()
      .mockResolvedValue({ id: 'dev-1', code: 'ABC123456' }),
  };

  const mockMailService = {
    sendOtp: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetOtp: jest.fn().mockResolvedValue(true),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-google-client-id'),
  };

  const mockSubscriptionsService = {
    subscribeToFreePlan: jest.fn().mockResolvedValue({ id: 'sub-1' }),
    syncUserSubscriptionToQrThrive: jest.fn().mockResolvedValue(undefined),
  };

  const mockAffiliatesService = {
    createProfile: jest.fn().mockResolvedValue({ id: 'aff-1' }),
    findByReferralCode: jest.fn().mockResolvedValue(null),
    recordReferral: jest.fn().mockResolvedValue(undefined),
    getStats: jest.fn().mockResolvedValue({ referralCode: 'REF-123' }),
  };

  const mockExternalAffiliateService = {
    validateReferralCode: jest
      .fn()
      .mockResolvedValue({ valid: false, affiliateId: null }),
  };

  const mockOtpRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((otp) => Promise.resolve(otp)),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: BusinessesService, useValue: mockBusinessesService },
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: MailService, useValue: mockMailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(Otp), useValue: mockOtpRepository },
        {
          provide: AffiliatesService,
          useValue: mockAffiliatesService,
        },
        {
          provide: ExternalAffiliateService,
          useValue: mockExternalAffiliateService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    businessesService = module.get(BusinessesService);
    devicesService = module.get(DevicesService);
    mailService = module.get(MailService);
    jwtService = module.get(JwtService);
    otpRepository = module.get(getRepositoryToken(Otp));
    subscriptionsService = module.get(SubscriptionsService);
    affiliatesService = module.get(AffiliatesService);
    externalAffiliateService = module.get(ExternalAffiliateService);
  });

  // ==================== requestOwnerOtp ====================
  describe('requestOwnerOtp', () => {
    const dto: RequestOtpDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      role: UserRole.OWNER,
    };

    it('should generate and send OTP if email is unique', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByPhone.mockResolvedValue(null);

      const result = await service.requestOwnerOtp(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(otpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email, metadata: dto }),
      );
      expect(otpRepository.save).toHaveBeenCalled();
      expect(mailService.sendOtp).toHaveBeenCalledWith(
        dto.email,
        expect.any(String),
      );
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should allow OTP request for existing PENDING user (resumption)', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        status: UserStatus.PENDING,
      });
      usersService.findByPhone.mockResolvedValue(null);

      const result = await service.requestOwnerOtp(dto);

      expect(otpRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should throw ConflictException if ACTIVE user exists', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        status: UserStatus.ACTIVE,
      });
      usersService.findByPhone.mockResolvedValue(null);

      await expect(service.requestOwnerOtp(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if phone already exists', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByPhone.mockResolvedValue({
        id: 'user-2',
        status: UserStatus.ACTIVE,
      });

      await expect(service.requestOwnerOtp(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ==================== sendOtp ====================
  describe('sendOtp', () => {
    it('should send OTP for unique email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.sendOtp({ email: 'test@example.com' });

      expect(otpRepository.save).toHaveBeenCalled();
      expect(mailService.sendOtp).toHaveBeenCalled();
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should allow sendOtp for PENDING users', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        status: UserStatus.PENDING,
      });

      const result = await service.sendOtp({ email: 'pending@example.com' });

      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should throw ConflictException for ACTIVE users', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        status: UserStatus.ACTIVE,
      });

      await expect(
        service.sendOtp({ email: 'active@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ==================== verifyOtp ====================
  describe('verifyOtp', () => {
    it('should verify a valid OTP', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: 'test@example.com',
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
      });

      const result = await service.verifyOtp('test@example.com', '1234');

      expect(otpRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isVerified: true }),
      );
      expect(result).toEqual({ message: 'OTP verified successfully' });
    });

    it('should throw if OTP not found', async () => {
      otpRepository.findOne.mockResolvedValue(null);

      await expect(
        service.verifyOtp('test@example.com', '1234'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if OTP code does not match', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: 'test@example.com',
        code: '9999',
        expiresAt: new Date(Date.now() + 10000),
      });

      await expect(
        service.verifyOtp('test@example.com', '1234'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if OTP is expired', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: 'test@example.com',
        code: '1234',
        expiresAt: new Date(Date.now() - 10000),
      });

      await expect(
        service.verifyOtp('test@example.com', '1234'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== register ====================
  describe('register', () => {
    const baseDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    });

    it('should register a new customer successfully with OTP', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: baseDto.email,
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
        isVerified: true,
        metadata: {},
      });
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.register(baseDto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: baseDto.email,
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
        }),
      );
      expect(result.access_token).toBeDefined();
      expect(result.isNewUser).toBe(true);
      expect(otpRepository.remove).toHaveBeenCalled();
    });

    it('should throw if OTP not found', async () => {
      otpRepository.findOne.mockResolvedValue(null);

      await expect(service.register(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if OTP not verified', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: baseDto.email,
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
        isVerified: false,
      });

      await expect(service.register(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should register as OWNER if businessName provided', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: baseDto.email,
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
        isVerified: true,
        metadata: {},
      });
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findOne.mockResolvedValue({
        id: 'user-1',
        email: baseDto.email,
        role: UserRole.OWNER,
        branchId: 'br-1',
      });

      const result = await service.register({
        ...baseDto,
        businessName: 'Test Business',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.OWNER }),
      );
      expect(businessesService.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Business' }),
      );
      expect(result.access_token).toBeDefined();
    });

    it('should complete registration for INVITED user', async () => {
      const invitedUser = {
        id: 'invited-1',
        email: baseDto.email,
        firstName: 'Old',
        lastName: 'Name',
        status: UserStatus.INVITED,
        role: UserRole.CUSTOMER,
        password: null,
      };
      otpRepository.findOne.mockResolvedValue({
        email: baseDto.email,
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
        isVerified: true,
        metadata: {},
      });
      usersService.findByEmail.mockResolvedValue(invitedUser);

      const result = await service.register(baseDto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'invited-1',
          firstName: 'John',
          status: UserStatus.ACTIVE,
        }),
      );
      expect(result.isNewUser).toBe(false);
    });

    it('should resume registration for PENDING user', async () => {
      const pendingUser = {
        id: 'pending-1',
        email: baseDto.email,
        firstName: '',
        lastName: '',
        status: UserStatus.PENDING,
        role: UserRole.OWNER,
        password: null,
      };
      otpRepository.findOne.mockResolvedValue({
        email: baseDto.email,
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
        isVerified: true,
        metadata: {},
      });
      usersService.findByEmail.mockResolvedValue(pendingUser);
    });
  });

  // ==================== registerOwner ====================
  describe('registerOwner', () => {
    const dto: RegisterOwnerDto = {
      email: 'dan@owner.com',
      password: 'SecurePass123!',
      firstName: 'Dan',
      lastName: 'Owner',
      businessName: 'Dan Biz',
      visitors: '500',
      goals: ['Growth'],
      businessAddress: '123 St',
      businessWebsite: 'https://dan.com',
      whatsappNumber: '123456',
      officialEmail: 'info@dan.com',
      businessNumber: '987654',
    };

    const storedMetadata = {
      firstName: 'Dan',
      lastName: 'Owner',
      email: 'dan@owner.com',
      phone: '987654',
      role: UserRole.OWNER,
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    });

    it('should register a new owner with valid OTP', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: dto.email,
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
        isVerified: true,
        metadata: storedMetadata,
      });
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findOne.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        role: UserRole.OWNER,
        branchId: 'br-1',
      });

      const result = await service.registerOwner(dto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          role: UserRole.OWNER,
          status: UserStatus.ACTIVE,
        }),
      );
      expect(businessesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.businessName,
          ownerId: 'user-1',
        }),
      );
      expect(subscriptionsService.subscribeToFreePlan).toHaveBeenCalledWith(
        'biz-1',
      );
      expect(result.access_token).toBeDefined();
      expect(result.isNewUser).toBe(true);
    });

    it('should throw if OTP is invalid', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: dto.email,
        code: '9999',
        expiresAt: new Date(Date.now() + 10000),
      });

      await expect(service.registerOwner(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if OTP is expired', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: dto.email,
        code: '1234',
        expiresAt: new Date(Date.now() - 10000),
      });

      await expect(service.registerOwner(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create PENDING user if businessName is omitted (resumption flow)', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: dto.email,
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
        isVerified: true,
        metadata: storedMetadata,
      });
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.registerOwner({
        email: dto.email,
        password: 'SecurePass123!',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          role: UserRole.OWNER,
          status: UserStatus.PENDING,
        }),
      );
      expect(businessesService.create).not.toHaveBeenCalled();
      expect(result.isNewUser).toBe(true);
    });

    it('should throw if email exists as ACTIVE (non-Google)', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: dto.email,
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
        isVerified: true,
        metadata: storedMetadata,
      });
      usersService.findByEmail.mockResolvedValue({
        id: 'existing',
        status: UserStatus.ACTIVE,
      });

      await expect(service.registerOwner(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ==================== validateUser ====================
  describe('validateUser', () => {
    it('should return user sans password if credentials are valid', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed_password',
      };
      usersService.findByIdentifier.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({ id: '1', email: 'test@example.com' });
    });

    it('should return null if user not found', async () => {
      usersService.findByIdentifier.mockResolvedValue(null);

      const result = await service.validateUser('none', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password incorrect', async () => {
      usersService.findByIdentifier.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashed_password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong');

      expect(result).toBeNull();
    });
  });

  // ==================== login ====================
  describe('login', () => {
    it('should return access token and user', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
        password: 'hashed_password',
      };
      usersService.findByIdentifier.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        identifier: 'test@example.com',
        password: 'password123',
      });

      expect(result.access_token).toBe('mock_token');
      expect(result.user.role).toBe(UserRole.CUSTOMER);
    });

    it('should throw for non-existent user', async () => {
      usersService.findByIdentifier.mockResolvedValue(null);

      await expect(
        service.login({
          identifier: 'nobody@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for Google-only user trying password login', async () => {
      usersService.findByIdentifier.mockResolvedValue({
        id: 'user-1',
        email: 'google@example.com',
        password: null,
        authProvider: AuthProvider.GOOGLE,
      });

      await expect(
        service.login({
          identifier: 'google@example.com',
          password: 'any',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for wrong password', async () => {
      usersService.findByIdentifier.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed_password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          identifier: 'test@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ==================== checkUserStatus ====================
  describe('checkUserStatus', () => {
    it('should return exists false for unknown user', async () => {
      usersService.findByIdentifier.mockResolvedValue(null);

      const result = await service.checkUserStatus({
        identifier: 'none@example.com',
      });

      expect(result).toEqual({ exists: false });
    });

    it('should return user status if found', async () => {
      usersService.findByIdentifier.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: UserRole.OWNER,
        isPasswordChanged: true,
      });

      const result = await service.checkUserStatus({
        identifier: 'test@example.com',
      });

      expect(result).toEqual({
        exists: true,
        role: UserRole.OWNER,
        isPasswordChanged: true,
        hasRealEmail: true,
        email: 'test@example.com',
      });
    });

    it('should mark dummy email as no real email', async () => {
      usersService.findByIdentifier.mockResolvedValue({
        id: 'user-1',
        email: 'abc@vemtap.dummy',
        role: UserRole.CUSTOMER,
        isPasswordChanged: false,
      });

      const result = await service.checkUserStatus({
        identifier: 'abc@vemtap.dummy',
      });

      expect(result).toEqual({
        exists: true,
        role: UserRole.CUSTOMER,
        isPasswordChanged: false,
        hasRealEmail: false,
        email: undefined,
      });
    });
  });

  // ==================== changePassword ====================
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const user = { id: 'user-1' } as any;
      usersService.findOne.mockResolvedValue({
        id: 'user-1',
        password: 'old_hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.changePassword(
        user,
        { currentPassword: 'old', newPassword: 'NewPass123!' },
        { ip: '127.0.0.1', userAgent: 'test' },
      );

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(usersService.updatePassword).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
        expect.objectContaining({
          ipAddress: '127.0.0.1',
          userAgent: 'test',
        }),
      );
    });

    it('should throw if current password is wrong', async () => {
      const user = { id: 'user-1' } as any;
      usersService.findOne.mockResolvedValue({
        id: 'user-1',
        password: 'old_hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(user, {
          currentPassword: 'wrong',
          newPassword: 'NewPass123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== completeCustomerSetup ====================
  describe('completeCustomerSetup', () => {
    it('should update email and send welcome email', async () => {
      usersService.findByIdentifier.mockResolvedValue({
        id: 'cust-1',
        email: 'old@dummy.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CUSTOMER,
      });
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.completeCustomerSetup({
        identifier: 'old@dummy.com',
        email: 'real@example.com',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'real@example.com',
        }),
      );
      expect(mailService.sendWelcomeEmail).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Setup completed and welcome email sent',
      });
    });

    it('should throw if user not found', async () => {
      usersService.findByIdentifier.mockResolvedValue(null);

      await expect(
        service.completeCustomerSetup({
          identifier: 'none',
          email: 'new@example.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not a customer', async () => {
      usersService.findByIdentifier.mockResolvedValue({
        id: 'owner-1',
        email: 'owner@example.com',
        role: UserRole.OWNER,
      });

      await expect(
        service.completeCustomerSetup({
          identifier: 'owner@example.com',
          email: 'new@example.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if email already taken', async () => {
      usersService.findByIdentifier.mockResolvedValue({
        id: 'cust-1',
        email: 'old@dummy.com',
        role: UserRole.CUSTOMER,
      });
      usersService.findByEmail.mockResolvedValue({
        id: 'other-user',
        email: 'taken@example.com',
      });

      await expect(
        service.completeCustomerSetup({
          identifier: 'old@dummy.com',
          email: 'taken@example.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ==================== resendDefaultPassword ====================
  describe('resendDefaultPassword', () => {
    it('should resend default password if password not changed', async () => {
      usersService.findByIdentifier.mockResolvedValue({
        id: 'cust-1',
        email: 'real@example.com',
        firstName: 'Test',
        lastName: 'User',
        isPasswordChanged: false,
      });

      const result = await service.resendDefaultPassword('real@example.com');

      expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'real@example.com',
        'Test User',
        '123456',
      );
      expect(result).toEqual({
        message: 'Default password resent successfully',
      });
    });

    it('should throw if password already changed', async () => {
      usersService.findByIdentifier.mockResolvedValue({
        id: 'cust-1',
        email: 'real@example.com',
        isPasswordChanged: true,
      });

      await expect(
        service.resendDefaultPassword('real@example.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== switchRole ====================
  describe('switchRole', () => {
    it('should switch Owner to Customer', async () => {
      const user = {
        id: 'owner-1',
        email: 'owner@example.com',
        role: UserRole.OWNER,
        branchId: 'br-1',
      } as any;
      usersService.findOne.mockResolvedValue(user);
      businessesService.findByOwner.mockResolvedValue({
        id: 'biz-1',
      });

      const result = await service.switchRole(user, UserRole.CUSTOMER);

      expect(result.access_token).toBe('mock_token');
      expect(result.user.role).toBe(UserRole.CUSTOMER);
    });

    it('should throw if Owner tries to switch to non-Customer', async () => {
      const user = {
        id: 'owner-1',
        role: UserRole.OWNER,
      } as any;

      await expect(service.switchRole(user, UserRole.ADMIN)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ==================== password reset ====================
  describe('requestPasswordReset', () => {
    it('should send reset OTP for existing user', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      const result = await service.requestPasswordReset({
        email: 'test@example.com',
      });

      expect(otpRepository.save).toHaveBeenCalled();
      expect(mailService.sendPasswordResetOtp).toHaveBeenCalled();
      expect(result.message).toContain('reset code has been sent');
    });

    it('should return generic message even if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.requestPasswordReset({
        email: 'nobody@example.com',
      });

      expect(result.message).toContain('reset code has been sent');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid OTP', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: 'test@example.com',
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
      });
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      const result = await service.resetPassword(
        {
          email: 'test@example.com',
          otp: '1234',
          newPassword: 'NewPass123!',
        },
        { ip: '127.0.0.1', userAgent: 'test' },
      );

      expect(usersService.updatePassword).toHaveBeenCalled();
      expect(otpRepository.remove).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    it('should throw if reset OTP is invalid', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: 'test@example.com',
        code: '9999',
        expiresAt: new Date(Date.now() + 10000),
      });

      await expect(
        service.resetPassword({
          email: 'test@example.com',
          otp: '1234',
          newPassword: 'NewPass123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
