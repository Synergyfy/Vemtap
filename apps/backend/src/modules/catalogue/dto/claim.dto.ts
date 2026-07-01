import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEmail,
  IsOptional,
  Length,
} from 'class-validator';

export class RequestClaimOtpDto {
  @ApiProperty({ example: '2c92e76f-239c-499c-b102-1f7df2b89a01' })
  @IsNotEmpty()
  @IsUUID()
  offerId: string;

  @ApiProperty({ example: 'Chidi' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'Okonkwo' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'chidi@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class VerifyClaimDto {
  @ApiProperty({ example: 'chidi@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '2c92e76f-239c-499c-b102-1f7df2b89a01' })
  @IsNotEmpty()
  @IsUUID()
  offerId: string;

  @ApiProperty({ example: '1234' })
  @IsNotEmpty()
  @IsString()
  @Length(4, 6)
  code: string;
}
