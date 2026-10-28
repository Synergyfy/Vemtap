import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ReverseGeocodeQueryDto {
  @ApiProperty({ example: 9.0765, minimum: -90, maximum: 90 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 7.3986, minimum: -180, maximum: 180 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class SearchGeocodeQueryDto {
  @ApiProperty({ example: 'Wuse II, Abuja' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q: string;
}
