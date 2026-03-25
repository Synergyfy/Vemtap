import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
} from 'class-validator';

export class CreateSegmentDto {
  @ApiProperty({ example: 'VIP Customers' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Customers with high visit frequency' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-branch' })
  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class UpdateSegmentDto {
  @ApiPropertyOptional({ example: 'VIP Gold' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class SegmentMemberDto {
  @ApiProperty({ example: ['uuid-user-1', 'uuid-user-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}
