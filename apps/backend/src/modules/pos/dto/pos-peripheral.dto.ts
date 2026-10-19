import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PosPeripheralConnection,
  PosPeripheralStatus,
  PosPeripheralType,
} from '../entities/pos-enums';

export class CreatePosPeripheralDto {
  @ApiProperty() @IsUUID() branchId: string;

  @ApiPropertyOptional({ description: 'Till it is attached to' })
  @IsOptional()
  @IsUUID()
  tillId?: string;

  @ApiProperty({ enum: PosPeripheralType })
  @IsEnum(PosPeripheralType)
  type: PosPeripheralType;

  @ApiProperty({ example: 'Kitchen printer' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional({ example: 'Epson TM-T20III' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  model?: string;

  @ApiProperty({ enum: PosPeripheralConnection })
  @IsEnum(PosPeripheralConnection)
  connection: PosPeripheralConnection;

  @ApiPropertyOptional({ example: '192.168.1.40' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  address?: string;
}

export class UpdatePosPeripheralDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  tillId?: string;

  @ApiPropertyOptional({ example: 'Bar printer' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ example: 'Epson TM-m30III' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  model?: string;

  @ApiPropertyOptional({ enum: PosPeripheralConnection })
  @IsOptional()
  @IsEnum(PosPeripheralConnection)
  connection?: PosPeripheralConnection;

  @ApiPropertyOptional({ example: '192.168.1.41' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  address?: string;
}

export class PosPeripheralHeartbeatDto {
  @ApiProperty({ enum: PosPeripheralStatus })
  @IsEnum(PosPeripheralStatus)
  status: PosPeripheralStatus;
}

export class PosPeripheralQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;

  @ApiPropertyOptional({ enum: PosPeripheralType })
  @IsOptional()
  @IsEnum(PosPeripheralType)
  type?: PosPeripheralType;
}
