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
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Otp } from './entities/otp.entity';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { PasswordResetOtpDto } from './dto/password-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private businessesService: BusinessesService,
    private devicesService: DevicesService,
    private subscriptionsService: SubscriptionsService,
    private mailService: MailService,
    private jwtService: JwtService,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  async requestOwnerOtp(dto: RequestOtpDto) {
    const email = dto.email.toLowerCase();
    const existingUserByEmail = await this.usersService.findByEmail(email);
    if (existingUserByEmail && existingUserByEmail.status !== UserStatus.PENDING) {
      throw new ConflictException('User with this email already exists');
    }

    const existingUserByPhone = await this.usersService.findByPhone(dto.phone);
    if (existingUserByPhone && existingUserByPhone.status !== UserStatus.PENDING) {
      throw new ConflictException('User with this phone number already exists');
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit OTP
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

    // Save OTP with metadata
    const otp = this.otpRepository.create({
      email,
      code,
      expiresAt,
      metadata: { ...dto, email },
    });
    await this.otpRepository.save(otp);

    // Send Email
    await this.mailService.sendOtp(email, code);

    return { message: 'OTP sent successfully' };
  }

  async sendOtp(dto: any) {
    const email = (typeof dto === 'string' ? dto : dto.email).toLowerCase();
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
      metadata: typeof dto === 'object' ? { ...dto, email } : undefined,
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

  async validateUser(
    identifier: string,
    pass: string,
  ): Promise<Partial<User> | null> {
    const user = await this.usersService.findByIdentifier(identifier);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  private async generateAuthResponse(user: Partial<User>) {
    let businessId: string | undefined;

    if (user.role === UserRole.OWNER) {
      const business = await this.businessesService.findByOwner(
        user.id as string,
      );
      if (business) {
        businessId = business.id;
      }
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      branchId: user.branchId,
      businessId: businessId || (user as any).businessId,
    };
    delete user.password;
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByIdentifier(dto.identifier);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    const { password: _password, ...result } = user;
    return this.generateAuthResponse(result as User);
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

    // Determine Role (Default to OWNER if businessName is provided, else CUSTOMER)
    let role = registrationData.role || UserRole.CUSTOMER;

    // Security: Prevent unauthorized ADMIN registration
    if (role === UserRole.ADMIN) {
      throw new UnauthorizedException('Cannot register as Admin publicly');
    }

    if (registrationData.businessName && !registrationData.role) {
      role = UserRole.OWNER;
    }

    // 1. Create or Update User
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    let user: User;

    if (existingUser && existingUser.status === UserStatus.INVITED) {
      // Complete registration for invited user
      existingUser.firstName =
        registrationData.firstName ||
        metadata.firstName ||
        existingUser.firstName;
      existingUser.lastName =
        registrationData.lastName || metadata.lastName || existingUser.lastName;
      existingUser.password = hashedPassword;
      existingUser.role =
        (registrationData.role as UserRole) || existingUser.role;
      existingUser.status = UserStatus.ACTIVE;
      existingUser.phone =
        registrationData.phone || metadata.phone || existingUser.phone;
      user = await this.usersService.create(existingUser);
    } else if (existingUser && existingUser.status === UserStatus.PENDING) {
      // Resume registration for pending user
      existingUser.firstName =
        registrationData.firstName ||
        metadata.firstName ||
        existingUser.firstName;
      existingUser.lastName =
        registrationData.lastName || metadata.lastName || existingUser.lastName;
      existingUser.password = hashedPassword;
      existingUser.role =
        (registrationData.role as UserRole) || existingUser.role;
      existingUser.status = UserStatus.ACTIVE;
      existingUser.phone =
        registrationData.phone || metadata.phone || existingUser.phone;
      user = await this.usersService.create(existingUser);
    } else {
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      user = await this.usersService.create({
        firstName: registrationData.firstName || metadata.firstName,
        lastName: registrationData.lastName || metadata.lastName,
        email: registrationData.email,
        password: hashedPassword,
        role: role as UserRole,
        status:
          role === UserRole.CUSTOMER ? UserStatus.ACTIVE : UserStatus.PENDING,
        phone: registrationData.phone || metadata.phone,
        branchId: registrationData.branchId, // Use branchId instead of businessId
      });
    }

    // 2. Create Business (only for Owners)
    if (
      user.role === UserRole.OWNER &&
      registrationData.businessName &&
      !user.branchId
    ) {
      // BusinessesService.create handles main branch creation and linking owner
      const business = await this.businessesService.create({
        name: registrationData.businessName,
        categoryId: registrationData.categoryId,
        subcategoryId: registrationData.subcategoryId,
        otherSubcategoryName: registrationData.otherSubcategoryName,
        monthlyVisitors: registrationData.monthlyVisitors,
        goal: registrationData.goal,
        ownerId: user.id,
      });

      // Auto-Subscribe to Free Plan if available
      try {
        await this.subscriptionsService.subscribeToFreePlan(business.id);
      } catch (error) {
        console.error('Failed to auto-subscribe to free plan:', error);
      }

      // Fetch fresh user with branchId
      const refreshed = await this.usersService.findOne(user.id);
      if (refreshed) user = refreshed;
    }

    // Consume OTP session
    await this.otpRepository.remove(otpRecord);

    const { password: _password, ...result } = user;
    return this.generateAuthResponse(result as User);
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
    if (existingUser && existingUser.status !== UserStatus.PENDING) {
      throw new ConflictException('Email already exists');
    }

    // 2. Create or Update User (Owner)
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    let user: User;

    if (existingUser) {
      // Update existing pending user
      existingUser.firstName = registrationData.firstName;
      existingUser.lastName = registrationData.lastName;
      existingUser.password = hashedPassword;
      existingUser.phone = registrationData.phone;
      existingUser.engagement = dto.engagement;
      user = await this.usersService.create(existingUser);
    } else {
      user = await this.usersService.create({
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        email: dto.email,
        password: hashedPassword,
        role: UserRole.OWNER,
        status: UserStatus.PENDING,
        phone: registrationData.phone,
        engagement: dto.engagement,
      });
    }

    // 3. Create Business with detailed info (Optional - user can finish later)
    if (dto.businessName) {
      const goalString = Array.isArray(dto.goals)
        ? dto.goals.join(', ')
        : dto.goals;

      // Check if business already exists for this owner
      let business = await this.businessesService.findByOwner(user.id);

      if (!business) {
        business = await this.businessesService.create({
          name: dto.businessName,
          categoryId: dto.categoryId,
          subcategoryId: dto.subcategoryId,
          otherSubcategoryName: dto.otherSubcategoryName,
          monthlyVisitors: dto.visitors,
          goal: goalString,
          logoUrl: dto.businessLogo,
          ownerId: user.id,
          address: dto.businessAddress,
          website: dto.businessWebsite,
          state: dto.state,
          city: dto.city,
          whatsappNumber: dto.whatsappNumber,
          officialEmail: dto.officialEmail,
          phone: dto.businessNumber,
          isRegistered: dto.isRegistered,
        });
      } else {
        // Update existing business if needed
        await this.businessesService.update(business.id, {
          name: dto.businessName,
          categoryId: dto.categoryId,
          subcategoryId: dto.subcategoryId,
          otherSubcategoryName: dto.otherSubcategoryName,
          monthlyVisitors: dto.visitors,
          goal: goalString,
          logoUrl: dto.businessLogo,
          address: dto.businessAddress,
          website: dto.businessWebsite,
          state: dto.state,
          city: dto.city,
          whatsappNumber: dto.whatsappNumber,
          officialEmail: dto.officialEmail,
          phone: dto.businessNumber,
          isRegistered: dto.isRegistered,
        } as any);
      }

      // 4. Finalize User Status if business is created
      user.status = UserStatus.ACTIVE;
      await this.usersService.create(user);

      // 5. Auto-Subscribe to Free Plan if available
      try {
        await this.subscriptionsService.subscribeToFreePlan(business.id);
      } catch (error) {
        // We don't want to fail the whole registration if auto-subscription fails
        console.error('Failed to auto-subscribe to free plan:', error);
      }
    }

    // Fetch fresh user with branchId (linked during business creation)
    const updatedUser = await this.usersService.findOne(user.id);
    if (!updatedUser) {
      throw new NotFoundException('User not found after registration');
    }

    // Consume OTP
    await this.otpRepository.remove(otpRecord);

    return this.generateAuthResponse(updatedUser);
  }

  // --- New Dedicated Admin Registration ---
  async registerAdmin(dto: RegisterAdminDto) {
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
      status: UserStatus.ACTIVE,
      phone: dto.phone || undefined,
    });

    return this.generateAuthResponse(user);
  }

  async requestPasswordReset(dto: PasswordResetOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
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

  async switchRole(user: User, targetRole: UserRole) {
    // Only Owners can switch to Customer
    if (user.role === UserRole.OWNER && targetRole !== UserRole.CUSTOMER) {
      throw new BadRequestException('Owners can only switch to Customer role');
    }

    // A user who is currently a CUSTOMER in their JWT but is an OWNER in DB can switch back
    const dbUser = await this.usersService.findOne(user.id);
    if (!dbUser) throw new NotFoundException('User not found');

    if (targetRole === UserRole.OWNER && dbUser.role !== UserRole.OWNER) {
      throw new BadRequestException('You are not an owner');
    }

    // Generate new token with target role
    const payload = {
      email: dbUser.email,
      sub: dbUser.id,
      role: targetRole,
      branchId: dbUser.branchId,
      // If switching to OWNER, we need businessId
      businessId:
        targetRole === UserRole.OWNER
          ? (await this.businessesService.findByOwner(dbUser.id))?.id
          : undefined,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        ...dbUser,
        role: targetRole,
      },
    };
  }
}
