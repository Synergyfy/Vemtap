import { ApiProperty } from '@nestjs/swagger';

export class AffiliatePerformanceDto {
  @ApiProperty({ description: 'Abbreviated name of the month', example: 'Jan' })
  name: string;

  @ApiProperty({ description: 'Total earnings/conversions for that month', example: 50000 })
  earnings: number;
}
