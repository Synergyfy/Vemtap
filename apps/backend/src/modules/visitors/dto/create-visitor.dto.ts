import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';

export class CreateVisitorDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+234 801 234 5678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'New', enum: ['New', 'Active', 'VIP', 'Returning'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Branch ID where visitor is being registered (required if deviceId not provided)',
    required: false,
  })
  @IsString()
  branchId?: string;
}
