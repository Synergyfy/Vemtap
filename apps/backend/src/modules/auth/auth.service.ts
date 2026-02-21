import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { Otp } from './entities/otp.entity';
import { RegisterOwnerDto } from './dto/register-owner.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private businessesService: BusinessesService,
    private mailService: MailService,
    private jwtService: JwtService,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  async sendOtp(email: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit OTP
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

    // Save OTP
    const otp = this.otpRepository.create({
      email,
      code,
      expiresAt,
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
    await this.otpRepository.remove(otpRecord); // Consume OTP
    return { message: 'OTP verified successfully' };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
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
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      email: registrationData.email,
      password: hashedPassword,
      role: role as UserRole,
      phone: registrationData.phone,
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

    const { password, ...result } = user;
    return result;
  }

  // --- New Dedicated Owner Registration ---
  async registerOwner(dto: RegisterOwnerDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 1. Create User (Owner)
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.OWNER, // Explicitly OWNER
      phone: dto.businessNumber || undefined, // Use business number as user phone if generic phone not provided? Frontend sends 'businessNumber' and 'whatsappNumber'
      // Frontend doesn't explicitly send user phone, just business phone. Using businessNumber for now.
    });

    // 2. Create Business with detailed info
    // Join array goals to string if needed, or update Business entity to support array.
    // Current entity 'goal' is a string. We can join them or pick the first.
    const goalString = Array.isArray(dto.goals)
      ? dto.goals.join(', ')
      : dto.goals;

    const business = await this.businessesService.create({
      name: dto.businessName,
      category: dto.category,
      monthlyVisitors: dto.visitors, // Frontend field mapped to entity
      goal: goalString,
      logoUrl: dto.businessLogo,
      ownerId: user.id,
      // New fields
      address: dto.businessAddress,
      website: dto.businessWebsite,
      whatsappNumber: dto.whatsappNumber,
      officialEmail: dto.officialEmail,
    });

    // 3. Link User to Business
    user.businessId = business.id;
    await this.usersService.create(user); // Update user with businessId

    // Return auth response (token + user) or just user?
    // Usually auto-login after register is good UX.
    return this.login(user);
  }
}
