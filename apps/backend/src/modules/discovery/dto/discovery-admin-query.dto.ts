import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminPaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class AdminOfferQueryDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class AdminReferralQueryDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminPartnershipQueryDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminSponsoredQueryDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminBillingQueryDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}

export class AdminCustomerQueryDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminLocationQueryDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminCategoryQueryDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminFraudQueryDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  severity?: string;
}

export class AdminNotificationQueryDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;
}

export class AdminAuditLogQueryDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;
}
