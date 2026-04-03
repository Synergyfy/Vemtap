import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateFaqTriggerDto {
  @ApiProperty({ example: ['pricing', 'cost'] })
  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @ApiProperty({ example: 'Pricing is $10/mo' })
  @IsString()
  response: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  branchId: string;
}

export class UpdateFaqTriggerDto {
  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  response?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
