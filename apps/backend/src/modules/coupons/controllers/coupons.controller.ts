import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CouponEngineService } from '../services/coupon-engine.service';
import { ValidatePromoCodeDto } from '../dto/validate-promo-code.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { BranchesService } from '../../branches/branches.service';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Coupons & Discounts')
@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly couponEngineService: CouponEngineService,
    private readonly branchesService: BranchesService,
  ) {}

  private async extractBusinessId(req: any): Promise<string | undefined> {
    if (req.user?.businessId) return req.user.businessId;
    if (req.user?.role === UserRole.OWNER && req.user?.id) {
      const business = await this.branchesService.findBusinessByOwner(
        req.user.id,
      );
      if (business) return business.id;
    }
    if (req.user?.branchId) {
      const branch = await this.branchesService.findById(req.user.branchId);
      if (branch) return branch.businessId;
    }
    return undefined;
  }

  @Post('validate')
  @Public()
  @ApiOperation({
    summary: 'Validate promotion code & calculate discount preview',
    description:
      'Validates a coupon/promo code against plan and billing cycle rules. Returns complete pricing breakdown with tax and discount math.',
  })
  @ApiResponse({
    status: 200,
    description: 'Promotion code is valid and breakdown calculated',
  })
  async validate(
    @Body() dto: ValidatePromoCodeDto,
    @Request() req: any,
  ) {
    let businessId = dto.businessId;
    if (!businessId && req?.user) {
      businessId = await this.extractBusinessId(req);
    }

    return this.couponEngineService.validatePromotion({
      code: dto.code,
      planId: dto.planId,
      billingPeriod: dto.billingPeriod,
      businessId,
    });
  }
}
