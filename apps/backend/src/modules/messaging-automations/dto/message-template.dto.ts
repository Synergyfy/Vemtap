import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateMessageTemplateDto {
  @ApiProperty({ example: 'WELCOME_EMAIL' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MARKETING' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Hello {FirstName}!' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: 'IN_HOUSE' })
  @IsString()
  @IsOptional()
  channel?: string;
}

export class UpdateMessageTemplateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;
}
