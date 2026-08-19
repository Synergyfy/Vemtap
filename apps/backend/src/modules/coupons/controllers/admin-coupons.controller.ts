import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { CouponsService } from '../services/coupons.service';
import { PromotionCodesService } from '../services/promotion-codes.service';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { CreatePromoCodeDto } from '../dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from '../dto/update-promo-code.dto';
import { QueryPromoCodesDto } from '../dto/query-promo-codes.dto';
import { QueryRedemptionsDto } from '../dto/query-redemptions.dto';
import { ToggleStatusDto } from '../dto/toggle-status.dto';

@ApiTags('Admin - Coupons & Promotion Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(
    private readonly couponsService: CouponsService,
    private readonly promotionCodesService: PromotionCodesService,
  ) {}

  // ----------------------------------------------------
  // COUPON ENDPOINTS (Underlying Discount Rules)
  // ----------------------------------------------------

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new Coupon discount rule' })
  async createCoupon(@Request() req: any, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Admin: List all Coupons' })
  async findAllCoupons() {
    return this.couponsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get single Coupon details with promo codes' })
  async findOneCoupon(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: Update Coupon settings' })
  async updateCoupon(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({
    summary: 'Admin: Suspend or Reactivate a Coupon (affects all its promo codes)',
  })
  async toggleCoupon(
    @Param('id') id: string,
    @Body() dto: ToggleStatusDto,
  ) {
    return this.couponsService.toggleActive(id, dto.isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete a Coupon' })
  async deleteCoupon(@Param('id') id: string) {
    await this.couponsService.remove(id);
    return { success: true, message: 'Coupon deleted successfully' };
  }

  // ----------------------------------------------------
  // PROMOTION CODE ENDPOINTS (Customer Facing Strings)
  // ----------------------------------------------------

  @Post(':couponId/promo-codes')
  @ApiOperation({
    summary: 'Admin: Create a Promotion Code attached to a Coupon',
  })
  async createPromoCode(
    @Param('couponId') couponId: string,
    @Request() req: any,
    @Body() dto: CreatePromoCodeDto,
  ) {
    return this.promotionCodesService.create(req.user.id, couponId, dto);
  }

  @Get('promo-codes/all')
  @ApiOperation({ summary: 'Admin: List all Promotion Codes with filters' })
  async findAllPromoCodes(@Query() query: QueryPromoCodesDto) {
    return this.promotionCodesService.findAll(query);
  }

  @Get('promo-codes/:id')
  @ApiOperation({ summary: 'Admin: Get single Promotion Code details' })
  async findOnePromoCode(@Param('id') id: string) {
    return this.promotionCodesService.findOne(id);
  }

  @Patch('promo-codes/:id')
  @ApiOperation({ summary: 'Admin: Update Promotion Code settings' })
  async updatePromoCode(
    @Param('id') id: string,
    @Body() dto: UpdatePromoCodeDto,
  ) {
    return this.promotionCodesService.update(id, dto);
  }

  @Patch('promo-codes/:id/toggle')
  @ApiOperation({
    summary: 'Admin: Suspend or Reactivate a single Promotion Code',
  })
  async togglePromoCode(
    @Param('id') id: string,
    @Body() dto: ToggleStatusDto,
  ) {
    return this.promotionCodesService.toggleActive(id, dto.isActive);
  }

  // ----------------------------------------------------
  // REDEMPTIONS AUDIT & ANALYTICS
  // ----------------------------------------------------

  @Get('analytics/stats')
  @ApiOperation({
    summary: 'Admin: Get overall coupon & discount performance metrics',
  })
  async getStats() {
    return this.promotionCodesService.getStats();
  }

  @Get('analytics/redemptions')
  @ApiOperation({
    summary: 'Admin: View immutable redemption log for all discounted subscriptions',
  })
  async getRedemptions(@Query() query: QueryRedemptionsDto) {
    return this.promotionCodesService.findRedemptions(query);
  }
}
