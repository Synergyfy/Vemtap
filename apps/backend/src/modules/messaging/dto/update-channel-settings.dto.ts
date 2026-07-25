import { IsOptional, IsString, IsEnum, IsBoolean, IsUUID, MaxLength, MinLength, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SmsRoutingMode, EmailDomainStatus } from '../entities/messaging-channel-setting.entity';

export class UpdateChannelSettingsDto {
  @ApiPropertyOptional({ description: 'Branch UUID filter/scope' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Custom SMS Sender ID', example: 'VemTap' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(11)
  smsSenderId?: string;

  @ApiPropertyOptional({
    description: 'SMS global routing strategy',
    enum: SmsRoutingMode,
    example: SmsRoutingMode.AFRICA_OPTIMIZED,
  })
  @IsOptional()
  @IsEnum(SmsRoutingMode)
  smsRouting?: SmsRoutingMode;

  @ApiPropertyOptional({ description: 'Meta WhatsApp Phone Number ID' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  whatsappPhoneNumberId?: string;

  @ApiPropertyOptional({ description: 'Meta WABA Account ID' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  whatsappWabaAccountId?: string;

  @ApiPropertyOptional({ description: 'Meta System User Token' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  whatsappSystemUserToken?: string;

  @ApiPropertyOptional({ description: 'Require double opt-in for subscribers' })
  @IsOptional()
  @IsBoolean()
  whatsappRequireDoubleOptIn?: boolean;

  @ApiPropertyOptional({ description: 'Enable auto reply on STOP' })
  @IsOptional()
  @IsBoolean()
  whatsappEnableStopAutoReply?: boolean;

  @ApiPropertyOptional({ description: 'Email From Name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emailFromName?: string;

  @ApiPropertyOptional({ description: 'Email From Email Address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  emailFromEmail?: string;

  @ApiPropertyOptional({ description: 'Email Custom Domain' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emailCustomDomain?: string;

  @ApiPropertyOptional({ description: 'Trigger DNS Record Generation' })
  @IsOptional()
  @IsBoolean()
  generateDnsRecords?: boolean;

  @ApiPropertyOptional({ description: 'Email Domain Verification Status', enum: EmailDomainStatus })
  @IsOptional()
  @IsEnum(EmailDomainStatus)
  emailDomainStatus?: EmailDomainStatus;
}
