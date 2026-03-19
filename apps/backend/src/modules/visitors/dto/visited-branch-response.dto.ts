import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VisitedBranchDto {
  @ApiProperty({ example: 'uuid-branch' })
  id: string;

  @ApiProperty({ example: 'Main Branch' })
  name: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  address: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  city: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  logoUrl: string;

  @ApiProperty({ example: '2023-10-25T10:00:00.000Z' })
  lastVisitedAt: Date;

  @ApiProperty({ example: 5 })
  visitCount: number;

  @ApiProperty({ example: 'uuid-business' })
  businessId: string;
}

export class PaginatedVisitedBranchResponseDto {
  @ApiProperty({ type: [VisitedBranchDto] })
  data: VisitedBranchDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
