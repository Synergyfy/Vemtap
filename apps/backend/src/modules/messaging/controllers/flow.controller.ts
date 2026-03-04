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
import { TrialRestrictionGuard } from '../../subscriptions/guards/trial-restriction.guard';
import { Flow, FlowStatus, FlowTriggerType } from '../entities/flow.entity';

export class CreateFlowDto {
  name: string;
  triggerType: FlowTriggerType;
  branchId?: string;
  businessId?: string;
  structure: any;
}

@ApiTags('Flow Builder')
@Controller('messaging/flows')
export class FlowController {
  constructor(
    @InjectRepository(Flow)
    private readonly flowRepo: Repository<Flow>,
  ) { }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new flow' })
  @ApiBody({ type: CreateFlowDto })
  async create(@Body() dto: CreateFlowDto, @Request() req: any) {
    const user = req.user as User;

    const businessId =
      user.role === UserRole.ADMIN ? dto.businessId : user.businessId;

    if (!businessId) {
      throw new BadRequestException('businessId is required');
    }

    let branchId = dto.branchId;
    if (user.role === UserRole.MANAGER || user.role === UserRole.STAFF) {
      branchId = user.branchId;
    } else if (user.role === UserRole.OWNER && !branchId) {
      throw new BadRequestException(
        'branchId is required for flows created by Owner',
      );
    }

    const flow = this.flowRepo.create({
      businessId,
      branchId,
      name: dto.name,
      triggerType: dto.triggerType,
      status: FlowStatus.DRAFT,
      structure: dto.structure || { nodes: [], edges: [] },
    });
    return this.flowRepo.save(flow);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @ApiOperation({ summary: 'Get flows by branch' })
  async findAll(
    @Query('branchId') branchId: string,
    @Query('businessId') businessId: string,
    @Request() req: any,
  ) {
    const user = req.user as User;

    if (user.role === UserRole.ADMIN) {
      if (!businessId) throw new BadRequestException('businessId is required');
      return this.flowRepo.find({
        where: branchId ? { businessId, branchId } : { businessId },
      });
    }

    const resolved = branchId || user.branchId;
    if (!resolved) throw new BadRequestException('branchId is required');
    return this.flowRepo.find({
      where: { branchId: resolved, businessId: user.businessId },
    });
  }

  @Post(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update flow status (active/draft/paused)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: FlowStatus,
    @Request() req: any,
  ) {
    const user = req.user as User;
    const flow = await this.flowRepo.findOne(
      user.role === UserRole.ADMIN
        ? { where: { id } }
        : { where: { id, businessId: user.businessId } },
    );
    if (!flow) throw new BadRequestException('Flow not found');

    flow.status = status;
    return this.flowRepo.save(flow);
  }
}
