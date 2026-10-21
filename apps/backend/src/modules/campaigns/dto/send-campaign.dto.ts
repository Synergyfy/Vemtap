import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class SendCampaignDto {
  @ApiProperty({
    type: [String],
    description:
      "Customer user ids to send to. Ids that are not the business's customers, or that opted out of the channel, are skipped.",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @IsUUID('all', { each: true })
  customerIds: string[];

  @ApiPropertyOptional({
    example: 'This weekend only',
    description: 'Email subject line; ignored for SMS and WhatsApp',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;
}
