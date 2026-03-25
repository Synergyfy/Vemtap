import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  Delete,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdministrationService } from './administration.service';
import {
  AdminCreateAgentDto,
  GenerateImpersonationTokenDto,
  GenerateCustomerImpersonationTokenDto,
  AuditLogFilterDto,
} from './dto/administration.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
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
import { SkipSubscriptionCheck } from '../subscriptions/decorators/skip-subscription-check.decorator';

@ApiTags('Administration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('administration')
export class AdministrationController {
  constructor(private readonly adminService: AdministrationService) {}

  @Get('agents')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all agent accounts' })
  async listAgents(@Query() filter: PaginationQueryDto) {
    return this.adminService.listAgents(filter);
  }

  @Post('agents')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Create a new agent with module permissions',
  })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  async createAgent(@Body() dto: AdminCreateAgentDto) {
    return this.adminService.createAgent(dto);
  }

  @Post('impersonation/token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Generate an impersonation token for an agent or admin',
  })
  async generateToken(
    @Request() req,
    @Body() dto: GenerateImpersonationTokenDto,
  ) {
    return this.adminService.generateToken(req.user.id, dto);
  }

  @Post('impersonation/customer-token')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({
    summary: 'Admin/Agent: Generate a customer impersonation token to act on behalf of a customer',
    description: 'The actor must be a logged-in Admin or Agent. The targetCustomer must be a Customer role user who has visited the targetBranch.',
  })
  @ApiResponse({ status: 201, description: 'Customer impersonation token generated' })
  async generateCustomerToken(
    @Request() req,
    @Body() dto: GenerateCustomerImpersonationTokenDto,
  ) {
    return this.adminService.generateCustomerToken(req.user.id, dto);
  }

  @Get('me/permissions')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @SkipSubscriptionCheck()
  @ApiOperation({
    summary: 'Admin/Agent: Get current actor\'s impersonation permissions and profile',
    description: 'Returns the role, permissions array, and whether this actor has full (ALL) access.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        id: 'uuid',
        email: 'agent@vemtap.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'Agent',
        permissions: ['LOYALTY', 'VISITORS', 'TICKETS'],
        hasFullAccess: false,
      },
    },
  })
  async getMyPermissions(@Request() req) {
    return this.adminService.getActorPermissions(req.user.id);
  }

  @Get('impersonation/tokens')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Admin/Agent: List all active impersonation tokens for the current actor' })
  async listMyTokens(@Request() req) {
    return this.adminService.listActorTokens(req.user.id);
  }

  @Delete('impersonation/token/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Revoke an impersonation token immediately' })
  async revokeToken(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.revokeToken(id);
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: View and filter immutable audit logs' })
  async getAuditLogs(@Query() filter: AuditLogFilterDto) {
    return this.adminService.getAuditLogs(filter);
  }
}
