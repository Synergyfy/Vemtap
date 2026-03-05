import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
} from 'class-validator';
import type { FlowStructure } from '../interfaces/flow-engine.interface';

export class CreateFlowTemplateDto {
  @ApiProperty({ example: 'Welcome Flow', description: 'Name of the template' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'A simple welcome flow for new customers',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'new_customer', description: 'Trigger type' })
  @IsString()
  triggerType: string;

  @ApiProperty({ example: 'v1', required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({
    example: 'active',
    required: false,
    enum: ['active', 'inactive'],
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: { nodes: [], edges: [] },
    description: 'JSON structure of the flow',
  })
  @IsObject()
  structure: FlowStructure;
}

export class UpdateFlowTemplateDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  triggerType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ required: false, enum: ['active', 'inactive'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  structure?: FlowStructure;
}

export class UpdateFlowTriggerConfigDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  inactivityDays?: number;
}
