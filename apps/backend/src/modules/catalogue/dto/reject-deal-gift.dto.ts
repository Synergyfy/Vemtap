import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectDealGiftDto {
  @ApiProperty({
    example: 'Location is too far from my area',
    description: 'Reason why the recipient declined this deal gift',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;
}
