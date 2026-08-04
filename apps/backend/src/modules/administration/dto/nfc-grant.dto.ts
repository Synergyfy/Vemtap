import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class AdminNfcGrantDto {
  @ApiProperty({
    example: 'uuid-business-id',
    description: 'Business UUID to receive NFC quota grant',
  })
  @IsUUID()
  businessId: string;

  @ApiProperty({ example: 50, description: 'Number of NFC tags/cards granted' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    example: 'PROMOTIONAL',
    description: 'Grant reason or type',
  })
  @IsOptional()
  @IsString()
  grantType?: string;

  @ApiPropertyOptional({
    example: 'Manual admin quota boost for event',
    description: 'Notes or internal memo',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
