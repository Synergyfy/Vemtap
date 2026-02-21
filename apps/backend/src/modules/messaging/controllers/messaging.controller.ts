import { Controller, Post, Get, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiHeader } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
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
export class MessagingController {
    constructor(
        private readonly messagingEngine: MessagingEngineService,
        private readonly templateService: TemplateService,
        private readonly campaignService: CampaignService,
        private readonly analyticsService: AnalyticsService,
        private readonly inboxService: InboxService,
    ) { }

    @Post('send')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.MANAGER)
    @ApiOperation({ summary: 'Send a single message or start a campaign' })
    @ApiResponse({ status: 200, description: 'Message queued or sent successfully' })
    async sendMessage(@Body() dto: SendMessageDto, @Request() req: { user: User }) {
        // Ensures businessId matches the caller's business context
        dto.businessId = req.user.businessId;
        return this.messagingEngine.sendMessage(dto);
    }

    @Post('templates')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.MANAGER)
    @ApiOperation({ summary: 'Create a new message template' })
    async createTemplate(@Body() dto: CreateTemplateDto, @Request() req: { user: User }) {
        return this.templateService.createTemplate(req.user.businessId, dto.name, dto.channel, dto.content);
    }

    @Get('campaigns')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all messaging campaigns for a business' })
    async getCampaigns(@Request() req: { user: User }) {
        return this.campaignService.getCampaigns(req.user.businessId);
    }

    @Get('analytics')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get messaging analytics' })
    async getAnalytics(@Query('channel') channel: Channel, @Request() req: { user: User }) {
        return this.analyticsService.getDashboardMetrics(req.user.businessId, channel);
    }

    @Get('inbox/:channel')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiParam({ name: 'channel', enum: Channel })
    @ApiOperation({ summary: 'Get conversation threads by channel' })
    async getInboxThreads(@Param('channel') channel: Channel, @Request() req: { user: User }) {
        return this.inboxService.getThreads(req.user.businessId, channel);
    }

    @Get('inbox/threads/:threadId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get messages in a specific thread' })
    async getThreadMessages(@Param('threadId') threadId: string, @Request() req: { user: User }) {
        return this.inboxService.getThreadMessages(req.user.businessId, threadId);
    }

    @Post('inbox/threads/:threadId/reply')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
    @ApiOperation({ summary: 'Send a reply to an active thread' })
    async replyToThread(
        @Param('threadId') threadId: string,
        @Body() dto: ReplyDto,
        @Request() req: { user: User }
    ) {
        return this.inboxService.sendReply(req.user.businessId, threadId, dto.content);
    }

    @Post('webhooks/infobip/:channel')
    @ApiOperation({ summary: 'Public webhook endpoint for Infobip inbound messages/delivery reports' })
    async infobipWebhook(
        @Param('channel') channel: Channel,
        @Body() payload: any
    ) {
        // Determine if delivery report or inbound message based on payload schema
        if (payload.results && payload.results[0] && payload.results[0].status) {
            await this.messagingEngine.updateDeliveryStatus(payload);
        } else {
            await this.messagingEngine.handleInbound(payload, channel);
        }
        return { status: 'Received' };
    }
}
