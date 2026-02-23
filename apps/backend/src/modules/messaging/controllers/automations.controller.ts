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
import { User, UserRole } from '../../users/entities/user.entity';
import { AutomationService } from '../services/automation.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from '../dto/automation-rule.dto';

@ApiTags('Messaging Automations')
@Controller('automations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Permissions('messaging')
export class AutomationsController {
  constructor(private readonly automationService: AutomationService) {}

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
}
