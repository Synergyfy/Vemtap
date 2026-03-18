import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { InboxService } from '../services/inbox.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { ReplyDto } from '../dto/reply.dto';

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

  @Get('threads/:threadId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get messages in a specific in-house thread (Newest to Oldest)' })
  @ApiResponse({ status: 200, description: 'List of messages with quoting support' })
  async getThreadMessages(
    @Param('threadId') threadId: string,
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
    @Param('threadId') threadId: string,
    @Body() dto: ReplyDto,
    @Request() req: { user: User },
  ) {
    return this.inboxService.sendCustomerReply(threadId, dto.content, req.user.id, dto.replyToId);
  }
}
