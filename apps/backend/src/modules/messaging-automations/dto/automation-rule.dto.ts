import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsBoolean, IsOptional, IsUUID, IsObject } from 'class-validator';
import { TriggerType, TargetType, ActionType } from '../enums/rule.enums';

export class CreateAutomationRuleDto {
  @ApiProperty({ example: 'Welcome Message' })
  @IsString()
  name: string;

  @ApiProperty({ enum: TriggerType })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiProperty({ enum: TargetType })
  @IsEnum(TargetType)
  targetType: TargetType;

  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  actionType: ActionType;

  @ApiPropertyOptional({ example: { message: 'Hello!' } })
  @IsObject()
  @IsOptional()
  actionConfig?: any;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class UpdateAutomationRuleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: TriggerType })
  @IsEnum(TriggerType)
  @IsOptional()
  triggerType?: TriggerType;

  @ApiPropertyOptional({ enum: TargetType })
  @IsEnum(TargetType)
  @IsOptional()
  targetType?: TargetType;

  @ApiPropertyOptional({ enum: ActionType })
  @IsEnum(ActionType)
  @IsOptional()
  actionType?: ActionType;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  actionConfig?: any;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
