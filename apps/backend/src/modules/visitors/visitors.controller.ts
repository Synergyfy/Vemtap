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
} from '@nestjs/swagger';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { VisitorQueryDto } from './dto/visitor-query.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Permissions } from 'src/common/decorators/permissions.decorator';
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

  private getBranchId(req: any, branchId?: string): string {
    const resolved = branchId || req.user?.branchId;
    if (!resolved) {
      throw new BadRequestException(
        'branchId is required (pass as query param or ensure user has branchId)',
      );
    }
    return resolved;
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
    return this.visitorsService.getStats(this.getBranchId(req, branchId));
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
    return this.visitorsService.getNewStats(this.getBranchId(req, branchId));
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
    return this.visitorsService.findNew(query, this.getBranchId(req, branchId));
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
    return this.visitorsService.findAll(query, this.getBranchId(req, branchId));
  }

  // --- Actions (Bulk) ---

  @Post('export')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Export visitors to CSV' })
  async export(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.visitorsService.export(this.getBranchId(req, branchId));
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
      this.getBranchId(req, branchId || body.branchId),
      body,
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
      this.getBranchId(req, branchId),
    );
  }

  @Post('rewards')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('dashboard') // Rewards might fall under campaigns/loyalty/dashboard
  @ApiOperation({ summary: 'Create a reward for visitors' })
  async createReward(
    @Req() req: any,
    @Body() body: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.campaignsService.createReward(
      this.getBranchId(req, branchId || body.branchId),
      body,
    );
  }

  // --- CRUD & Individual Actions ---

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('visitors')
  @ApiOperation({ summary: 'Create a new visitor' })
  @ApiResponse({ type: VisitorResponseDto })
  async create(
    @Body() createVisitorDto: CreateVisitorDto,
    @Req() req: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.visitorsService.create(
      createVisitorDto,
      this.getBranchId(req, branchId || createVisitorDto.branchId),
    );
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
      this.getBranchId(req, branchId),
      id,
      body.message,
      body.channel as any,
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
      this.getBranchId(req, branchId),
      id,
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
      this.getBranchId(req, branchId),
      id,
      body.rewardId,
    );
  }
}
