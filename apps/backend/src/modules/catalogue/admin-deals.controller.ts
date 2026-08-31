import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CatalogueOfferService } from './catalogue-offer.service';
import {
  AdminDealsQueryDto,
  AdminBusinessesQueryDto,
} from './dto/offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Admin Deals Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/deals')
export class AdminDealsController {
  constructor(private readonly offerService: CatalogueOfferService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all deals with filters, sorting, and pagination (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of deals with metadata',
  })
  async listDeals(@Query() query: AdminDealsQueryDto) {
    return this.offerService.getAdminDeals(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get deal counts and statistics (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Deal statistics summary (total, active, featured, expired)',
  })
  async getDealsStats() {
    return this.offerService.getAdminDealsStats();
  }

  @Get('businesses')
  @ApiOperation({
    summary: 'Get simple list of businesses for deal filtering (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of businesses with ID and name',
  })
  async listBusinesses(@Query() query: AdminBusinessesQueryDto) {
    return this.offerService.getAdminBusinessesList(query);
  }

  @Patch(':id/featured')
  @ApiOperation({
    summary: 'Toggle featured status on a deal (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Toggled featured status for the deal',
  })
  async toggleFeatured(@Param('id', ParseUUIDPipe) id: string) {
    return this.offerService.toggleDealFeatured(id);
  }
}
