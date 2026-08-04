import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { Public } from '../../common/decorators/public.decorator';
import { RewardQueryDto } from './dto/loyalty-query.dto';

@ApiTags('Loyalty, Points & Rewards')
@Controller('public/loyalty')
export class PublicLoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Public()
  @Get('rewards')
  @ApiOperation({
    summary: 'Publicly fetch rewards (legacy alias)',
    description:
      'Alias of GET /loyalty/rewards for backward compatibility with older public-page clients.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of redeemable rewards',
  })
  async getPublicRewards(@Query() query: RewardQueryDto) {
    return this.loyaltyService.getPublicRewards(query);
  }
}
