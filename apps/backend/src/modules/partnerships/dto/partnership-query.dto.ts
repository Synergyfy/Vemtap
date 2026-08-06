import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartnershipStatus } from '../entities/partnership.entity';

export enum InvitationQueryType {
  SENT = 'sent',
  RECEIVED = 'received',
  ALL = 'all',
}

export class PartnershipQueryDto {
  @ApiProperty({
    example: 'd9b2d63d-4c3e-4f30-8025-06be521b191a',
    description: 'The branch ID to query invitations for',
  })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    enum: InvitationQueryType,
    default: InvitationQueryType.ALL,
    description: 'Filter invitations by sent, received, or all',
  })
  @IsOptional()
  @IsEnum(InvitationQueryType)
  type?: InvitationQueryType = InvitationQueryType.ALL;

  @ApiPropertyOptional({
    enum: PartnershipStatus,
    description: 'Filter by partnership status (Pending, Accepted, Declined)',
  })
  @IsOptional()
  @IsEnum(PartnershipStatus)
  status?: PartnershipStatus;

  @ApiPropertyOptional({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
