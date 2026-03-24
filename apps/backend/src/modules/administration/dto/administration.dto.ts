import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsArray, IsEnum, IsOptional } from 'class-validator';
import { BackendModule } from '../../../common/enums/backend-module.enum';

export class AdminCreateAgentDto {
  @ApiProperty({ example: 'agent@vemtap.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '+2348000000000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ enum: BackendModule, isArray: true, example: [BackendModule.LOYALTY, BackendModule.TICKETS] })
  @IsArray()
  @IsEnum(BackendModule, { each: true })
  @IsNotEmpty()
  permissions: BackendModule[];
}

export class GenerateImpersonationTokenDto {
  @ApiProperty({ example: 'agent-uuid-or-admin-uuid' })
  @IsString()
  @IsNotEmpty()
  actorId: string;

  @ApiProperty({ example: 'branch-uuid' })
  @IsString()
  @IsNotEmpty()
  targetBranchId: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z' })
  @IsNotEmpty()
  expiresAt: Date;
}

export class AuditLogFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ required: false, enum: BackendModule })
  @IsOptional()
  @IsEnum(BackendModule)
  module?: BackendModule;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  limit?: number = 10;
}
