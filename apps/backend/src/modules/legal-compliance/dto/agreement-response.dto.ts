import { ApiProperty } from '@nestjs/swagger';

class AcceptanceInfoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'v1.0' })
  version: string;

  @ApiProperty({ example: '2026-01-31T14:22:00Z' })
  acceptedAt: Date;

  @ApiProperty({ example: '192.168.1.45' })
  ipAddress: string;

  @ApiProperty({ example: 'Chrome 120.0' })
  userAgent: string;
}

export class AgreementResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Terms of Service' })
  name: string;

  @ApiProperty({ example: 'terms-of-service' })
  slug: string;

  @ApiProperty({ example: 'v1.0' })
  version: string;

  @ApiProperty({ example: 'https://docs.example.com/terms-v1.pdf' })
  contentUrl: string;

  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  effectiveDate: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: AcceptanceInfoDto, nullable: true })
  acceptance: AcceptanceInfoDto | null;
}

export class AgreementHistoryResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Terms of Service' })
  doc: string;

  @ApiProperty({ example: 'v1.0' })
  version: string;

  @ApiProperty({ example: '2026-01-31T14:22:00Z' })
  date: Date;

  @ApiProperty({ example: '192.168.1.45' })
  ip: string;

  @ApiProperty({ example: 'Chrome 120.0' })
  browser: string;

  @ApiProperty({ example: 'Windows 11' })
  os: string;

  @ApiProperty({ example: 'view' })
  action: string;
}

export class PaginatedAgreementHistoryDto {
  @ApiProperty({ type: [AgreementHistoryResponseDto] })
  data: AgreementHistoryResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
