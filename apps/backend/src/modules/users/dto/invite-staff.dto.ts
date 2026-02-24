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
  VISITORS = 'visitors',
  MESSAGES = 'messages',
  MESSAGING = 'messaging', // Add both since they might be used
  STAFF = 'staff',
  ANALYTICS = 'analytics',
  CAMPAIGNS = 'campaigns',
  REWARDS = 'rewards',
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

  @ApiProperty({
    enum: [UserRole.MANAGER, UserRole.STAFF],
    example: UserRole.STAFF,
  })
  @IsEnum(UserRole)
  role: UserRole;

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

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;
}
