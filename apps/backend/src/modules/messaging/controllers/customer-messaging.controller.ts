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
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InboxService } from '../services/inbox.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { ReplyDto } from '../dto/reply.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { StartConversationDto } from '../dto/start-conversation.dto';
import { ThreadIdDto } from '../dto/thread-id.dto';

@ApiTags('Customer Messaging')
@Controller('customer/messaging')
export class CustomerMessagingController {
  constructor(private readonly inboxService: InboxService) {}

  @Get('threads')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Get all in-house messaging threads for the customer (Newest to Oldest)',
    description:
      'Retrieves all active conversations between the customer and various business branches. Access: CUSTOMER',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Optional branch ID to find or create a thread',
  })
  @ApiResponse({
    status: 200,
    description: 'List of business threads for the visitor',
  })
  async getThreads(
    @Request() req: { user: User },
    @Query('branchId') branchId?: string,
  ) {
    if (branchId) {
      await this.inboxService.findOrCreateCustomerThread(req.user.id, branchId);
    }
    return this.inboxService.getCustomerThreads(req.user.id);
  }

  @Post('threads/start')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Start a new conversation with a branch',
    description:
      'Initiates a new chat thread with a specific business branch and sends the first message. Access: CUSTOMER',
  })
  @ApiBody({ type: StartConversationDto })
  @ApiResponse({
    status: 201,
    description: 'Conversation started and first message sent',
  })
  async startConversation(
    @Body() dto: StartConversationDto,
    @Request() req: { user: User },
  ) {
    return this.inboxService.startCustomerConversation(
      req.user.id,
      dto.branchId,
      dto.content,
    );
  }

  @Get('threads/:threadId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get messages in a specific in-house thread (Newest to Oldest)',
    description:
      'Fetches conversation history for a specific thread. Access: CUSTOMER',
  })
  @ApiParam({ name: 'threadId', description: 'Conversation thread UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of messages with quoting support',
  })
  async getThreadMessages(
    @Param() { threadId }: ThreadIdDto,
    @Request() req: { user: User },
  ) {
    return this.inboxService.getCustomerThreadMessages(threadId, req.user.id);
  }

  @Post('threads/:threadId/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Reply to an in-house message (Supports Quoting)',
    description:
      'Sends a reply to an existing conversation thread. Access: CUSTOMER',
  })
  @ApiParam({ name: 'threadId', description: 'Conversation thread UUID' })
  @ApiBody({ type: ReplyDto })
  @ApiResponse({
    status: 201,
    description: 'Reply sent and broadcast via Socket',
  })
  async replyToThread(
    @Param() { threadId }: ThreadIdDto,
    @Body() dto: ReplyDto,
    @Request() req: { user: User },
  ) {
    return this.inboxService.sendCustomerReply(
      threadId,
      dto.content,
      req.user.id,
      dto.replyToId,
    );
  }

  @Patch('messages/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Edit a message' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  async editMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMessageDto,
    @Request() req: { user: User },
  ) {
    return this.inboxService.editMessage(id, dto.content, req.user.id);
  }

  @Delete('messages/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete (hide) a message' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  async deleteMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: User },
  ) {
    return this.inboxService.deleteMessage(id, req.user.id);
  }
}
