import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SponsoredService } from './sponsored.service';
import {
  RecordSponsoredEventsDto,
  SponsoredQueryDto,
} from './dto/sponsored.dto';

interface MaybeAuthedRequest {
  user?: { id?: string; role?: string };
}

/**
 * Consumer side of boosts and promotion campaigns: what to show, and what was
 * seen. Public (signed-out browsing counts), with the user attached when the
 * request carries a token.
 */
@ApiTags('Sponsored')
@UseGuards(JwtAuthGuard)
@Public()
@Controller('sponsored')
export class SponsoredController {
  constructor(private readonly sponsored: SponsoredService) {}

  @Get()
  @ApiOperation({ summary: 'Promoted deals for a placement near the viewer' })
  serve(@Query() query: SponsoredQueryDto) {
    return this.sponsored.serve(query);
  }

  @Post('events')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Record views and taps of promoted deals' })
  record(
    @Req() req: MaybeAuthedRequest,
    @Body() dto: RecordSponsoredEventsDto,
  ) {
    const customerId =
      req.user?.id && req.user.role === UserRole.CUSTOMER ? req.user.id : null;
    return this.sponsored.recordEvents(dto.viewerKey, customerId, dto.events);
  }
}
