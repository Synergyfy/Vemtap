import {
  BadRequestException,
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { User, UserRole } from '../../users/entities/user.entity';

import { MessagingEngineService } from '../services/messaging-engine.service';
import { TemplateService } from '../services/template.service';
import { CampaignService } from '../services/campaign.service';
import { AnalyticsService } from '../services/analytics.service';
import { InboxService } from '../services/inbox.service';

import { SendMessageDto } from '../dto/send-message.dto';
import { Channel } from '../enums/channel.enum';

export class CreateTemplateDto {
  name: string;
  channel: Channel;
  content: string;
}

export class ReplyDto {
  content: string;
}

@ApiTags('Messaging Center')
@Controller('messaging')
@Permissions('messages')
export class MessagingController {
  constructor(
    private readonly messagingEngine: MessagingEngineService,
    private readonly templateService: TemplateService,
    private readonly campaignService: CampaignService,
    private readonly analyticsService: AnalyticsService,
    private readonly inboxService: InboxService,
  ) {}

  @Post('send')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Send a single message or start a campaign' })
  @ApiResponse({
    status: 200,
    description: 'Message queued or sent successfully',
  })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Request() req: { user: User },
  ) {
    // Ensures businessId matches the caller's business context
    dto.businessId = req.user.businessId;

    // Use user's branchId if available, unless overridden (e.g. by owner sending on behalf of branch)
    // Staff should always use their branch.
    if (req.user.role === UserRole.STAFF) {
        dto.branchId = req.user.branchId;
    } else if (!dto.branchId && req.user.branchId) {
        // Default to user's branch if not provided
        dto.branchId = req.user.branchId;
    }

    if (!dto.branchId) {
        throw new BadRequestException('branchId is required');
    }

    return this.messagingEngine.sendMessage(dto);
  }

  @Post('templates')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new message template' })
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @Request() req: { user: User },
  ) {
    return this.templateService.createTemplate(
      req.user.businessId,
      dto.name,
      dto.channel,
      dto.content,
    );
  }

  @Get('campaigns')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Get all messaging campaigns for a branch' })
  async getCampaigns(
    @Query('branchId') branchId: string,
    @Request() req: { user: User },
  ) {
    const resolved = branchId || req.user?.branchId;
    if (!resolved) throw new BadRequestException('branchId is required');
    return this.campaignService.getCampaigns(resolved);
  }

  @Get('analytics')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Get messaging analytics by branch' })
  async getAnalytics(
    @Query('channel') channel: Channel,
    @Query('branchId') branchId: string,
    @Request() req: { user: User },
  ) {
    const resolved = branchId || req.user?.branchId;
    if (!resolved) throw new BadRequestException('branchId is required');
    return this.analyticsService.getDashboardMetrics(resolved, channel);
  }

  @Get('inbox/:channel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiParam({ name: 'channel', enum: Channel })
  @ApiOperation({ summary: 'Get conversation threads by channel for a branch' })
  async getInboxThreads(
    @Param('channel') channel: Channel,
    @Query('branchId') branchId: string,
    @Request() req: { user: User },
  ) {
    const resolved = branchId || req.user?.branchId;
    if (!resolved) throw new BadRequestException('branchId is required');
    return this.inboxService.getThreads(resolved, channel);
  }

  @Get('inbox/threads/:threadId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Get messages in a specific thread' })
  async getThreadMessages(
    @Param('threadId') threadId: string,
    @Query('branchId') branchId: string,
    @Request() req: { user: User },
  ) {
    const resolved = branchId || req.user?.branchId;
    if (!resolved) throw new BadRequestException('branchId is required');
    return this.inboxService.getThreadMessages(resolved, threadId);
  }

  @Post('inbox/threads/:threadId/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Send a reply to an active thread' })
  async replyToThread(
    @Param('threadId') threadId: string,
    @Body() dto: ReplyDto,
    @Request() req: { user: User },
  ) {
    const resolved = req.user.branchId; // Staff/Managers replying usually do so from their context.
    // If Owner, they might need to specify branchId, but usually reply is to a thread which has branchId.
    // However, InboxService.sendReply uses threadId to look up the thread.
    // We pass req.user.branchId as security check (if provided).
    // If user is Owner (no branchId), we might need to skip this check or fetch thread first.
    // Ideally, sendReply(threadId) is enough, but we should verify ownership.

    // For now, let's assume if user has branchId, we enforce it.
    // If user is owner (branchId undefined), we might need to allow it.
    // InboxService.sendReply expects a branchId.
    // If owner, we need to get branchId from the thread first? Or just pass undefined?

    if (!resolved && (req.user.role === UserRole.OWNER || req.user.role === UserRole.MANAGER)) {
         // We can't validate branch ownership easily without fetching thread first.
         // Let's rely on InboxService to fetch thread and maybe we trust it belongs to business?
         // InboxService currently expects branchId to filter.
         // Let's modify InboxService to find thread by ID and then check businessId/branchId?
         // For now, I'll update InboxService.sendReply to be more flexible or we require branchId in query/body for reply too if not staff.
         // But wait, the previous code passed `req.user.businessId` to `inboxService.sendReply`.
         // `InboxService` now expects `branchId`.
         // If I am owner, I don't have branchId.
         // I should probably fetch the thread by ID and BusinessID, then get the branchId from it.
    }

    // FIX: Update InboxService to finding thread by businessId (for owners) OR branchId (for staff).
    // But I already updated InboxService to take `branchId`.
    // Let's just require branchId in query for reply if not present in user.
    // Or better, let's update InboxService to allow finding by ThreadID + BusinessID.

    // Actually, let's just stick to what I wrote: `InboxService.sendReply` takes `branchId`.
    // So `MessagingController` must provide it.
    // If `req.user.branchId` is null, throw error "branchId required".
    if (!resolved) {
         throw new BadRequestException('branchId is required to reply. Please switch to a branch context.');
    }

    return this.inboxService.sendReply(
      resolved,
      threadId,
      dto.content,
    );
  }
}
