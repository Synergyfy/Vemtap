import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const CUSTOMER_INVITE_CHANNELS = [
  'link',
  'qr',
  'whatsapp',
  'sms',
  'email',
] as const;

export class CreateCustomerInviteDto {
  @ApiPropertyOptional({
    enum: CUSTOMER_INVITE_CHANNELS,
    isArray: true,
    example: ['whatsapp', 'qr'],
    description: 'Where the business plans to share the link (analytics only).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsIn(CUSTOMER_INVITE_CHANNELS, { each: true })
  channels?: string[];
}

export class CustomerInviteResponseDto {
  @ApiProperty({ example: 'k3J9xQ2mVb7LpR4sT8wZ1a' })
  token: string;

  @ApiProperty({
    example: 'https://vemtap.com/join/AB12CD34E?invite=k3J9xQ2mVb7LpR4sT8wZ1a',
  })
  url: string;

  @ApiProperty({ example: '2026-11-20T10:00:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ example: 'Urban Grill' })
  merchantName: string;
}

export class PublicCustomerInviteDto {
  @ApiProperty({ example: 'b3f1c2d4-5e6f-4a1b-9c8d-7e6f5a4b3c2d' })
  merchantId: string;

  @ApiProperty({ example: 'Urban Grill' })
  merchantName: string;

  @ApiProperty({ example: 'AB12CD34E', description: 'Business uniqueCode' })
  merchantSlug: string;

  @ApiProperty({ example: 'https://cdn.vemtap.com/logo.png', nullable: true })
  logoUrl: string | null;

  @ApiProperty({
    example: true,
    description: 'False once the link has expired or been revoked',
  })
  valid: boolean;
}

export class InviteRegistrationDto {
  @ApiProperty({ example: 'Ada Obi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: '+2348031234567' })
  @IsString()
  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: 'Enter a valid phone number' })
  phone: string;

  @ApiPropertyOptional({ example: 'ada@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
}

export class InviteEmailRegistrationDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class InviteRegistrationResponseDto {
  @ApiProperty({
    enum: ['registered', 'pending_email'],
    description:
      '`pending_email` when an email was given and the invitation email was queued',
  })
  status: 'registered' | 'pending_email';

  @ApiProperty({ example: 'Urban Grill' })
  merchantName: string;
}
