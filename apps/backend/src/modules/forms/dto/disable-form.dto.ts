import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DisableFormDto {
  @ApiProperty({
    example: 'Violated terms of service',
    description: 'Reason for disabling the form',
  })
  @IsString()
  @IsNotEmpty()
  adminDisabledNote: string;
}
