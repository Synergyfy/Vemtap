import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AffiliatesService } from './affiliates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { KycStatus } from './entities/affiliate-profile.entity';

@ApiTags('Affiliates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Get('stats')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Get current affiliate stats' })
  async getStats(@Req() req) {
    return this.affiliatesService.getStats(req.user.id);
  }

  @Get('activity')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Get recent affiliate activity' })
  async getActivity(@Req() req) {
    return this.affiliatesService.getActivity(req.user.id);
  }

  @Get('performance')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Get earnings performance data' })
  async getPerformance(@Req() req) {
    return this.affiliatesService.getPerformance(req.user.id);
  }

  @Get('leaderboard')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Get global leaderboard' })
  async getLeaderboard() {
    return this.affiliatesService.getLeaderboard();
  }

  @Get('referrals')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Get all referrals for current affiliate' })
  async getReferrals(@Req() req) {
    return this.affiliatesService.getReferrals(req.user.id);
  }

  @Get('profile')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Get full affiliate profile details (KYC, etc.)' })
  async getProfile(@Req() req) {
    return this.affiliatesService.getProfile(req.user.id);
  }

  @Post('profile')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Initialize affiliate profile' })
  async createProfile(@Req() req) {
    return this.affiliatesService.createProfile(req.user.id);
  }

  @Post('profile/update')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Update affiliate profile (KYC & Bank)' })
  async updateProfile(@Req() req, @Body() data: any) {
    return this.affiliatesService.updateProfile(req.user.id, data);
  }

  @Post('withdraw')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Request a withdrawal' })
  async requestWithdrawal(@Req() req, @Body('amount') amount: number) {
    return this.affiliatesService.requestWithdrawal(req.user.id, amount);
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
}
