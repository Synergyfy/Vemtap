import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

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

  @ApiProperty({ example: ['dashboard', 'visitors'], required: false })
  @IsArray()
  @IsOptional()
  permissions?: string[];
}
