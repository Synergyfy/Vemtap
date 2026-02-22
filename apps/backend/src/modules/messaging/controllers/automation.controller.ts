import {
  Controller,
  Post,
  Body,
  Get,
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
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/entities/user.entity';
import { AutomationRule } from '../entities/automation-rule.entity';
import { CreateAutomationDto } from '../dto/create-automation.dto';

@ApiTags('Messaging Automation')
@Controller('messaging/automations')
export class AutomationController {
  constructor(
    @InjectRepository(AutomationRule)
    private readonly ruleRepo: Repository<AutomationRule>,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new automation rule' })
  @ApiBody({ type: CreateAutomationDto })
  async create(@Body() dto: CreateAutomationDto, @Request() req: any) {
    const user = req.user as User;

    let branchId = dto.branchId;
    if (user.role === UserRole.MANAGER || user.role === UserRole.STAFF) {
      branchId = user.branchId;
    } else if (user.role === UserRole.OWNER && !branchId) {
      throw new BadRequestException(
        'branchId is required for automation rules created by Owner',
      );
    }

    const rule = this.ruleRepo.create({
      businessId: user.businessId,
      branchId,
      name: dto.name,
      triggerType: dto.triggerType,
      actionChannel: dto.actionChannel,
      actionTemplateId: dto.actionTemplateId,
      delaySeconds: dto.delaySeconds || 0,
      conditions: dto.conditions,
      isActive: true,
    });
    return this.ruleRepo.save(rule);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Get automation rules by branch' })
  async findAll(@Query('branchId') branchId: string, @Request() req: any) {
    const user = req.user as User;
    // @ts-ignore
    const resolved = branchId || user.branchId;
    if (!resolved) throw new BadRequestException('branchId is required');

    return this.ruleRepo.find({
      where: { branchId: resolved, businessId: user.businessId },
    });
  }

  @Post(':id/toggle')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Activate/Deactivate an automation rule' })
  async toggle(@Param('id') id: string, @Request() req: any) {
    const user = req.user as User;
    const rule = await this.ruleRepo.findOne({
      where: { id, businessId: user.businessId },
    });
    if (!rule) throw new BadRequestException('Rule not found');

    rule.isActive = !rule.isActive;
    return this.ruleRepo.save(rule);
  }
}
