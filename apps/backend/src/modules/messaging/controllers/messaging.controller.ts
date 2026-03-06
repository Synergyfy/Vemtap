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

  private async getBranchId(req: any, queryBranchId?: string): Promise<string> {
    const user = req.user;

    // For Owner and Admin: branchId MUST be provided in the request
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (!queryBranchId) {
        throw new BadRequestException(
          'branchId is required for Owners and Admins',
        );
      }

      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.messagingEngine.checkBranchAccess(
          user,
          queryBranchId,
        );
        if (!hasAccess) {
          throw new BadRequestException(
            'You do not have access to this branch',
          );
        }
      }
      return queryBranchId;
    }

    // For Manager and Staff: ignore provided branchId, always use branchId from token
    if (!user.branchId) {
      throw new BadRequestException('User is not associated with any branch');
    }

    return user.branchId;
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
    return this.templateService.createTemplate(dto, req.user);
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
    @Query('channel') channel: Channel,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.analyticsService.getDashboardMetrics(branchId, channel);
  }

  @Get('inbox/:channel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @ApiParam({ name: 'channel', enum: Channel })
  @ApiOperation({
    summary: 'Get conversation threads by channel for a branch',
  })
  async getInboxThreads(
    @Param('channel') channel: Channel,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.inboxService.getThreads(branchId, channel);
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
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.inboxService.getThreadMessages(threadId, branchId);
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
    const branchId = await this.getBranchId(req, filter.branchId);

    return this.inboxService.sendReply(threadId, dto.content, branchId);
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
