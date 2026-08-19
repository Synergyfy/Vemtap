import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
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
import { Public } from '../../common/decorators/public.decorator';
import { BranchesService } from '../branches/branches.service';
import { SubscribeWithAddonsDto } from './dto/addons/subscribe-with-addons.dto';
import { SubscriptionTaxService } from './services/subscription-tax.service';
import { UpdateSubscriptionTaxDto } from './dto/tax/update-subscription-tax.dto';
import { ToggleSubscriptionTaxDto } from './dto/tax/toggle-subscription-tax.dto';
import { PricePreviewDto } from './dto/tax/price-preview.dto';

@ApiTags('Subscriptions (Owner / Capabilities)')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly branchesService: BranchesService,
    private readonly subscriptionTaxService: SubscriptionTaxService,
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

  @Post('initialize-payment')
  @SkipSubscriptionCheck()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initialize a subscription payment via Paystack',
    description:
      'Computes the exact amount server-side (plan price + tax, or the ₦100 trial deposit), creates a pending payment record, and returns a Paystack access_code for the client to complete the transaction.',
  })
  async initializePayment(
    @Request() req,
    @Body() subscribeDto: SubscribeWithAddonsDto,
  ) {
    if (!subscribeDto.businessId) {
      subscribeDto.businessId = await this.getBusinessId(req);
    }
    return this.subscriptionsService.initializePayment({
      planId: subscribeDto.planId,
      businessId: subscribeDto.businessId,
      billingPeriod: subscribeDto.billingPeriod,
      isTrial: subscribeDto.isTrial ?? false,
    });
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
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
  async cancelByBusinessId(@Param('businessId') businessId: string) {
    return this.subscriptionsService.cancelSubscription(businessId);
  }

  @Post('cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Cancel current active subscription for current user business',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
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

  // --- Subscription Tax (VAT) Endpoints ---

  @Get('tax-config')
  @Public()
  @ApiOperation({
    summary: 'Get active subscription VAT / Tax configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Active subscription tax configuration',
  })
  async getTaxConfig() {
    return this.subscriptionTaxService.getActiveConfig();
  }

  @Get('price-preview')
  @Public()
  @ApiOperation({
    summary:
      'Preview subscription checkout cost with VAT/tax breakdown, coupon discount, and add-ons',
  })
  @ApiResponse({
    status: 200,
    description: 'Calculated breakdown of subtotal, discount, tax amount, and total',
  })
  async previewPrice(@Query() dto: PricePreviewDto, @Request() req: any) {
    let businessId: string | undefined;
    if (req?.user) {
      try {
        businessId = await this.getBusinessId(req);
      } catch {}
    }
    return this.subscriptionsService.previewPrice(dto, businessId);
  }


  // --- Admin Tax Endpoints ---

  @Get('admin/tax-config/history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Get complete audit history of tax configuration changes',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all tax configuration history records',
  })
  async getTaxHistory() {
    return this.subscriptionTaxService.getHistory();
  }

  @Put('admin/tax-config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Admin: Update subscription tax rule (% or fixed price) and record history',
  })
  @ApiResponse({
    status: 200,
    description: 'New tax configuration saved successfully',
  })
  async updateTaxConfig(
    @Request() req: any,
    @Body() dto: UpdateSubscriptionTaxDto,
  ) {
    return this.subscriptionTaxService.updateTaxConfig(req.user.id, dto);
  }

  @Patch('admin/tax-config/toggle')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Quick toggle to enable or disable VAT/Tax for subscriptions',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax status toggled successfully and recorded in history',
  })
  async toggleTax(
    @Request() req: any,
    @Body() dto: ToggleSubscriptionTaxDto,
  ) {
    return this.subscriptionTaxService.toggleTax(req.user.id, dto);
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
