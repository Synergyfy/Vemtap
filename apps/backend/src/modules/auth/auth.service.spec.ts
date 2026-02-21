import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { UserRole } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let businessesService: any;
  let mailService: any;
  let jwtService: any;
  let otpRepository: any;

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((u) => Promise.resolve({ ...u, id: 'user-1' })),
    };
    const mockBusinessesService = {
      create: jest
        .fn()
        .mockImplementation((b) => Promise.resolve({ ...b, id: 'biz-1' })),
    };
    const mockMailService = {
      sendOtp: jest.fn(),
    };
    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock_token'),
    };
    const mockOtpRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: BusinessesService, useValue: mockBusinessesService },
        { provide: MailService, useValue: mockMailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(Otp), useValue: mockOtpRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    businessesService = module.get(BusinessesService);
    mailService = module.get(MailService);
    jwtService = module.get(JwtService);
    otpRepository = module.get(getRepositoryToken(Otp));
  });

  describe('registerOwner', () => {
    it('should register an owner and a business', async () => {
      const dto: RegisterOwnerDto = {
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

      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.registerOwner(dto);

      // Verify User Creation
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          role: UserRole.OWNER,
        }),
      );

      // Verify Business Creation
      expect(businessesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.businessName,
          address: dto.businessAddress,
          website: dto.businessWebsite,
          whatsappNumber: dto.whatsappNumber,
          officialEmail: dto.officialEmail,
        }),
      );

      // Verify Response (should include token)
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });

    it('should throw ConflictException if email exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'existing' });
      await expect(
        service.registerOwner({ email: 'test@test.com' } as any),
      ).rejects.toThrow();
    });
  });
});
