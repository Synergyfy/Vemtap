import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { AdminFlowEngineService } from '../services/admin-flow-engine.service';
import { UpdateSettingDto } from '../../settings/dto/update-setting.dto';
import { FlowTemplate } from '../entities/flow-template.entity';
import { FlowTriggerConfig } from '../entities/flow-trigger-config.entity';
import {
  CreateFlowTemplateDto,
  UpdateFlowTemplateDto,
  UpdateFlowTriggerConfigDto,
} from '../dto/flow-engine.dto';
import { FlowFilterDto } from '../dto/flow-filter.dto';
import { FlowExecution } from '../entities/flow-execution.entity';
import { FlowLog } from '../entities/flow-log.entity';
import { Setting } from '../../settings/entities/setting.entity';
import { FlowAnalyticsResponse } from '../interfaces/flow-engine.interface';
import { IdDto } from '../dto/id.dto';

@ApiTags('Admin Flow Engine')
@Controller('admin/flow-engine')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminFlowEngineController {
  constructor(private readonly adminFlowService: AdminFlowEngineService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get all global flow templates' })
  @ApiResponse({ status: 200, type: [FlowTemplate] })
  async getTemplates(): Promise<FlowTemplate[]> {
    return this.adminFlowService.getTemplates();
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a new global flow template' })
  @ApiBody({ type: CreateFlowTemplateDto })
  @ApiResponse({ status: 201, type: FlowTemplate })
  async createTemplate(
    @Body() data: CreateFlowTemplateDto,
  ): Promise<FlowTemplate> {
    return this.adminFlowService.createTemplate(data);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update a global flow template' })
  @ApiBody({ type: UpdateFlowTemplateDto })
  @ApiResponse({ status: 200, type: FlowTemplate })
  async updateTemplate(
    @Param() { id }: IdDto,
    @Body() data: UpdateFlowTemplateDto,
  ): Promise<FlowTemplate | null> {
    return this.adminFlowService.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a global flow template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  async deleteTemplate(@Param() { id }: IdDto): Promise<void> {
    await this.adminFlowService.deleteTemplate(id);
  }

  @Get('triggers')
  @ApiOperation({ summary: 'Get all flow trigger configurations' })
  @ApiResponse({ status: 200, type: [FlowTriggerConfig] })
  async getTriggers(): Promise<FlowTriggerConfig[]> {
    return this.adminFlowService.getTriggers();
  }

  @Put('triggers/:key')
  @ApiOperation({ summary: 'Update a flow trigger configuration' })
  @ApiBody({ type: UpdateFlowTriggerConfigDto })
  @ApiResponse({ status: 200, type: FlowTriggerConfig })
  async updateTrigger(
    @Param('key') key: string,
    @Body() data: UpdateFlowTriggerConfigDto,
  ): Promise<FlowTriggerConfig | null> {
    return this.adminFlowService.updateTrigger(key, data);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get flow execution sessions with filters' })
  @ApiResponse({ status: 200, type: [FlowExecution] })
  async getSessions(@Query() filter: FlowFilterDto): Promise<FlowExecution[]> {
    return this.adminFlowService.getSessions(filter);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get flow execution logs with filters' })
  @ApiResponse({ status: 200, type: [FlowLog] })
  async getLogs(@Query() filter: FlowFilterDto): Promise<FlowLog[]> {
    return this.adminFlowService.getLogs(filter);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get flow engine analytics with filters' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        totalMessagesSent: 100,
        totalRepliesReceived: 40,
        avgResponseRate: 40.0,
        loyaltyAssigned: 50,
        activeSessionsCount: 5,
      },
    },
  })
  async getAnalytics(
    @Query() filter: FlowFilterDto,
  ): Promise<FlowAnalyticsResponse> {
    return this.adminFlowService.getAnalytics(filter);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get WhatsApp system settings' })
  @ApiResponse({ status: 200, type: Setting })
  async getSettings(): Promise<Setting> {
    return this.adminFlowService.getSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update WhatsApp system settings' })
  @ApiBody({ type: UpdateSettingDto })
  @ApiResponse({ status: 200, type: Setting })
  async updateSettings(@Body() data: UpdateSettingDto): Promise<Setting> {
    return this.adminFlowService.updateSettings(data);
  }
}
