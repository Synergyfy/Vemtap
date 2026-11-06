import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { CatalogueOfferService } from './catalogue-offer.service';
import { MyGiftDto, MyGiftsPageDto, MyGiftsQueryDto } from './dto/my-gifts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Customer Gifts')
@ApiBearerAuth()
@ApiExtraModels(MyGiftDto, MyGiftsPageDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('me/gifts')
export class MeGiftsController {
  constructor(private readonly offerService: CatalogueOfferService) {}

  @Get()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'List the deal gifts the authenticated customer has sent',
    description:
      'Deals the customer gifting away, newest first — the sender side of ' +
      '`POST /catalogue/offers/claim/gift`. Every row is scoped to the caller, ' +
      'so no other customer\u2019s gifts can leak in. Pagination is opt-in, as ' +
      'with `/me/claims`: omit `page`/`limit` for the legacy bare array, or ' +
      'send them for `{ data, total, page, limit }`. A declined gift is ' +
      'soft-removed so the branch dashboard stops seeing the recipient, and ' +
      'this endpoint deliberately opts it back in — the sender is the one ' +
      'party it is not being hidden from. `q` matches recipient email or name, ' +
      'sender name or offer name. Access: CUSTOMER',
  })
  @ApiOkResponse({
    description:
      'Bare array when `page`/`limit` are omitted, otherwise a paginated page',
    schema: {
      oneOf: [
        { type: 'array', items: { $ref: '#/components/schemas/MyGiftDto' } },
        { $ref: '#/components/schemas/MyGiftsPageDto' },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not a CUSTOMER',
  })
  async listMyGifts(
    @Req() req: RequestWithUser,
    @Query() query: MyGiftsQueryDto,
  ): Promise<MyGiftDto[] | MyGiftsPageDto> {
    return this.offerService.findMyGifts(req.user, query);
  }
}
