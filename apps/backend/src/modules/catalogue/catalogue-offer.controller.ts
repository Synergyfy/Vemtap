import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
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
  OwnerOffersQueryDto,
  UpdateOfferGroupDto,
  UpdateOfferGroupStatusDto,
} from './dto/offer.dto';
import { RequestClaimOtpDto, VerifyClaimDto } from './dto/claim.dto';
import { BusinessClaimsQueryDto } from './dto/my-claims.dto';
import { SendDealGiftDto } from './dto/send-deal-gift.dto';
import { SetOfferBranchPricingDto } from './dto/branch-pricing.dto';
import { RejectDealGiftDto } from './dto/reject-deal-gift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  ProcessingConsentGuard,
  RequiresProcessingConsent,
} from '../account-privacy/processing-consent.guard';

@ApiTags('Catalogue Offers')
@Controller('catalogue/offers')
export class CatalogueOfferController {
  constructor(private readonly offerService: CatalogueOfferService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, ProcessingConsentGuard)
  @RequiresProcessingConsent('ai')
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
  @ApiOperation({
    summary: "List the business's own offers (any status)",
    description:
      'Always a bare array. Optional filters: branchId, status, search, sortBy; ' +
      '`groupBy=deal` collapses multi-branch deals; `page`/`limit` slice the list.',
  })
  async listOffersAdmin(@Query() query: OwnerOffersQueryDto, @Req() req: any) {
    return this.offerService.findAllOffersAdmin(req.user.businessId, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Patch('groups/:dealGroupId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('inventory')
  @ApiOperation({
    summary: 'Apply the same edit to every branch of a multi-branch deal',
  })
  async updateOfferGroup(
    @Param('dealGroupId', ParseUUIDPipe) dealGroupId: string,
    @Body() dto: UpdateOfferGroupDto,
    @Req() req: any,
  ) {
    return this.offerService.updateOfferGroup(
      dealGroupId,
      dto,
      req.user.businessId,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get('groups/:dealGroupId/branch-pricing')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('inventory')
  @ApiOperation({
    summary: 'Each branch of a deal: price, vouchers, status and claims',
  })
  async getOfferGroupBranchPricing(
    @Param('dealGroupId', ParseUUIDPipe) dealGroupId: string,
    @Req() req: any,
  ) {
    return this.offerService.getOfferGroupBranchPricing(
      dealGroupId,
      req.user.businessId,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get('groups/:dealGroupId/price-history')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('inventory')
  @ApiOperation({
    summary: "A deal's recent per-branch price changes, newest first",
  })
  async getOfferGroupPriceHistory(
    @Param('dealGroupId', ParseUUIDPipe) dealGroupId: string,
    @Req() req: any,
  ) {
    return this.offerService.getOfferGroupPriceHistory(
      dealGroupId,
      req.user.businessId,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Put('groups/:dealGroupId/branch-pricing')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('inventory')
  @ApiOperation({
    summary:
      'Set per-branch price/vouchers and turn branches on or off for a deal',
  })
  async setOfferGroupBranchPricing(
    @Param('dealGroupId', ParseUUIDPipe) dealGroupId: string,
    @Body() dto: SetOfferBranchPricingDto,
    @Req() req: any,
  ) {
    return this.offerService.setOfferGroupBranchPricing(
      dealGroupId,
      dto,
      req.user.businessId,
      req.user.id,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Patch('groups/:dealGroupId/status')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('inventory')
  @ApiOperation({ summary: 'Activate or deactivate a deal at every branch' })
  async updateOfferGroupStatus(
    @Param('dealGroupId', ParseUUIDPipe) dealGroupId: string,
    @Body() dto: UpdateOfferGroupStatusDto,
    @Req() req: any,
  ) {
    return this.offerService.updateOfferGroupStatus(
      dealGroupId,
      dto.status,
      req.user.businessId,
    );
  }

  @Public()
  @Get('public')
  @ApiOperation({
    summary: 'List active promotions across all branches (Public)',
    description:
      'Each offer carries its branch and business context. `business.uniqueCode` ' +
      'is the business 9-character code used by `GET /public/businesses/code/:code` ' +
      'for merchant profile links.',
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
  @ApiOperation({
    summary: 'Get offer details (Public)',
    description:
      'Returns the full offer payload. `business.slug` keeps the branch code ' +
      '(branch username or uniqueCode) for branch deep links while ' +
      '`business.uniqueCode` is the business 9-character code used by ' +
      '`GET /public/businesses/code/:code` for the merchant profile link.',
  })
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
      } catch {
        // A malformed Referer just means no detected origin.
      }
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
    description:
      'Claim rows carry `status` (`claimed` | `redeemed` | `expired`), ' +
      '`claimCode`, `expiresAt` and nested offer. Pagination is opt-in: ' +
      'without `page`/`limit` the legacy bare array is returned; supplying ' +
      'either returns `{ data, total, page, limit }`.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Business claims (array, or paginated envelope when requested)',
  })
  async getBusinessClaims(
    @Req() req: any,
    @Query() query: BusinessClaimsQueryDto,
  ) {
    return this.offerService.getBusinessClaims(req.user.businessId, query);
  }
}
