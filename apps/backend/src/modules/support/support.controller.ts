import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
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
  constructor(private readonly supportService: SupportService) {}

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
    @Query() query: PaginationQueryDto,
  ) {
    return this.supportService.findAll(req.user.id, query.page, query.limit);
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
}
