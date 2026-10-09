import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicDiscoveryService } from './public-discovery.service';
import {
  PublicBusinessesQueryDto,
  PublicSearchQueryDto,
} from './dto/public-discovery.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public Discovery')
@Controller('public')
export class PublicDiscoveryController {
  constructor(private readonly discoveryService: PublicDiscoveryService) {}

  @Public()
  @Get('businesses')
  @ApiOperation({
    summary: 'List recently joined businesses (Public)',
    description:
      'Supports text search (`search`), `categoryId`, `sortBy` ' +
      '(`newest` | `name_asc`) and proximity filtering via `lat` + `lng` + ' +
      '`radius` (km). Proximity is ignored unless lat and lng are both sent.',
  })
  async listBusinesses(@Query() query: PublicBusinessesQueryDto) {
    const businesses = await this.discoveryService.findBusinesses(query);
    return { businesses };
  }

  @Public()
  @Get('search')
  @ApiOperation({
    summary:
      'Unified search across deals, businesses, categories and catalogue products/services',
    description:
      'Returns the same shapes as the individual endpoints. `limit` is per ' +
      'group. Passing `lat` + `lng` + `radius` narrows every group by ' +
      'proximity (radius in km; ignored without both coordinates).',
  })
  async search(@Query() query: PublicSearchQueryDto) {
    return this.discoveryService.search(query.q, query.limit, {
      lat: query.lat,
      lng: query.lng,
      radius: query.radius,
    });
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Aggregate platform stats (Public)' })
  async stats() {
    return this.discoveryService.getStats();
  }
}
