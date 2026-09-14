import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RequestCustomerSignupOtpDto {
  @ApiProperty({ example: 'Jane Doe', description: 'Full name of the customer' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    example: 'customer@example.com',
    description: 'Email address of the customer',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'Optional phone number',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(),
  )
  phone?: string;

  @ApiPropertyOptional({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'Optional branch ID for visit tracking and CRM attribution',
  })
  @IsOptional()
  @IsUUID('4', { message: 'branchId must be a valid UUID v4' })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(),
  )
  branchId?: string;
}

export class ResendCustomerOtpDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Email address to resend OTP to',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiPropertyOptional({
    example: 'registration',
    description: 'Optional purpose of the OTP (registration, pin-reset, verification)',
  })
  @IsOptional()
  @IsString()
  purpose?: string;
}

export class VerifyAndSetCustomerPinDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Email address of the customer',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code received via email',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  code: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit numeric PIN to serve as customer account password',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'PIN must be exactly 6 digits' })
  pin: string;

  @ApiPropertyOptional({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'Optional branch ID for visit tracking',
  })
  @IsOptional()
  @IsUUID('4', { message: 'branchId must be a valid UUID v4' })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(),
  )
  branchId?: string;
}

export class RequestCustomerPinResetDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Email address for PIN reset',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;
}

export class ResetCustomerPinDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Email address associated with the account',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code received via email',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  otp: string;

  @ApiProperty({
    example: '654321',
    description: 'New 6-digit numeric PIN',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'New PIN must be exactly 6 digits' })
  newPin: string;
}
