import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { VisitorSignupDto } from './dto/visitor-signup.dto';
import { VisitorSignupQueryDto } from './dto/visitor-signup-query.dto';
import { CreateVisitorRewardDto } from './dto/create-visitor-reward.dto';
import { DeviceTapDto } from './dto/device-tap.dto';
import { VisitorQueryDto } from './dto/visitor-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AllowPending } from '../../common/decorators/allow-pending.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { LoyaltyService } from '../loyalty/loyalty.service';
import {
  VisitorResponseDto,
  PaginatedVisitorResponseDto,
  NewVisitorResponseDto,
  ReturningVisitorResponseDto,
} from './dto/visitor-response.dto';
import { VisitorStatsResponseDto } from './dto/visitor-stats.dto';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';
import {
  AdminSendMessageDto,
  AdminSendRewardDto,
  SendCampaignDto,
} from './dto/admin-visitor-action.dto';
import { ParseUUIDPipe } from '@nestjs/common';

import { VisitedBranchesQueryDto } from './dto/visited-branches-query.dto';
import { PaginatedVisitedBranchResponseDto } from './dto/visited-branch-response.dto';
import { AdminVisitorActivitiesQueryDto } from './dto/admin-visitor-activities-query.dto';
import { PaginatedVisitResponseDto } from './dto/visit-response.dto';
import { RewardCategory } from '../loyalty/entities/reward-template.entity';

