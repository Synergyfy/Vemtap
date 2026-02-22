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
import { VerifyOtpDto } from './dto/otp.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP to email' })
  async sendOtp(@Body('email') email: string) {
    return this.authService.sendOtp(email);
  }

  @Public()
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiBody({ type: VerifyOtpDto })
  async verifyOtp(@Body() otpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(otpDto.email, otpDto.code);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user (Generic)' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('register/owner')
  @ApiOperation({ summary: 'Register a Business Owner (Full Onboarding)' })
  @ApiBody({ type: RegisterOwnerDto })
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
          email: 'admin@latap.com',
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
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-string-here',
          email: 'admin@latap.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'Admin',
          phone: '+1234567890',
          status: 'Invited',
          createdAt: '2023-10-25T10:00:00.000Z',
          updatedAt: '2023-10-25T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request (validation error or configuration error)' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid admin account code)' })
  @ApiResponse({ status: 409, description: 'Conflict (email already exists)' })
  async registerAdmin(@Body() registerAdminDto: RegisterAdminDto) {
    return this.authService.registerAdmin(registerAdminDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return req.user;
  }
}
