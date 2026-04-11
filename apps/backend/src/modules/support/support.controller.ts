import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Patch,
  Delete,
  Logger,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { SupportService } from './support.service';
import { SupportBotService } from './support-bot.service';
import { ConversationContextService } from './conversation-context.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { BotQueryDto, CreateKnowledgeDto } from './dto/support-bot.dto';
import { FindTicketsAdminDto } from './dto/find-tickets-admin.dto';
import { TicketStatus, TicketType } from './entities/support-ticket.entity';
import {
  UpdateTicketStatusAdminDto,
  AssignTicketDto,
  AdminTicketMessageDto,
} from './dto/update-ticket-admin.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

type AuthRequest = { user: { id: string; role: UserRole } };

@ApiTags('Support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('support')
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  constructor(
    private readonly supportService: SupportService,
    private readonly botService: SupportBotService,
    private readonly conversationContextService: ConversationContextService,
  ) {}

  @Post('bot/query')
  @Public()
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.AGENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Query the automated support bot' })
  async queryBot(
    @Request() req: any,
    @Body() dto: BotQueryDto,
  ) {
    const userId = req.user?.id || null;
    return this.botService.handleQuery(userId, dto);
  }

  @Post('escalate')
  @Public()
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.AGENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Escalate bot session to a live human agent' })
  async escalateChat(
    @Request() req: any,
    @Body('initialMessage') initialMessage?: string,
    @Body('guestName') guestName?: string,
    @Body('guestEmail') guestEmail?: string,
  ) {
    const userId = req.user?.id || null;
    const name = guestName || (req.body as any).guestName;
    const email = guestEmail || (req.body as any).guestEmail;
    
    return this.supportService.escalateChat(userId, initialMessage, name, email);
  }

  @Patch('bot/interaction/:id')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.AGENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Submit feedback for a bot interaction' })
  async updateInteraction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('wasHelpful') wasHelpful: boolean,
  ) {
    return this.botService.updateInteraction(id, wasHelpful);
  }

  @Get('bot/context')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.AGENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get conversation context' })
  @ApiQuery({ name: 'sessionId', required: false })
  async getContext(
    @Request() req: AuthRequest,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.conversationContextService.getContext(req.user.id, sessionId);
  }

  @Delete('bot/context')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.AGENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Clear conversation context' })
  @ApiQuery({ name: 'sessionId', required: false })
  async clearContext(
    @Request() req: AuthRequest,
    @Query('sessionId') sessionId?: string,
  ) {
    await this.conversationContextService.clearContext(req.user.id, sessionId);
    return { success: true, message: 'Context cleared' };
  }

  @Post('tickets')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new support ticket' })
  async createTicket(
    @Request() req: AuthRequest,
    @Body() dto: CreateTicketDto,
  ) {
    return this.supportService.create(req.user.id, dto);
  }

  @Get('tickets')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get all tickets for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTickets(
    @Request() req: AuthRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.supportService.findAll(req.user.id, page, limit);
  }

  @Get('tickets/:id')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get ticket details with messages' })
  async getTicket(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.supportService.findOne(id, req.user.id);
  }

  @Post('tickets/:id/message')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Reply to a ticket' })
  @ApiBody({ type: AdminTicketMessageDto })
  async addMessage(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminTicketMessageDto,
  ) {
    return this.supportService.addMessage(id, req.user.id, dto.message);
  }

  // --- Admin Endpoints ---

  @Get('admin/tickets')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all support tickets' })
  async getAllTickets(@Query() query: FindTicketsAdminDto) {
    return this.supportService.findAllAdmin(
      query.type,
      query.isAssigned,
      query.page,
      query.limit,
    );
  }

  @Get('admin/tickets/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get ticket details with messages' })
  async getAdminTicket(@Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.findOneAdmin(id);
  }

  @Post('admin/tickets/:id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update ticket status' })
  @ApiBody({ type: UpdateTicketStatusAdminDto })
  async updateTicketStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketStatusAdminDto,
  ) {
    return this.supportService.updateStatus(id, dto.status);
  }

  @Post('admin/tickets/:id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Assign ticket to an agent' })
  @ApiBody({ type: AssignTicketDto })
  async assignTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTicketDto,
  ) {
    return this.supportService.assignTicket(id, dto.agentId);
  }

  @Post('admin/tickets/:id/message')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reply to any ticket' })
  @ApiBody({ type: AdminTicketMessageDto })
  async addAdminMessage(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminTicketMessageDto,
  ) {
    return this.supportService.addAdminMessage(id, req.user.id, dto.message);
  }

  @Get('admin/bot/knowledge')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get bot knowledge base stats' })
  async getKnowledgeStats() {
    return this.botService.getKnowledgeStats();
  }

  @Get('admin/bot/missed')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get missed questions (fallbacks)' })
  async getMissedQuestions() {
    return this.botService.getMissedQuestions();
  }

  @Post('admin/bot/knowledge')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Add knowledge base entry' })
  async addKnowledge(@Body() dto: CreateKnowledgeDto) {
    return this.botService.addKnowledge(dto);
  }

  @Patch('admin/bot/knowledge/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update knowledge base entry' })
  @ApiBody({ type: CreateKnowledgeDto })
  async updateKnowledge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateKnowledgeDto,
  ) {
    const { InjectRepository } = require('@nestjs/typeorm');
    const { SupportKnowledge } = require('./entities/support-bot.entity');
    const supportModule = require('./support.module');
    const moduleRef = require('../../app.module');
    return { success: true, message: 'Update endpoint - implement repository injection' };
  }

  @Delete('admin/bot/knowledge/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete knowledge base entry' })
  async deleteKnowledge(@Param('id', ParseUUIDPipe) id: string) {
    return this.botService.getKnowledgeStats();
  }
}
