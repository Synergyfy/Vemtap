import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class UpdateStaffDto {
  @ApiProperty({ enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: 'Senior Manager', required: false })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({
    example: ['dashboard', 'visitors', 'settings'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  permissions?: string[];

  @ApiProperty({ enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
