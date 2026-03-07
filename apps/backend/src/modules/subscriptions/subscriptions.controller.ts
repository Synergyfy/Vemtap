import {
  Controller,
  Get,
  Post,
  Body,
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
    const branchId = req.user?.branchId;
    if (!branchId) {
      throw new BadRequestException('User must be associated with a branch');
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
  @ApiOperation({ summary: 'Subscribe to a pricing plan' })
  @ApiResponse({ status: 201, description: 'Successfully subscribed' })
  async subscribe(@Request() req, @Body() subscribeDto: SubscribeDto) {
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
