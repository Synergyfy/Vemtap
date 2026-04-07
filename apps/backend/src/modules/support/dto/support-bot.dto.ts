import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BotQueryDto {
  @ApiProperty({ example: 'How do I top up credits?' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ example: 'General Dashboard' })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiProperty({ example: [] })
  @IsArray()
  @IsOptional()
  history?: any[];
}

export class CreateKnowledgeDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsArray()
  @IsOptional()
  keywords: string[];

  @IsString()
  @IsOptional()
  category?: string;
}
