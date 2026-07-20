import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class WithdrawRequestDto {
  @ApiProperty({
    description: 'The amount to withdraw in local currency (NGN)',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;
}
