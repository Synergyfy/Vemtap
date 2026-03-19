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
import { User, UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateRewardTemplateDto,
  CreateRewardDto,
  GivePointsDto,
  GeneratePointCodeDto,
  UsePointCodeDto,
  GenerateRedemptionCodeDto,
  RedeemRewardDto,
} from './dto/loyalty.dto';

@ApiTags('Loyalty, Points & Rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // --- Point Logs ---
  @Get('points/balance')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Customer fetches their point balance for a business' })
  async getBalance(@Request() req: { user: User }, @Query('businessId') businessId: string) {
    return this.loyaltyService.getBusinessPoints(req.user.id, businessId);
  }

  @Get('points/logs')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Customer fetches their point logs' })
  async getMyLogs(
    @Request() req: { user: User },
    @Query('businessId') businessId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.loyaltyService.getPointLogs(req.user.id, businessId, page, limit);
  }

  @Get('points/business-logs')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Owner/Admin fetches point logs for business/branch' })
  async getBusinessLogs(
    @Request() req: { user: User },
    @Query('businessId') businessId: string,
    @Query('branchId') branchId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // If owner, ensure businessId matches their business
    return this.loyaltyService.getBusinessPointLogs(businessId, branchId, page, limit);
  }

  // --- Point Earning ---
  @Post('points/give')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Staff gives points to customer using unique code' })
  async givePoints(@Request() req: { user: User }, @Body() dto: GivePointsDto) {
    return this.loyaltyService.givePoints(req.user, dto);
  }

  @Post('points/generate-code')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Staff generates a 9-digit point code' })
  async generatePointCode(@Request() req: { user: User }, @Body() dto: GeneratePointCodeDto) {
    return this.loyaltyService.generatePointCode(req.user, dto);
  }

  @Post('points/use-code')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Customer uses a 9-digit point code' })
  async usePointCode(@Request() req: { user: User }, @Body() dto: UsePointCodeDto) {
    return this.loyaltyService.usePointCode(req.user, dto);
  }

  // --- Reward Templates ---
  @Post('templates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin creates a reward template' })
  async createTemplate(@Request() req: { user: User }, @Body() dto: CreateRewardTemplateDto) {
    return this.loyaltyService.createTemplate(req.user, dto);
  }

  @Get('templates')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Fetch all reward templates' })
  async getTemplates() {
    return this.loyaltyService.getTemplates();
  }

  // --- Rewards ---
  @Post('rewards')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Owner creates a reward for a branch' })
  async createReward(@Request() req: { user: User }, @Body() dto: CreateRewardDto) {
    return this.loyaltyService.createReward(req.user, dto);
  }

  @Get('rewards/branch/:branchId')
  @ApiOperation({ summary: 'Publicly fetch rewards for a branch' })
  async getBranchRewards(
    @Param('branchId') branchId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.loyaltyService.getBranchRewards(branchId, page, limit);
  }

  @Patch('rewards/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async updateReward(@Param('id') id: string, @Body() dto: Partial<CreateRewardDto>) {
    return this.loyaltyService.updateReward(id, dto);
  }

  @Delete('rewards/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async deleteReward(@Param('id') id: string) {
    return this.loyaltyService.deleteReward(id);
  }

  // --- Redemption ---
  @Post('redemption/generate-code')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Staff generates a redemption code for a reward' })
  async generateRedemptionCode(@Request() req: { user: User }, @Body() dto: GenerateRedemptionCodeDto) {
    return this.loyaltyService.generateRedemptionCode(req.user, dto);
  }

  @Post('redemption/redeem')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Customer redeems a reward using a code' })
  async redeemReward(@Request() req: { user: User }, @Body() dto: RedeemRewardDto) {
    return this.loyaltyService.redeemReward(req.user, dto);
  }

  @Get('analytics')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Fetch overall customer analytics (visits, points, savings)' })
  async getAnalytics(@Request() req: { user: User }, @Query('days') days?: number) {
    return this.loyaltyService.getCustomerAnalytics(req.user.id, days);
  }
}
