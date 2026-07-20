import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'The type of identification document',
    example: 'NIN',
  })
  @IsOptional()
  @IsString()
  idType?: string;

  @ApiPropertyOptional({
    description: 'The identification document number',
    example: '12345678901',
  })
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiPropertyOptional({
    description: 'URL of the uploaded identification document image',
    example: 'https://cdn.example.com/id.png',
  })
  @IsOptional()
  @IsString()
  idImageUrl?: string;

  @ApiPropertyOptional({
    description: 'JSON object containing bank details',
    example: {
      bankName: 'GTBank',
      accountNumber: '0123456789',
      accountName: 'John Doe',
    },
  })
  @IsOptional()
  @IsObject()
  bankAccountDetails?: Record<string, any>;
}
