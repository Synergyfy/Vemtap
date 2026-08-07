import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FosSettingsCategory,
  FosAccount,
  FosFiscalPeriod,
  FosCurrency,
  FosPermission,
  FosApprovalRule,
  FosNotificationRule,
  FosAuditLog,
  FosPeriodStatus,
  FosApprovalRuleStatus,
} from './entities/fos-config.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateAccountDto,
  UpdateAccountDto,
  CreatePeriodDto,
  UpdatePeriodDto,
  CreateCurrencyDto,
  UpdateCurrencyDto,
  UpdatePermissionsDto,
  CreateApprovalRuleDto,
  UpdateApprovalRuleDto,
  CreateNotificationRuleDto,
  UpdateNotificationRuleDto,
  ListAuditLogsQueryDto,
} from './dto/fos-config.dto';

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  'Super Admin': {
    view: true,
    create: true,
    edit: true,
    delete: true,
    approve: true,
    manageTeam: true,
    manageSettings: true,
  },
  Admin: {
    view: true,
    create: true,
    edit: true,
    delete: false,
    approve: true,
    manageTeam: false,
    manageSettings: false,
  },
  Manager: {
    view: true,
    create: true,
    edit: true,
    delete: false,
    approve: false,
    manageTeam: false,
    manageSettings: false,
  },
};

@Injectable()
export class FosConfigService {
  constructor(
    @InjectRepository(FosSettingsCategory)
    private readonly categoryRepo: Repository<FosSettingsCategory>,
    @InjectRepository(FosAccount)
    private readonly accountRepo: Repository<FosAccount>,
    @InjectRepository(FosFiscalPeriod)
    private readonly periodRepo: Repository<FosFiscalPeriod>,
    @InjectRepository(FosCurrency)
    private readonly currencyRepo: Repository<FosCurrency>,
    @InjectRepository(FosPermission)
    private readonly permissionRepo: Repository<FosPermission>,
    @InjectRepository(FosApprovalRule)
    private readonly approvalRuleRepo: Repository<FosApprovalRule>,
    @InjectRepository(FosNotificationRule)
    private readonly notificationRuleRepo: Repository<FosNotificationRule>,
    @InjectRepository(FosAuditLog)
    private readonly auditLogRepo: Repository<FosAuditLog>,
  ) {}

  // ---- Categories ----

