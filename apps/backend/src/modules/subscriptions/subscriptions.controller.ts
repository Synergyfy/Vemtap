import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto } from './dto/subscribe.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SkipSubscriptionCheck } from './decorators/skip-subscription-check.decorator';

@ApiTags('Subscriptions (Owner / Capabilities)')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('subscribe')
  @SkipSubscriptionCheck()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Subscribe to a pricing plan' })
  @ApiResponse({ status: 201, description: 'Successfully subscribed' })
  subscribe(@Body() subscribeDto: SubscribeDto) {
    return this.subscriptionsService.subscribe(subscribeDto);
  }

  @Get('active')
  @SkipSubscriptionCheck()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Get current active plan for the current business',
    description: 'Uses businessId from the authenticated user token.',
  })
  @ApiOkResponse({
    description: 'Return current active plan details',
  })
  getActivePlan(@Request() req) {
    const businessId = req.user.businessId;
    if (!businessId) {
      throw new BadRequestException('User is not associated with a business');
    }
    return this.subscriptionsService.activeSubscription(businessId);
  }

  @Get('capabilities')
  @SkipSubscriptionCheck()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary:
      'View capability details and limits used for the current subscription',
    description: 'Only accessible by business staff. Uses businessId from token.',
  })
  @ApiOkResponse({
    description: 'Return capability limits and used counts',
  })
  getCapabilities(@Request() req) {
    const businessId = req.user.businessId;
    if (!businessId) {
      throw new BadRequestException('User is not associated with a business');
    }
    return this.subscriptionsService.getCapabilities(businessId);
  }

  // --- Admin Endpoints ---

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Get all subscriptions with business and plan details',
  })
  async findAllAdmin() {
    return this.subscriptionsService.findAllAdmin();
  }

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get overall subscription statistics' })
  async getAdminStats() {
    return this.subscriptionsService.getAdminStats();
  }
}
