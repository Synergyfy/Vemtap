import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { GeocodingService } from './geocoding.service';
import {
  ReverseGeocodeQueryDto,
  SearchGeocodeQueryDto,
} from './dto/geocoding.dto';

@ApiTags('Public Geocoding')
@Controller('public/geocode')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Public()
  @Get('reverse')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Area and city at a point (Public)',
    description:
      'Turns a customer’s coordinates into an area and city for the location ' +
      'picker. Returns null when no geocoding provider recognises the point.',
  })
  reverse(@Query() query: ReverseGeocodeQueryDto) {
    return this.geocodingService.reverse(query.lat, query.lng);
  }

  @Public()
  @Get('search')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Coordinates for a typed area in Nigeria (Public)',
    description:
      'Finds the best match for an area the customer typed. Returns null ' +
      'when nothing matches.',
  })
  search(@Query() query: SearchGeocodeQueryDto) {
    return this.geocodingService.search(query.q);
  }
}
