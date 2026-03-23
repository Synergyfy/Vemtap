import { ApiProperty } from '@nestjs/swagger';

class CustomerVisitDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '+234 801 234 5678' })
  phone: string;
}

class BranchVisitDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Main Branch' })
  name: string;
}

class BusinessVisitDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Acme Corp' })
  name: string;
}

export class VisitResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '2023-10-27T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: 'returning', enum: ['new', 'returning'] })
  status: string;

  @ApiProperty({ type: CustomerVisitDto })
  customer: CustomerVisitDto;

  @ApiProperty({ type: BranchVisitDto })
  branch: BranchVisitDto;

  @ApiProperty({ type: BusinessVisitDto })
  business: BusinessVisitDto;
}

export class PaginatedVisitResponseDto {
  @ApiProperty({ type: [VisitResponseDto] })
  data: VisitResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
