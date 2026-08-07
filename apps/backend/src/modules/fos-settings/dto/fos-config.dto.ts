import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FosCategoryType,
  NormalBalance,
  FosPeriodStatus,
  FosApprovalRuleStatus,
  FosNotificationChannel,
} from '../entities/fos-config.entity';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Software & Subscriptions' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: FosCategoryType })
  @IsString()
  @IsNotEmpty()
  type: FosCategoryType;

  @ApiPropertyOptional({ example: 'SaaS tools and recurring software' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Software & Subscriptions' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: FosCategoryType })
  @IsOptional()
  @IsString()
  type?: FosCategoryType;

  @ApiPropertyOptional({ example: 'SaaS tools and recurring software' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateAccountDto {
  @ApiProperty({ example: '1000' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Cash & Bank' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Current Asset' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ enum: NormalBalance })
  @IsString()
  @IsNotEmpty()
  normalBalance: NormalBalance;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: '1000' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Cash & Bank' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Current Asset' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: NormalBalance })
  @IsOptional()
  @IsString()
  normalBalance?: NormalBalance;
}

export class CreatePeriodDto {
  @ApiProperty({ example: 'FY 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ enum: FosPeriodStatus })
  @IsOptional()
  @IsString()
  status?: FosPeriodStatus;
}

export class UpdatePeriodDto {
  @ApiPropertyOptional({ example: 'FY 2026' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: FosPeriodStatus })
  @IsOptional()
  @IsString()
  status?: FosPeriodStatus;
}

export class CreateCurrencyDto {
  @ApiProperty({ example: 'NGN' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Nigerian Naira' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '₦' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateCurrencyDto {
  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Nigerian Naira' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '₦' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePermissionsDto {
  @ApiProperty({
    example: {
      'Super Admin': {
        view: true,
        create: true,
        edit: true,
        delete: true,
        approve: true,
        manageTeam: true,
        manageSettings: true,
      },
    },
  })
  @IsNotEmpty()
  permissions: Record<string, Record<string, boolean>>;
}

export class CreateApprovalRuleDto {
  @ApiProperty({ example: 'Large Expense Approval' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Expense > ₦500,000' })
  @IsString()
  @IsNotEmpty()
  trigger: string;

  @ApiProperty({ example: 'Super Admin' })
  @IsString()
  @IsNotEmpty()
  approver: string;

  @ApiProperty({ example: '₦500,000' })
  @IsString()
  @IsNotEmpty()
  threshold: string;

  @ApiPropertyOptional({ enum: FosApprovalRuleStatus })
  @IsOptional()
  @IsString()
  status?: FosApprovalRuleStatus;
}

export class UpdateApprovalRuleDto {
  @ApiPropertyOptional({ example: 'Large Expense Approval' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Expense > ₦500,000' })
  @IsOptional()
  @IsString()
  trigger?: string;

  @ApiPropertyOptional({ example: 'Super Admin' })
  @IsOptional()
  @IsString()
  approver?: string;

  @ApiPropertyOptional({ example: '₦500,000' })
  @IsOptional()
  @IsString()
  threshold?: string;

  @ApiPropertyOptional({ enum: FosApprovalRuleStatus })
  @IsOptional()
  @IsString()
  status?: FosApprovalRuleStatus;
}

export class CreateNotificationRuleDto {
  @ApiProperty({ example: 'Large Transaction' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({ enum: FosNotificationChannel })
  @IsString()
  @IsNotEmpty()
  channel: FosNotificationChannel;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateNotificationRuleDto {
  @ApiPropertyOptional({ example: 'Large Transaction' })
  @IsOptional()
  @IsString()
  event?: string;

  @ApiPropertyOptional({ enum: FosNotificationChannel })
  @IsOptional()
  @IsString()
  channel?: FosNotificationChannel;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class ListAuditLogsQueryDto {
  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
