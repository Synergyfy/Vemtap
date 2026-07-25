import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
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
import { BranchesService } from '../branches/branches.service';
import { SubscribeWithAddonsDto } from './dto/addons/subscribe-with-addons.dto';

@ApiTags('Subscriptions (Owner / Capabilities)')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly branchesService: BranchesService,
  ) {}

  private async getBusinessId(req: any): Promise<string> {
    // 1. Try to get businessId directly from user (populated from JWT or DB)
    if (req.user?.businessId) {
      return req.user.businessId;
    }

    // 2. If it's an Owner, try to find their business
    if (req.user?.role === UserRole.OWNER) {
      const business = await this.branchesService.findBusinessByOwner(
        req.user.id,
      );
      if (business) return business.id;
    }

    // 3. Fallback to branch-based lookup (for Staff/Managers if businessId is missing)
    const branchId = req.user?.branchId;
    if (!branchId) {
      throw new BadRequestException(
        'User must be associated with a business or branch',
      );
    }
    const branch = await this.branchesService.findById(branchId);
    if (!branch) {
      throw new BadRequestException('Branch not found');
    }
    return branch.businessId;
  }

  @Post('subscribe')
  @SkipSubscriptionCheck()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Subscribe to a pricing plan',
    description:
      'Subscribes the business to a pricing plan. Optionally include add-on IDs to purchase add-ons in the same transaction. Payment is verified via Paystack.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
    schema: {
      example: {
        subscription: {
          id: 'uuid-subscription',
          businessId: 'uuid-business',
          planId: 'uuid-plan',
          billingPeriod: 'monthly',
          status: 'active',
          startDate: '2026-05-06T10:00:00Z',
          endDate: '2026-06-06T10:00:00Z',
        },
        addOns: [],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid plan or payment failed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async subscribe(
    @Request() req,
    @Body() subscribeDto: SubscribeWithAddonsDto,
  ) {
    if (subscribeDto.isAdminOverride && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only admins can override plans');
    }
    if (!subscribeDto.businessId) {
      subscribeDto.businessId = await this.getBusinessId(req);
    }
    return this.subscriptionsService.subscribe(subscribeDto);
  }

  @Get('active')
  @SkipSubscriptionCheck()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: "Get current active plan for the branch's business",
  })
  @ApiOkResponse({
    description: 'Return current active plan details',
  })
  async getActivePlan(@Request() req) {
    const businessId = await this.getBusinessId(req);
    return this.subscriptionsService.activeSubscription(businessId);
  }

  @Post('cancel/:businessId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel subscription for a business by businessId' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelByBusinessId(@Param('businessId') businessId: string) {
    return this.subscriptionsService.cancelSubscription(businessId);
  }

  @Post('cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel current active subscription for current user business' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelCurrent(@Request() req: any) {
    const businessId = await this.getBusinessId(req);
    return this.subscriptionsService.cancelSubscription(businessId);
  }

  @Get('capabilities')
  @SkipSubscriptionCheck()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary:
      'View capability details and limits used for the current subscription',
  })
  @ApiOkResponse({
    description: 'Return capability limits and used counts',
  })
  async getCapabilities(@Request() req) {
    const businessId = await this.getBusinessId(req);
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
