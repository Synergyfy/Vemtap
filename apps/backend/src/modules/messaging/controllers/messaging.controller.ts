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
import { TrialRestrictionGuard } from '../../subscriptions/guards/trial-restriction.guard';

import { MessagingEngineService } from '../services/messaging-engine.service';
import { TemplateService } from '../services/template.service';
import { CampaignService } from '../services/campaign.service';
import { AnalyticsService } from '../services/analytics.service';
import { InboxService } from '../services/inbox.service';

import { SendMessageDto } from '../dto/send-message.dto';
import { Channel } from '../enums/channel.enum';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';

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

    return this.messagingEngine.sendMessage(dto);
  }

  @Get('templates')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Get available templates for the business (System + Business specific)',
  })
  async getTemplates(@Request() req: { user: User }) {
    if (!req.user.businessId && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Business context required');
    }
    return this.templateService.getAvailableTemplates(req.user.businessId);
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
    return this.templateService.createTemplate(dto, req.user);
  }

  @Get('campaigns')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @ApiOperation({
    summary: 'Get all messaging campaigns for a branch or business',
  })
  async getCampaigns(
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const resolvedBranchId = filter.branchId || req.user?.branchId;
    return this.campaignService.getCampaigns(
      resolvedBranchId,
      req.user.businessId,
    );
  }

  @Get('analytics')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @ApiOperation({ summary: 'Get messaging analytics by branch or business' })
  async getAnalytics(
    @Query('channel') channel: Channel,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const resolved = filter.branchId || req.user?.branchId;
    return this.analyticsService.getDashboardMetrics(
      req.user.businessId,
      resolved,
      channel,
    );
  }

  @Get('inbox/:channel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @ApiParam({ name: 'channel', enum: Channel })
  @ApiOperation({
    summary: 'Get conversation threads by channel for a branch or business',
  })
  async getInboxThreads(
    @Param('channel') channel: Channel,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const resolved = filter.branchId || req.user?.branchId;
    return this.inboxService.getThreads(req.user.businessId, channel, resolved);
  }

  @Get('inbox/threads/:threadId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @ApiOperation({ summary: 'Get messages in a specific thread' })
  async getThreadMessages(
    @Param('threadId') threadId: string,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const resolved = filter.branchId || req.user?.branchId;
    return this.inboxService.getThreadMessages(
      req.user.businessId,
      threadId,
      resolved,
    );
  }

  @Post('inbox/threads/:threadId/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Send a reply to an active thread' })
  async replyToThread(
    @Param('threadId') threadId: string,
    @Body() dto: ReplyDto,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const resolved = filter.branchId || req.user.branchId;

    return this.inboxService.sendReply(
      req.user.businessId,
      threadId,
      dto.content,
      resolved,
    );
  }

  // --- Admin Endpoints ---

  @Get('admin/templates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all messaging templates' })
  async getAllTemplates() {
    return this.templateService.findAllAdmin();
  }

  @Post('admin/templates/:id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update template status' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
      },
    },
  })
  async updateTemplateStatus(
    @Param('id') id: string,
    @Body('status') status: any,
  ) {
    return this.templateService.updateStatus(id, status);
  }

  @Post('templates/:id/delete')
  @Delete('templates/:id/delete')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a message template' })
  async deleteTemplate(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    return this.templateService.deleteTemplate(id, req.user);
  }
}
