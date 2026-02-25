import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';
import { DevicesService } from '../devices/devices.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/entities/user.entity';
import { Otp } from './entities/otp.entity';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { PasswordResetOtpDto } from './dto/password-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private businessesService: BusinessesService,
    private devicesService: DevicesService,
    private mailService: MailService,
    private jwtService: JwtService,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) { }

  async requestOwnerOtp(dto: RequestOtpDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit OTP
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

    // Save OTP with metadata
    const otp = this.otpRepository.create({
      email: dto.email,
      code,
      expiresAt,
      metadata: dto,
    });
    await this.otpRepository.save(otp);

    // Send Email
    await this.mailService.sendOtp(dto.email, code);

    return { message: 'OTP sent successfully' };
  }

  async sendOtp(dto: any) {
    const email = typeof dto === 'string' ? dto : dto.email;
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit OTP
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

    // Save OTP with optional metadata
    const otp = this.otpRepository.create({
      email,
      code,
      expiresAt,
      metadata: typeof dto === 'object' ? dto : undefined,
    });
    await this.otpRepository.save(otp);

    // Send Email
    await this.mailService.sendOtp(email, code);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, code: string) {
    const otpRecord = await this.otpRepository.findOne({
      where: { email },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP not found');
    }

    if (otpRecord.code !== code) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('OTP expired');
    }

    // OTP Valid
    otpRecord.isVerified = true;
    await this.otpRepository.save(otpRecord);

    return { message: 'OTP verified successfully' };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  // --- Original Generic Register (Kept for compatibility) ---
  async register(registrationData: any) {
    // 0. Verify OTP first (Mandatory for Customers now)
    const otpRecord = await this.otpRepository.findOne({
      where: { email: registrationData.email },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Verification session not found');
    }

    if (!otpRecord.isVerified) {
      throw new BadRequestException(
        'OTP must be verified before completing registration',
      );
    }

    const metadata = otpRecord.metadata || {};

    const existingUser = await this.usersService.findByEmail(
      registrationData.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Determine Role (Default to OWNER if businessName is provided, else CUSTOMER)
    let role = registrationData.role || UserRole.CUSTOMER;

    // Security: Prevent unauthorized ADMIN registration
    if (role === UserRole.ADMIN) {
      throw new UnauthorizedException('Cannot register as Admin publicly');
    }

    if (registrationData.businessName && !registrationData.role) {
      role = UserRole.OWNER;
    }

    // 1. Create User
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    const user = await this.usersService.create({
      firstName: registrationData.firstName || metadata.firstName,
      lastName: registrationData.lastName || metadata.lastName,
      email: registrationData.email,
      password: hashedPassword,
      role: role as UserRole,
      phone: registrationData.phone || metadata.phone,
      businessId: registrationData.businessId, // For staff/managers joining existing business
    });

    // 2. Create Business (only for Owners)
    if (role === UserRole.OWNER && registrationData.businessName) {
      const business = await this.businessesService.create({
        name: registrationData.businessName,
        category: registrationData.category,
        monthlyVisitors: registrationData.monthlyVisitors,
        goal: registrationData.goal,
        ownerId: user.id,
      });

      // Optionally link the owner user to the new businessId
      user.businessId = business.id;
      await this.usersService.create(user); // Save update
    }

    // Consume OTP session
    await this.otpRepository.remove(otpRecord);

    const { password: _password, ...result } = user;
    return this.login(result);
  }

  // --- New Dedicated Owner Registration ---
  async registerOwner(dto: RegisterOwnerDto) {
    // 1. Verify OTP and Retrieve Metadata
    const otpRecord = await this.otpRepository.findOne({
      where: { email: dto.email },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Verification session not found');
    }

    if (!otpRecord.isVerified) {
      throw new BadRequestException(
        'OTP must be verified before completing registration',
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('Registration session expired');
    }

    const registrationData = otpRecord.metadata as RequestOtpDto;
    if (!registrationData) {
      throw new BadRequestException('Registration metadata missing');
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 2. Create User (Owner)
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.OWNER,
      phone: registrationData.phone,
    });

    // 3. Create Business with detailed info
    const goalString = Array.isArray(dto.goals)
      ? dto.goals.join(', ')
      : dto.goals;

    const business = await this.businessesService.create({
      name: dto.businessName,
      category: dto.category,
      monthlyVisitors: dto.visitors,
      goal: goalString,
      logoUrl: dto.businessLogo,
      ownerId: user.id,
      address: dto.businessAddress,
      website: dto.businessWebsite,
      whatsappNumber: dto.whatsappNumber,
      officialEmail: dto.officialEmail,
    });

    // 4. Link User to Business
    user.businessId = business.id;
    await this.usersService.create(user);

    // 5. Auto-Generate Device for Business
    await this.devicesService.createAutoDevice(business.id);

    // Consume OTP
    await this.otpRepository.remove(otpRecord);

    return this.login(user);
  }

  // --- New Dedicated Admin Registration ---
  async registerAdmin(dto: RegisterAdminDto) {
    const defaultCode = 'admin_secret_123';
    const envCode = process.env.ADMIN_ACCOUNT_CODE;

    // Safety check just in case env code is not set, don't allow open registration
    if (!envCode) {
      throw new BadRequestException(
        'Admin registration is not correctly configured on the server',
      );
    }

    if (dto.adminAccountCode !== envCode) {
      throw new UnauthorizedException('Invalid admin account code');
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Create User (Admin)
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.ADMIN, // Explicitly ADMIN
      phone: dto.phone || undefined,
    });

    return this.login(user);
  }

  async requestPasswordReset(dto: PasswordResetOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // For security, don't reveal if user exists, but we can log internally.
      // However, usually we just say "If an account exists, you will receive an email".
      return {
        message:
          'If an account exists with this email, a reset code has been sent.',
      };
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otp = this.otpRepository.create({
      email: dto.email,
      code,
      expiresAt,
      metadata: { type: 'password_reset' },
    });
    await this.otpRepository.save(otp);

    await this.mailService.sendPasswordResetOtp(dto.email, code);

    return {
      message:
        'If an account exists with this email, a reset code has been sent.',
    };
  }

  async resetPassword(
    dto: ResetPasswordDto,
    meta?: { ip: string; userAgent: string },
  ) {
    const otpRecord = await this.otpRepository.findOne({
      where: { email: dto.email },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) throw new BadRequestException('Reset session not found');
    if (otpRecord.code !== dto.otp)
      throw new BadRequestException('Invalid reset code');
    if (new Date() > otpRecord.expiresAt)
      throw new BadRequestException('Reset code expired');

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User no longer exists');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword, {
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    await this.otpRepository.remove(otpRecord);

    return { message: 'Password reset successfully' };
  }
}
