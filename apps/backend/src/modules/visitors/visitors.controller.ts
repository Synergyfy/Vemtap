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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { VisitorSignupDto } from './dto/visitor-signup.dto';
import { CreateVisitorRewardDto } from './dto/create-visitor-reward.dto';
import { DeviceTapDto } from './dto/device-tap.dto';
import { VisitorQueryDto } from './dto/visitor-query.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { CampaignsService } from '../campaigns/campaigns.service';
import { MessagingEngineService } from '../messaging/services/messaging-engine.service';
import {
  VisitorResponseDto,
  PaginatedVisitorResponseDto,
  NewVisitorResponseDto,
  ReturningVisitorResponseDto,
} from './dto/visitor-response.dto';
import { VisitorStatsResponseDto } from './dto/visitor-stats.dto';

@ApiTags('Visitors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('visitors')
export class VisitorsController {
  constructor(
    private readonly visitorsService: VisitorsService,
    private readonly campaignsService: CampaignsService,
    private readonly messagingService: MessagingEngineService,
  ) {}

  private getBusinessId(req: any): string {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new BadRequestException('User does not belong to any business');
    }
    return businessId;
  }

  private getBranchId(req: any, branchId?: string): string | undefined {
    return branchId || req.user?.branchId;
  }

  // --- Stats ---

  @Get('stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get overview visitor stats' })
  @ApiResponse({ type: VisitorStatsResponseDto })
  async getStats(
    @Req() req: any,
    @Query('branchId') branchId?: string,
  ): Promise<VisitorStatsResponseDto> {
    return this.visitorsService.getStats(
      this.getBusinessId(req),
      this.getBranchId(req, branchId),
    );
  }

  @Get('new/stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get new visitor stats' })
  @ApiResponse({ type: VisitorStatsResponseDto })
  async getNewStats(
    @Req() req: any,
    @Query('branchId') branchId?: string,
  ): Promise<VisitorStatsResponseDto> {
    return this.visitorsService.getNewStats(
      this.getBusinessId(req),
      this.getBranchId(req, branchId),
    );
  }

  @Get('returning/stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get returning visitor stats' })
  @ApiResponse({ type: VisitorStatsResponseDto })
  async getReturningStats(
    @Req() req: any,
    @Query('branchId') branchId?: string,
  ): Promise<VisitorStatsResponseDto> {
    return this.visitorsService.getReturningStats(
      this.getBusinessId(req),
      this.getBranchId(req, branchId),
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
    @Query('branchId') branchId?: string,
  ) {
    return this.visitorsService.findNew(
      query,
      this.getBusinessId(req),
      this.getBranchId(req, branchId),
    );
  }

  @Get('returning')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get returning visitors list' })
  async getReturning(
    @Query() query: VisitorQueryDto,
    @Req() req: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.visitorsService.findReturning(
      query,
      this.getBusinessId(req),
      this.getBranchId(req, branchId),
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
    @Query('branchId') branchId?: string,
  ): Promise<PaginatedVisitorResponseDto> {
    return this.visitorsService.findAll(
      query,
      this.getBusinessId(req),
      this.getBranchId(req, branchId),
    );
  }

  // --- Actions (Bulk) ---

  @Post('export')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Export visitors to CSV' })
  async export(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.visitorsService.export(
      this.getBusinessId(req),
      this.getBranchId(req, branchId),
    );
  }

  @Post('campaign')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('messages')
  @ApiOperation({ summary: 'Send campaign to visitors' })
  async sendCampaign(
    @Req() req: any,
    @Body() body: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.visitorsService.sendCampaign(
      this.getBusinessId(req),
      body,
      this.getBranchId(req, branchId || body.branchId),
    );
  }

  @Post('welcome-campaign')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('messages')
  @ApiOperation({ summary: 'Send welcome campaign to new visitors' })
  async sendWelcomeCampaign(
    @Req() req: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.visitorsService.sendWelcomeCampaign(
      this.getBusinessId(req),
      this.getBranchId(req, branchId),
    );
  }

  @Post('rewards')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('dashboard') // Rewards might fall under campaigns/loyalty/dashboard
  @ApiOperation({ summary: 'Create a reward for visitors' })
  async createReward(@Req() req: any, @Body() body: CreateVisitorRewardDto) {
    return this.campaignsService.createReward(
      this.getBranchId(req, body.branchId)!, // Rewards might still need branchId, or we handle it in service
      body,
    );
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
  async publicSignup(@Body() dto: VisitorSignupDto) {
    return this.visitorsService.create(dto);
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
  async create(@Body() createVisitorDto: CreateVisitorDto, @Req() req: any) {
    return this.visitorsService.create(
      createVisitorDto,
      this.getBusinessId(req),
      this.getBranchId(req),
    );
  }

  @Post('record-visit')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Record a visit via device tap (Customer Only)' })
  async recordVisit(@Body() dto: DeviceTapDto, @Req() req: any) {
    return this.visitorsService.recordVisit(req.user.id, dto.deviceCode);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Get a visitor by ID' })
  @ApiResponse({ type: VisitorResponseDto })
  async findOne(@Param('id') id: string) {
    return this.visitorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Update a visitor' })
  @ApiResponse({ type: VisitorResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateVisitorDto: Partial<CreateVisitorDto>,
  ) {
    return this.visitorsService.update(id, updateVisitorDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Delete a visitor' })
  async remove(@Param('id') id: string) {
    return this.visitorsService.remove(id);
  }

  @Post(':id/message')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('messages')
  @ApiOperation({ summary: 'Send a message to a visitor' })
  async sendMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { message: string; channel: string },
    @Query('branchId') branchId?: string,
  ) {
    return this.visitorsService.sendMessage(
      this.getBusinessId(req),
      id,
      body.message,
      body.channel as any,
      this.getBranchId(req, branchId),
    );
  }

  @Post(':id/welcome')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('messages')
  @ApiOperation({ summary: 'Send welcome message to a visitor' })
  async sendWelcome(
    @Req() req: any,
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.visitorsService.sendWelcome(
      this.getBusinessId(req),
      id,
      this.getBranchId(req, branchId),
    );
  }

  @Post(':id/reward')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('dashboard')
  @ApiOperation({ summary: 'Send reward to a visitor' })
  async sendReward(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { rewardId: string },
    @Query('branchId') branchId?: string,
  ) {
    return this.visitorsService.sendReward(
      this.getBusinessId(req),
      id,
      body.rewardId,
      this.getBranchId(req, branchId),
    );
  }
}
