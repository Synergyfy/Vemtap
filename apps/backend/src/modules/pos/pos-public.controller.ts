import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PosPublicService } from './pos-public.service';

@ApiTags('Public POS')
@Controller('public/pos')
export class PosPublicController {
  constructor(private readonly publicService: PosPublicService) {}

  @Public()
  @Get('orders/track/:token')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Track a guest order',
    description:
      'No login. The trackingToken comes back from POST /pos/orders. Returns status steps with times, lines, total, prep estimate, venue and the server first name. Live updates: connect to the pos socket namespace with auth.trackingToken and listen for order.status. Access: Public.',
  })
  @ApiResponse({ status: 404, description: 'Unknown tracking token' })
  track(@Param('token') token: string) {
    return this.publicService.track(token);
  }

  @Public()
  @Get('branches/:branchId/ordering')
  @ApiOperation({
    summary: 'Guest ordering info for a branch',
    description:
      'Whether the branch takes QR orders now (selfOrderingEnabled and not rushPause), the order cap and how the bill is priced (VAT, service charge). Access: Public.',
  })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  orderingInfo(@Param('branchId', ParseUUIDPipe) branchId: string) {
    return this.publicService.orderingInfo(branchId);
  }
}