@ApiTags('Visitors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('visitors')
export class VisitorsController {
  constructor(
    private readonly visitorsService: VisitorsService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  @Get('visited-branches')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Get branches visited by the customer with pagination and search',
  })
  @ApiResponse({
    status: 200,
    type: PaginatedVisitedBranchResponseDto,
    description:
      'List of branches visited by the customer, ordered from last visited to first visited',
  })
  async getVisitedBranches(
    @Req() req: any,
    @Query() query: VisitedBranchesQueryDto,
  ): Promise<PaginatedVisitedBranchResponseDto> {
    return this.visitorsService.getVisitedBranches(req.user.id, query);
  }

  private async getBranchId(req: any, queryBranchId?: string): Promise<string> {
    const user = req.user;

    // For Owner and Admin: branchId MUST be provided in the request for write operations
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (!queryBranchId) {
        throw new BadRequestException(
          'branchId is required for Owners and Admins for write operations',
        );
      }

      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.visitorsService.checkBranchAccess(
          user,
          queryBranchId,
        );
        if (!hasAccess) {
          throw new BadRequestException(
            'You do not have access to this branch',
          );
        }
      }
      return queryBranchId;
    }

    // For Manager and Staff: ignore queryBranchId, always use branchId from token
    if (!user.branchId) {
      throw new BadRequestException('User is not associated with any branch');
    }

    return user.branchId;
  }

  private async getResolvedContext(
    req: any,
    filter: BranchFilterDto,
  ): Promise<{ branchId?: string; businessId?: string }> {
    const user = req.user;

    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (filter.allBranches) {
        if (user.role === UserRole.OWNER) {
          return { businessId: user.businessId };
        }
        // For Admin, we could require a businessId in the query if allBranches is true
        // If not provided, it might mean 'all businesses' which is usually not what we want here
        return {
          businessId: user.businessId || (req.query.businessId as string),
        };
      }

      if (filter.branchId) {
        if (user.role === UserRole.OWNER) {
          const hasAccess = await this.visitorsService.checkBranchAccess(
            user,
            filter.branchId,
          );
          if (!hasAccess)
            throw new BadRequestException('Access denied to this branch');
        }
        return { branchId: filter.branchId };
      }

      throw new BadRequestException(
        'Either branchId or allBranches must be provided for Owners and Admins',
      );
    }

    return { branchId: user.branchId };
  }

  // --- Stats ---

  @Get('stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get overview visitor stats' })
  @ApiResponse({ type: VisitorStatsResponseDto })
  async getStats(
    @Req() req: any,
    @Query() filter: BranchFilterDto,
  ): Promise<VisitorStatsResponseDto> {
    const context = await this.getResolvedContext(req, filter);
    return this.visitorsService.getStats(context.branchId, context.businessId);
  }

  @Get('new/stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get new visitor stats' })
  @ApiResponse({ type: VisitorStatsResponseDto })
  async getNewStats(
    @Req() req: any,
    @Query() filter: BranchFilterDto,
  ): Promise<VisitorStatsResponseDto> {
    const context = await this.getResolvedContext(req, filter);
    return this.visitorsService.getNewStats(
      context.branchId,
      context.businessId,
    );
  }

  @Get('returning/stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get returning visitor stats' })
  @ApiResponse({ type: VisitorStatsResponseDto })
  async getReturningStats(
    @Req() req: any,
    @Query() filter: BranchFilterDto,
  ): Promise<VisitorStatsResponseDto> {
    const context = await this.getResolvedContext(req, filter);
    return this.visitorsService.getReturningStats(
      context.branchId,
      context.businessId,
    );
  }

  // --- Listings ---

  @Get('new')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get new visitors list' })
  async getNew(
    @Query() query: VisitorQueryDto,
    @Req() req: any,
    @Query() filter: BranchFilterDto,
  ): Promise<{ data: NewVisitorResponseDto[]; total: number }> {
    const context = await this.getResolvedContext(req, filter);
    return this.visitorsService.findNew(
      query,
      context.branchId,
      context.businessId,
    );
  }

  @Get('returning')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get returning visitors list' })
  async getReturning(
    @Query() query: VisitorQueryDto,
    @Req() req: any,
    @Query() filter: BranchFilterDto,
  ): Promise<{ data: ReturningVisitorResponseDto[]; total: number }> {
    const context = await this.getResolvedContext(req, filter);
    return this.visitorsService.findReturning(
      query,
      context.branchId,
      context.businessId,
    );
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get all visitors with pagination and filtering' })
  @ApiResponse({ type: PaginatedVisitorResponseDto })
  async findAll(
    @Query() query: VisitorQueryDto,
    @Req() req: any,
  ): Promise<PaginatedVisitorResponseDto> {
    const context = await this.getResolvedContext(req, query);
    return this.visitorsService.findAll(
      query,
      context.branchId,
      context.businessId,
    );
  }

  @Get('admin/activities')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin view of all visitor activities (visits)' })
  @ApiResponse({ type: PaginatedVisitResponseDto })
  async findAdminActivities(
    @Query() query: AdminVisitorActivitiesQueryDto,
  ): Promise<PaginatedVisitResponseDto> {
    return this.visitorsService.findAdminVisitorActivities(query);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get a visitor by ID' })
  @ApiResponse({ type: VisitorResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Query() filter: BranchFilterDto,
  ) {
    const context = await this.getResolvedContext(req, filter);
    return this.visitorsService.findOne(
      id,
      context.branchId,
      context.businessId,
    );
  }

  // --- Actions (Bulk) ---

  @Post('export')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Export visitors to CSV' })
  async export(
    @Req() req: any,
    @Query() filter: BranchFilterDto,
  ): Promise<{ message: string; data: string; filename: string }> {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.visitorsService.export(branchId);
  }

  @Post('campaign')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('messages')
  @ApiOperation({ summary: 'Send campaign to visitors' })
  async sendCampaign(
    @Req() req: any,
    @Body() body: SendCampaignDto,
    @Query() filter: BranchFilterDto,
  ): Promise<any> {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.visitorsService.sendCampaign(branchId, body as any);
  }

  @Post('welcome-campaign')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('messages')
  @ApiOperation({ summary: 'Send welcome campaign to new visitors' })
  async sendWelcomeCampaign(
    @Req() req: any,
    @Query() filter: BranchFilterDto,
  ): Promise<any> {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.visitorsService.sendWelcomeCampaign(branchId);
  }

  @Delete('reset')
  @Roles(UserRole.OWNER)
  @Permissions('settings')
  @ApiOperation({ summary: 'Reset all dashboard data for the branch' })
  async resetDashboard(
    @Req() req: any,
    @Query() filter: BranchFilterDto,
  ): Promise<void> {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.visitorsService.resetBusinessData(branchId);
  }

  @Post('rewards')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('dashboard')
  @ApiOperation({ summary: 'Create a reward for visitors' })
  async createReward(
    @Req() req: any,
    @Body() body: CreateVisitorRewardDto,
    @Query() filter: BranchFilterDto,
  ): Promise<any> {
    const branchId = await this.getBranchId(
      req,
      body.branchId || filter.branchId,
    );

    // Map simplified DTO to the more comprehensive CreateRewardDto used by loyaltyService
    const rewardDto = {
      ...body,
      pointsRequired: body.pointCost, // Map pointCost to pointsRequired
      branchId,
      category: (body as any).category || RewardCategory.FREE_PRODUCT,
      totalQuantity: (body as any).totalQuantity || 100, // Defaul quantity if not provided
      expiryDate: new Date(
        Date.now() + (body.validityDays || 30) * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };

    return this.loyaltyService.createReward(req.user, rewardDto as any);
  }

  // --- CRUD & Individual Actions ---

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Public visitor signup (Customer Only)' })
  @ApiBody({ type: VisitorSignupDto })
  @ApiResponse({
    status: 201,
    description: 'Visitor registered successfully',
    type: VisitorResponseDto,
  })
  async publicSignup(
    @Body() dto: VisitorSignupDto,
  ): Promise<VisitorResponseDto> {
    return this.visitorsService.create(dto);
  }

  // --- Smart Visit Tracking ---

  @Post('portal-visit')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Record a portal visit (Customer Only)',
    description:
      'Automatically called when an authenticated customer reaches the portal menu. ' +
      'Implements session idempotency, 4h cooldown, and IP rate limiting to prevent fraud. ' +
      'Returns the sessionToken which must be included in subsequent order payloads.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        deviceCode: { type: 'string', example: 'LT-8829-X' },
        sessionToken: {
          type: 'string',
          example: 'uuid-v4',
          description: 'Optional: if omitted, the server generates one.',
        },
        referredByBranchId: {
          type: 'string',
          example: 'uuid-v4',
          description: 'Optional: ID of the partner branch that referred this customer.',
        },
        catalogueOfferId: {
          type: 'string',
          example: 'uuid-v4',
          description: 'Optional: ID of the Catalogue Offer (Promotion) that drove this visit.',
        },
      },
      required: ['deviceCode'],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Visit recorded (or existing visit returned if within cooldown)',
    schema: {
      type: 'object',
      properties: {
        visitId: { type: 'string' },
        sessionToken: { type: 'string' },
        isNewVisit: { type: 'boolean' },
      },
    },
  })
  async recordPortalVisit(
    @Req() req: any,
    @Body() body: { deviceCode: string; sessionToken?: string; referredByBranchId?: string; catalogueOfferId?: string },
  ): Promise<{ visitId: string; sessionToken: string; isNewVisit: boolean }> {
    const customerId = req.user.id as string;
    const ipAddress: string =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
      req.socket?.remoteAddress ??
      req.ip;
    const userAgent = req.headers['user-agent'] as string | undefined;

    // Use the client-provided token (for resume after refresh) or generate a fresh one.
    const sessionToken = body.sessionToken ?? randomUUID();

    return this.visitorsService.recordPortalVisit({
      customerId,
      deviceCode: body.deviceCode,
      sessionToken,
      ipAddress,
      userAgent,
      referredByBranchId: body.referredByBranchId,
      catalogueOfferId: body.catalogueOfferId,
    });
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Create a new visitor' })
  @ApiBody({ type: CreateVisitorDto })
  @ApiResponse({
    status: 201,
    description: 'Visitor created successfully',
    type: VisitorResponseDto,
  })
  async create(
    @Body() createVisitorDto: CreateVisitorDto,
    @Req() req: any,
    @Query() filter: BranchFilterDto,
  ): Promise<VisitorResponseDto> {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.visitorsService.create(createVisitorDto, branchId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Update a visitor' })
  @ApiResponse({ type: VisitorResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVisitorDto: Partial<CreateVisitorDto>,
  ) {
    return this.visitorsService.update(id, updateVisitorDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Delete a visitor' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.remove(id);
  }

  @Post(':id/message')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('messages')
  @ApiOperation({ summary: 'Send a message to a visitor' })
  async sendMessage(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminSendMessageDto,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.visitorsService.sendMessage(
      id,
      body.message,
      body.channel,
      branchId,
    );
  }

  @Post(':id/welcome')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('messages')
  @ApiOperation({ summary: 'Send welcome message to a visitor' })
  async sendWelcome(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.visitorsService.sendWelcome(id, branchId);
  }

  @Post(':id/reward')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('dashboard')
  @ApiOperation({ summary: 'Send reward to a visitor' })
  async sendReward(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminSendRewardDto,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.visitorsService.sendReward(id, body.rewardId, branchId);
  }
}
