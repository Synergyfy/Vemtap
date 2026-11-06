import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SponsoredEventType } from '../../discovery/entities/sponsored-campaign-event.entity';

export class SponsoredQueryDto {
  @ApiProperty({
    enum: ['home', 'feed'],
    description: '`home` = Home Featured rail; `feed` = Featured Deals page',
  })
  @IsIn(['home', 'feed'])
  placement: 'home' | 'feed';

  @ApiPropertyOptional({ example: 9.0765 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ example: 7.3986 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ default: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number;
}

export class SponsoredEventDto {
  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiProperty()
  @IsUUID()
  offerId: string;

  @ApiProperty({ enum: SponsoredEventType })
  @IsEnum(SponsoredEventType)
  type: SponsoredEventType;
}

export class RecordSponsoredEventsDto {
  @ApiProperty({
    description: 'Anonymous viewer key the app generates and keeps',
    example: 'v-lq3k9a-8f2c1d7e',
  })
  @Matches(/^[A-Za-z0-9_-]{8,64}$/)
  viewerKey: string;

  @ApiProperty({ type: [SponsoredEventDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SponsoredEventDto)
  events: SponsoredEventDto[];
}
