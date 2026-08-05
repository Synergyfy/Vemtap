import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class VisitorLoyaltyIdentityDto {
  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Customer phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'First name (used when creating a new customer)',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name (used when creating a new customer)',
  })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class VisitorPointsEarnDto extends VisitorLoyaltyIdentityDto {
  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Branch unique code' })
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiPropertyOptional({ description: 'Whether these points are for a visit' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVisit?: boolean;
}

export class LegacyVisitorPointsEarnDto {
  @ApiPropertyOptional({ description: 'Visitor email or phone identifier' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Legacy business identifier, ignored' })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({ description: 'Whether these points are for a visit' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVisit?: boolean;
}
