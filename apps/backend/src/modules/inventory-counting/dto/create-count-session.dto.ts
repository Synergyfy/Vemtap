import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCountSessionDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isBlind?: boolean;

  @ApiPropertyOptional({ example: 'Aisle 3' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ example: 'End of month shelf count' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Limit count to specific item IDs. If empty, counts all items in the branch.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  itemIds?: string[];
}

export class StartCountSessionDto {
  @ApiProperty({ example: 'uuid-of-session' })
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;
}
