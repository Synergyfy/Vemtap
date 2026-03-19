import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { InboxService } from '../services/inbox.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { ReplyDto } from '../dto/reply.dto';
import { StartConversationDto } from '../dto/start-conversation.dto';

@ApiTags('Customer Messaging')
@Controller('customer/messaging')
export class CustomerMessagingController {
  constructor(
    private readonly inboxService: InboxService,
  ) {}

  @Get('threads')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all in-house messaging threads for the customer (Newest to Oldest)' })
  @ApiResponse({ status: 200, description: 'List of business threads for the visitor' })
  async getThreads(@Request() req: { user: User }) {
    return this.inboxService.getCustomerThreads(req.user.id);
  }

  @Post('threads/start')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start a new conversation with a branch' })
  @ApiBody({ type: StartConversationDto })
  @ApiResponse({ status: 201, description: 'Conversation started and first message sent' })
  async startConversation(
    @Body() dto: StartConversationDto,
    @Request() req: { user: User },
  ) {
    return this.inboxService.startCustomerConversation(req.user.id, dto.branchId, dto.content);
  }

  @Get('threads/:threadId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get messages in a specific in-house thread (Newest to Oldest)' })
  @ApiResponse({ status: 200, description: 'List of messages with quoting support' })
  async getThreadMessages(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Request() req: { user: User },
  ) {
    return this.inboxService.getCustomerThreadMessages(threadId, req.user.id);
  }

  @Post('threads/:threadId/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reply to an in-house message (Supports Quoting)' })
  @ApiBody({ type: ReplyDto })
  @ApiResponse({ status: 201, description: 'Reply sent and broadcast via Socket' })
  async replyToThread(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Body() dto: ReplyDto,
    @Request() req: { user: User },
  ) {
    return this.inboxService.sendCustomerReply(threadId, dto.content, req.user.id, dto.replyToId);
  }
}

