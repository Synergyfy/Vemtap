import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DealEngagementService } from './deal-engagement.service';
import {
  BusinessReviewsQueryDto,
  CreateDealReviewDto,
  DealReviewDetailDto,
  ListReviewsQueryDto,
  UpdateDealReviewDto,
} from './dto/deal-review.dto';
import { DealReactionDto } from './dto/deal-reaction.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

interface DealEngagementRequest {
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    businessId?: string;
    role?: UserRole;
  };
  ip?: string;
  headers?: { 'x-forwarded-for'?: string | string[] };
}

@ApiTags('Deal Engagement')
@Controller('deals')
export class DealEngagementController {
  constructor(private readonly engagementService: DealEngagementService) {}

  // =====================
  // BUSINESS REVIEW MANAGEMENT
  // =====================

  @ApiBearerAuth()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Get('business/reviews')
  @ApiOperation({
    summary: 'List deal reviews for the current user business (Merchant)',
  })
  async listBusinessReviews(
    @Request() req: DealEngagementRequest,
    @Query() query: BusinessReviewsQueryDto,
  ) {
    return this.engagementService.findReviewsForBusiness(
      this.getBusinessIdOrThrow(req),
      query,
    );
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Get('business/reviews/summary')
  @ApiOperation({
    summary: 'Rating summary for the current business (Merchant)',
    description:
      'Average and total of APPROVED deal reviews plus the pending moderation count.',
  })
  async getBusinessReviewsSummary(@Request() req: DealEngagementRequest) {
    return this.engagementService.getReviewsSummaryForBusiness(
      this.getBusinessIdOrThrow(req),
    );
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Post('business/reviews/:id/approve')
  @ApiOperation({
    summary: 'Approve a deal review for current user business (Merchant)',
  })
  async approveBusinessReview(
    @Request() req: DealEngagementRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.engagementService.approveReviewByBusiness(
      this.getBusinessIdOrThrow(req),
      id,
    );
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Post('business/reviews/:id/reject')
  @ApiOperation({
    summary: 'Reject a deal review for current user business (Merchant)',
  })
  async rejectBusinessReview(
    @Request() req: DealEngagementRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.engagementService.rejectReviewByBusiness(
      this.getBusinessIdOrThrow(req),
      id,
    );
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Delete('business/reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a deal review on current user business offer (Merchant)',
  })
  async removeBusinessReview(
    @Request() req: DealEngagementRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.engagementService.removeReviewByBusiness(
      this.getBusinessIdOrThrow(req),
      id,
    );
  }

  private getBusinessIdOrThrow(req: DealEngagementRequest): string {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new BadRequestException('User is not associated with a business');
    }
    return businessId;
  }

  // =====================
  // PUBLIC & CUSTOMER ENDPOINTS
  // =====================

  @Public()
  @Post(':offerId/reviews')
  @ApiOperation({ summary: 'Submit a review for a deal (Public)' })
  async createReview(
    @Request() req: DealEngagementRequest,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() dto: CreateDealReviewDto,
  ) {
    return this.engagementService.createReview(
      req.user,
      offerId,
      dto,
      this.resolveIp(req),
    );
  }

  @Public()
  @Get(':offerId/reviews')
  @ApiOperation({ summary: 'List approved reviews for a deal (Public)' })
  async listReviews(
    @Request() req: DealEngagementRequest,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Query() query: ListReviewsQueryDto,
  ) {
    return this.engagementService.listReviews(offerId, query, req.user);
  }

  @Public()
  @Get(':offerId/reviews/preview')
  @ApiOperation({ summary: 'Top 3 approved reviews for a deal (Public)' })
  async previewReviews(@Param('offerId', ParseUUIDPipe) offerId: string) {
    return this.engagementService.previewReviews(offerId);
  }

  @Public()
  @Get(':offerId/reviews/:reviewId')
  @ApiOperation({
    summary: 'Get a single review (Public)',
    description:
      'Approved reviews are public. A pending or rejected review is only ' +
      'visible to its author when the request carries the author’s token; ' +
      'everyone else receives 404 so moderation state is not leaked.',
  })
  @ApiParam({ name: 'offerId', format: 'uuid' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  @ApiResponse({ status: 200, type: DealReviewDetailDto })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findReview(
    @Request() req: DealEngagementRequest,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ) {
    return this.engagementService.findReviewById(offerId, reviewId, req.user);
  }

  @ApiBearerAuth()
  @Patch(':offerId/reviews/:reviewId')
  @ApiOperation({
    summary: "Update the authenticated author's own review",
    description:
      'Only the user who created the review can edit it (403 otherwise). ' +
      'Anonymous reviews cannot be edited. When the business requires review ' +
      'approval the edit re-enters PENDING moderation. Access: authenticated author',
  })
  @ApiParam({ name: 'offerId', format: 'uuid' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  @ApiResponse({ status: 200, type: DealReviewDetailDto })
  @ApiResponse({ status: 403, description: 'Review belongs to another user' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async updateReview(
    @Request() req: DealEngagementRequest,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: UpdateDealReviewDto,
  ) {
    return this.engagementService.updateOwnReview(
      offerId,
      reviewId,
      req.user!.id,
      dto,
    );
  }

  @ApiBearerAuth()
  @Delete(':offerId/reviews/:reviewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete the authenticated author's own review",
    description:
      'Soft-deletes the review and re-syncs the offer rating aggregates. ' +
      'Only the author can delete it (403 otherwise). Access: authenticated author',
  })
  @ApiParam({ name: 'offerId', format: 'uuid' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Review deleted' })
  @ApiResponse({ status: 403, description: 'Review belongs to another user' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(
    @Request() req: DealEngagementRequest,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ) {
    await this.engagementService.deleteOwnReview(
      offerId,
      reviewId,
      req.user!.id,
    );
  }

  @ApiBearerAuth()
  @Post(':offerId/reviews/:reviewId/like')
  @ApiOperation({ summary: 'Toggle a like on a review (Authenticated)' })
  async toggleReviewLike(
    @Request() req: DealEngagementRequest,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ) {
    return this.engagementService.toggleReviewLike(
      req.user!.id,
      offerId,
      reviewId,
    );
  }

  @ApiBearerAuth()
  @Post(':offerId/reactions')
  @ApiOperation({
    summary: 'Set/toggle the current user reaction (like/dislike) on a deal',
  })
  async setReaction(
    @Request() req: DealEngagementRequest,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() dto: DealReactionDto,
  ) {
    return this.engagementService.setReaction(req.user!.id, offerId, dto.type);
  }

  @ApiBearerAuth()
  @Get(':offerId/reaction-status')
  @ApiOperation({ summary: 'Current user reaction and counts for a deal' })
  async getReactionStatus(
    @Request() req: DealEngagementRequest,
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ) {
    return this.engagementService.getReactionStatus(req.user!.id, offerId);
  }

  @ApiBearerAuth()
  @Post(':offerId/save')
  @ApiOperation({ summary: 'Toggle save for a deal (Authenticated)' })
  async toggleSave(
    @Request() req: DealEngagementRequest,
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ) {
    return this.engagementService.toggleSave(req.user!.id, offerId);
  }

  @ApiBearerAuth()
  @Get(':offerId/save-status')
  @ApiOperation({ summary: 'Whether the current user saved a deal' })
  async getSaveStatus(
    @Request() req: DealEngagementRequest,
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ) {
    return this.engagementService.getSaveStatus(req.user!.id, offerId);
  }

  @Public()
  @Get(':offerId/engagement')
  @ApiOperation({ summary: 'Aggregated engagement for a deal (Public)' })
  async getEngagement(
    @Request() req: DealEngagementRequest,
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ) {
    return this.engagementService.getEngagement(offerId, req.user);
  }

  private resolveIp(req: DealEngagementRequest): string | undefined {
    // Prefer X-Forwarded-For (first hop = client IP) when present; the app does
    // not enable Express `trust proxy`, so req.ip would otherwise be the
    // reverse proxy's address behind nginx/ALB and collapse all anonymous
    // anti-spam buckets into one.
    const forwarded = req.headers?.['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ip = forwardedIp ?? req.ip;
    return ip ? String(ip).split(',')[0].trim() : undefined;
  }
}
