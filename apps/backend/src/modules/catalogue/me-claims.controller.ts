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
import {
  MyClaimDto,
  MyClaimsPageDto,
  MyClaimsQueryDto,
} from './dto/my-claims.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Customer Claims')
@ApiBearerAuth()
@ApiExtraModels(MyClaimDto, MyClaimsPageDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('me/claims')
export class MeClaimsController {
  constructor(private readonly offerService: CatalogueOfferService) {}

  @Get()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: "List the authenticated customer's claimed deal passes",
    description:
      'List of the deals the customer has claimed, newest first. Pagination ' +
      'is opt-in: omit `page`/`limit` for the legacy bare array, or send them ' +
      'for `{ data, total, page, limit }`. Each row carries the claim code, ' +
      'effective status (`ACTIVE` = claimed and not expired, `REDEEMED`, ' +
      '`EXPIRED`), the claim expiry and the offer/business/branch details ' +
      'needed to render the pass. `q` narrows the result (and `total`) by ' +
      'offer name, business name, branch name or claim code. Access: CUSTOMER',
  })
  @ApiOkResponse({
    description:
      'Bare array when `page`/`limit` are omitted, otherwise a paginated page',
    schema: {
      oneOf: [
        { type: 'array', items: { $ref: '#/components/schemas/MyClaimDto' } },
        { $ref: '#/components/schemas/MyClaimsPageDto' },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not a CUSTOMER',
  })
  async listMyClaims(
    @Req() req: RequestWithUser,
    @Query() query: MyClaimsQueryDto,
  ): Promise<MyClaimDto[] | MyClaimsPageDto> {
    return this.offerService.findMyClaims(req.user, query);
  }
}
