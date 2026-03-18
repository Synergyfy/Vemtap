import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DeleteResult,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  FindOptionsWhere,
} from 'typeorm';
import { FlowTemplate } from '../entities/flow-template.entity';
import { FlowTriggerConfig } from '../entities/flow-trigger-config.entity';
import { FlowLog } from '../entities/flow-log.entity';
import {
  FlowExecution,
  ExecutionStatus,
} from '../entities/flow-execution.entity';
import { SettingsService } from '../../settings/settings.service';
import { UpdateSettingDto } from '../../settings/dto/update-setting.dto';
import {
  CreateFlowTemplateDto,
  UpdateFlowTemplateDto,
  UpdateFlowTriggerConfigDto,
} from '../dto/flow-engine.dto';
import { FlowFilterDto } from '../dto/flow-filter.dto';
import { FlowAnalyticsResponse } from '../interfaces/flow-engine.interface';
import { Setting } from '../../settings/entities/setting.entity';

@Injectable()
export class AdminFlowEngineService implements OnModuleInit {
  constructor(
    @InjectRepository(FlowTemplate)
    private readonly templateRepo: Repository<FlowTemplate>,
    @InjectRepository(FlowTriggerConfig)
    private readonly triggerRepo: Repository<FlowTriggerConfig>,
    @InjectRepository(FlowLog)
    private readonly logRepo: Repository<FlowLog>,
    @InjectRepository(FlowExecution)
    private readonly executionRepo: Repository<FlowExecution>,
    private readonly settingsService: SettingsService,
  ) {}

  private getWhereClause<T>(
    filter: FlowFilterDto,
    dateField: string = 'createdAt',
  ): FindOptionsWhere<T> {
    const where: any = {};

    if (filter.branchId) where.branchId = filter.branchId;

    if (filter.from && filter.to) {
      where[dateField] = Between(new Date(filter.from), new Date(filter.to));
    } else if (filter.from) {
      where[dateField] = MoreThanOrEqual(new Date(filter.from));
    } else if (filter.to) {
      where[dateField] = LessThanOrEqual(new Date(filter.to));
    }

    return where;
  }

  async onModuleInit(): Promise<void> {
    const count = await this.triggerRepo.count();
    if (count === 0) {
      const defaults = [
        {
          key: 'new_customer',
          label: 'New Customer',
          enabled: true,
          inactivityDays: undefined,
        },
        {
          key: 'repeat_visit',
          label: 'Repeat Visit',
          enabled: true,
          inactivityDays: undefined,
        },
        {
          key: 'inactive_customer',
          label: 'Inactive Customer',
          enabled: true,
          inactivityDays: 14,
        },
      ];
      await this.triggerRepo.save(this.triggerRepo.create(defaults));
    }
  }

  // Templates
  async getTemplates(): Promise<FlowTemplate[]> {
    return this.templateRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createTemplate(data: CreateFlowTemplateDto): Promise<FlowTemplate> {
    const template = this.templateRepo.create(
      data as any,
    ) as unknown as FlowTemplate;
    return this.templateRepo.save(template);
  }

  async updateTemplate(
    id: string,
    data: UpdateFlowTemplateDto,
  ): Promise<FlowTemplate | null> {
    await this.templateRepo.update(id, data as any);
    return this.templateRepo.findOne({ where: { id } });
  }

  async deleteTemplate(id: string): Promise<DeleteResult> {
    return this.templateRepo.delete(id);
  }

  // Triggers
  async getTriggers(): Promise<FlowTriggerConfig[]> {
    return this.triggerRepo.find();
  }

  async updateTrigger(
    key: string,
    data: UpdateFlowTriggerConfigDto,
  ): Promise<FlowTriggerConfig | null> {
    await this.triggerRepo.update({ key }, data);
    return this.triggerRepo.findOne({ where: { key } });
  }

  // Sessions
  async getSessions(filter: FlowFilterDto): Promise<FlowExecution[]> {
    const where = this.getWhereClause<FlowExecution>(filter, 'updatedAt');
    return this.executionRepo.find({
      where,
      relations: ['flow', 'customer', 'branch'],
      order: { updatedAt: 'DESC' },
      take: filter.limit || 50,
    });
  }

  // Logs
  async getLogs(filter: FlowFilterDto): Promise<FlowLog[]> {
    const where = this.getWhereClause<FlowLog>(filter, 'createdAt');
    return this.logRepo.find({
      where,
      relations: ['flowExecution', 'branch'],
      order: { createdAt: 'DESC' },
      take: filter.limit || 100,
    });
  }

  // Analytics
  async getAnalytics(filter: FlowFilterDto): Promise<FlowAnalyticsResponse> {
    const logWhere = this.getWhereClause<FlowLog>(filter, 'createdAt');
    const executionWhere = this.getWhereClause<FlowExecution>(
      filter,
      'updatedAt',
    );

    const totalMessagesSent = await this.logRepo.count({
      where: { ...logWhere, actionType: 'message_sent' } as any,
    });
    const activeSessionsCount = await this.executionRepo.count({
      where: { ...executionWhere, status: ExecutionStatus.RUNNING } as any,
    });
    const loyaltyAssigned = await this.logRepo.count({
      where: { ...logWhere, actionType: 'loyalty_assigned' } as any,
    });

    return {
      totalMessagesSent,
      totalRepliesReceived: Math.floor(totalMessagesSent * 0.4),
      avgResponseRate: 40.0,
      loyaltyAssigned,
      activeSessionsCount,
    };
  }

  // Settings
  async getSettings(): Promise<Setting> {
    return this.settingsService.getGlobalSettings();
  }

  async updateSettings(data: UpdateSettingDto): Promise<Setting> {
    return this.settingsService.updateSettings(data);
  }
}
