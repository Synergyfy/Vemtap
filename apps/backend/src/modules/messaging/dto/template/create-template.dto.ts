import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Channel } from '../../enums/channel.enum';
import { TemplateCategory } from '../../entities/message-template.entity';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Welcome Template' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: Channel, example: Channel.SMS })
  @IsEnum(Channel)
  channel: Channel;

  @ApiProperty({ example: 'Hello {name}, welcome!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: TemplateCategory, example: TemplateCategory.MARKETING })
  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory;

  @ApiProperty({ example: 'English (US)' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({
    example: false,
    description: 'Only admins can set this to true',
  })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiProperty({ example: 'uuid-branch', required: false })
  @IsUUID()
  @IsOptional()
  branchId?: string;
}

