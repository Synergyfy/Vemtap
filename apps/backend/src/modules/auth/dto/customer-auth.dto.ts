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
  @ApiProperty({ example: 'John', description: 'First name of the customer' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value, obj }) => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    const fallback = obj?.name || obj?.fullName;
    if (typeof fallback === 'string' && fallback.trim()) {
      return fallback.trim().split(/\s+/)[0];
    }
    return value;
  })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the customer' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value, obj }) => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    const fallback = obj?.name || obj?.fullName;
    if (typeof fallback === 'string' && fallback.trim()) {
      const parts = fallback.trim().split(/\s+/);
      return parts.length > 1 ? parts.slice(1).join(' ') : 'Customer';
    }
    return value;
  })
  lastName: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Legacy full name support' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Legacy full name support' })
  @IsOptional()
  @IsString()
  fullName?: string;

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
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.otp;
    return typeof raw === 'string' ? raw.trim() : raw;
  })
  code: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Alias for code',
  })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit numeric PIN to serve as customer account password',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'PIN must be exactly 6 digits' })
  pin: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Optional first name',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Optional last name',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Optional full name',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'Optional phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

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
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.code;
    return typeof raw === 'string' ? raw.trim() : raw;
  })
  otp: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Alias for otp',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    example: '654321',
    description: 'New 6-digit numeric PIN',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'New PIN must be exactly 6 digits' })
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.pin;
    return typeof raw === 'string' ? raw.trim() : raw;
  })
  newPin: string;

  @ApiPropertyOptional({
    example: '654321',
    description: 'Alias for newPin',
  })
  @IsOptional()
  @IsString()
  pin?: string;
}
