import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  CreateRewardTemplateDto,
  CreateRewardDto,
  GivePointsDto,
  GeneratePointCodeDto,
  UsePointCodeDto,
  GenerateRedemptionCodeDto,
  RedeemRewardDto,
  BranchIdParamDto,
} from './dto/loyalty.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import {
  CustomerAnalyticsQueryDto,
  PointLogsQueryDto,
  RewardQueryDto,
} from './dto/loyalty-query.dto';

@ApiTags('Loyalty, Points & Rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // --- Point Logs ---
  @Get('points/balance')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Customer fetches their point balance for a business',
    description:
      'Returns the total points balance for the authenticated customer at a specific business. Access: CUSTOMER',
  })
  @ApiQuery({
    name: 'businessId',
    required: true,
    description: 'The ID of the business',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns point balance',
    schema: { example: 150 },
  })
  async getBalance(
    @Request() req: { user: User },
    @Query('businessId') businessId: string,
  ) {
    return this.loyaltyService.getBusinessPoints(req.user.id, businessId);
  }

  @Get('points/logs')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Customer fetches their point logs',
    description:
      'Retrieves a paginated list of point transactions (earning/spending) for the authenticated customer. Access: CUSTOMER',
  })
  @ApiQuery({
    name: 'businessId',
    required: true,
    description: 'The ID of the business',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns list of point logs',
    schema: {
      example: [
        {
          id: '1',
          amount: 50,
          type: 'EARNED',
          reason: 'Purchased coffee',
          createdAt: '2023-10-10T12:00:00Z',
          branch: {
            id: 'br-123',
            name: 'Main Branch',
          },
          givenBy: {
            id: 'staff-456',
            firstName: 'Alice',
            lastName: 'Smith',
            email: 'alice@example.com',
          },
        },
      ],
    },
  })
  async getMyLogs(
    @Request() req: { user: User },
    @Query('businessId') businessId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.loyaltyService.getPointLogs(
      req.user.id,
      businessId,
      query.page,
      query.limit,
    );
  }

  @Get('points/business-logs')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Owner/Admin fetches point logs for business/branch',
    description:
      'Retrieves point transaction history for a specific business or branch. Owners can only access their own business. Access: OWNER, ADMIN',
  })
  @ApiQuery({ name: 'businessId', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns business point logs',
    schema: {
      example: [
        {
          id: '1',
          amount: 50,
          type: 'EARNED',
          reason: 'Purchased coffee',
          customerId: 'user-123',
          createdAt: '2023-10-10T12:00:00Z',
        },
      ],
    },
  })
  async getBusinessLogs(@Query() query: PointLogsQueryDto) {
    return this.loyaltyService.getBusinessPointLogs(
      query.businessId,
      query.branchId,
      query.page,
      query.limit,
    );
  }

  // --- Point Earning ---
  @Post('points/give')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('loyalty')
  @ApiOperation({
    summary: 'Staff gives points to customer using unique code',
    description:
      'Manually award points to a customer using their unique customer code. Access: OWNER, MANAGER, STAFF',
  })
  @ApiBody({ type: GivePointsDto })
  @ApiResponse({
    status: 201,
    description: 'Points awarded successfully',
    schema: { example: { success: true, message: 'Points awarded' } },
  })
  async givePoints(@Request() req: { user: User }, @Body() dto: GivePointsDto) {
    return this.loyaltyService.givePoints(req.user, dto);
  }

  @Post('points/generate-code')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('loyalty')
  @ApiOperation({
    summary: 'Staff generates a 9-digit point code',
    description:
      'Generates a temporary code that a customer can use to claim points. Access: OWNER, MANAGER, STAFF',
  })
  @ApiBody({ type: GeneratePointCodeDto })
  @ApiResponse({
    status: 201,
    description: 'Code generated successfully',
    schema: { example: { code: '123-456-789' } },
  })
  async generatePointCode(
    @Request() req: { user: User },
    @Body() dto: GeneratePointCodeDto,
  ) {
    return this.loyaltyService.generatePointCode(req.user, dto);
  }

  @Post('points/use-code')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Customer uses a 9-digit point code',
    description:
      'Allows a customer to redeem a 9-digit code to receive points. Access: CUSTOMER',
  })
  @ApiBody({ type: UsePointCodeDto })
  @ApiResponse({
    status: 201,
    description: 'Points claimed successfully',
    schema: { example: { success: true, points: 50 } },
  })
  async usePointCode(
    @Request() req: { user: User },
    @Body() dto: UsePointCodeDto,
  ) {
    return this.loyaltyService.usePointCode(req.user, dto);
  }

  // --- Reward Templates ---
  @Post('reward-templates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin creates a reward template',
    description:
      'Creates a base template for rewards that owners can use for their branches. Access: ADMIN',
  })
  @ApiBody({ type: CreateRewardTemplateDto })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    schema: {
      example: {
        id: 'tpl-1',
        name: 'Coffee',
        description: 'Free Coffee',
        pointsRequired: 50,
        category: 'DRINK',
      },
    },
  })
  async createTemplate(
    @Request() req: { user: User },
    @Body() dto: CreateRewardTemplateDto,
  ) {
    return this.loyaltyService.createTemplate(req.user, dto);
  }

  @Get('reward-templates')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Fetch all reward templates',
    description:
      'Retrieves all available reward templates. Access: OWNER, ADMIN',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of reward templates',
    schema: {
      example: [
        {
          id: 'tpl-1',
          name: 'Coffee',
          description: 'Free Coffee',
          pointsRequired: 50,
          category: 'DRINK',
        },
      ],
    },
  })
  async getTemplates() {
    return this.loyaltyService.getTemplates();
  }

  // --- Rewards ---
  @Post('rewards')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('loyalty')
  @ApiOperation({
    summary: 'Owner creates a reward for a branch',
    description:
      'Creates a specific reward instance for a branch, optionally based on a template. Access: OWNER, ADMIN',
  })
  @ApiBody({ type: CreateRewardDto })
  @ApiResponse({
    status: 201,
    description: 'Reward created successfully',
    schema: {
      example: {
        id: 'rwd-1',
        name: 'Free Coffee',
        pointsRequired: 50,
        totalQuantity: 100,
        remainingQuantity: 100,
        branchId: 'br-1',
      },
    },
  })
  async createReward(
    @Request() req: { user: User },
    @Body() dto: CreateRewardDto,
  ) {
    return this.loyaltyService.createReward(req.user, dto);
  }

  @Get('rewards')
  @ApiOperation({
    summary: 'Publicly fetch rewards for a branch',
    description:
      'Retrieves a paginated list of redeemable rewards for a specific branch. Supports filtering and sorting. Public access.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of redeemable rewards',
    schema: {
      example: {
        data: [
          {
            id: 'd9b2d63d-a233-4123-8478-438acb679b32',
            createdAt: '2023-10-10T12:00:00Z',
            updatedAt: '2023-10-10T12:00:00Z',
            name: 'Free Coffee',
            description: 'Get a free coffee with 100 points',
            pointsRequired: 100,
            category: 'FOOD_AND_BEVERAGE',
            coverImage: 'https://example.com/image.jpg',
            galleryImages: [],
            totalQuantity: 50,
            remainingQuantity: 40,
            isActive: true,
            expiryDate: '2024-10-10T12:00:00Z',
            businessId: 'f8b2d63d-a233-4123-8478-438acb679b32',
            branchId: 'b5b2d63d-a233-4123-8478-438acb679b32',
            templateId: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      },
    },
  })
  async getPublicRewards(@Query() query: RewardQueryDto) {
    return this.loyaltyService.getPublicRewards(query);
  }

  @Get('rewards/branch/:branchId')
  @ApiOperation({
    summary: 'Publicly fetch rewards for a branch (Legacy)',
    description:
      'Retrieves available rewards for a specific branch. Public access. DEPRECATED.',
  })
  @ApiParam({ name: 'branchId', description: 'The ID of the branch' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns list of rewards' })
  async getBranchRewards(
    @Param() { branchId }: BranchIdParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.loyaltyService.getBranchRewards(
      branchId,
      query.page,
      query.limit,
    );
  }

  @Patch('rewards/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('loyalty')
  @ApiOperation({
    summary: 'Update a reward',
    description:
      'Updates reward details like quantity or expiry date. Access: OWNER, ADMIN, MANAGER, STAFF',
  })
  @ApiParam({ name: 'id', description: 'The ID of the reward' })
  @ApiBody({ type: CreateRewardDto, description: 'Partial upgrade of reward' })
  @ApiResponse({ status: 200, description: 'Reward updated successfully' })
  async updateReward(
    @Request() req: { user: User },
    @Param('id') id: string,
    @Body() dto: Partial<CreateRewardDto>,
  ) {
    return this.loyaltyService.updateReward(req.user, id, dto);
  }

  @Delete('rewards/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('loyalty')
  @ApiOperation({
    summary: 'Delete a reward',
    description:
      'Removes a reward from a branch. Access: OWNER, ADMIN, MANAGER, STAFF',
  })
  @ApiParam({ name: 'id', description: 'The ID of the reward' })
  @ApiResponse({
    status: 200,
    description: 'Reward deleted successfully',
    schema: { example: { affected: 1 } },
  })
  async deleteReward(@Request() req: { user: User }, @Param('id') id: string) {
    return this.loyaltyService.deleteReward(req.user, id);
  }

  @Get('rewards/:id/redemptions')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('loyalty')
  @ApiOperation({
    summary: 'Fetch customers who redeemed a reward',
    description:
      'Retrieves a paginated list of customers who have successfully redeemed a specific reward. Access: OWNER, MANAGER, STAFF',
  })
  @ApiParam({ name: 'id', description: 'The ID of the reward' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns list of redemptions',
    schema: {
      example: {
        data: [
          {
            id: 'red-1',
            usedAt: '2023-10-10T12:00:00Z',
            customer: {
              id: 'cus-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              phone: '+1234567890',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      },
    },
  })
  async getRewardRedemptions(
    @Request() req: { user: User },
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.loyaltyService.getRewardRedemptions(
      req.user,
      id,
      query.page,
      query.limit,
    );
  }

  // --- Redemption ---
  @Post('redemption/generate-code')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('loyalty')
  @ApiOperation({
    summary: 'Staff generates a redemption code for a reward',
    description:
      'Generates a code that a customer can use to redeem a reward at the branch. Access: OWNER, MANAGER, STAFF',
  })
  @ApiBody({ type: GenerateRedemptionCodeDto })
  @ApiResponse({
    status: 201,
    description: 'Redemption code generated successfully',
    schema: {
      example: {
        id: 'redc-1',
        code: '123456789',
        rewardId: 'rwd-1',
        createdById: 'staff-1',
        businessId: 'biz-1',
        branchId: 'br-1',
      },
    },
  })
  async generateRedemptionCode(
    @Request() req: { user: User },
    @Body() dto: GenerateRedemptionCodeDto,
  ) {
    return this.loyaltyService.generateRedemptionCode(req.user, dto);
  }

  @Post('redemption/redeem')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Customer redeems a reward using a code',
    description:
      'Allows a customer to use a redemption code to claim a reward. Access: CUSTOMER',
  })
  @ApiBody({ type: RedeemRewardDto })
  @ApiResponse({
    status: 201,
    description: 'Reward redeemed successfully',
    schema: { example: { success: true, reward: 'Free Coffee' } },
  })
  async redeemReward(
    @Request() req: { user: User },
    @Body() dto: RedeemRewardDto,
  ) {
    return this.loyaltyService.redeemReward(req.user, dto);
  }

  @Get('analytics')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Fetch overall customer analytics (visits, points, savings)',
    description:
      'Retrieves aggregated loyalty data for the authenticated customer across all businesses. Access: CUSTOMER',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of past days to include in analytics',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully',
    schema: {
      example: {
        totalVisits: 12,
        currentPointsBalance: 450,
        netSavings: 1500,
        visitTrends: [
          { month: 'Jan', visits: 4 },
          { month: 'Feb', visits: 5 },
          { month: 'Mar', visits: 3 },
        ],
        pointsByVenue: [
          { venueName: 'Starbucks Downtown', points: 300 },
          { venueName: 'Burger King Main', points: 150 },
        ],
        topVenues: [
          { venueName: 'Starbucks Downtown', points: 8 },
          { venueName: 'Burger King Main', points: 4 },
        ],
        trends: {
          totalVisits: '+25%',
          rewardPoints: '+10%',
        },
      },
    },
  })
  async getAnalytics(
    @Request() req: { user: User },
    @Query() query: CustomerAnalyticsQueryDto,
  ) {
    return this.loyaltyService.getCustomerAnalytics(req.user.id, query.days);
  }
}
