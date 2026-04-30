import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CatalogueOfferService } from './catalogue-offer.service';
import {
  CreateCatalogueOfferDto,
  UpdateCatalogueOfferDto,
  CatalogueOfferQueryDto,
} from './dto/offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Catalogue Offers')
@Controller('catalogue/offers')
export class CatalogueOfferController {
  constructor(private readonly offerService: CatalogueOfferService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Create a new catalogue offer (Admin)' })
  async createOffer(@Body() dto: CreateCatalogueOfferDto, @Req() req: any) {
    return this.offerService.createOffer(dto, req.user.businessId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Update a catalogue offer (Admin)' })
  async updateOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogueOfferDto,
    @Req() req: any,
  ) {
    return this.offerService.updateOffer(id, dto, req.user.businessId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Delete a catalogue offer (Admin)' })
  async deleteOffer(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.offerService.deleteOffer(id, req.user.businessId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get('admin')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'List all offers for the business (Admin)' })
  async listOffersAdmin(@Query('branchId') branchId: string, @Req() req: any) {
    return this.offerService.findAllOffersAdmin(req.user.businessId, branchId);
  }

  @Public()
  @Get('public/:branchId')
  @ApiOperation({ summary: 'List all active offers for a branch (Public)' })
  async listOffersPublic(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Query() query: CatalogueOfferQueryDto,
  ) {
    return this.offerService.findAllOffersPublic(branchId, query);
  }

  @Public()
  @Get('public/details/:id')
  @ApiOperation({ summary: 'Get offer details (Public)' })
  async getOfferPublic(@Param('id', ParseUUIDPipe) id: string) {
    return this.offerService.findOneOffer(id);
  }
}
