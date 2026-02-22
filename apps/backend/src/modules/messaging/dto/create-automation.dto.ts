import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AutomationTriggerType } from '../entities/automation-rule.entity';
import { Channel } from '../enums/channel.enum';

export class CreateAutomationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: AutomationTriggerType })
  @IsEnum(AutomationTriggerType)
  triggerType: AutomationTriggerType;

  @ApiProperty({ enum: Channel })
  @IsEnum(Channel)
  actionChannel: Channel;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  actionTemplateId: string;

  @ApiProperty()
  @IsOptional()
  delaySeconds?: number;

  @ApiProperty()
  @IsOptional()
  conditions?: any;

  @ApiProperty()
  @IsOptional()
  @IsString()
  branchId?: string;
}
