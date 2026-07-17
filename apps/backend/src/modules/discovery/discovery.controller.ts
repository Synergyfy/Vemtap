import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { BranchesService } from '../branches/branches.service';
import {
  UpdateDiscoverySettingsDto,
  RecommendBusinessDto,
  DiscoveryQueryDto,
} from './dto/discovery.dto';
import {
  DiscoveryAdminStatsResponseDto,
  DiscoveryAdminBusinessesResponseDto,
} from './dto/discovery-admin-responses.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  AdminOfferQueryDto,
  AdminReferralQueryDto,
  AdminPartnershipQueryDto,
  AdminSponsoredQueryDto,
  AdminBillingQueryDto,
  AdminCustomerQueryDto,
  AdminLocationQueryDto,
  AdminCategoryQueryDto,
  AdminFraudQueryDto,
  AdminNotificationQueryDto,
  AdminAuditLogQueryDto,
} from './dto/discovery-admin-query.dto';
import {
  CreateCategoryTypeDto,
  UpdateCategoryTypeDto,
  GenerateReportDto,
  UpdateDiscoveryAdminSettingsDto,
} from './dto/discovery-admin-category-types.dto';

@ApiTags('discovery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('discovery')
export class DiscoveryController {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly branchesService: BranchesService,
  ) {}

  @Get('overview/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Discovery Network Overview for a branch' })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  @ApiResponse({
    status: 200,
    description: 'Overview statistics and highlights retrieved successfully',
  })
  async getOverview(@Req() req: any, @Param('branchId') branchId: string) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.getOverview(branchId);
  }

  @Get('results/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get Discovery Network performance results/analytics',
  })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['7days', 'month', 'year'],
    example: '7days',
  })
  async getResults(
    @Req() req: any,
    @Param('branchId') branchId: string,
    @Query('range') range: '7days' | 'month' | 'year' = '7days',
  ) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.getResults(branchId, range);
  }

  @Get('settings/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Discovery Network settings for a branch' })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  async getSettings(@Req() req: any, @Param('branchId') branchId: string) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.getSettings(branchId);
  }

  @Patch('settings/:branchId')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update Discovery Network settings for a branch' })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  async updateSettings(
    @Req() req: any,
    @Param('branchId') branchId: string,
    @Body() dto: UpdateDiscoverySettingsDto,
  ) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.updateSettings(branchId, dto);
  }

  @Get('partners/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get active partnership list with referral metrics',
  })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  async getPartners(@Req() req: any, @Param('branchId') branchId: string) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.getPartners(branchId);
  }

  @Get('customers/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get list of customer visits driven by discovery referrals',
  })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  async getCustomers(
    @Req() req: any,
    @Param('branchId') branchId: string,
    @Query() query: DiscoveryQueryDto,
  ) {
    await this.validateAccess(req.user, branchId);
    const filter = query.filter || 'all';
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    return this.discoveryService.getCustomers(branchId, filter, page, limit);
  }

  @Post('recommend/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Recommend a complementary business to join VemTap',
  })
  @ApiParam({ name: 'branchId', description: 'ID of the recommending branch' })
  async recommend(
    @Req() req: any,
    @Param('branchId') branchId: string,
    @Body() dto: RecommendBusinessDto,
  ) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.submitRecommendation(branchId, dto);
  }

  // =============== ADMIN ENDPOINTS ===============

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Get platform-wide Discovery Network KPI statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Aggregated platform discovery metrics retrieved successfully',
    type: DiscoveryAdminStatsResponseDto,
  })
  async getAdminStats() {
    return this.discoveryService.getAdminStats();
  }

  @Get('admin/businesses')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Get all businesses with their discovery metrics',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'restaurant',
  })
  @ApiResponse({
    status: 200,
    description: 'Businesses with discovery metrics retrieved successfully',
    type: DiscoveryAdminBusinessesResponseDto,
  })
  async getAdminBusinesses(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.discoveryService.getAdminBusinesses({ page, limit, search });
  }

  @Get('admin/businesses/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get business discovery detail' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  async getAdminBusinessDetail(@Param('id') id: string) {
    return this.discoveryService.getAdminBusinessDetail(id);
  }

  // --- Offers ---
  @Get('admin/offers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all offers with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  async getAdminOffers(@Query() query: AdminOfferQueryDto) {
    return this.discoveryService.getAdminOffers(query);
  }

  @Get('admin/offers/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get single offer detail with conversion funnel' })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  async getAdminOfferDetail(@Param('id') id: string) {
    return this.discoveryService.getAdminOfferDetail(id);
  }

  // --- Referrals ---
  @Get('admin/referrals')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all referrals with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getAdminReferrals(@Query() query: AdminReferralQueryDto) {
    return this.discoveryService.getAdminReferrals(query);
  }

  @Get('admin/referrals/:id/investigate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get fraud investigation detail for a referral' })
  @ApiParam({ name: 'id', description: 'Referral ID' })
  async getAdminReferralInvestigation(@Param('id') id: string) {
    return this.discoveryService.getAdminReferralInvestigation(id);
  }

  // --- Partnerships ---
  @Get('admin/partnerships')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all B2B partnerships' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getAdminPartnerships(@Query() query: AdminPartnershipQueryDto) {
    return this.discoveryService.getAdminPartnerships(query);
  }

  // --- Sponsored Campaigns ---
  @Get('admin/sponsored')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all sponsored ad campaigns' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getAdminSponsoredCampaigns(@Query() query: AdminSponsoredQueryDto) {
    return this.discoveryService.getAdminSponsoredCampaigns(query);
  }

  @Get('admin/sponsored/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get campaign detail with performance/billing/audit tabs' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async getAdminSponsoredCampaignDetail(@Param('id') id: string) {
    return this.discoveryService.getAdminSponsoredCampaignDetail(id);
  }

  // --- Billing ---
  @Get('admin/billing')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List invoices/transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  async getAdminBilling(@Query() query: AdminBillingQueryDto) {
    return this.discoveryService.getAdminBilling(query);
  }

  @Get('admin/billing/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get invoice detail with line items' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  async getAdminBillingDetail(@Param('id') id: string) {
    return this.discoveryService.getAdminBillingDetail(id);
  }

  // --- Attribution ---
  @Get('admin/attribution')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get attribution paths, metrics, and window config' })
  async getAdminAttribution() {
    return this.discoveryService.getAdminAttribution();
  }

  // --- Customers ---
  @Get('admin/customers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all customers across network' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getAdminCustomers(@Query() query: AdminCustomerQueryDto) {
    return this.discoveryService.getAdminCustomers(query);
  }

  @Get('admin/customers/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get customer profile with activity timeline' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async getAdminCustomerDetail(@Param('id') id: string) {
    return this.discoveryService.getAdminCustomerDetail(id);
  }

  // --- Locations ---
  @Get('admin/locations')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all districts with performance metrics' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAdminLocations(@Query() query: AdminLocationQueryDto) {
    return this.discoveryService.getAdminLocations(query);
  }

  @Get('admin/locations/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get location detail with businesses, offers, revenue' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  async getAdminLocationDetail(@Param('id') id: string) {
    return this.discoveryService.getAdminLocationDetail(id);
  }

  // --- Categories ---
  @Get('admin/categories')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all offer categories with conversion data' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAdminCategories(@Query() query: AdminCategoryQueryDto) {
    return this.discoveryService.getAdminCategories(query);
  }

  @Get('admin/categories/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get category detail' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async getAdminCategoryDetail(@Param('id') id: string) {
    return this.discoveryService.getAdminCategoryDetail(id);
  }

  // --- Category Types ---
  @Get('admin/category-types')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List offer category types' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAdminCategoryTypes(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.discoveryService.getAdminCategoryTypes(page, limit);
  }

  @Post('admin/category-types')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create category type' })
  async createAdminCategoryType(@Body() dto: CreateCategoryTypeDto) {
    return this.discoveryService.createAdminCategoryType(dto);
  }

  @Patch('admin/category-types/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update category type' })
  @ApiParam({ name: 'id', description: 'Category Type ID' })
  async updateAdminCategoryType(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryTypeDto,
  ) {
    return this.discoveryService.updateAdminCategoryType(id, dto);
  }

  @Delete('admin/category-types/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete category type' })
  @ApiParam({ name: 'id', description: 'Category Type ID' })
  async deleteAdminCategoryType(@Param('id') id: string) {
    return this.discoveryService.deleteAdminCategoryType(id);
  }

  // --- Fraud ---
  @Get('admin/fraud')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get fraud alerts with KPIs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'severity', required: false, type: String })
  async getAdminFraudAlerts(@Query() query: AdminFraudQueryDto) {
    return this.discoveryService.getAdminFraudAlerts(query);
  }

  // --- Notifications ---
  @Get('admin/notifications')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get notification delivery log' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'channel', required: false, type: String })
  async getAdminNotifications(@Query() query: AdminNotificationQueryDto) {
    return this.discoveryService.getAdminNotifications(query);
  }

  // --- Reports ---
  @Get('admin/reports')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List generated reports' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAdminReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.discoveryService.getAdminReports(page, limit);
  }

  @Post('admin/reports/generate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Generate a new report' })
  async generateAdminReport(@Req() req: any, @Body() dto: GenerateReportDto) {
    return this.discoveryService.generateAdminReport(dto, req.user.id);
  }

  // --- Audit Logs ---
  @Get('admin/audit-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get immutable audit trail' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: String })
  async getAdminAuditLogs(@Query() query: AdminAuditLogQueryDto) {
    return this.discoveryService.getAdminAuditLogs(query);
  }

  @Get('admin/audit-logs/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get audit log detail with before/after diff' })
  @ApiParam({ name: 'id', description: 'Audit Log ID' })
  async getAdminAuditLogDetail(@Param('id') id: string) {
    return this.discoveryService.getAdminAuditLogDetail(id);
  }

  // --- Settings ---
  @Get('admin/settings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get global discovery system config' })
  async getAdminDiscoverySettings() {
    return this.discoveryService.getAdminDiscoverySettings();
  }

  @Patch('admin/settings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Save global discovery system config' })
  async updateAdminDiscoverySettings(@Body() dto: UpdateDiscoveryAdminSettingsDto) {
    return this.discoveryService.updateAdminDiscoverySettings(dto);
  }

  private async validateAccess(user: any, branchId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this branch');
    }
  }
}
