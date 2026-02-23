import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsNotEmpty,
} from 'class-validator';
import { BusinessType, BusinessStatus } from '../entities/business.entity';

export class AdminCreateBusinessDto {
    @ApiProperty({ example: 'VemTap Head Office', description: 'The name of the business' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'owner-uuid-here', description: 'The user ID of the business owner' })
    @IsString()
    @IsNotEmpty()
    ownerId: string;

    @ApiPropertyOptional({ enum: BusinessType, example: BusinessType.RETAIL })
    @IsEnum(BusinessType)
    @IsOptional()
    type?: BusinessType;

    @ApiPropertyOptional({ enum: BusinessStatus, example: BusinessStatus.ACTIVE })
    @IsEnum(BusinessStatus)
    @IsOptional()
    status?: BusinessStatus;

    @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
    @IsString()
    @IsOptional()
    logoUrl?: string;

    @ApiPropertyOptional({ example: '123 Main St, Lagos' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ example: 'https://vemtap.com' })
    @IsString()
    @IsOptional()
    website?: string;

    @ApiPropertyOptional({ example: '+2348000000000' })
    @IsString()
    @IsOptional()
    whatsappNumber?: string;

    @ApiPropertyOptional({ example: 'hello@vemtap.com' })
    @IsString()
    @IsOptional()
    officialEmail?: string;
}
