import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CustomerActivityService } from './customer-activity.service';
import {
  ActivityQueryDto,
  ActivitySummaryQueryDto,
} from './dto/activity-query.dto';

interface ActivityRequest {
  user: { id: string; email?: string | null; phone?: string | null };
}

@ApiTags('Customer Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('me/activity')
export class CustomerActivityController {
  constructor(private readonly activityService: CustomerActivityService) {}

  @Get()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: "The customer's activity timeline",
    description:
      'Claims, orders, bookings, visits, deal reviews and product comments, newest first. `kind` narrows it (`visits` = in-person visits and orders, `reviews` = reviews and comments); `from` limits it to a period.',
  })
  list(@Req() req: ActivityRequest, @Query() query: ActivityQueryDto) {
    return this.activityService.list(req.user, query);
  }

  @Get('switch-preview')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.AGENT,
  )
  @ApiOperation({
    summary: 'The customer side of this account, for the profile switch',
    description:
      'Active claims (and the newest), saved places and saved deals for the caller only. Any role: an owner reads it before switching to customer mode.',
  })
  switchPreview(@Req() req: ActivityRequest) {
    return this.activityService.switchPreview(req.user);
  }

  @Get('summary')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Activity counts for the same period' })
  summary(
    @Req() req: ActivityRequest,
    @Query() query: ActivitySummaryQueryDto,
  ) {
    return this.activityService.summary(req.user, query.from);
  }
}
