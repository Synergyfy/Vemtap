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
  ApiQuery,
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
  @ApiOperation({ 
    summary: 'Send a single message or start a campaign',
    description: 'Enqueues a message for delivery or initiates a bulk campaign. Access: OWNER, MANAGER, STAFF'
  })
  @ApiBody({ type: SendMessageDto })
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
    summary: 'Get available templates for the branch (System + Branch specific)',
    description: 'Retrieves both system-wide and branch-specific message templates. Access: OWNER, MANAGER, STAFF, ADMIN',
  })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter templates by branch' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
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
  @ApiOperation({ 
    summary: 'Create a new message template',
    description: 'Creates a message template that can be reused for campaigns or direct messages. Access: OWNER, MANAGER, ADMIN'
  })
  @ApiBody({ type: CreateTemplateDto })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
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
  @ApiOperation({ 
    summary: 'Update a message template',
    description: 'Modifies an existing message template. Access: OWNER, MANAGER, ADMIN'
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiBody({ type: CreateTemplateDto, description: 'Partial template data' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
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
    description: 'Lists all sent and scheduled messaging campaigns for the branch. Access: Authenticated users with branch access'
  })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully' })
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
  @ApiOperation({ 
    summary: 'Get messaging analytics by branch',
    description: 'Provides delivery metrics and success rates for a branch. Access: Authenticated users with branch access'
  })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
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
    description: 'Retrieves all active message threads for a specific channel (e.g., WhatsApp, SMS) in a branch. Access: OWNER, MANAGER, STAFF, ADMIN',
  })
  @ApiQuery({ name: 'branchId', required: false })
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
  @ApiOperation({ 
    summary: 'Get messages in a specific thread (Newest to Oldest)',
    description: 'Fetches the full conversation history for a specific thread ID. Access: OWNER, MANAGER, STAFF, ADMIN'
  })
  @ApiParam({ name: 'threadId', description: 'Conversation thread UUID' })
  @ApiQuery({ name: 'branchId', required: false })
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
  @ApiOperation({ 
    summary: 'Send a reply to an active thread (Supports Quoting)',
    description: 'Sends a response to a customer message in a thread. Access: OWNER, MANAGER, STAFF'
  })
  @ApiParam({ name: 'threadId', description: 'Conversation thread UUID' })
  @ApiBody({ type: ReplyDto })
  @ApiQuery({ name: 'branchId', required: false })
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
  @ApiOperation({ 
    summary: 'Mark a conversation thread as read for the branch',
    description: 'Marks all messages in the thread as read to clear notifications. Access: OWNER, MANAGER, STAFF, ADMIN'
  })
  @ApiParam({ name: 'threadId', description: 'Conversation thread UUID' })
  @ApiQuery({ name: 'branchId', required: false })
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
  @ApiOperation({ 
    summary: 'Delete a message template',
    description: 'Permanently removes a message template. Access: OWNER, MANAGER, ADMIN'
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  async deleteTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: User },
  ) {
    return this.templateService.deleteTemplate(id, req.user);
  }
}

