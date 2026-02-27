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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { TrialRestrictionGuard } from '../../subscriptions/guards/trial-restriction.guard';
import { User, UserRole } from '../../users/entities/user.entity';
import { AutomationService } from '../services/automation.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  UpdateAutomationToggleDto,
  UpdateAutomationConfigDto,
} from '../dto/automation-rule.dto';

@ApiTags('Messaging Automations')
@Controller('automations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
@Permissions('messaging')
export class AutomationsController {
  constructor(private readonly automationService: AutomationService) { }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new automation rule' })
  async create(
    @Body() dto: CreateAutomationRuleDto,
    @Request() req: { user: User },
  ) {
    if (req.user.businessId !== dto.businessId) {
      // Allow admin to override, otherwise enforce business check
      if (req.user.role !== UserRole.ADMIN) {
        throw new BadRequestException(
          'You can only create rules for your own business',
        );
      }
    }

    // Enforce branch access for managers
    if (
      req.user.role === UserRole.MANAGER &&
      req.user.branchId &&
      dto.branchId !== req.user.branchId
    ) {
      throw new BadRequestException(
        'You can only create rules for your assigned branch',
      );
    }

    return this.automationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List automation rules' })
  @ApiQuery({ name: 'branchId', required: false })
  async findAll(
    @Query('branchId') branchId: string,
    @Request() req: { user: User },
  ) {
    // If user is manager/staff, enforce their branchId
    const targetBranchId = req.user.branchId || branchId;

    return this.automationService.findAll(req.user.businessId, targetBranchId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get automation execution logs' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getLogs(
    @Query('branchId') branchId: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @Request() req: { user: User },
  ) {
    const targetBranchId = req.user.branchId || branchId;
    return this.automationService.findLogs(
      req.user.businessId,
      targetBranchId,
      limit || 50,
      offset || 0,
    );
  }

  @Get('logs/:sessionId')
  @ApiOperation({ summary: 'Get details for a specific automation session log' })
  async getLogDetails(
    @Param('sessionId') sessionId: string,
    @Request() req: { user: User },
  ) {
    try {
      return await this.automationService.findLogDetails(sessionId, req.user.businessId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Error fetching log details');
    }
  }

  @Get('connection-status')
  @ApiOperation({ summary: 'Get WhatsApp connection status for the business' })
  @ApiQuery({ name: 'branchId', required: false })
  async getConnectionStatus(
    @Query('branchId') branchId: string,
    @Request() req: { user: User },
  ) {
    const targetBranchId = req.user.branchId || branchId;
    return this.automationService.getConnectionStatus(req.user.businessId, targetBranchId);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get simple automation performance analytics' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async getPerformance(
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Request() req: { user: User },
  ) {
    const targetBranchId = req.user.branchId || branchId;
    return this.automationService.getPerformanceAnalytics(
      req.user.businessId,
      targetBranchId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific automation rule' })
  async findOne(@Param('id') id: string, @Request() req: { user: User }) {
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (
      rule.businessId !== req.user.businessId &&
      req.user.role !== UserRole.ADMIN
    )
      throw new BadRequestException('Access denied');
    return rule;
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update an automation rule' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAutomationRuleDto,
    @Request() req: { user: User },
  ) {
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (
      rule.businessId !== req.user.businessId &&
      req.user.role !== UserRole.ADMIN
    )
      throw new BadRequestException('Access denied');

    if (
      req.user.role === UserRole.MANAGER &&
      req.user.branchId &&
      rule.branchId !== req.user.branchId
    ) {
      throw new BadRequestException('Access denied');
    }

    return this.automationService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete an automation rule' })
  async remove(@Param('id') id: string, @Request() req: { user: User }) {
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (
      rule.businessId !== req.user.businessId &&
      req.user.role !== UserRole.ADMIN
    )
      throw new BadRequestException('Access denied');

    if (
      req.user.role === UserRole.MANAGER &&
      req.user.branchId &&
      rule.branchId !== req.user.branchId
    ) {
      throw new BadRequestException('Access denied');
    }

    return this.automationService.remove(id);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle an automation rule ON or OFF' })
  async toggle(
    @Param('id') id: string,
    @Body() dto: UpdateAutomationToggleDto,
    @Request() req: { user: User },
  ) {
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (
      rule.businessId !== req.user.businessId &&
      req.user.role !== UserRole.ADMIN
    )
      throw new BadRequestException('Access denied');

    if (
      req.user.role === UserRole.MANAGER &&
      req.user.branchId &&
      rule.branchId !== req.user.branchId
    ) {
      throw new BadRequestException('Access denied');
    }

    return this.automationService.toggleAutomation(id, dto);
  }

  @Patch(':id/configure')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Configure settings for an automation template' })
  async configure(
    @Param('id') id: string,
    @Body() dto: UpdateAutomationConfigDto,
    @Request() req: { user: User },
  ) {
    const rule = await this.automationService.findOne(id);
    if (!rule) throw new BadRequestException('Rule not found');
    if (
      rule.businessId !== req.user.businessId &&
      req.user.role !== UserRole.ADMIN
    )
      throw new BadRequestException('Access denied');

    if (
      req.user.role === UserRole.MANAGER &&
      req.user.branchId &&
      rule.branchId !== req.user.branchId
    ) {
      throw new BadRequestException('Access denied');
    }

    try {
      return await this.automationService.configureAutomation(id, dto);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Configuration failed');
    }
  }
}
