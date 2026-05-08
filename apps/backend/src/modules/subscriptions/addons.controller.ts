import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AddonsService } from './services/addons.service';
import { CreateAddonDto } from './dto/addons/create-addon.dto';
import { UpdateAddonDto } from './dto/addons/update-addon.dto';
import { PurchaseAddonDto } from './dto/addons/purchase-addon.dto';
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
import { UserRole, User } from '../users/entities/user.entity';
import { Public } from '../../common/decorators/public.decorator';
import { SkipSubscriptionCheck } from './decorators/skip-subscription-check.decorator';
import { AddOn } from './entities/addon.entity';
import { BusinessAddOn } from './entities/business-addon.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Add-ons')
@Controller('addons')
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get add-on purchase statistics (Admin only)',
    description:
      'Returns aggregated statistics about add-ons including total templates, active templates, purchase counts, and breakdown by type.',
  })
  @ApiOkResponse({
    description: 'Add-on statistics',
    schema: {
      example: {
        totalAddons: 12,
        activeAddons: 10,
        resourceAddons: 8,
        serviceAddons: 4,
        totalPurchases: 156,
        activePurchases: 89,
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getAdminStats() {
    return this.addonsService.getAdminStats();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all add-on templates (Admin only)',
    description:
      'Returns all add-on templates including inactive ones. Use to manage add-on inventory.',
  })
  @ApiOkResponse({
    description: 'List of all add-on templates',
    type: [AddOn],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  findAllAdmin() {
    return this.addonsService.findAllAdmin();
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new add-on template (Admin only)',
    description:
      'Creates a new purchasable add-on template. Add-ons can be of type RESOURCE (extra limits like branches, staff) or SERVICE (custom support like dashboard managers, experts).',
  })
  @ApiResponse({
    status: 201,
    description: 'Add-on template created successfully',
    type: AddOn,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  create(@Body() createAddonDto: CreateAddonDto) {
    return this.addonsService.create(createAddonDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @SkipSubscriptionCheck()
  @ApiOperation({
    summary: 'Get purchased add-ons for the current business',
    description:
      'Returns all add-ons purchased by the authenticated user\'s business, including active, expired, and canceled add-ons.',
  })
  @ApiOkResponse({
    description: 'List of purchased add-ons with add-on details',
    type: [BusinessAddOn],
  })
  async getMyAddons(@Request() req: RequestWithUser) {
    const businessId = req.user.businessId;
    return this.addonsService.getBusinessAddons(businessId);
  }

  @Get('my/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @SkipSubscriptionCheck()
  @ApiOperation({
    summary: 'Get active purchased add-ons for the current business',
    description:
      'Returns only the currently active and non-expired add-ons purchased by the authenticated user\'s business.',
  })
  @ApiOkResponse({
    description: 'List of active purchased add-ons with add-on details',
    type: [BusinessAddOn],
  })
  async getMyActiveAddons(@Request() req: RequestWithUser) {
    const businessId = req.user.businessId;
    return this.addonsService.getActiveBusinessAddons(businessId);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @SkipSubscriptionCheck()
  @ApiOperation({
    summary: 'Purchase add-on(s) standalone',
    description:
      'Purchase one or more add-ons for the authenticated user\'s business. Payment is verified via Paystack. Add-ons can be purchased independently of a plan subscription.',
  })
  @ApiResponse({
    status: 201,
    description: 'Add-ons purchased successfully',
    type: [BusinessAddOn],
  })
  @ApiResponse({ status: 400, description: 'Invalid add-on IDs or payment verification failed' })
  @ApiResponse({ status: 404, description: 'One or more add-ons not found' })
  async purchaseAddons(
    @Request() req: RequestWithUser,
    @Body() dto: PurchaseAddonDto,
  ) {
    const businessId = req.user.businessId;
    return this.addonsService.purchaseAddons(dto, businessId, req.user.id);
  }

  @Get('')
  @Public()
  @ApiOperation({
    summary: 'List all active add-ons',
    description:
      'Returns all add-ons available for purchase. Includes resource add-ons (extra limits) and service add-ons (custom support).',
  })
  @ApiOkResponse({
    description: 'List of active add-ons',
    type: [AddOn],
  })
  findAll() {
    return this.addonsService.findAll(true);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a single add-on template by ID (Admin only)',
    description: 'Returns full details of a specific add-on template.',
  })
  @ApiOkResponse({
    description: 'Add-on template details',
    type: AddOn,
  })
  @ApiResponse({ status: 404, description: 'Add-on not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  findOneAdmin(@Param('id') id: string) {
    return this.addonsService.findOne(id);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update an add-on template (Admin only)',
    description:
      'Updates an existing add-on template. Can update pricing, description, limits, active status, and more.',
  })
  @ApiResponse({
    status: 200,
    description: 'Add-on template updated successfully',
    type: AddOn,
  })
  @ApiResponse({ status: 404, description: 'Add-on not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  update(@Param('id') id: string, @Body() updateAddonDto: UpdateAddonDto) {
    return this.addonsService.update(id, updateAddonDto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deactivate an add-on template (Admin only)',
    description:
      'Soft-deletes an add-on template by setting isActive to false. Existing purchases remain valid.',
  })
  @ApiResponse({ status: 200, description: 'Add-on deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Add-on not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  remove(@Param('id') id: string) {
    return this.addonsService.remove(id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get an add-on by ID',
    description: 'Returns details of a specific add-on template.',
  })
  @ApiOkResponse({
    description: 'Add-on details',
    type: AddOn,
  })
  @ApiResponse({ status: 404, description: 'Add-on not found' })
  findOne(@Param('id') id: string) {
    return this.addonsService.findOne(id);
  }

  @Delete(':businessAddonId/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @SkipSubscriptionCheck()
  @ApiOperation({
    summary: 'Cancel a recurring service add-on',
    description:
      'Cancels a recurring service add-on (e.g., dashboard manager agent). Only add-ons marked as recurring can be canceled.',
  })
  @ApiOkResponse({
    description: 'Add-on canceled successfully',
    type: BusinessAddOn,
  })
  @ApiResponse({ status: 400, description: 'Add-on is not a recurring service' })
  @ApiResponse({ status: 404, description: 'Purchased add-on not found' })
  async cancelAddon(
    @Request() req: RequestWithUser,
    @Param('businessAddonId') businessAddonId: string,
  ) {
    const businessId = req.user.businessId;
    return this.addonsService.cancelAddon(businessAddonId, businessId);
  }
}