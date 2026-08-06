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
import { AllowPending } from '../../common/decorators/allow-pending.decorator';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto, SendOtpDto } from './dto/otp.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { PasswordResetOtpDto } from './dto/password-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';
import { CheckStatusDto } from './dto/check-status.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import {
  AuthResponseDto,
  MessageResponseDto,
  VerifyOtpResponseDto,
} from './dto/responses.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User, UserRole } from '../users/entities/user.entity';
import { TwoFactorCodeDto } from './dto/two-factor.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

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

  @Post('email-verification/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.AGENT, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Send an email verification code to the current user' })
  async sendEmailVerification(@Request() req: { user: User }) {
    return this.authService.sendVerificationEmail(req.user.id);
  }

  @Post('email-verification/verify')
  @Public()
  @ApiOperation({ summary: 'Verify an email address with a verification code' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.AGENT, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Start two-factor authentication setup' })
  async setupTwoFactor(@Request() req: { user: User }) {
    return this.authService.setupTwoFactor(req.user.id);
  }

  @Post('2fa/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.AGENT, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Confirm and enable two-factor authentication' })
  async confirmTwoFactor(@Request() req: { user: User }, @Body() dto: TwoFactorCodeDto) {
    return this.authService.confirmTwoFactor(req.user.id, dto);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.AGENT, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  async disableTwoFactor(@Request() req: { user: User }, @Body() dto: TwoFactorCodeDto) {
    return this.authService.disableTwoFactor(req.user.id, dto);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or Register with Google' })
  @ApiBody({ type: GoogleLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Google Authentication successful',
    type: AuthResponseDto,
  })
  async googleAuth(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
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

  @UseGuards(JwtAuthGuard)
  @AllowPending()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        message: 'Password changed successfully',
      },
    },
  })
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.changePassword(req.user, dto, { ip, userAgent });
  }

  @Public()
  @Post('check-status')
  @ApiOperation({ summary: 'Check user status by email or phone' })
  async checkStatus(@Body() dto: CheckStatusDto) {
    return this.authService.checkUserStatus(dto);
  }

  @Public()
  @Post('customer/complete-setup')
  @ApiOperation({ summary: 'Complete customer setup by updating email' })
  async completeCustomerSetup(@Body() dto: UpdateEmailDto) {
    return this.authService.completeCustomerSetup(dto);
  }

  @Public()
  @Post('resend-default-password')
  @ApiOperation({ summary: 'Resend default password to a customer' })
  async resendDefaultPassword(@Body('identifier') identifier: string) {
    return this.authService.resendDefaultPassword(identifier);
  }
}
