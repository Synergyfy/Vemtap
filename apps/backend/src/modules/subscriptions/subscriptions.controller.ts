import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto } from './dto/subscribe.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Subscriptions (Owner / Capabilities)')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('subscribe')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Subscribe to a pricing plan' })
  @ApiResponse({ status: 201, description: 'Successfully subscribed' })
  subscribe(@Body() subscribeDto: SubscribeDto) {
    return this.subscriptionsService.subscribe(subscribeDto);
  }

  @Get('active/:businessId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current active plan for a specific business' })
  @ApiResponse({
    status: 200,
    description: 'Return current active plan details',
  })
  getActivePlan(@Param('businessId') businessId: string) {
    return this.subscriptionsService.activeSubscription(businessId);
  }

  @Get('capabilities/:businessId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary:
      'View capability details and limits used for the current subscription',
  })
  @ApiResponse({
    status: 200,
    description: 'Return capability limits and used counts',
  })
  getCapabilities(@Param('businessId') businessId: string) {
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
