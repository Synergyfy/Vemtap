import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { AffiliatesService } from './affiliates.service';
import { VemtapAffiliateAgentsService } from './vemtap-affiliate-agents.service';
import { ListAgentsQueryDto } from './dto/list-agents-query.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { WithdrawRequestDto } from './dto/withdraw-request.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AffiliateStatsDto } from './dto/affiliate-stats.dto';
import { AffiliateActivityDto } from './dto/affiliate-activity.dto';
import { AffiliatePerformanceDto } from './dto/affiliate-performance.dto';
import { LeaderboardEntryDto } from './dto/leaderboard-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { KycStatus, AffiliateProfile } from './entities/affiliate-profile.entity';
import { AffiliateWithdrawalRequest } from './entities/withdrawal-request.entity';

@ApiTags('Affiliates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('affiliates')
export class AffiliatesController {
  constructor(
    private readonly affiliatesService: AffiliatesService,
    private readonly agentsService: VemtapAffiliateAgentsService,
  ) {}

  @Get('stats')
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get current affiliate stats' })
  @ApiOkResponse({ type: AffiliateStatsDto })
  async getStats(@Req() req): Promise<AffiliateStatsDto> {
    return this.affiliatesService.getStats(req.user.id);
  }

  @Get('activity')
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get recent affiliate activity' })
  @ApiOkResponse({ type: [AffiliateActivityDto] })
  async getActivity(@Req() req): Promise<AffiliateActivityDto[]> {
    return this.affiliatesService.getActivity(req.user.id);
  }

  @Get('performance')
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get earnings performance data' })
  @ApiOkResponse({ type: [AffiliatePerformanceDto] })
  async getPerformance(@Req() req): Promise<AffiliatePerformanceDto[]> {
    return this.affiliatesService.getPerformance(req.user.id);
  }

  @Get('leaderboard')
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get global leaderboard' })
  @ApiOkResponse({ type: [LeaderboardEntryDto] })
  async getLeaderboard(@Req() req): Promise<LeaderboardEntryDto[]> {
    return this.affiliatesService.getLeaderboard(req.user.role);
  }

  @Get('referrals')
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all referrals for current affiliate' })
  @ApiOkResponse({ description: 'List of referrals' })
  async getReferrals(@Req() req): Promise<any[]> {
    return this.affiliatesService.getReferrals(req.user.id);
  }

  @Get('profile')
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get full affiliate profile details (KYC, etc.)' })
  @ApiOkResponse({ description: 'Affiliate profile details' })
  async getProfile(@Req() req): Promise<any> {
    return this.affiliatesService.getProfile(req.user.id);
  }

  @Post('profile')
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Initialize affiliate profile' })
  @ApiOkResponse({ type: AffiliateProfile })
  async createProfile(@Req() req): Promise<AffiliateProfile> {
    return this.affiliatesService.createProfile(req.user.id);
  }

  @Post('profile/update')
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update affiliate profile (KYC & Bank)' })
  @ApiOkResponse({ type: AffiliateProfile })
  async updateProfile(
    @Req() req,
    @Body() data: UpdateProfileDto,
  ): Promise<AffiliateProfile> {
    return this.affiliatesService.updateProfile(req.user.id, data);
  }

  @Post('withdraw')
  @Roles(UserRole.AGENT, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Request a withdrawal' })
  @ApiOkResponse({ type: AffiliateWithdrawalRequest })
  async requestWithdrawal(
    @Req() req,
    @Body() body: WithdrawRequestDto,
  ): Promise<AffiliateWithdrawalRequest> {
    return this.affiliatesService.requestWithdrawal(req.user.id, body.amount);
  }

  // --- Admin Specific Endpoints ---

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get global affiliate stats' })
  async getAdminStats() {
    return this.affiliatesService.getGlobalAdminStats();
  }

  @Get('admin/withdrawals')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List withdrawal requests' })
  async getWithdrawals(@Req() req) {
    return this.affiliatesService.getAllWithdrawals();
  }

  @Post('admin/withdrawals/:id/process')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Process a withdrawal request' })
  async processWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req,
    @Body('status') status: any,
    @Body('note') note?: string,
  ) {
    return this.affiliatesService.processWithdrawal(
      id,
      req.user.id,
      status,
      note,
    );
  }

  @Get('admin/profiles')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all affiliate profiles' })
  async getAllProfiles() {
    return this.affiliatesService.getAllProfilesAdmin();
  }

  @Get('admin/referrals')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all referrals globally' })
  async getAllReferrals() {
    return this.affiliatesService.getAllReferralsAdmin();
  }

  @Get('admin/commissions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all commissions globally' })
  async getAllCommissions() {
    return this.affiliatesService.getAllCommissionsAdmin();
  }

  @Get('admin/fraud')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List flagged/fraudulent profiles' })
  async getFraudAlerts() {
    return this.affiliatesService.getFraudAlerts();
  }

  @Patch('admin/settings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update global commission rules' })
  async updateSettings(
    @Body() data: { directRate: number; indirectRate?: number },
  ) {
    return this.affiliatesService.updateCommissionSettings(
      data.directRate,
      data.indirectRate,
    );
  }

  @Post('admin/profiles/:id/verify-kyc')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Verify/Reject an affiliate KYC' })
  async verifyAffiliateKyc(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: KycStatus,
  ) {
    return this.affiliatesService.updateKycStatus(id, status);
  }

  @Post('admin/profiles/:id/flag')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Flag/Unflag an affiliate' })
  async flagAffiliate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isFlagged') isFlagged: boolean,
    @Body('reason') reason?: string,
  ) {
    return this.affiliatesService.toggleAffiliateFlag(id, isFlagged, reason);
  }

  // --- Affiliate Agent Proxy Endpoints (Compensation Dashboard) ---

  @Get('agents')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List agents from affiliate backend' })
  async listAgents(@Query() query: ListAgentsQueryDto) {
    return this.agentsService.listAgents(query);
  }

  @Get('agents/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get agent detail from affiliate backend' })
  async getAgentDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.getAgentDetail(id);
  }

  @Get('agents/:id/revenue')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get agent monthly revenue trend' })
  async getAgentRevenue(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.getAgentRevenue(id);
  }

  @Post('agents')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new agent in affiliate backend' })
  async createAgent(@Body() dto: CreateAgentDto) {
    return this.agentsService.createAgent(dto);
  }

  @Patch('agents/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an agent in affiliate backend' })
  async updateAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agentsService.updateAgent(id, dto);
  }

  @Delete('agents/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate an agent in affiliate backend' })
  async deleteAgent(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.deleteAgent(id);
  }
}
