import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class SendDealGiftDto {
  @ApiProperty({
    example: '2c92e76f-239c-499c-b102-1f7df2b89a01',
    description: 'The offer ID of the deal to gift',
  })
  @IsNotEmpty()
  @IsUUID()
  offerId: string;

  @ApiProperty({
    example: 'friend@example.com',
    description: 'The email of the recipient who receives the deal',
  })
  @IsNotEmpty()
  @IsEmail()
  recipientEmail: string;

  @ApiPropertyOptional({
    example: 'Alex',
    description: 'The name of the sender gifting this deal',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  senderName?: string;

  @ApiPropertyOptional({
    example: 'alex@example.com',
    description: 'The email of the sender',
  })
  @IsOptional()
  @IsEmail()
  senderEmail?: string;

  @ApiPropertyOptional({
    example: 'Thought you might love this pizza deal! Enjoy!',
    description: 'An optional personal message from the sender',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @ApiPropertyOptional({
    example: '4b72e76f-129c-499c-b102-1f7df2b89a02',
    description: 'Optional specific branch ID for redemption',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000',
    description:
      'Frontend base URL used to construct the claim link in the email',
  })
  @IsOptional()
  @IsString()
  frontendBaseUrl?: string;
}
