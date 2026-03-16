import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsUUID,
  IsEmail,
} from 'class-validator';
import { BusinessStatus } from '../entities/business.entity';

export class AdminCreateBusinessDto {
  @ApiProperty({
    example: 'VemTap Head Office',
    description: 'The name of the business',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the business owner',
  })
  @IsString()
  @IsNotEmpty()
  ownerFirstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the business owner',
  })
  @IsString()
  @IsNotEmpty()
  ownerLastName: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email address of the business owner',
  })
  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password for the new business owner',
  })
  @IsString()
  @IsNotEmpty()
  ownerPassword: string;

  @ApiPropertyOptional({
    example: '+2348000000000',
    description: 'The phone number of the business owner',
  })
  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @ApiPropertyOptional({ enum: BusinessStatus, example: BusinessStatus.ACTIVE })
  @IsEnum(BusinessStatus)
  @IsOptional()
  status?: BusinessStatus;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @ApiPropertyOptional({ example: 'Art Studio' })
  @IsOptional()
  @IsString()
  otherSubcategoryName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '123 Main St, Lagos' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Ikeja' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'https://vemtap.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ example: '+2348000000000' })
  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @ApiPropertyOptional({ example: 'hello@vemtap.com' })
  @IsEmail()
  @IsOptional()
  officialEmail?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isRegistered?: boolean;

  @ApiPropertyOptional({ example: 'RC1234567' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: ['https://example.com/doc.pdf'] })
  @IsOptional()
  @IsString({ each: true })
  documents?: string[];
}
