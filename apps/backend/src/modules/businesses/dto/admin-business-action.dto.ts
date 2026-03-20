import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SuspendBusinessDto {
  @ApiProperty({ description: 'Reason for suspension', example: 'Terms violation' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason: string;
}
