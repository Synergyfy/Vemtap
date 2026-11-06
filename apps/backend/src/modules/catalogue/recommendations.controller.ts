import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CatalogueOfferService } from './catalogue-offer.service';
import { RecommendationsQueryDto } from './dto/recommendations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly offerService: CatalogueOfferService) {}

  @Get()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Recommended deals for the customer',
    description:
      'Active nearby offers ranked featured-first, then by engagement ' +
      '(claims), then newest. Offers the customer already claimed are ' +
      'excluded. Optional `lat`/`lng`/`radius` narrow by proximity. ' +
      'Response rows use the same shape as the public offers feed. ' +
      'Access: CUSTOMER',
  })
  @ApiResponse({
    status: 200,
    description:
      'Ranked list of offers (feed shape: id, name, prices, images, business…)',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-of-offer',
            name: 'Burger + Wings Combo',
            calculatedPrice: 11600,
            originalPrice: 14500,
            discountPercent: 20,
            business: { id: 'uuid', name: 'Patrick Ventures' },
            items: [],
          },
        ],
        total: 6,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not a CUSTOMER',
  })
  async listRecommendations(
    @Req() req: RequestWithUser,
    @Query() query: RecommendationsQueryDto,
  ) {
    return this.offerService.findRecommendedOffers(req.user, query);
  }
}
