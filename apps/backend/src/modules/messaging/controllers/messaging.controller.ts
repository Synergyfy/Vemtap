import {
  Controller,
  Delete,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Request,
  Patch,
  ParseEnumPipe,
  ParseUUIDPipe,
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
import { UpdateMessageDto } from '../dto/update-message.dto';
import { CreateMessagingTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateStatusDto } from '../dto/template/update-template-status.dto';
import { ReplyDto } from '../dto/reply.dto';
import { Channel } from '../enums/channel.enum';
import { User, UserRole } from '../../users/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { TrialRestrictionGuard } from '../../subscriptions/guards/trial-restriction.guard';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';
import { MessagingAnalyticsFilterDto } from '../dto/messaging-analytics-filter.dto';
import { MessagingHelperService } from '../services/messaging-helper.service';
import { BusinessCustomersService } from '../../business-customers/business-customers.service';
import { InitThreadDto } from '../dto/init-thread.dto';
import { BranchesService } from '../../branches/branches.service';
import { IdDto } from '../dto/id.dto';
import { ThreadIdDto } from '../dto/thread-id.dto';
import { MessagingThreadFilterDto } from '../dto/thread-filter.dto';

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
    private readonly businessCustomers: BusinessCustomersService,
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
  @Permissions('messages')
  @ApiOperation({
    summary: 'Send a single message or start a campaign',
    description:
      "Enqueues a message for delivery or initiates a bulk campaign. Credits are charged to the caller's business (a body businessId is ignored), and customerIds that are not the business's customers are dropped (400 when none remain). Access: OWNER, MANAGER, STAFF",
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
    // The business (whose credits pay for the send) comes from the token,
    // never the body, and a business may only message its own customers.
    const businessId = req.user.businessId;
    if (!businessId)
      throw new ForbiddenException('No business on this account');
    dto.businessId = businessId;
    if (dto.customerIds?.length) {
      dto.customerIds = await this.businessCustomers.filterKnownCustomers(
        businessId,
        dto.customerIds,
      );
      if (!dto.customerIds.length) {
        throw new BadRequestException(
          'None of these customers belong to this business',
        );
      }
    }
    return this.messagingEngine.sendMessage(dto);
  }

  @Get('templates')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @Permissions('messages')
  @ApiOperation({
    summary:
      'Get available templates for the branch (System + Branch specific)',
    description:
      'Retrieves both system-wide and branch-specific message templates. Access: OWNER, MANAGER, STAFF, ADMIN',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Filter templates by branch',
  })
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
  @Permissions('messages')
  @ApiOperation({
    summary: 'Create a new message template',
    description:
      'Creates a message template that can be reused for campaigns or direct messages. Access: OWNER, MANAGER, ADMIN',
  })
  @ApiBody({ type: CreateMessagingTemplateDto })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(
    @Body() dto: CreateMessagingTemplateDto,
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
  @Permissions('messages')
  @ApiOperation({
    summary: 'Update a message template',
    description:
      'Modifies an existing message template. Access: OWNER, MANAGER, ADMIN',
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiBody({
    type: CreateMessagingTemplateDto,
    description: 'Partial template data',
  })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(
    @Param() { id }: IdDto,
    @Body() dto: Partial<CreateMessagingTemplateDto>,
    @Request() req: { user: User },
  ) {
    return this.templateService.updateTemplate(id, dto, req.user);
  }

  @Get('admin/templates')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Get all messaging templates platform-wide',
    description: 'Retrieves all messaging templates. Access: ADMIN',
  })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getAdminTemplates() {
    return this.templateService.findAllAdmin();
  }

  @Post('admin/templates/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Update template status',
    description:
      'Updates template status (approved, rejected, pending). Access: ADMIN',
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiBody({ type: UpdateTemplateStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Template status updated successfully',
  })
  async updateAdminTemplateStatus(
    @Param() { id }: IdDto,
    @Body() dto: UpdateTemplateStatusDto,
  ) {
    return this.templateService.updateStatus(id, dto.status);
  }

  @Get('campaigns')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Permissions('messages')
  @ApiOperation({
    summary: 'Get all messaging campaigns for a branch',
    description:
      'Lists all sent and scheduled messaging campaigns for the branch. Access: Authenticated users with branch access',
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
  @Permissions('messages')
  @ApiOperation({
    summary: 'Get messaging analytics by branch',
    description:
      'Provides delivery metrics and success rates for a branch. Access: Authenticated users with branch access',
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

  @Get('inbox/unread-summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @Permissions('messages')
  @ApiOperation({
    summary: 'Unread conversation counts per branch',
    description:
      'For every branch the caller can read (all business branches for an owner, otherwise their own): unread messages and conversations waiting, zeros included. Channel defaults to IN_HOUSE. Access: OWNER, MANAGER, STAFF, ADMIN',
  })
  @ApiQuery({ name: 'channel', required: false, enum: Channel })
  @ApiResponse({
    status: 200,
    schema: { example: [{ branchId: 'uuid', unread: 3, threads: 2 }] },
  })
  async getUnreadSummary(
    @Query('channel') channel: Channel | undefined,
    @Request() req: { user: User },
  ) {
    const resolved =
      channel && Object.values(Channel).includes(channel)
        ? channel
        : Channel.IN_HOUSE;
    const branchIds = await this.messagingHelperService.accessibleBranchIds(
      req.user,
    );
    return this.inboxService.getUnreadSummary(branchIds, resolved);
  }

  @Get('inbox/threads/:threadId/context')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @Permissions('messages')
  @ApiOperation({
    summary: 'What a conversation is about',
    description:
      'The order / booking (reference, status, total, items, booking date) or deal claim (code, status, dates, offer) the thread was opened from; null when it is a general chat. Access: OWNER, MANAGER, STAFF, ADMIN',
  })
  @ApiQuery({ name: 'branchId', required: false })
  async getThreadContext(
    @Param() params: ThreadIdDto,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.inboxService.getThreadContext(params.threadId, branchId);
  }

  @Get('inbox/:channel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @Permissions('messages')
  @ApiParam({ name: 'channel', enum: Channel })
  @ApiOperation({
    summary:
      'Get conversation threads by channel for a branch (Newest to Oldest)',
    description:
      'Retrieves all active message threads for a specific channel (e.g., WhatsApp, SMS) in a branch. Access: OWNER, MANAGER, STAFF, ADMIN',
  })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of threads sorted by last activity',
  })
  async getInboxThreads(
    @Param('channel', new ParseEnumPipe(Channel)) channel: Channel,
    @Query() filter: MessagingThreadFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.inboxService.getThreads(branchId, channel, filter.segmentId);
  }

  @Get('inbox/threads/:threadId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @Permissions('messages')
  @ApiOperation({
    summary: 'Get messages in a specific thread (Newest to Oldest)',
    description:
      'Fetches the full conversation history for a specific thread ID. Access: OWNER, MANAGER, STAFF, ADMIN',
  })
  @ApiParam({ name: 'threadId', description: 'Conversation thread UUID' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of messages with quoting support',
  })
  async getThreadMessages(
    @Param() { threadId }: ThreadIdDto,
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
  @Permissions('messages')
  @ApiOperation({
    summary: 'Send a reply to an active thread (Supports Quoting)',
    description:
      'Sends a response to a customer message in a thread. Access: OWNER, MANAGER, STAFF',
  })
  @ApiParam({ name: 'threadId', description: 'Conversation thread UUID' })
  @ApiBody({ type: ReplyDto })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({
    status: 201,
    description: 'Reply sent and broadcast via Socket',
  })
  async replyToThread(
    @Param() { threadId }: ThreadIdDto,
    @Body() dto: ReplyDto,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);

    return this.inboxService.sendReply(
      threadId,
      dto.content,
      branchId,
      dto.replyToId,
      dto.metadata,
      { url: dto.mediaUrl, mimeType: dto.mediaMimeType },
    );
  }

  @Post('inbox/threads/:threadId/read')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @Permissions('messages')
  @ApiOperation({
    summary: 'Mark a conversation thread as read for the branch',
    description:
      'Marks all messages in the thread as read to clear notifications. Access: OWNER, MANAGER, STAFF, ADMIN',
  })
  @ApiParam({ name: 'threadId', description: 'Conversation thread UUID' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, description: 'Thread marked as read' })
  async markThreadAsRead(
    @Param() { threadId }: ThreadIdDto,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.inboxService.markAsRead(threadId, branchId);
  }

  @Post('inbox/threads/init')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('messages')
  @ApiOperation({
    summary: 'Initialize an empty conversation thread with a customer',
  })
  async initThread(@Body() dto: InitThreadDto, @Request() req: { user: User }) {
    const branchId = await this.getBranchId(req, dto.branchId);
    // An existing conversation can always be reopened; a new one only with
    // someone who is already this business's customer, so a business cannot
    // message arbitrary users by id.
    const existing = await this.inboxService.findBranchConversation(
      branchId,
      dto.customerId,
    );
    if (existing) return existing;
    const businessId = req.user.businessId;
    if (
      !businessId ||
      !(await this.businessCustomers.isKnownCustomer(
        businessId,
        dto.customerId,
      ))
    ) {
      throw new NotFoundException('Customer not found');
    }
    return this.inboxService.initBranchConversation(branchId, dto.customerId);
  }

  @Delete('inbox/threads/:threadId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @Permissions('messages')
  @ApiOperation({
    summary: 'Delete an in-house conversation thread',
    description:
      'Permanently removes a conversation thread and all of its messages. Access: OWNER, MANAGER, STAFF, ADMIN',
  })
  @ApiParam({ name: 'threadId', description: 'Conversation thread UUID' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, description: 'Thread deleted successfully' })
  async deleteThread(
    @Param() { threadId }: ThreadIdDto,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.inboxService.deleteThread(threadId, { branchId });
  }

  @Delete('templates/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('messages')
  @ApiOperation({
    summary: 'Delete a message template',
    description:
      'Permanently removes a message template. Access: OWNER, MANAGER, ADMIN',
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  async deleteTemplate(@Param() { id }: IdDto, @Request() req: { user: User }) {
    return this.templateService.deleteTemplate(id, req.user);
  }

  @Patch('messages/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('messages')
  @ApiOperation({ summary: 'Edit a message' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  async editMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMessageDto,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.inboxService.editMessage(
      id,
      dto.content,
      req.user.id,
      branchId,
    );
  }

  @Delete('messages/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('messages')
  @ApiOperation({ summary: 'Delete (hide) a message' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  async deleteMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.inboxService.deleteMessage(id, req.user.id, branchId);
  }
}
