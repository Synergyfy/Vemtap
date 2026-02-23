import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { TriggerType, ActionType } from '../enums/automation.enum';

export class CreateAutomationRuleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: TriggerType })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  delaySeconds?: number;

  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  actionType: ActionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  actionConfig?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAutomationRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: TriggerType })
  @IsOptional()
  @IsEnum(TriggerType)
  triggerType?: TriggerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  delaySeconds?: number;

  @ApiPropertyOptional({ enum: ActionType })
  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  actionConfig?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AutomationTriggerDto {
  businessId: string;
  branchId?: string;
  contactId: string;
  metadata?: Record<string, any>;
}
