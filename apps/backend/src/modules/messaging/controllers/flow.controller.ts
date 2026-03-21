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
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/entities/user.entity';
import { TrialRestrictionGuard } from '../../subscriptions/guards/trial-restriction.guard';
import { Flow, FlowStatus, FlowTriggerType } from '../entities/flow.entity';
import {
  CreateFlowDto,
  UpdateFlowStatusDto,
  GetFlowsDto,
} from '../dto/create-flow.dto';
import { MessagingFlowService } from '../services/messaging-flow.service';

@ApiTags('Flow Builder')
@Controller('messaging/flows')
export class FlowController {
  constructor(private readonly flowsService: MessagingFlowService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new flow' })
  @ApiBody({ type: CreateFlowDto })
  async create(
    @Body() dto: CreateFlowDto,
    @Request() req: Request & { user: User },
  ) {
    return this.flowsService.create(dto, req.user);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @ApiOperation({ summary: 'Get flows by branch' })
  async findAll(@Query() query: GetFlowsDto, @Request() req: any) {
    return this.flowsService.findAll(query, req.user);
  }

  @Post(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TrialRestrictionGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update flow status (active/draft/paused)' })
  @ApiBody({ type: UpdateFlowStatusDto })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFlowStatusDto,
    @Request() req: any,
  ) {
    return this.flowsService.updateStatus(id, dto, req.user);
  }
}

