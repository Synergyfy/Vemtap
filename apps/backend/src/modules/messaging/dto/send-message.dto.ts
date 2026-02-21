import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { Channel } from '../enums/channel.enum';
import { AudienceType } from '../entities/message-campaign.entity';

export class SendMessageDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    businessId: string;

    @ApiProperty({ enum: Channel })
    @IsEnum(Channel)
    channel: Channel;

    @ApiPropertyOptional({ enum: AudienceType })
    @IsOptional()
    @IsEnum(AudienceType)
    audienceType?: AudienceType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    templateId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({ description: 'Specific contact IDs for DIRECT send or GROUP send', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    contactIds?: string[];
}
