import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReminderTemplateDto {
  @ApiProperty({
    example: 14,
    description: 'Stage in days before expiry (e.g. 14, 7, 3) or 0 for lapsed/expired/inactive',
  })
  @IsInt()
  @Min(0)
  stage: number;

  @ApiProperty({
    example: '14-Day Expiry Reminder',
    description: 'Name of the template',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Sent 14 days before subscription expires',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'Your deals in {{clusterName}} expire in {{daysLeft}} days',
    description: 'Title template supporting dynamic placeholders',
  })
  @IsString()
  @IsNotEmpty()
  titleTemplate: string;

  @ApiProperty({
    example: '{{people}} people checked deals in {{clusterName}} this month — renew now to stay visible to them.',
    description: 'Message body template supporting dynamic placeholders',
  })
  @IsString()
  @IsNotEmpty()
  messageTemplate: string;

  @ApiPropertyOptional({
    example: 'warning',
    default: 'warning',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: '/dashboard/settings/subscription',
    default: '/dashboard/settings/subscription',
  })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  sendPush?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  sendInApp?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;

  @ApiPropertyOptional({ example: 'Action Required: Your plan expires in {{daysLeft}} days' })
  @IsString()
  @IsOptional()
  emailSubjectTemplate?: string;
}

export class UpdateReminderTemplateDto {
  @ApiPropertyOptional({ example: 'Updated 14-Day Expiry Reminder' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Your deals in {{clusterName}} expire in {{daysLeft}} days',
  })
  @IsString()
  @IsOptional()
  titleTemplate?: string;

  @ApiPropertyOptional({
    example: '{{people}} people checked deals in {{clusterName}} this month — renew now to stay visible to them.',
  })
  @IsString()
  @IsOptional()
  messageTemplate?: string;

  @ApiPropertyOptional({ example: 'warning' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: '/dashboard/settings/subscription' })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  sendPush?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  sendInApp?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;

  @ApiPropertyOptional({ example: 'Your {{planName}} expires in {{daysLeft}} days' })
  @IsString()
  @IsOptional()
  emailSubjectTemplate?: string;
}

export class PreviewReminderTemplateDto {
  @ApiProperty({
    example: 'Your deals in {{clusterName}} expire in {{daysLeft}} days',
    description: 'Title template string to test',
  })
  @IsString()
  @IsNotEmpty()
  titleTemplate: string;

  @ApiProperty({
    example: '{{people}} people checked deals in {{clusterName}} this month — renew now to stay visible to them.',
    description: 'Message body template string to test',
  })
  @IsString()
  @IsNotEmpty()
  messageTemplate: string;

  @ApiPropertyOptional({
    example: {
      businessName: 'Apex Supermarket',
      ownerName: 'Jane Doe',
      planName: 'Discovery Pro',
      daysLeft: 14,
      daysText: '14 days',
      clusterName: 'Ikeja Mall Cluster',
      people: '1,450',
      businesses: '38',
      renewalUrl: '/dashboard/settings/subscription',
    },
    description: 'Custom mock variable values to test interpolation',
  })
  @IsOptional()
  variables?: Record<string, any>;
}
