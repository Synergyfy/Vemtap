import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { PosOverrideAction } from '../entities/pos-enums';

export class SetPosStaffPinDto {
  @ApiProperty({ example: '4821', description: '4 to 6 digits' })
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4 to 6 digits' })
  pin: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Supervisors can approve overrides',
  })
  @IsOptional()
  @IsBoolean()
  isSupervisor?: boolean;
}

export class VerifyPosOverrideDto {
  @ApiProperty({ example: '4821' })
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4 to 6 digits' })
  pin: string;

  @ApiProperty({ enum: PosOverrideAction })
  @IsEnum(PosOverrideAction)
  action: PosOverrideAction;

  @ApiPropertyOptional({ description: 'Sale or ticket the approval is for' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ example: 'Customer returned a cold dish' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

export class PosOverrideTokenDto {
  @ApiProperty({ description: 'Pass as overrideToken; valid for 2 minutes' })
  overrideToken: string;
  @ApiProperty() expiresAt: Date;
  @ApiProperty({ example: 'Sarah Ade' }) supervisorName: string;
}

export class PosStaffPinRowDto {
  @ApiProperty() userId: string;
  @ApiProperty({ example: 'Sarah Ade' }) name: string;
  @ApiProperty({ example: 'Manager' }) role: string;
  @ApiProperty({ nullable: true }) branchId: string | null;
  @ApiProperty() hasPin: boolean;
  @ApiProperty() isSupervisor: boolean;
  @ApiProperty({ nullable: true }) lockedUntil: Date | null;
}

export class PosOverrideQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PosOverrideAction })
  @IsOptional()
  @IsEnum(PosOverrideAction)
  action?: PosOverrideAction;
}
