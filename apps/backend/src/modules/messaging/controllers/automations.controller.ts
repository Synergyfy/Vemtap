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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiParam,
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
import { IdDto } from '../dto/id.dto';
import { SessionIdDto } from '../dto/session-id.dto';

@ApiTags('Messaging Automations')
@Controller('messaging/automations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
@Permissions('messages')
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
  @ApiOperation({
    summary: 'Create a new automation rule',
    description:
      'Defines a new automation rule with triggers and actions for messaging. Access: OWNER, MANAGER',
  })
  @ApiBody({ type: CreateAutomationRuleDto })
  @ApiCreatedResponse({
    type: AutomationRule,
    description: 'Automation rule created successfully',
  })
  async create(
    @Body() dto: CreateAutomationRuleDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, dto.branchId);
    dto.branchId = branchId; // Ensure DTO uses resolved branchId
    return this.automationService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List automation rules',
    description:
      'Retrieves all automation rules for a specific branch. Access: Authenticated users with branch access',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Filter by branch ID (required for Owners/Admins)',
  })
  @ApiOkResponse({
    type: [AutomationRule],
    description: 'List of automation rules',
  })
  async findAll(
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.automationService.findAll(branchId);
  }

  @Get('logs')
  @ApiOperation({
    summary: 'Get automation execution logs',
    description:
      'Retrieves a paginated history of automation executions for a branch. Access: Authenticated users with branch access',
  })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({
    description: 'Paginated automation logs',
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
    description:
      'Fetches detailed execution steps and data for a specific automation session. Access: Authenticated users with branch access',
  })
  @ApiParam({ name: 'sessionId', description: 'Session UUID from logs' })
  @ApiOkResponse({
    type: AutomationLogResponseDto,
    description: 'Session log details',
  })
  async getLogDetails(
    @Param() { sessionId }: SessionIdDto,
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
  @ApiOperation({
    summary: 'Get WhatsApp connection status for the branch',
    description:
      'Checks if the WhatsApp provider is correctly connected for the branch. Access: Authenticated users with branch access',
  })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiOkResponse({
    description: 'Current connection status',
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
  @ApiOperation({
    summary: 'Get simple automation performance analytics',
    description:
      'Retrieves aggregated performance data (runs, successes, failures) for automations. Access: Authenticated users with branch access',
  })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiOkResponse({
    type: AutomationPerformanceResponseDto,
    description: 'Performance analytics data',
  })
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
  @ApiOperation({
    summary: 'Get a specific automation rule',
    description:
      'Retrieves details of a single automation rule. Access: Authenticated users with branch access',
  })
  @ApiParam({ name: 'id', description: 'Automation rule UUID' })
  @ApiOkResponse({
    type: AutomationRule,
    description: 'Automation rule details',
  })
  async findOne(@Param() { id }: IdDto, @Request() req: { user: User }) {
    const branchId = await this.getBranchId(req);
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (rule.branchId !== branchId && req.user.role !== UserRole.ADMIN)
      throw new BadRequestException('Access denied');
    return rule;
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Update an automation rule',
    description:
      'Modifies the trigger, conditions, or actions of an existing automation rule. Access: OWNER, MANAGER',
  })
  @ApiParam({ name: 'id', description: 'Automation rule UUID' })
  @ApiBody({ type: UpdateAutomationRuleDto })
  @ApiOkResponse({
    type: AutomationRule,
    description: 'Automation rule updated successfully',
  })
  async update(
    @Param() { id }: IdDto,
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
  @ApiOperation({
    summary: 'Delete an automation rule',
    description:
      'Permanently removes an automation rule. Access: OWNER, MANAGER',
  })
  @ApiParam({ name: 'id', description: 'Automation rule UUID' })
  @ApiOkResponse({ description: 'Rule deleted successfully' })
  async remove(@Param() { id }: IdDto, @Request() req: { user: User }) {
    const branchId = await this.getBranchId(req);
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (rule.branchId !== branchId && req.user.role !== UserRole.ADMIN)
      throw new BadRequestException('Access denied');

    return this.automationService.remove(id);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Toggle an automation rule ON or OFF',
    description:
      'Enables or disables an automation rule without deleting it. Access: OWNER, MANAGER',
  })
  @ApiParam({ name: 'id', description: 'Automation rule UUID' })
  @ApiBody({ type: UpdateAutomationToggleDto })
  @ApiOkResponse({
    type: AutomationRule,
    description: 'Toggle status updated successfully',
  })
  async toggle(
    @Param() { id }: IdDto,
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
  @ApiOperation({
    summary: 'Configure settings for an automation template',
    description:
      'Applies specific settings/configuration values to an automation template. Access: OWNER, MANAGER',
  })
  @ApiParam({ name: 'id', description: 'Automation rule UUID' })
  @ApiBody({ type: UpdateAutomationConfigDto })
  @ApiOkResponse({
    type: AutomationRule,
    description: 'Automation configuration updated successfully',
  })
  async configure(
    @Param() { id }: IdDto,
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
