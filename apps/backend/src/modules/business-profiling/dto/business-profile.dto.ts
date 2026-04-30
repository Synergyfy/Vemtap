import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProfileStatus } from '../entities/business-profile.entity';

export class CreateBusinessProfileDto {
  @ApiProperty({ example: 'Chicken Republic' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ example: 'Wuse, Abuja', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'contact@chickenrepublic.com', required: true })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ example: '+2348000000000', required: false })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({ example: 'Restaurant', required: false })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiProperty({
    example: { doYouHaveMenu: true, footTraffic: 'high' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  responses?: Record<string, any>;

  @ApiProperty({
    example: { hasTableService: true, highFootTraffic: true },
    required: false,
  })
  @IsObject()
  @IsOptional()
  physicalSetup?: Record<string, any>;

  @ApiProperty({ example: { strategy: 'Table QR' }, required: false })
  @IsObject()
  @IsOptional()
  qrPlacement?: Record<string, any>;

  @ApiProperty({ example: 'Discussed about loyalty program.', required: false })
  @IsString()
  @IsOptional()
  @IsOptional()
  notes?: string;

  @ApiProperty({ enum: ProfileStatus, required: false })
  @IsEnum(ProfileStatus)
  @IsOptional()
  status?: ProfileStatus;

  @ApiProperty({ example: 45, required: false })
  @IsOptional()
  xpEarned?: number;

  @ApiProperty({ example: ['first_step'], required: false })
  @IsOptional()
  achievements?: string[];
}

export class UpdateBusinessProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  responses?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  physicalSetup?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  qrPlacement?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ enum: ProfileStatus, required: false })
  @IsEnum(ProfileStatus)
  @IsOptional()
  status?: ProfileStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  xpEarned?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  achievements?: string[];
}
