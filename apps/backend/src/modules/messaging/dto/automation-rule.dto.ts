import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsObject,
  IsUUID,
} from 'class-validator';
import { TriggerType, ActionType, TargetType } from '../enums/automation.enum';

export class CreateAutomationRuleDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ example: 'uuid-of-business' })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiProperty({ example: 'Post-Visit Welcome' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: TriggerType, example: TriggerType.FIRST_MESSAGE })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiPropertyOptional({ enum: TargetType, example: TargetType.NEW_VISITORS })
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @ApiPropertyOptional({
    example: 3600,
    description: 'Delay in seconds before execution',
  })
  @IsOptional()
  @IsNumber()
  delaySeconds?: number;

  @ApiProperty({ enum: ActionType, example: ActionType.SEND_WHATSAPP })
  @IsEnum(ActionType)
  actionType: ActionType;

  @ApiPropertyOptional({
    example: { content: 'Hi {{visitor_name}}!', loyaltyPoints: 10 },
    description: 'Configuration for the action',
  })
  @IsOptional()
  @IsObject()
  actionConfig?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAutomationRuleDto {
  @ApiPropertyOptional({ example: 'Updated Rule Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: TriggerType, example: TriggerType.FIRST_MESSAGE })
  @IsOptional()
  @IsEnum(TriggerType)
  triggerType?: TriggerType;

  @ApiPropertyOptional({ enum: TargetType, example: TargetType.NEW_VISITORS })
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @ApiPropertyOptional({ example: 7200 })
  @IsOptional()
  @IsNumber()
  delaySeconds?: number;

  @ApiPropertyOptional({ enum: ActionType, example: ActionType.SEND_WHATSAPP })
  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @ApiPropertyOptional({ example: { content: 'New message content' } })
  @IsOptional()
  @IsObject()
  actionConfig?: Record<string, any>;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AutomationTriggerDto {
  branchId: string;
  customerId: string;
  content?: string;
  metadata?: Record<string, any>;
}

export class UpdateAutomationToggleDto {
  @ApiProperty({ example: true })
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ example: 'uuid-of-branch' })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export class UpdateAutomationConfigDto {
  @ApiPropertyOptional({
    example: 'Hi {{visitor_name}}, thanks for visiting {{business_name}}!',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  loyaltyPoints?: number;

  @ApiPropertyOptional({ example: 1, description: 'Delay in days' })
  @IsOptional()
  @IsNumber()
  delayDays?: number;

  @ApiPropertyOptional({ example: 'uuid-of-branch' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-segment' })
  @IsOptional()
  @IsUUID()
  segmentId?: string;
}

export class AutomationLogResponseDto {
  @ApiProperty({ example: 'uuid-log' })
  id: string;
  @ApiProperty({ example: 'Post-Visit Welcome' })
  ruleName: string;
  @ApiProperty({ example: 'uuid-contact' })
  customerId: string;
  @ApiProperty({ example: 'success' })
  status: string;
  @ApiProperty({ example: '2024-02-27T10:00:00.000Z' })
  executedAt: Date;
  @ApiPropertyOptional({ example: 'Connection failed' })
  errorReason?: string;
}

export class AutomationPerformanceResponseDto {
  @ApiProperty({ example: 150 })
  totalMessagesSent: number;
  @ApiProperty({ example: 5 })
  totalFailures: number;
  @ApiProperty({ example: 25 })
  totalRepliesReceived: number;
  @ApiProperty({ example: 16.67 })
  replyRate: number;
  @ApiProperty({ example: 3000 })
  loyaltyPointsIssued: number;
  @ApiProperty({ example: 3 })
  activeAutomationsCount: number;
}
