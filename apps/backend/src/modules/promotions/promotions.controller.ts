import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Type,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SponsoredCampaignKind } from '../discovery/entities/sponsored-campaign.entity';
import { PromotionsService } from './promotions.service';
import {
  ForecastDto,
  AddBudgetDto,
  LaunchCampaignDto,
  ListCampaignsQueryDto,
  SaveCampaignDto,
} from './dto/promotion.dto';

interface AuthedRequest {
  user: { id: string; email?: string | null; businessId: string };
}

/**
 * `/boosts` and `/promotions` are the same lifecycle over the same table,
 * differing only in `kind` and in which wizard fields are required, so both
 * controllers come from this one definition.
 */
function campaignController(
  kind: SponsoredCampaignKind,
  path: string,
  tag: string,
): Type<unknown> {
  const noun =
    kind === SponsoredCampaignKind.BOOST ? 'boost' : 'promotion campaign';

  @ApiTags(tag)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Controller(path)
  class CampaignController {
    constructor(readonly service: PromotionsService) {}

    @Get()
    @ApiOperation({ summary: `List the business's ${noun}s` })
    list(@Req() req: AuthedRequest, @Query() query: ListCampaignsQueryDto) {
      return this.service.list(kind, req.user.businessId, query);
    }

    @Get('summary')
    @ApiOperation({ summary: `Hub header numbers for ${noun}s` })
    summary(@Req() req: AuthedRequest) {
      return this.service.summary(kind, req.user.businessId);
    }

    @Get('options')
    @ApiOperation({ summary: `Choices for the ${noun} wizard` })
    options(@Req() req: AuthedRequest) {
      return this.service.options(kind, req.user.businessId);
    }

    @Get('eligible-assets')
    @ApiOperation({
      summary: 'Deals, products, services and the profile that can be featured',
    })
    eligibleAssets(@Req() req: AuthedRequest) {
      return this.service.eligibleAssets(req.user.businessId);
    }

    @Post('forecast')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Estimated reach and claims for a budget' })
    forecast(@Req() req: AuthedRequest, @Body() dto: ForecastDto) {
      return this.service.forecast(dto, req.user.businessId);
    }

    @Post()
    @ApiOperation({ summary: `Create a ${noun} draft (any step's fields)` })
    create(@Req() req: AuthedRequest, @Body() dto: SaveCampaignDto) {
      return this.service.create(kind, req.user.businessId, dto);
    }

    @Get(':id')
    @ApiOperation({ summary: `Get a ${noun}` })
    get(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
      return this.service.get(kind, id, req.user.businessId);
    }

    @Patch(':id')
    @ApiOperation({ summary: `Save wizard steps on a ${noun}` })
    update(
      @Req() req: AuthedRequest,
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: SaveCampaignDto,
    ) {
      return this.service.update(kind, id, req.user.businessId, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: `Delete a ${noun} draft` })
    remove(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
      return this.service.remove(kind, id, req.user.businessId);
    }

    @Post(':id/launch')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
      summary: `Launch a ${noun}: reserve the budget from the wallet, or open a card top-up for the shortfall`,
    })
    launch(
      @Req() req: AuthedRequest,
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: LaunchCampaignDto,
    ) {
      return this.service.launch(kind, id, req.user.businessId, req.user, dto);
    }

    @Post(':id/budget')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
      summary: `Add budget to a live ${noun}; its end date moves out at the same daily spend`,
    })
    addBudget(
      @Req() req: AuthedRequest,
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: AddBudgetDto,
    ) {
      return this.service.addBudget(
        kind,
        id,
        req.user.businessId,
        req.user,
        dto,
      );
    }

    @Post(':id/pause')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Stop spending; the reserve is kept' })
    pause(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
      return this.service.pause(kind, id, req.user.businessId);
    }

    @Post(':id/resume')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
      summary: 'Resume; the schedule moves back by the time paused',
    })
    resume(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
      return this.service.resume(kind, id, req.user.businessId);
    }

    @Post(':id/end')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
      summary: 'End now and return the unspent budget to the wallet',
    })
    end(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
      return this.service.end(kind, id, req.user.businessId);
    }

    @Get(':id/stats')
    @ApiOperation({
      summary: 'Spend, funnel, claims by hour/branch and a daily series',
    })
    stats(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
      return this.service.stats(kind, id, req.user.businessId);
    }
  }

  Object.defineProperty(CampaignController, 'name', {
    value:
      kind === SponsoredCampaignKind.BOOST
        ? 'BoostsController'
        : 'PromotionsController',
  });
  return CampaignController;
}

export const BoostsController = campaignController(
  SponsoredCampaignKind.BOOST,
  'boosts',
  'Boosts',
);
export const PromotionsController = campaignController(
  SponsoredCampaignKind.PROMOTION,
  'promotions',
  'Promotion Campaigns',
);
