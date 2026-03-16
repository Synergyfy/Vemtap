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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InboxService } from '../services/inbox.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../contacts/entities/contact.entity';
import { ReplyDto } from '../dto/reply.dto';

@ApiTags('Customer Messaging')
@Controller('customer/messaging')
export class CustomerMessagingController {
  constructor(
    private readonly inboxService: InboxService,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {}

  private async getContact(user: User): Promise<Contact> {
    const contact = await this.contactRepo.findOne({
      where: [
        { email: user.email },
        { phone: user.phone },
      ],
    });
    if (!contact) {
      throw new NotFoundException('Customer record not found');
    }
    return contact;
  }

  @Get('threads')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all in-house messaging threads for the customer' })
  async getThreads(@Request() req: { user: User }) {
    const contact = await this.getContact(req.user);
    return this.inboxService.getCustomerThreads(contact.id);
  }

  @Get('threads/:threadId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get messages in a specific in-house thread' })
  async getThreadMessages(
    @Param('threadId') threadId: string,
    @Request() req: { user: User },
  ) {
    const contact = await this.getContact(req.user);
    return this.inboxService.getCustomerThreadMessages(threadId, contact.id);
  }

  @Post('threads/:threadId/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reply to an in-house message' })
  async replyToThread(
    @Param('threadId') threadId: string,
    @Body() dto: ReplyDto,
    @Request() req: { user: User },
  ) {
    const contact = await this.getContact(req.user);
    return this.inboxService.sendCustomerReply(threadId, dto.content, contact.id);
  }
}
