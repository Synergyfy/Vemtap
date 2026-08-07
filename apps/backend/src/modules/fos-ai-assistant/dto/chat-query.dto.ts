import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatQueryDto {
  @ApiProperty({ example: 'Can we afford to hire a developer?' })
  @IsString()
  @IsNotEmpty()
  query: string;
}
