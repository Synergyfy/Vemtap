import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CheckPhoneQueryDto {
  @ApiProperty({
    description: 'Phone number to check existence for',
    example: '+2348012345678',
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;
}
