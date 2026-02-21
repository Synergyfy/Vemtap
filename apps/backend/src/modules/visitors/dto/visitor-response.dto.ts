import { ApiProperty } from '@nestjs/swagger';

export class VisitorResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '+234 801 234 5678' })
  phone: string;

  @ApiProperty({ example: 5 })
  visits: number;

  @ApiProperty({ example: '2023-10-27T10:00:00Z' })
  lastVisit: Date;

  @ApiProperty({
    example: 'Active',
    enum: ['New', 'Active', 'Returning', 'VIP', 'Inactive'],
  })
  status: string;

  @ApiProperty({ example: '₦45,000' })
  totalSpent: string;
}

export class NewVisitorResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '+234 801 234 5678' })
  phone: string;

  @ApiProperty({ example: '2023-10-27T10:00:00Z' })
  joined: Date;

  @ApiProperty({ example: 'Front Desk NFC' })
  source: string;

  @ApiProperty({ example: 'New' })
  status: string;
}

export class ReturningVisitorResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '+234 801 234 5678' })
  phone: string;

  @ApiProperty({ example: 24 })
  totalVisits: number;

  @ApiProperty({ example: 'Weekly' })
  frequency: string;

  @ApiProperty({ example: '2023-10-27T10:00:00Z' })
  lastVisit: Date;

  @ApiProperty({ example: 'VIP' })
  status: string;
}

export class PaginatedVisitorResponseDto {
  @ApiProperty({ type: [VisitorResponseDto] })
  data: VisitorResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
