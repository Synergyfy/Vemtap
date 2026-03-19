import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { TrialRestrictionGuard } from '../../subscriptions/guards/trial-restriction.guard';
import { User, UserRole } from '../../users/entities/user.entity';
import { AutomationService } from '../services/automation.service';
import { AutomationRule } from '../entities/automation-rule.entity';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  UpdateAutomationToggleDto,
  UpdateAutomationConfigDto,
  AutomationLogResponseDto,
  AutomationPerformanceResponseDto,
} from '../dto/automation-rule.dto';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';

@ApiTags('Messaging Automations')
@Controller('messaging/automations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
@Permissions('messaging')
export class AutomationsController {
  constructor(private readonly automationService: AutomationService) {}

  private async getBranchId(req: any, queryBranchId?: string): Promise<string> {
    const user = req.user;

    // For Owner and Admin: branchId MUST be provided in the request
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (!queryBranchId) {
        throw new BadRequestException(
          'branchId is required for Owners and Admins',
        );
      }

      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.automationService.checkBranchAccess(
          user,
          queryBranchId,
        );
        if (!hasAccess) {
          throw new BadRequestException(
            'You do not have access to this branch',
          );
        }
      }
      return queryBranchId;
    }

    // For Manager and Staff: ignore queryBranchId, always use branchId from token
    if (!user.branchId) {
      throw new BadRequestException('User is not associated with any branch');
    }

    return user.branchId;
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new automation rule' })
  @ApiCreatedResponse({ type: AutomationRule })
  async create(
    @Body() dto: CreateAutomationRuleDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, dto.branchId);
    dto.branchId = branchId; // Ensure DTO uses resolved branchId
    return this.automationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List automation rules' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiOkResponse({ type: [AutomationRule] })
  async findAll(
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.automationService.findAll(branchId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get automation execution logs' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AutomationLogResponseDto' },
        },
        total: { type: 'number' },
      },
    },
  })
  async getLogs(
    @Query() filter: BranchFilterDto,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.automationService.findLogs(branchId, limit || 50, offset || 0);
  }

  @Get('logs/:sessionId')
  @ApiOperation({
    summary: 'Get details for a specific automation session log',
  })
  @ApiOkResponse({ type: AutomationLogResponseDto })
  async getLogDetails(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req);
    try {
      return await this.automationService.findLogDetails(sessionId, branchId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Error fetching log details');
    }
  }

  @Get('connection-status')
  @ApiOperation({ summary: 'Get WhatsApp connection status for the branch' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'Connected',
        provider: 'WhatsApp',
        updatedAt: '2024-02-27T10:00:00.000Z',
      },
    },
  })
  async getConnectionStatus(
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.automationService.getConnectionStatus(branchId);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get simple automation performance analytics' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiOkResponse({ type: AutomationPerformanceResponseDto })
  async getPerformance(
    @Query() filter: BranchFilterDto,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.automationService.getPerformanceAnalytics(
      branchId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific automation rule' })
  @ApiOkResponse({ type: AutomationRule })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: User }) {
    const branchId = await this.getBranchId(req);
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (rule.branchId !== branchId && req.user.role !== UserRole.ADMIN)
      throw new BadRequestException('Access denied');
    return rule;
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update an automation rule' })
  @ApiOkResponse({ type: AutomationRule })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAutomationRuleDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req);
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (rule.branchId !== branchId && req.user.role !== UserRole.ADMIN)
      throw new BadRequestException('Access denied');

    return this.automationService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete an automation rule' })
  @ApiOkResponse({ description: 'Rule deleted successfully' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: User }) {
    const branchId = await this.getBranchId(req);
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (rule.branchId !== branchId && req.user.role !== UserRole.ADMIN)
      throw new BadRequestException('Access denied');

    return this.automationService.remove(id);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle an automation rule ON or OFF' })
  @ApiOkResponse({ type: AutomationRule })
  async toggle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAutomationToggleDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, dto.branchId);
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (rule.branchId !== branchId && req.user.role !== UserRole.ADMIN)
      throw new BadRequestException('Access denied');

    return this.automationService.toggleAutomation(id, dto);
  }

  @Patch(':id/configure')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Configure settings for an automation template' })
  @ApiOkResponse({ type: AutomationRule })
  async configure(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAutomationConfigDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, dto.branchId);
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (rule.branchId !== branchId && req.user.role !== UserRole.ADMIN)
      throw new BadRequestException('Access denied');

    try {
      return await this.automationService.configureAutomation(id, dto);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Configuration failed');
    }
  }
}

}
