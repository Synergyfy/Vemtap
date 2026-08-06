import {
  Injectable,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AiCreditUsage } from '../entities/ai-credit-usage.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../../subscriptions/entities/subscription.entity';
import { CreditService } from '../../messaging/services/credit.service';
import { Channel } from '../../messaging/enums/channel.enum';

@Injectable()
export class AiCreditService {
  private readonly logger = new Logger(AiCreditService.name);

  private readonly planCache = new Map<
    string,
    { limit: number; enabled: boolean; businessId: string; timestamp: number }
  >();

  constructor(
    @InjectRepository(AiCreditUsage)
    private readonly usageRepo: Repository<AiCreditUsage>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => CreditService))
    private readonly creditService: CreditService,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Returns the start (first moment of this month) and end (last moment of this month) in UTC */
  private getCurrentPeriod(): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );
    return { periodStart, periodEnd };
  }

  /** Resolves the active plan's aiCredits limit for a given businessId (or branchId fallback). Returns 0 if no plan. */
  private async getPlanCreditLimit(
    targetId: string,
  ): Promise<{ limit: number; enabled: boolean; businessId: string }> {
    const cached = this.planCache.get(targetId);
    if (cached && Date.now() - cached.timestamp < 60000) {
      return {
        limit: cached.limit,
        enabled: cached.enabled,
        businessId: cached.businessId,
      };
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
        const branch = await this.dataSource
          .getRepository('branches')
          .findOne({
            where: { id: targetId },
            select: ['businessId'],
          })
          .catch(() => null);

        if (branch?.businessId) {
          resolvedBusinessId = branch.businessId;
          sub = await this.subscriptionRepo.findOne({
            where: {
              businessId: resolvedBusinessId,
              status: SubscriptionStatus.ACTIVE,
            },
            relations: ['plan'],
            order: { createdAt: 'DESC' },
          });
        }
      }

      if (!sub?.plan) {
        const result = {
          limit: 0,
          enabled: false,
          businessId: resolvedBusinessId,
        };
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
      this.logger.warn(
        `[AiCreditService] Could not resolve plan for target ${targetId}: ${e.message}`,
      );
      return { limit: 0, enabled: false, businessId: targetId };
    }
  }

  /** Gets or creates the usage row for the current period */
  private async getOrCreateUsageRow(
    businessId: string,
  ): Promise<AiCreditUsage> {
    const { periodStart, periodEnd } = this.getCurrentPeriod();

    const existing = await this.usageRepo.findOne({
      where: { businessId, periodStart },
    });

    if (existing) {
      return existing;
    }

    try {
      const newRow = this.usageRepo.create({
        businessId,
        used: 0,
        periodStart,
        periodEnd,
      });
      return await this.usageRepo.save(newRow);
    } catch (e) {
      // Handle race condition if concurrent request created row in parallel
      const fallback = await this.usageRepo.findOne({
        where: { businessId, periodStart },
      });
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
  async getStatus(targetId: string): Promise<{
    available: number;
    used: number;
    limit: number;
    enabled: boolean;
    walletCredits: number;
  }> {
    const { limit, enabled, businessId } =
      await this.getPlanCreditLimit(targetId);
    const wallet = await this.creditService
      .getOrCreateWallet(businessId)
      .catch(() => null);
    const walletCredits = wallet?.aiCredits || 0;

    if (!enabled && walletCredits <= 0) {
      return {
        available: 0,
        used: 0,
        limit: 0,
        enabled: false,
        walletCredits: 0,
      };
    }

    const row = await this.getOrCreateUsageRow(businessId);
    const used = row.used;

    if (limit === -1) {
      // Unlimited
      return { available: -1, used, limit: -1, enabled: true, walletCredits };
    }

    const monthlyAvailable = Math.max(0, limit - used);
    const available = monthlyAvailable + walletCredits;
    return {
      available,
      used,
      limit,
      enabled: enabled || walletCredits > 0,
      walletCredits,
    };
  }

  /**
   * Deducts one credit from the business's balance for the current period.
   * Consumes from monthly plan limit first, then falls back to top-up wallet credits.
   * Throws ForbiddenException if no credits remain.
   */
  async consume(targetId: string): Promise<void> {
    const { limit, enabled, businessId } =
      await this.getPlanCreditLimit(targetId);

    const row = await this.getOrCreateUsageRow(businessId);

    // 1. Unlimited plan
    if (limit === -1) {
      await this.usageRepo.increment({ id: row.id }, 'used', 1);
      this.logger.log(
        `[AiCreditService] Unlimited plan credit consumed for business ${businessId}. Total used this month: ${row.used + 1}`,
      );
      return;
    }

    // 2. Monthly plan limit available
    if (limit > 0 && row.used < limit) {
      const result = await this.dataSource.query(
        `UPDATE ai_credit_usage SET used = used + 1 WHERE id = $1 AND used < $2 RETURNING used`,
        [row.id, limit],
      );
      if (result && result.length > 0) {
        this.logger.log(
          `[AiCreditService] Monthly plan credit consumed for business ${businessId}. Total used this month: ${result[0].used}`,
        );
        return;
      }
    }

    // 3. Fallback: Monthly plan quota exhausted or limit === 0. Try deducting from wallet top-up AI credits.
    try {
      await this.creditService.deductCredits(
        businessId,
        Channel.AI,
        1,
        'AI Copilot Request',
      );
      this.logger.log(
        `[AiCreditService] Purchased wallet AI credit consumed for business ${businessId}.`,
      );
      return;
    } catch (e) {
      this.logger.warn(
        `[AiCreditService] Top-up credit deduction failed for business ${businessId}: ${e.message}`,
      );
      throw new ForbiddenException(
        limit > 0
          ? `You have used all ${limit} monthly AI Copilot credits and have no top-up AI credits left. Please purchase AI credits or upgrade your plan.`
          : 'AI Copilot is not enabled on your plan and you have no top-up AI credits. Please purchase AI credits or upgrade your plan to use AI Copilot.',
      );
    }
  }
}
