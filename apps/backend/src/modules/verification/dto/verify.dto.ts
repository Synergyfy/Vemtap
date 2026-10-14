import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export const IDENTITY_ID_TYPES = [
  'nin',
  'drivers_license',
  'voters_card',
  'passport',
] as const;
export type IdentityIdType = (typeof IDENTITY_ID_TYPES)[number];

export class StartLivenessDto {
  @ApiPropertyOptional({
    example: 'vemtap://verification/liveness',
    description:
      'Where bytID sends the person after the selfie check (app deep link)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  redirectUrl?: string;
}

export class VerifyIdentityDto {
  @ApiProperty({ enum: IDENTITY_ID_TYPES })
  @IsIn(IDENTITY_ID_TYPES)
  idType: IdentityIdType;

  @ApiPropertyOptional({
    example: '12345678901',
    description:
      "NIN (11 digits), driver's licence number or voter's card VIN. Not used for passports.",
  })
  @ValidateIf((dto: VerifyIdentityDto) => dto.idType !== 'passport')
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Matches(/^[A-Za-z0-9\s-]+$/, {
    message: 'idNumber may only contain letters and numbers',
  })
  idNumber?: string;

  @ApiProperty({ example: 'Adaeze', description: 'As written on the ID' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiProperty({
    description:
      'Id of a passed selfie check from POST /verification/liveness-sessions',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  livenessSessionId: string;

  @ApiPropertyOptional({
    description:
      'Passport only: uploaded photo of the data page (POST /uploads, folder vemtap/verification/…)',
  })
  @ValidateIf((dto: VerifyIdentityDto) => dto.idType === 'passport')
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  documentUrl?: string;
}

export class VerifyBusinessDto {
  @ApiProperty({
    example: 'RC1234567',
    description: 'CAC number starting with RC, BN or IT',
  })
  @IsString()
  @Matches(/^\s*(RC|BN|IT)[\s-]*\d{1,10}\s*$/i, {
    message:
      'registrationNumber must start with RC, BN or IT followed by digits',
  })
  registrationNumber: string;
}

export class UnregisteredBusinessDto {
  @ApiPropertyOptional({ example: 'Home kitchen, trading since 2021' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Supporting photos / documents (uploaded URLs)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({ require_protocol: true, protocols: ['https'] }, { each: true })
  documentUrls?: string[];
}

export class ManualReviewDto {
  @ApiPropertyOptional({
    description: 'The check to review; defaults to the latest identity check',
  })
  @IsOptional()
  @IsUUID()
  checkId?: string;

  @ApiPropertyOptional({ example: 'My NIN record has my maiden name' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class AdminVerificationDecisionDto {
  @ApiPropertyOptional({
    example: 'CAC certificate checked against the record',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
