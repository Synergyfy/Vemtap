import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
  ValidateIf,
} from 'class-validator';

export class ReplyDto {
  /**
   * Required unless the message is an image on its own — a photo with no
   * caption is a complete thing to say, and requiring text for it would make
   * the camera button unusable.
   */
  @ApiProperty({ example: 'Hello, how can I help you?' })
  @ValidateIf((dto: ReplyDto) => !dto.mediaUrl)
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'uuid-of-message-being-replied-to' })
  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @ApiPropertyOptional({ example: { rewardId: 'uuid' } })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({
    example:
      'https://res.cloudinary.com/vemtap/image/upload/vemtap/messaging/photo.jpg',
    description:
      'Hosted image to send with the message. Images may travel without text, ' +
      'in which case `content` may be an empty string.',
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mediaMimeType?: string;
}
