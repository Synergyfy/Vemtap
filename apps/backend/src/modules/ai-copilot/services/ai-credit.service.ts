import {
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AiCreditUsage } from '../entities/ai-credit-usage.entity';
import { Subscription, SubscriptionStatus } from '../../subscriptions/entities/subscription.entity';

@Injectable()
export class AiCreditService {
  private readonly logger = new Logger(AiCreditService.name);

  private readonly planCache = new Map<string, { limit: number; enabled: boolean; businessId: string; timestamp: number }>();

  constructor(
    @InjectRepository(AiCreditUsage)
    private readonly usageRepo: Repository<AiCreditUsage>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Returns the start (first moment of this month) and end (last moment of this month) in UTC */
  private getCurrentPeriod(): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    return { periodStart, periodEnd };
  }

  /** Resolves the active plan's aiCredits limit for a given businessId (or branchId fallback). Returns 0 if no plan. */
  private async getPlanCreditLimit(targetId: string): Promise<{ limit: number; enabled: boolean; businessId: string }> {
    const cached = this.planCache.get(targetId);
    if (cached && Date.now() - cached.timestamp < 60000) {
      return { limit: cached.limit, enabled: cached.enabled, businessId: cached.businessId };
    }

    try {
      let sub = await this.subscriptionRepo.findOne({
        where: { businessId: targetId, status: SubscriptionStatus.ACTIVE },
        relations: ['plan'],
        order: { createdAt: 'DESC' },
      });

      let resolvedBusinessId = targetId;

      // Fallback: If targetId is a branchId, resolve its parent businessId
      if (!sub) {
        const branch = await this.dataSource.getRepository('branches').findOne({
          where: { id: targetId },
          select: ['businessId'],
        }).catch(() => null);

        if (branch?.businessId) {
          resolvedBusinessId = branch.businessId;
          sub = await this.subscriptionRepo.findOne({
            where: { businessId: resolvedBusinessId, status: SubscriptionStatus.ACTIVE },
            relations: ['plan'],
            order: { createdAt: 'DESC' },
          });
        }
      }

      if (!sub?.plan) {
        const result = { limit: 0, enabled: false, businessId: resolvedBusinessId };
        this.planCache.set(targetId, { ...result, timestamp: Date.now() });
        return result;
      }
      
      const result = {
        limit: sub.plan.aiCredits ?? 0,
        enabled: sub.plan.aiCopilotEnabled ?? false,
        businessId: resolvedBusinessId,
      };
      this.planCache.set(targetId, { ...result, timestamp: Date.now() });
      return result;
    } catch (e) {
      this.logger.warn(`[AiCreditService] Could not resolve plan for target ${targetId}: ${e.message}`);
      return { limit: 0, enabled: false, businessId: targetId };
    }
  }

  /** Gets or creates the usage row for the current period */
  private async getOrCreateUsageRow(businessId: string): Promise<AiCreditUsage> {
    const { periodStart, periodEnd } = this.getCurrentPeriod();

    const existing = await this.usageRepo.findOne({
      where: { businessId, periodStart },
    });

    if (existing) {
      return existing;
    }

    try {
      const newRow = this.usageRepo.create({ businessId, used: 0, periodStart, periodEnd });
      return await this.usageRepo.save(newRow);
    } catch (e) {
      // Handle race condition if concurrent request created row in parallel
      const fallback = await this.usageRepo.findOne({ where: { businessId, periodStart } });
      if (fallback) {
        return fallback;
      }
      throw e;
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns the real credit balance for a business for the current billing period.
   */
  async getStatus(targetId: string): Promise<{ available: number; used: number; limit: number; enabled: boolean }> {
    const { limit, enabled, businessId } = await this.getPlanCreditLimit(targetId);

    if (!enabled || limit === 0) {
      return { available: 0, used: 0, limit: 0, enabled: false };
    }

    const row = await this.getOrCreateUsageRow(businessId);
    const used = row.used;

    if (limit === -1) {
      // Unlimited
      return { available: -1, used, limit: -1, enabled: true };
    }

    const available = Math.max(0, limit - used);
    return { available, used, limit, enabled };
  }

  /**
   * Deducts one credit from the business's balance for the current period.
   * Throws ForbiddenException if the business has run out of credits or AI is not enabled on their plan.
   */
  async consume(targetId: string): Promise<void> {
    const { limit, enabled, businessId } = await this.getPlanCreditLimit(targetId);

    if (!enabled || limit === 0) {
      throw new ForbiddenException(
        'AI Copilot is not enabled on your current plan. Please upgrade to access this feature.',
      );
    }

    const row = await this.getOrCreateUsageRow(businessId);

    if (limit !== -1) {
      // Atomic update
      const result = await this.dataSource.query(
        `UPDATE ai_credit_usage SET used = used + 1 WHERE id = $1 AND ($2 = -1 OR used < $2) RETURNING used`,
        [row.id, limit]
      );
      
      if (!result || result.length === 0) {
        throw new ForbiddenException(
          `You have used all ${limit} AI Copilot credits for this month. Upgrade your plan or wait until next month.`
        );
      }
      this.logger.log(`[AiCreditService] Credit consumed for business ${businessId}. Total used this month: ${result[0].used}`);
    } else {
      await this.usageRepo.increment({ id: row.id }, 'used', 1);
      this.logger.log(`[AiCreditService] Credit consumed for business ${businessId}. Total used this month: ${row.used + 1}`);
    }
  }
}
