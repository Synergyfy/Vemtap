import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';
import { DevicesService } from '../devices/devices.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { UserRole } from '../users/entities/user.entity';
import { ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let businessesService: any;
  let devicesService: any;
  let mailService: any;
  let jwtService: any;
  let otpRepository: any;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByIdentifier: jest.fn(),
    findOne: jest.fn(),
    create: jest
      .fn()
      .mockImplementation((u) => Promise.resolve({ ...u, id: 'user-1' })),
  };

  const mockBusinessesService = {
    create: jest
      .fn()
      .mockImplementation((b) => Promise.resolve({ ...b, id: 'biz-1' })),
    findById: jest.fn().mockResolvedValue({
      id: 'biz-1',
      branches: [{ id: 'br-1', isMainBranch: true }],
    }),
    findByOwner: jest.fn(),
  };

  const mockDevicesService = {
    createAutoDevice: jest
      .fn()
      .mockResolvedValue({ id: 'dev-1', code: 'ABC123456' }),
  };

  const mockMailService = {
    sendOtp: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_token'),
  };

  const mockOtpRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((otp) => Promise.resolve(otp)),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: BusinessesService, useValue: mockBusinessesService },
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: MailService, useValue: mockMailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(Otp), useValue: mockOtpRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    businessesService = module.get(BusinessesService);
    devicesService = module.get(DevicesService);
    mailService = module.get(MailService);
    jwtService = module.get(JwtService);
    otpRepository = module.get(getRepositoryToken(Otp));

    jest.clearAllMocks();
  });

  describe('requestOwnerOtp', () => {
    it('should generate and send OTP if email is unique', async () => {
      const dto: RequestOtpDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        role: UserRole.OWNER,
      };

      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.requestOwnerOtp(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(otpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          metadata: dto,
        }),
      );
      expect(otpRepository.save).toHaveBeenCalled();
      expect(mailService.sendOtp).toHaveBeenCalledWith(
        dto.email,
        expect.any(String),
      );
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should generate and send OTP if email is unique (case-insensitive)', async () => {
      const dto: RequestOtpDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'John@Example.com',
        phone: '1234567890',
        role: UserRole.OWNER,
      };

      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.requestOwnerOtp(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(otpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'John@Example.com'.toLowerCase(),
        }),
      );
    });
  });

  describe('registerOwner', () => {
    const otpDto: any = {
      otp: '1234',
      firstName: 'Dan',
      lastName: 'Owner',
      email: 'dan@owner.com',
      password: 'password123',
      businessName: 'Dan Biz',
      category: 'Retail',
      visitors: '500',
      goals: ['Growth'],
      businessAddress: '123 St',
      businessWebsite: 'dan.com',
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

    it('should register owner, business, and device with valid OTP', async () => {
      // Mock OTP verification success
      otpRepository.findOne.mockResolvedValue({
        email: otpDto.email,
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
        isVerified: true,
        metadata: storedMetadata,
      });

      usersService.findByEmail.mockResolvedValue(null);
      usersService.findOne.mockResolvedValue({
        id: 'user-1',
        email: otpDto.email,
        role: UserRole.OWNER,
        branchId: 'br-1',
      });

      const result = await service.registerOwner(otpDto);

      // Verify User Creation
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: otpDto.email,
          role: UserRole.OWNER,
          firstName: storedMetadata.firstName, // Should come from metadata
        }),
      );

      // Verify Business Creation
      expect(businessesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: otpDto.businessName,
          ownerId: 'user-1',
        }),
      );

      // Verify Device Creation
      expect(devicesService.createAutoDevice).toHaveBeenCalledWith('br-1');

      // Verify OTP consumed
      expect(otpRepository.remove).toHaveBeenCalled();

      // Verify Response
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });

    it('should throw BadRequestException if OTP is invalid', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: otpDto.email,
        code: '9999', // Wrong code
        expiresAt: new Date(Date.now() + 10000),
      });

      await expect(service.registerOwner(otpDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if OTP is expired', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: otpDto.email,
        code: '1234',
        expiresAt: new Date(Date.now() - 10000), // Expired
      });

      await expect(service.registerOwner(otpDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if email exists during registration', async () => {
      otpRepository.findOne.mockResolvedValue({
        email: otpDto.email,
        code: '1234',
        expiresAt: new Date(Date.now() + 10000),
        isVerified: true,
        metadata: storedMetadata,
      });

      usersService.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(service.registerOwner(otpDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid (email)', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed_password',
      };
      usersService.findByIdentifier = jest.fn().mockResolvedValue(user);
      (require('bcrypt').compare as jest.Mock) = jest
        .fn()
        .mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual({ id: '1', email: 'test@example.com' });
      expect(usersService.findByIdentifier).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should return user if credentials are valid (phone)', async () => {
      const user = {
        id: '1',
        phone: '1234567890',
        password: 'hashed_password',
      };
      usersService.findByIdentifier = jest.fn().mockResolvedValue(user);
      (require('bcrypt').compare as jest.Mock) = jest
        .fn()
        .mockResolvedValue(true);

      const result = await service.validateUser('1234567890', 'password');
      expect(result).toEqual({ id: '1', phone: '1234567890' });
      expect(usersService.findByIdentifier).toHaveBeenCalledWith('1234567890');
    });

    it('should return null if user not found', async () => {
      usersService.findByIdentifier = jest.fn().mockResolvedValue(null);
      const result = await service.validateUser('none', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password incorrect', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed_password',
      };
      usersService.findByIdentifier = jest.fn().mockResolvedValue(user);
      (require('bcrypt').compare as jest.Mock) = jest
        .fn()
        .mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong');
      expect(result).toBeNull();
    });
  });

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

      const dto = { identifier: 'test@example.com', password: 'password123' };
      const result = await service.login(dto);

      expect(result).toEqual({
        access_token: 'mock_token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: UserRole.CUSTOMER,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: user.email,
          sub: user.id,
          role: user.role,
        }),
      );
    });
  });
});
