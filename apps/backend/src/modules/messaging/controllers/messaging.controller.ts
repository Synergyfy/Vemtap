import {
  BadRequestException,
  Controller,
  Delete,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
  Patch,
  ParseUUIDPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { MessagingEngineService } from '../services/messaging-engine.service';
import { CampaignService } from '../services/campaign.service';
import { TemplateService } from '../services/template.service';
import { AnalyticsService } from '../services/analytics.service';
import { InboxService } from '../services/inbox.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { ReplyDto } from '../dto/reply.dto';
import { Channel } from '../enums/channel.enum';
import { User, UserRole } from '../../users/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { TrialRestrictionGuard } from '../../subscriptions/guards/trial-restriction.guard';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';
import { MessagingAnalyticsFilterDto } from '../dto/messaging-analytics-filter.dto';
import { MessagingHelperService } from '../services/messaging-helper.service';
import { BranchesService } from '../../branches/branches.service';

@ApiTags('Messaging')
@Controller('messaging')
export class MessagingController {
  constructor(
    private readonly messagingEngine: MessagingEngineService,
    private readonly campaignService: CampaignService,
    private readonly templateService: TemplateService,
    private readonly analyticsService: AnalyticsService,
    private readonly inboxService: InboxService,
    private readonly branchesService: BranchesService,
    private readonly messagingHelperService: MessagingHelperService,
  ) {}

  private async getBranchId(
    req: { user: User },
    branchId?: string,
  ): Promise<string> {
    return this.messagingHelperService.resolveBranchId(req.user, branchId);
  }

  @Post('send')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
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
    const branchId = await this.getBranchId(req, dto.branchId);
    dto.branchId = branchId;
    return this.messagingEngine.sendMessage(dto);
  }

  @Get('templates')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Get available templates for the branch (System + Branch specific)',
  })
  async getTemplates(
    @Request() req: { user: User },
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.templateService.getAvailableTemplates(branchId);
  }

  @Post('templates')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new message template' })
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @Request() req: { user: User },
  ) {
    // Explicitly check for branchId if not provided in DTO for Owners/Admins
    const branchId = await this.getBranchId(req, dto.branchId);
    dto.branchId = branchId;
    return this.templateService.createTemplate(dto, req.user);
  }

  @Patch('templates/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a message template' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateTemplateDto>,
    @Request() req: { user: User },
  ) {
    return this.templateService.updateTemplate(id, dto, req.user);
  }

  @Get('campaigns')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @ApiOperation({
    summary: 'Get all messaging campaigns for a branch',
  })
  async getCampaigns(
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.campaignService.getCampaigns(branchId);
  }

  @Get('analytics')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @ApiOperation({ summary: 'Get messaging analytics by branch' })
  async getAnalytics(
    @Query() filter: MessagingAnalyticsFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.analyticsService.getDashboardMetrics(branchId, filter.channel);
  }


  @Get('inbox/:channel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiParam({ name: 'channel', enum: Channel })
  @ApiOperation({
    summary: 'Get conversation threads by channel for a branch (Newest to Oldest)',
  })
  @ApiResponse({ status: 200, description: 'List of threads sorted by last activity' })
  async getInboxThreads(
    @Param('channel', new ParseEnumPipe(Channel)) channel: Channel,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.inboxService.getThreads(branchId, channel);
  }

  @Get('inbox/threads/:threadId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get messages in a specific thread (Newest to Oldest)' })
  @ApiResponse({ status: 200, description: 'List of messages with quoting support' })
  async getThreadMessages(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.inboxService.getThreadMessages(threadId, branchId);
  }

  @Post('inbox/threads/:threadId/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Send a reply to an active thread (Supports Quoting)' })
  @ApiBody({ type: ReplyDto })
  @ApiResponse({ status: 201, description: 'Reply sent and broadcast via Socket' })
  async replyToThread(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Body() dto: ReplyDto,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);

    return this.inboxService.sendReply(threadId, dto.content, branchId, dto.replyToId);
  }

  @Post('inbox/threads/:threadId/read')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark a conversation thread as read for the branch' })
  @ApiResponse({ status: 200, description: 'Thread marked as read' })
  async markThreadAsRead(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.inboxService.markAsRead(threadId, branchId);
  }

  @Delete('templates/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a message template' })
  async deleteTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: User },
  ) {
    return this.templateService.deleteTemplate(id, req.user);
  }
}