  async listCategories() {
    const rows = await this.categoryRepo.find({ order: { name: 'ASC' } });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      description: c.description,
    }));
  }

  async createCategory(dto: CreateCategoryDto) {
    const row = this.categoryRepo.create({
      name: dto.name,
      type: dto.type,
      description: dto.description ?? undefined,
    });
    const saved = await this.categoryRepo.save(row);
    return {
      id: saved.id,
      name: saved.name,
      type: saved.type,
      description: saved.description,
    };
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const row = await this.categoryRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Category ${id} not found`);
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.type !== undefined) row.type = dto.type;
    if (dto.description !== undefined) row.description = dto.description;
    const saved = await this.categoryRepo.save(row);
    return {
      id: saved.id,
      name: saved.name,
      type: saved.type,
      description: saved.description,
    };
  }

  async removeCategory(id: string) {
    const row = await this.categoryRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Category ${id} not found`);
    await this.categoryRepo.remove(row);
    return { success: true };
  }

  // ---- Chart of Accounts ----

  async listAccounts() {
    const rows = await this.accountRepo.find({ order: { code: 'ASC' } });
    return rows.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      normalBalance: a.normalBalance,
    }));
  }

  async createAccount(dto: CreateAccountDto) {
    const row = this.accountRepo.create({
      code: dto.code,
      name: dto.name,
      type: dto.type,
      normalBalance: dto.normalBalance,
    });
    const saved = await this.accountRepo.save(row);
    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      type: saved.type,
      normalBalance: saved.normalBalance,
    };
  }

  async updateAccount(id: string, dto: UpdateAccountDto) {
    const row = await this.accountRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Account ${id} not found`);
    if (dto.code !== undefined) row.code = dto.code;
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.type !== undefined) row.type = dto.type;
    if (dto.normalBalance !== undefined) row.normalBalance = dto.normalBalance;
    const saved = await this.accountRepo.save(row);
    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      type: saved.type,
      normalBalance: saved.normalBalance,
    };
  }

  async removeAccount(id: string) {
    const row = await this.accountRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Account ${id} not found`);
    await this.accountRepo.remove(row);
    return { success: true };
  }

  // ---- Fiscal Periods ----

  async listPeriods() {
    const rows = await this.periodRepo.find({ order: { startDate: 'ASC' } });
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
    }));
  }

  async createPeriod(dto: CreatePeriodDto) {
    const row = this.periodRepo.create({
      name: dto.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status ?? FosPeriodStatus.OPEN,
    });
    const saved = await this.periodRepo.save(row);
    return {
      id: saved.id,
      name: saved.name,
      startDate: saved.startDate,
      endDate: saved.endDate,
      status: saved.status,
    };
  }

  async updatePeriod(id: string, dto: UpdatePeriodDto) {
    const row = await this.periodRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Period ${id} not found`);
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.startDate !== undefined) row.startDate = dto.startDate;
    if (dto.endDate !== undefined) row.endDate = dto.endDate;
    if (dto.status !== undefined) row.status = dto.status;
    const saved = await this.periodRepo.save(row);
    return {
      id: saved.id,
      name: saved.name,
      startDate: saved.startDate,
      endDate: saved.endDate,
      status: saved.status,
    };
  }

  async removePeriod(id: string) {
    const row = await this.periodRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Period ${id} not found`);
    await this.periodRepo.remove(row);
    return { success: true };
  }

  // ---- Currencies ----

  async listCurrencies() {
    const rows = await this.currencyRepo.find({ order: { code: 'ASC' } });
    return rows.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      rate: Number(c.rate) || 1,
      isDefault: c.isDefault,
    }));
  }

  async createCurrency(dto: CreateCurrencyDto) {
    const row = this.currencyRepo.create({
      code: dto.code,
      name: dto.name,
      symbol: dto.symbol,
      rate: dto.rate ?? 1,
      isDefault: dto.isDefault ?? false,
    });
    const saved = await this.currencyRepo.save(row);
    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      symbol: saved.symbol,
      rate: Number(saved.rate) || 1,
      isDefault: saved.isDefault,
    };
  }

  async updateCurrency(id: string, dto: UpdateCurrencyDto) {
    const row = await this.currencyRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Currency ${id} not found`);
    if (dto.code !== undefined) row.code = dto.code;
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.symbol !== undefined) row.symbol = dto.symbol;
    if (dto.rate !== undefined) row.rate = dto.rate;
    if (dto.isDefault !== undefined) {
      if (dto.isDefault) {
        await this.currencyRepo.update({}, { isDefault: false });
      }
      row.isDefault = dto.isDefault;
    }
    const saved = await this.currencyRepo.save(row);
    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      symbol: saved.symbol,
      rate: Number(saved.rate) || 1,
      isDefault: saved.isDefault,
    };
  }

  async removeCurrency(id: string) {
    const row = await this.currencyRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Currency ${id} not found`);
    await this.currencyRepo.remove(row);
    return { success: true };
  }

  // ---- Permissions ----

  async getPermissions() {
    const rows = await this.permissionRepo.find();
    if (rows.length === 0) {
      await this.permissionRepo.save(
        Object.entries(DEFAULT_PERMISSIONS).map(([role, permissions]) =>
          this.permissionRepo.create({ role, permissions }),
        ),
      );
      return Object.entries(DEFAULT_PERMISSIONS).map(([role, permissions]) => ({
        role,
        permissions,
      }));
    }
    return rows.map((r) => ({ role: r.role, permissions: r.permissions }));
  }

  async updatePermissions(dto: UpdatePermissionsDto) {
    const existing = await this.permissionRepo.find();
    for (const row of existing) {
      await this.permissionRepo.remove(row);
    }
    const rows = Object.entries(dto.permissions).map(([role, permissions]) =>
      this.permissionRepo.create({ role, permissions }),
    );
    await this.permissionRepo.save(rows);
    return rows.map((r) => ({ role: r.role, permissions: r.permissions }));
  }

  // ---- Approval Rules ----

  async listApprovalRules() {
    const rows = await this.approvalRuleRepo.find({ order: { name: 'ASC' } });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      trigger: r.trigger,
      approver: r.approver,
      threshold: r.threshold,
      status: r.status,
    }));
  }

  async createApprovalRule(dto: CreateApprovalRuleDto) {
    const row = this.approvalRuleRepo.create({
      name: dto.name,
      trigger: dto.trigger,
      approver: dto.approver,
      threshold: dto.threshold,
      status: dto.status ?? FosApprovalRuleStatus.ACTIVE,
    });
    const saved = await this.approvalRuleRepo.save(row);
    return {
      id: saved.id,
      name: saved.name,
      trigger: saved.trigger,
      approver: saved.approver,
      threshold: saved.threshold,
      status: saved.status,
    };
  }

  async updateApprovalRule(id: string, dto: UpdateApprovalRuleDto) {
    const row = await this.approvalRuleRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Approval rule ${id} not found`);
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.trigger !== undefined) row.trigger = dto.trigger;
    if (dto.approver !== undefined) row.approver = dto.approver;
    if (dto.threshold !== undefined) row.threshold = dto.threshold;
    if (dto.status !== undefined) row.status = dto.status;
    const saved = await this.approvalRuleRepo.save(row);
    return {
      id: saved.id,
      name: saved.name,
      trigger: saved.trigger,
      approver: saved.approver,
      threshold: saved.threshold,
      status: saved.status,
    };
  }

  async removeApprovalRule(id: string) {
    const row = await this.approvalRuleRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Approval rule ${id} not found`);
    await this.approvalRuleRepo.remove(row);
    return { success: true };
  }

  // ---- Notification Rules ----

  async listNotificationRules() {
    const rows = await this.notificationRuleRepo.find({
      order: { event: 'ASC' },
    });
    return rows.map((r) => ({
      id: r.id,
      event: r.event,
      channel: r.channel,
      enabled: r.enabled,
    }));
  }

  async createNotificationRule(dto: CreateNotificationRuleDto) {
    const row = this.notificationRuleRepo.create({
      event: dto.event,
      channel: dto.channel,
      enabled: dto.enabled ?? true,
    });
    const saved = await this.notificationRuleRepo.save(row);
    return {
      id: saved.id,
      event: saved.event,
      channel: saved.channel,
      enabled: saved.enabled,
    };
  }

  async updateNotificationRule(id: string, dto: UpdateNotificationRuleDto) {
    const row = await this.notificationRuleRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Notification rule ${id} not found`);
    if (dto.event !== undefined) row.event = dto.event;
    if (dto.channel !== undefined) row.channel = dto.channel;
    if (dto.enabled !== undefined) row.enabled = dto.enabled;
    const saved = await this.notificationRuleRepo.save(row);
    return {
      id: saved.id,
      event: saved.event,
      channel: saved.channel,
      enabled: saved.enabled,
    };
  }

  async removeNotificationRule(id: string) {
    const row = await this.notificationRuleRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Notification rule ${id} not found`);
    await this.notificationRuleRepo.remove(row);
    return { success: true };
  }

  // ---- Audit Logs (server-generated) ----

  async listAuditLogs(query: ListAuditLogsQueryDto) {
    const limit = query.limit || 50;
    const rows = await this.auditLogRepo.find({
      order: { timestamp: 'DESC' },
      take: Math.min(limit, 200),
    });
    return {
      entries: rows.map((r) => ({
        id: r.id,
        timestamp: r.timestamp.toISOString(),
        user: r.user,
        action: r.action,
        details: r.details,
      })),
    };
  }

  async log(user: string, action: string, details?: string) {
    const row = this.auditLogRepo.create({
      timestamp: new Date(),
      user,
      action,
      details: details ?? undefined,
    });
    return this.auditLogRepo.save(row);
  }
}
