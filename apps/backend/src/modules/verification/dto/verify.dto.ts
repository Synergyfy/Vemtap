import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class VerifyNinDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/.../nin_slip.jpg', description: 'Cloudinary URL of the uploaded NIN slip document' })
  @IsNotEmpty()
  @IsUrl()
  documentUrl: string;

  @ApiProperty({ example: '12345678901', description: '11-digit National Identification Number' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(11)
  nin: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class VerifyCacDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/.../cac_cert.pdf', description: 'Cloudinary URL of the uploaded CAC certificate document' })
  @IsNotEmpty()
  @IsUrl()
  documentUrl: string;

  @ApiProperty({ example: 'RC-1234567', description: 'CAC registration number' })
  @IsNotEmpty()
  @IsString()
  cacNumber: string;

  @ApiProperty({ example: 'Acme Ventures Ltd' })
  @IsNotEmpty()
  @IsString()
  businessName: string;

  @ApiPropertyOptional({ example: 'business@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}