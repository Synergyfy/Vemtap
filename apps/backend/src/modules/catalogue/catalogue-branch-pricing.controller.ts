import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CatalogueBranchPricingService } from './catalogue-branch-pricing.service';
import { SetItemBranchPricingDto } from './dto/branch-pricing.dto';

@ApiTags('Admin Catalogue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('catalogue/items')
export class CatalogueBranchPricingController {
  constructor(private readonly pricingService: CatalogueBranchPricingService) {}

  @Get(':id/branch-pricing')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('inventory')
  @ApiOperation({
    summary: "Every branch with the item's availability, price and stock there",
  })
  async getBranchPricing(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.pricingService.getItemBranchPricing(id, req.user.businessId);
  }

  @Put(':id/branch-pricing')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('inventory')
  @ApiOperation({
    summary:
      'Set which branches carry the item and, per branch, its price/stock',
  })
  async setBranchPricing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetItemBranchPricingDto,
    @Req() req: any,
  ) {
    return this.pricingService.setItemBranchPricing(
      id,
      dto,
      req.user.businessId,
    );
  }
}
