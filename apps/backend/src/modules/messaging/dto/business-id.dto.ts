import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BusinessIdDto {
  @ApiProperty({
    description: 'Business UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'The business ID must be a valid UUID v4' })
  @IsNotEmpty()
  businessId: string;
}
