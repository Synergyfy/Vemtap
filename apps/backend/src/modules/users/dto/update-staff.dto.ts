import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsEmail,
} from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';
import { StaffPermission } from './invite-staff.dto';

export class UpdateStaffDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: 'Senior Manager', required: false })
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

  @ApiProperty({ enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
