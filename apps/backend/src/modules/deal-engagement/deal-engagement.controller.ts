import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DealEngagementService } from './deal-engagement.service';
import {
  CreateDealReviewDto,
  ListReviewsQueryDto,
} from './dto/deal-review.dto';
import { DealReactionDto } from './dto/deal-reaction.dto';
import { Public } from '../../common/decorators/public.decorator';

interface DealEngagementRequest {
  user?: { id: string; firstName?: string; lastName?: string };
  ip?: string;
  headers?: { 'x-forwarded-for'?: string | string[] };
}

@ApiTags('Deal Engagement')
@Controller('deals')
export class DealEngagementController {
  constructor(private readonly engagementService: DealEngagementService) {}

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
