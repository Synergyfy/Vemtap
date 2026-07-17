import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export enum StaffPermission {
  DASHBOARD = 'dashboard',
  INVENTORY = 'inventory',
  POS = 'pos',
  VISITORS = 'visitors',
  MESSAGES = 'messages',
  ENGAGEMENT = 'engagement',
  CUSTOMER_EXPERIENCE = 'customer-experience',
  MARKETING = 'marketing',
  DISCOVERY = 'discovery',
  ANALYTICS = 'analytics',
  STAFF = 'staff',
  SETTINGS = 'settings',
  QRTHRIVE = 'qrthrive',
}

export class InviteStaffDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'staff@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+2348012345678', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Cashier' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ example: 'Sales Associate', required: false })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({
    enum: StaffPermission,
    isArray: true,
    example: [StaffPermission.DASHBOARD, StaffPermission.VISITORS],
    required: false,
  })
  @IsArray()
  @IsEnum(StaffPermission, { each: true })
  @IsOptional()
  permissions?: StaffPermission[];

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;
}
