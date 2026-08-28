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
  @ApiOperation({ summary: 'List recently joined businesses (Public)' })
  async listBusinesses(@Query() query: PublicBusinessesQueryDto) {
    const businesses = await this.discoveryService.findBusinesses(
      undefined,
      query.limit,
    );
    return { businesses };
  }

  @Public()
  @Get('search')
  @ApiOperation({
    summary: 'Unified search across deals, businesses, categories',
  })
  async search(@Query() query: PublicSearchQueryDto) {
    return this.discoveryService.search(query.q, query.limit);
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Aggregate platform stats (Public)' })
  async stats() {
    return this.discoveryService.getStats();
  }
}
