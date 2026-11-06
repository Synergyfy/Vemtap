import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PosTillStatus } from '../entities/pos-enums';

export class CreatePosTillDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: 'Front Counter' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional({
    example: 'TILL-01',
    description: 'Unique per business; generated when omitted',
  })
  @IsOptional()
  @Matches(/^[A-Z0-9-]{2,24}$/, {
    message: 'code must be 2–24 capital letters, digits or dashes',
  })
  code?: string;

  @ApiPropertyOptional({ example: 'iPad Air · 192.168.1.20' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceLabel?: string;
}

export class UpdatePosTillDto {
  @ApiPropertyOptional({ example: 'Bar Till' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ example: 'iPad mini · 192.168.1.21' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceLabel?: string;

  @ApiPropertyOptional({
    enum: [PosTillStatus.IDLE, PosTillStatus.OFFLINE, PosTillStatus.DISABLED],
    description:
      'active is derived from an open session and cannot be set directly',
  })
  @IsOptional()
  @IsEnum(PosTillStatus)
  status?: PosTillStatus;
}

export class PosTillOccupantDto {
  @ApiProperty() sessionId: string;
  @ApiProperty() cashierId: string;
  @ApiProperty({ example: 'Emeka Okafor', nullable: true })
  cashierName: string | null;
  @ApiProperty() openedAt: Date;
}

export class PosTillResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() branchId: string;
  @ApiProperty({ example: 'Front Counter' }) name: string;
  @ApiProperty({ example: 'TILL-01' }) code: string;
  @ApiProperty({ enum: PosTillStatus }) status: PosTillStatus;
  @ApiProperty({ nullable: true }) deviceLabel: string | null;
  @ApiProperty({ nullable: true }) lastSeenAt: Date | null;
  @ApiProperty({ type: PosTillOccupantDto, nullable: true })
  occupant: PosTillOccupantDto | null;
  @ApiProperty({ example: 124500 }) todaySales: number;
  @ApiProperty({ example: 37 }) todayTransactions: number;
}

export class PosTillListResponseDto {
  @ApiProperty({ type: [PosTillResponseDto] }) data: PosTillResponseDto[];
  @ApiProperty({
    example: 3,
    nullable: true,
    description: 'Plan terminal limit; null when uncapped',
  })
  limit: number | null;
}

export class PosBranchSummaryDto {
  @ApiProperty() branchId: string;
  @ApiProperty({ example: 'Wuse 2' }) name: string;
  @ApiProperty({ nullable: true }) address: string | null;
  @ApiProperty({ example: 342850 }) todaySales: number;
  @ApiProperty({ example: 142 }) todayTransactions: number;
  @ApiProperty({ example: 3 }) tillCount: number;
  @ApiProperty({ example: 2 }) openSessions: number;
  @ApiProperty({ description: "True for the caller's own branch" })
  current: boolean;
}
