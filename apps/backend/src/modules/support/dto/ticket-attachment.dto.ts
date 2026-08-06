import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TicketAttachmentDto {
  @ApiProperty({ description: 'Public URL or base64 data URL of the file' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'MIME type, e.g. image/png' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @IsInt()
  @Min(1)
  size: number;
}

export class AddTicketAttachmentsDto {
  @ApiPropertyOptional({
    description: 'Optional caption/message alongside files',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    type: [TicketAttachmentDto],
    description: 'Attachments to attach to the ticket',
  })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => TicketAttachmentDto)
  attachments: TicketAttachmentDto[];
}
