import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  push?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  email?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  orderUpdates?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  loyalty?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  support?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  rewardAlerts?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activityDigest?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  smsSecurity?: boolean;
}
