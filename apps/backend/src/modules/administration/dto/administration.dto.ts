import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsArray,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';
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

  @ApiProperty({
    enum: BackendModule,
    isArray: true,
    example: [BackendModule.LOYALTY, BackendModule.TICKETS],
  })
  @IsArray()
  @IsEnum(BackendModule, { each: true })
  @IsNotEmpty()
  permissions: BackendModule[];
}

export class GenerateImpersonationTokenDto {
  @ApiProperty({ example: 'agent-uuid', required: false })
  @IsUUID()
  @IsOptional()
  actorId?: string;

  @ApiProperty({ example: 'branch-uuid' })
  @IsUUID()
  @IsNotEmpty()
  targetBranchId: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;
}

export class GenerateCustomerImpersonationTokenDto {
  @ApiProperty({ example: 'customer-user-uuid' })
  @IsUUID()
  @IsNotEmpty()
  targetCustomerId: string;

  @ApiProperty({ example: 'branch-uuid' })
  @IsUUID()
  @IsNotEmpty()
  targetBranchId: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;
}

import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AuditLogFilterDto extends PaginationQueryDto {
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
}
