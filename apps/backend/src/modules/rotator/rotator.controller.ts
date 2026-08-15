import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Headers,
  BadRequestException,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RotatorService } from './rotator.service';
import { RotatorAnalyticsService } from './rotator-analytics.service';
import {
  UpdateRotatorGlobalConfigDto,
  UpdateRotatorClusterConfigDto,
  SetClusterOfferIncludedDto,
  SetClusterOfferDeliveryDto,
  PreviewRotationDto,
  UpsertDealScheduleDto,
  RecordClusterEventDto,
  RotatorAnalyticsQueryDto,
  RotatorWindowHistoryQueryDto,
} from './dto/rotator.dto';

interface AuthenticatedAdminRequest {
  user?: { id?: string };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@ApiTags('Rotator (Public)')
@Controller('clusters')
export class RotatorPublicController {
  constructor(private readonly rotator: RotatorService) {}

  @Public()
  @Post(':uniqueCode/events')
  @ApiOperation({
    summary: 'Record a rotator view/click event for a scanned cluster deal',
    description:
      'Public and unauthenticated. The client identifies itself with the same ' +
      'x-visit-session-token header used by the tap flow so unique-reach analytics work. ' +
      'Only view/click are accepted; impressions are recorded automatically by the deals feed.',
  })
  recordEvent(
    @Param('uniqueCode') uniqueCode: string,
    @Body() dto: RecordClusterEventDto,
    @Headers('x-visit-session-token') sessionToken?: string,
  ) {
    if (sessionToken && !UUID_REGEX.test(sessionToken)) {
      throw new BadRequestException(
        'Invalid x-visit-session-token header — expected a UUID',
      );
    }
    return this.rotator.recordClusterEvent(
      uniqueCode,
      dto,
      sessionToken ?? null,
    );
  }
}

@ApiTags('Rotator (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/rotator')
export class GlobalRotatorController {
  constructor(private readonly rotator: RotatorService) {}

  @Get('config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Read global rotator defaults' })
  getGlobalConfig() {
    return this.rotator.getGlobalConfig();
  }

  @Put('config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Update global rotator defaults',
    description: 'Changing these invalidates every cluster rotator cache.',
  })
  updateGlobalConfig(@Body() dto: UpdateRotatorGlobalConfigDto) {
    return this.rotator.updateGlobalConfig(dto);
  }

  @Post('config/reset')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Restore factory rotator defaults' })
  resetGlobalConfig() {
    return this.rotator.resetGlobalConfig();
  }
}

@ApiTags('Rotator (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/clusters/:id/rotator')
export class ClusterRotatorController {
  constructor(
    private readonly rotator: RotatorService,
    private readonly analytics: RotatorAnalyticsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Get effective rotator config for a cluster',
  })
  getConfig(@Param('id', ParseUUIDPipe) id: string) {
    return this.rotator.getClusterConfig(id);
  }

  @Put()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Override rotator config for a cluster',
    description: 'Set reset=true to return the cluster to automatic.',
  })
  updateConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRotatorClusterConfigDto,
  ) {
    return this.rotator.updateClusterConfig(id, dto);
  }

  @Post('reset')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Reset cluster rotator to automatic',
    description: 'Clears the cluster override and any manual deal memberships.',
  })
  resetConfig(@Param('id', ParseUUIDPipe) id: string) {
    return this.rotator.resetClusterConfig(id);
  }

  @Get('eligibility')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Eligible deal pool summary',
    description:
      'automatic vs manual mode, total eligible, included and excluded offer ids.',
  })
  eligibility(@Param('id', ParseUUIDPipe) id: string) {
    return this.rotator.eligibilitySummary(id);
  }

  @Put('offers/:offerId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Include/exclude a deal in manual mode' })
  setOfferIncluded(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() dto: SetClusterOfferIncludedDto,
    @Req() req: AuthenticatedAdminRequest,
  ) {
    return this.rotator.setClusterOffer(id, offerId, dto, req.user?.id ?? '');
  }

  @Put('offers/:offerId/delivery')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Set manual delivery weight for a deal' })
  setOfferDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() dto: SetClusterOfferDeliveryDto,
    @Req() req: AuthenticatedAdminRequest,
  ) {
    return this.rotator.setOfferDelivery(id, offerId, dto, req.user?.id ?? '');
  }

  @Get('offers/:offerId/why')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Why is this deal showing (or not)?',
    description:
      'Per-condition eligibility explanation for full admin visibility.',
  })
  whyShowing(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ) {
    return this.rotator.explain(id, offerId);
  }

  @Get('preview')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Preview rotation',
    description:
      'Simulates N consecutive rotation windows so admin can verify behavior.',
  })
  preview(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PreviewRotationDto,
  ) {
    return this.rotator.preview(id, query.windows ?? 3);
  }

  @Get('schedules/:offerId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List recurring schedules for a deal' })
  listSchedules(@Param('offerId', ParseUUIDPipe) offerId: string) {
    return this.rotator.listSchedules(offerId);
  }

  @Put('schedules/:offerId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Create/update a recurring schedule for a deal',
  })
  upsertSchedule(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() dto: UpsertDealScheduleDto,
  ) {
    return this.rotator.upsertSchedule(offerId, dto);
  }

  @Delete('schedules/:scheduleId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete a deal schedule' })
  deleteSchedule(@Param('scheduleId', ParseUUIDPipe) scheduleId: string) {
    return this.rotator.deleteSchedule(scheduleId);
  }

  @Get('analytics/summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Cluster rotator analytics summary' })
  analyticsSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RotatorAnalyticsQueryDto,
  ) {
    return this.analytics.getClusterSummary(id, query.days ?? 30);
  }

  @Get('analytics/offers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Per-deal rotator analytics' })
  analyticsOffers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RotatorAnalyticsQueryDto,
  ) {
    return this.analytics.getOfferAnalytics(id, query.days ?? 30);
  }

  @Get('analytics/windows')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Rotation window history' })
  analyticsWindows(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RotatorWindowHistoryQueryDto,
  ) {
    return this.analytics.getWindowHistory(id, query.limit ?? 50);
  }
}
