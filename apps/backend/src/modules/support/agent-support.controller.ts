import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { SupportService } from './support.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AgentStatsDto } from './dto/agent-stats.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { TicketReplyDto } from './dto/ticket-reply.dto';
import { SupportTicket, TicketType } from './entities/support-ticket.entity';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';

import { ParseUUIDPipe } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

type AuthRequest = { user: { id: string; role: UserRole } };

@ApiTags('Agent Support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT, UserRole.ADMIN)
@Controller('agent')
export class AgentSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('all')
  @ApiOperation({ summary: 'Get all agents (for assignment/listing)' })
  async getAgents(@Query() query: PaginationQueryDto) {
    return this.supportService.findAllAgents(query.page, query.limit, query.cursor);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get agent dashboard statistics' })
  @ApiResponse({ status: 200, type: AgentStatsDto })
  async getStats(@Request() req: AuthRequest): Promise<AgentStatsDto> {
    return this.supportService.getAgentStats(req.user.id);
  }

  @Get('chats')
  @ApiOperation({ summary: 'Get all chats assigned to agent' })
  async getAssignedChats(
    @Request() req: AuthRequest,
    @Query() query: PaginationQueryDto,
  ) {
    return this.supportService.findAssigned(
      req.user.id,
      TicketType.CHAT,
      query.page,
      query.limit,
      query.cursor,
    );
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get all tickets assigned to agent' })
  async getAssignedTickets(
    @Request() req: AuthRequest,
    @Query() query: PaginationQueryDto,
  ) {
    return this.supportService.findAssigned(
      req.user.id,
      TicketType.TICKET,
      query.page,
      query.limit,
      query.cursor,
    );
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket/chat details' })
  @ApiResponse({ status: 200, type: SupportTicket })
  async getTicketDetails(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SupportTicket> {
    return this.supportService.findOneAgent(id);
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Update ticket/chat status' })
  @ApiResponse({ status: 200, type: SupportTicket })
  async updateStatus(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ): Promise<SupportTicket> {
    return this.supportService.updateStatusAgent(id, req.user.id, dto.status);
  }

  @Post('tickets/:id/message')
  @ApiOperation({ summary: 'Reply to a ticket/chat' })
  @ApiResponse({ status: 201 })
  async addMessage(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: TicketReplyDto,
  ) {
    return this.supportService.addAgentMessage(id, req.user.id, dto.message);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current agent profile' })
  @ApiResponse({ status: 200 })
  async getProfile(@Request() req: AuthRequest) {
    return this.supportService.findOneAgentUser(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update agent profile' })
  @ApiResponse({ status: 200 })
  async updateProfile(
    @Request() req: AuthRequest,
    @Body() dto: UpdateAgentProfileDto,
  ) {
    return this.supportService.updateAgentProfile(req.user.id, dto);
  }
}
