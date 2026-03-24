import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { AdministrationService } from './administration.service';
import {
  AdminCreateAgentDto,
  GenerateImpersonationTokenDto,
  AuditLogFilterDto,
} from './dto/administration.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AuditInterceptor } from './audit.interceptor';

@ApiTags('Administration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('administration')
export class AdministrationController {
  constructor(private readonly adminService: AdministrationService) {}

  @Post('agents')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create a new agent with module permissions' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  async createAgent(@Body() dto: AdminCreateAgentDto) {
    return this.adminService.createAgent(dto);
  }

  @Post('impersonation/token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Generate an impersonation token for an agent or admin' })
  async generateToken(@Body() dto: GenerateImpersonationTokenDto) {
    return this.adminService.generateToken(dto);
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: View and filter immutable audit logs' })
  async getAuditLogs(@Query() filter: AuditLogFilterDto) {
    return this.adminService.getAuditLogs(filter);
  }
}
