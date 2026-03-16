import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto, SendOtpDto } from './dto/otp.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { PasswordResetOtpDto } from './dto/password-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';
import {
  AuthResponseDto,
  MessageResponseDto,
  VerifyOtpResponseDto,
} from './dto/responses.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP to email' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({
    status: 201,
    description: 'OTP sent successfully',
    type: MessageResponseDto,
  })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.email);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    type: VerifyOtpResponseDto,
  })
  async verifyOtp(@Body() otpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(otpDto.email, otpDto.code);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/phone and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user (Generic)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('register/owner/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for Owner Registration' })
  @ApiBody({ type: RequestOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: MessageResponseDto,
  })
  async requestOwnerOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOwnerOtp(dto);
  }

  @Public()
  @Post('register/owner')
  @ApiOperation({ summary: 'Register a Business Owner (Full Onboarding)' })
  @ApiBody({ type: RegisterOwnerDto })
  @ApiResponse({
    status: 201,
    description: 'Owner registered successfully',
    type: AuthResponseDto,
  })
  async registerOwner(@Body() registerOwnerDto: RegisterOwnerDto) {
    return this.authService.registerOwner(registerOwnerDto);
  }

  @Public()
  @Post('register/admin')
  @ApiOperation({ summary: 'Register an Admin account' })
  @ApiBody({
    type: RegisterAdminDto,
    examples: {
      success: {
        summary: 'Valid Admin Registration Payload',
        value: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@vemtap.com',
          password: 'securePassword123!',
          phone: '+1234567890',
          adminAccountCode: 'admin_secret_123',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Admin created successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (validation error or configuration error)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (invalid admin account code)',
  })
  @ApiResponse({ status: 409, description: 'Conflict (email already exists)' })
  async registerAdmin(@Body() registerAdminDto: RegisterAdminDto) {
    return this.authService.registerAdmin(registerAdminDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: User,
  })
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Post('password-reset/request')
  @ApiOperation({ summary: 'Request a password reset OTP' })
  @ApiBody({ type: PasswordResetOtpDto })
  async requestPasswordReset(@Body() dto: PasswordResetOtpDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('password-reset/reset')
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Request() req, @Body() dto: ResetPasswordDto) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.resetPassword(dto, { ip, userAgent });
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-role')
  @ApiOperation({
    summary: 'Switch current active role (e.g. Owner to Customer)',
  })
  @ApiBody({ type: SwitchRoleDto })
  @ApiResponse({
    status: 200,
    description: 'Role switched successfully, returns new access token',
    type: AuthResponseDto,
  })
  async switchRole(@Request() req, @Body() dto: SwitchRoleDto) {
    return this.authService.switchRole(req.user, dto.role);
  }
}
