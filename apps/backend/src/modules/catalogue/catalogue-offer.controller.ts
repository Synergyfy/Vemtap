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
  HttpCode,
  HttpStatus,
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
  PublicCatalogueOffersQueryDto,
  GenerateOfferTermsDto,
} from './dto/offer.dto';
import { RequestClaimOtpDto, VerifyClaimDto } from './dto/claim.dto';
import { SendDealGiftDto } from './dto/send-deal-gift.dto';
import { RejectDealGiftDto } from './dto/reject-deal-gift.dto';
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
  @Post('generate-terms')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('inventory')
  @ApiOperation({
    summary:
      'AI-generate terms & conditions for an offer (Deducts 1 AI credit)',
  })
  async generateTerms(@Body() dto: GenerateOfferTermsDto, @Req() req: any) {
    return this.offerService.generateTerms(dto, req.user.businessId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('inventory')
  @ApiOperation({ summary: 'Create a new catalogue offer (Admin)' })
  async createOffer(@Body() dto: CreateCatalogueOfferDto, @Req() req: any) {
    return this.offerService.createOffer(dto, req.user.businessId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('inventory')
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
  @Permissions('inventory')
  @ApiOperation({ summary: 'Delete a catalogue offer (Admin)' })
  async deleteOffer(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.offerService.deleteOffer(id, req.user.businessId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get('admin')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('inventory')
  @ApiOperation({ summary: 'List all offers for the business (Admin)' })
  async listOffersAdmin(@Query('branchId') branchId: string, @Req() req: any) {
    return this.offerService.findAllOffersAdmin(req.user.businessId, branchId);
  }

  @Public()
  @Get('public')
  @ApiOperation({
    summary: 'List active promotions across all branches (Public)',
  })
  async listAllOffersPublic(@Query() query: PublicCatalogueOffersQueryDto) {
    return this.offerService.findAllOffersPublicGlobal(query);
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

  @Public()
  @Post('claim/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP to claim a promotion (Public)' })
  async requestClaimOtp(@Body() dto: RequestClaimOtpDto) {
    return this.offerService.requestClaimOtp(dto);
  }

  @Public()
  @Post('claim/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and complete promotion claim (Public)' })
  async verifyClaim(@Body() dto: VerifyClaimDto) {
    return this.offerService.verifyClaim(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('claim/gift')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Send deal gift details and claim instructions to another person (Authenticated)',
  })
  async sendDealGift(@Body() dto: SendDealGiftDto, @Req() req: any) {
    const originHeader = (req?.headers?.['origin'] as string) || undefined;
    let refererOrigin: string | undefined;
    if (req?.headers?.['referer']) {
      try {
        refererOrigin = new URL(req.headers['referer']).origin;
      } catch {}
    }
    const detectedOrigin = dto.frontendBaseUrl || originHeader || refererOrigin;
    return this.offerService.sendDealGift(dto, req.user, detectedOrigin);
  }

  @Public()
  @Get('gift/:token')
  @ApiOperation({ summary: 'Get gift deal details for recipient (Public)' })
  async getGiftByToken(@Param('token') token: string) {
    return this.offerService.getGiftByToken(token);
  }

  @Public()
  @Post('gift/:token/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject/decline a deal gift (Public)' })
  async rejectDealGift(
    @Param('token') token: string,
    @Body() dto: RejectDealGiftDto,
  ) {
    return this.offerService.rejectDealGift(token, dto.reason);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get('gifts/branch/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('inventory')
  @ApiOperation({ summary: 'Get gifted deals for a branch (Admin)' })
  async getBranchGiftedDeals(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.offerService.getBranchGiftedDeals(branchId, {
      page,
      limit,
      search,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Post('claim/redeem/:code')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('pos')
  @ApiOperation({ summary: 'Redeem a claimed promotion code (Admin/Staff)' })
  async redeemClaim(@Param('code') code: string, @Req() req: any) {
    return this.offerService.redeemClaim(code, req.user.businessId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get('claims')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('inventory')
  @ApiOperation({
    summary: 'Get all promotion claims for the business (Admin)',
  })
  async getBusinessClaims(@Req() req: any) {
    return this.offerService.getBusinessClaims(req.user.businessId);
  }
}
