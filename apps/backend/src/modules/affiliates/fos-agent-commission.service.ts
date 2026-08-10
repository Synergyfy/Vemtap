import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FosAgentCommission,
  FosCommissionStatus,
} from './entities/agent-commission.entity';
import {
  FinancialTransaction,
  FosTransactionType,
} from '../fos-core/entities/financial-transaction.entity';

@Injectable()
export class FosAgentCommissionService {
  private readonly logger = new Logger(FosAgentCommissionService.name);

  constructor(
    @InjectRepository(FosAgentCommission)
    private readonly commissionRepo: Repository<FosAgentCommission>,
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepo: Repository<FinancialTransaction>,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  private currentPeriod(): string {
    return new Date().toISOString().substring(0, 7);
  }

  private async computeForAgent(agentId: string) {
    const transactions = await this.transactionRepo.find({
      where: [{ agentId }],
    });

    const revenueAttributed = transactions
      .filter(
        (t) =>
          t.type === FosTransactionType.SUBSCRIPTION ||
          t.type === FosTransactionType.SMS,
      )
      .reduce((sum, t) => sum + this.toNumber(t.amount), 0);

    const commissionEarned = transactions
      .filter((t) => t.type === FosTransactionType.COMMISSION)
      .reduce((sum, t) => sum + this.toNumber(t.amount), 0);

    return { commissionEarned, revenueAttributed };
  }

  private async upsert(agentId: string, period: string) {
    const computed = await this.computeForAgent(agentId);
    let row = await this.commissionRepo.findOne({
      where: { agentId, period },
    });

    if (!row) {
      row = this.commissionRepo.create({
        agentId,
        period,
        status: FosCommissionStatus.PENDING,
        commissionEarned: computed.commissionEarned,
        revenueAttributed: computed.revenueAttributed,
      });
    } else {
      row.commissionEarned = computed.commissionEarned;
      row.revenueAttributed = computed.revenueAttributed;
    }

    return this.commissionRepo.save(row);
  }

  async getCommission(agentId: string) {
    const period = this.currentPeriod();
    const row = await this.upsert(agentId, period);
    return {
      status: row.status,
      commissionEarned: this.toNumber(row.commissionEarned),
      revenueAttributed: this.toNumber(row.revenueAttributed),
      period: row.period,
    };
  }

  async approve(agentId: string) {
    const period = this.currentPeriod();
    const row = await this.upsert(agentId, period);
    row.status = FosCommissionStatus.APPROVED;
    await this.commissionRepo.save(row);
    return { status: row.status };
  }

  async markPaid(agentId: string) {
    const period = this.currentPeriod();
    const row = await this.upsert(agentId, period);
    row.status = FosCommissionStatus.PAID;
    await this.commissionRepo.save(row);
    return { status: row.status };
  }

  async getSummary() {
    const rows = await this.commissionRepo.find();
    const summary = {
      pendingCount: 0,
      approvedCount: 0,
      paidCount: 0,
      pendingTotal: 0,
      approvedTotal: 0,
      paidTotal: 0,
    };

    for (const row of rows) {
      const amount = this.toNumber(row.commissionEarned);
      if (row.status === FosCommissionStatus.PENDING) {
        summary.pendingCount += 1;
        summary.pendingTotal += amount;
      } else if (row.status === FosCommissionStatus.APPROVED) {
        summary.approvedCount += 1;
        summary.approvedTotal += amount;
      } else if (row.status === FosCommissionStatus.PAID) {
        summary.paidCount += 1;
        summary.paidTotal += amount;
      }
    }

    return {
      ...summary,
      pendingTotal: Math.round(summary.pendingTotal * 100) / 100,
      approvedTotal: Math.round(summary.approvedTotal * 100) / 100,
      paidTotal: Math.round(summary.paidTotal * 100) / 100,
    };
  }

  async enrichAgents(
    agents: Array<Record<string, unknown>>,
  ): Promise<Array<Record<string, unknown>>> {
    const period = this.currentPeriod();
    return Promise.all(
      agents.map(async (agent) => {
        const agentId =
          typeof agent?.id === 'string'
            ? agent.id
            : typeof agent?.agentId === 'string'
              ? agent.agentId
              : undefined;
        if (!agentId) {
          return { ...agent, commissionStatus: 'pending' };
        }
        try {
          const row = await this.upsert(agentId, period);
          return {
            ...agent,
            commissionStatus: row.status,
            commissionEarned: this.toNumber(row.commissionEarned),
            revenueAttributed: this.toNumber(row.revenueAttributed),
          };
        } catch (error) {
          this.logger.warn(
            `Failed to enrich commission for agent ${agentId}: ${error}`,
          );
          return {
            ...agent,
            commissionStatus: 'pending',
            commissionEarned: 0,
            revenueAttributed: 0,
          };
        }
      }),
    );
  }

  async enrichAgentsPayload(payload: unknown): Promise<unknown> {
    if (Array.isArray(payload)) {
      return this.enrichAgents(payload as Array<Record<string, unknown>>);
    }
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      if (Array.isArray(record.data)) {
        const enriched = await this.enrichAgents(
          record.data as Array<Record<string, unknown>>,
        );
        return { ...record, data: enriched };
      }
      if (Array.isArray(record.agents)) {
        const enriched = await this.enrichAgents(
          record.agents as Array<Record<string, unknown>>,
        );
        return { ...record, agents: enriched };
      }
    }
    return payload;
  }
}
