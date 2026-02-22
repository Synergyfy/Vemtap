import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new support ticket' })
  async createTicket(@Request() req, @Body() dto: CreateTicketDto) {
    return this.supportService.create(req.user.id, dto);
  }

  @Get('tickets')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get all tickets for current user' })
  async getTickets(@Request() req) {
    return this.supportService.findAll(req.user.id);
  }

  @Get('tickets/:id')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get ticket details with messages' })
  async getTicket(@Request() req, @Param('id') id: string) {
    return this.supportService.findOne(id, req.user.id);
  }

  @Post('tickets/:id/message')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Reply to a ticket' })
  @ApiBody({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
  async addMessage(@Request() req, @Param('id') id: string, @Body('message') message: string) {
    return this.supportService.addMessage(id, req.user.id, message);
  }
}
