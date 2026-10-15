import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, In, Repository } from 'typeorm';
import {
  SponsoredCampaign,
  SponsoredCampaignKind,
  SponsoredCampaignStatus,
} from '../discovery/entities/sponsored-campaign.entity';
import {
  CampaignTransactionStatus,
  SponsoredCampaignTransaction,
} from '../discovery/entities/sponsored-campaign-transaction.entity';
import { AdWalletService } from '../ad-wallet/ad-wallet.service';
import { AD_WALLET_MIN_TOPUP } from '../ad-wallet/ad-wallet.constants';
import type { Payment } from '../payments/entities/payment.entity';
import {
  ForecastDto,
  LaunchCampaignDto,
  ListCampaignsQueryDto,
  SaveCampaignDto,
} from './dto/promotion.dto';
import {
  AUDIENCE_SCOPES,
  BOOST_BUDGET_TIERS,
  BOOST_GOALS,
  DAYPART_WINDOWS,
  DURATION_OPTIONS_DAYS,
  FORECAST,
  MIN_CAMPAIGN_BUDGET,
  PLACEMENTS,
  PROMOTION_BUDGET_TIERS,
  PROMOTION_COHORTS,
  PROMOTION_OBJECTIVES,
  PROMOTION_STRATEGIES,
  RADIUS_OPTIONS_KM,
} from './promotions.constants';

const DAY_MS = 24 * 60 * 60 * 1000;
const round2 = (value: number) => Math.round(value * 100) / 100;
const num = (value: unknown) => Number(value ?? 0) || 0;

interface CampaignUser {
  id: string;
  email?: string | null;
}

/**
 * Boosts and promotion campaigns — the business side of
 * `sponsored_campaigns`. Both kinds share one lifecycle:
 *
 *   Draft ──launch──▶ Active (or Pending until startAt / until a card top-up
 *   is paid) ──pause/resume──▶ Paused ──end──▶ Ended
 *
 * Launch reserves the whole budget in the ad wallet; an hourly job spends it
 * evenly over the schedule and releases whatever is left when it ends.
 */
@Injectable()
export class PromotionsService implements OnModuleInit {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    @InjectRepository(SponsoredCampaign)
    private readonly campaignRepo: Repository<SponsoredCampaign>,
    @InjectRepository(SponsoredCampaignTransaction)
    private readonly invoiceRepo: Repository<SponsoredCampaignTransaction>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly walletService: AdWalletService,
  ) {}

  onModuleInit() {
    // A card-funded launch completes when its wallet top-up is credited.
    this.walletService.onTopUpCredited((payment) =>
      this.launchAfterTopUp(payment),
    );
  }

  // ─── reads ────────────────────────────────────────────────────────────

  private async findOwned(
    kind: SponsoredCampaignKind,
    id: string,
    businessId: string,
  ) {
    const campaign = await this.campaignRepo.findOne({
      where: { id, businessId, kind },
    });
    if (!campaign) throw new NotFoundException(`${this.label(kind)} not found`);
    return campaign;
  }

  private label(kind: SponsoredCampaignKind) {
    return kind === SponsoredCampaignKind.BOOST ? 'Boost' : 'Campaign';
  }

  /** Total the campaign may spend, from its budget mode. */
  totalBudget(
    campaign: Pick<
      SponsoredCampaign,
      'budgetMode' | 'budget' | 'dailyBudget' | 'schedule'
    >,
  ) {
    if (campaign.budgetMode === 'daily') {
      return round2(
        num(campaign.dailyBudget) * (campaign.schedule?.durationDays ?? 0),
      );
    }
    return round2(num(campaign.budget));
  }

  private view(campaign: SponsoredCampaign) {
    const budget = num(campaign.budget);
    const spent = num(campaign.spent);
    return {
      id: campaign.id,
      kind: campaign.kind,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      goalId: campaign.goalId,
      assets: campaign.assets ?? [],
      audience: campaign.audience ?? {},
      placements: campaign.placements ?? [],
      schedule: campaign.schedule ?? null,
      budgetMode: campaign.budgetMode,
      budget: this.totalBudget(campaign),
      dailyBudget: campaign.dailyBudget,
      spent,
      remaining: round2(Math.max(0, budget - spent)),
      fundingSource: campaign.fundingSource,
      awaitingPayment: Boolean(
        campaign.paymentReference &&
        campaign.status === SponsoredCampaignStatus.PENDING,
      ),
      paymentReference: campaign.paymentReference,
      branchId: campaign.branchId,
      startDate: campaign.startDate?.toISOString() ?? null,
      endDate: campaign.endDate?.toISOString() ?? null,
      launchedAt: campaign.launchedAt?.toISOString() ?? null,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      createdAt: campaign.createdAt?.toISOString(),
      updatedAt: campaign.updatedAt?.toISOString(),
    };
  }

  async list(
    kind: SponsoredCampaignKind,
    businessId: string,
    query: ListCampaignsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.campaignRepo.findAndCount({
      where: {
        businessId,
        kind,
        ...(query.status && { status: query.status }),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: rows.map((row) => this.view(row)),
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
    };
  }

  async get(kind: SponsoredCampaignKind, id: string, businessId: string) {
    return this.view(await this.findOwned(kind, id, businessId));
  }

  /** Hub header numbers across the business's campaigns of this kind. */
  async summary(kind: SponsoredCampaignKind, businessId: string) {
    const campaigns = await this.campaignRepo.find({
      where: { businessId, kind },
    });
    const count = (status: SponsoredCampaignStatus) =>
      campaigns.filter((campaign) => campaign.status === status).length;
    const launched = campaigns.filter((campaign) => campaign.launchedAt);
    const outcome = await this.outcomes(launched);
    return {
      live: count(SponsoredCampaignStatus.ACTIVE),
      scheduled: count(SponsoredCampaignStatus.PENDING),
      paused: count(SponsoredCampaignStatus.PAUSED),
      drafts: count(SponsoredCampaignStatus.DRAFT),
      ended: count(SponsoredCampaignStatus.ENDED),
      totalBudget: round2(launched.reduce((sum, c) => sum + num(c.budget), 0)),
      totalSpent: round2(campaigns.reduce((sum, c) => sum + num(c.spent), 0)),
      audienceReached: campaigns.reduce(
        (sum, c) => sum + (c.impressions ?? 0),
        0,
      ),
      claims: outcome.claims,
      redemptions: outcome.redemptions,
      revenue: outcome.revenue,
    };
  }

  // ─── writes ───────────────────────────────────────────────────────────

  private async assertAssetsOwned(businessId: string, dto: SaveCampaignDto) {
    for (const asset of dto.assets ?? []) {
      const [row] =
        asset.type === 'deal'
          ? await this.dataSource.query<{ ok: number }[]>(
              `SELECT 1 AS ok FROM "catalogue_offers" WHERE "id" = $1 AND "businessId" = $2 AND "deletedAt" IS NULL`,
              [asset.id, businessId],
            )
          : asset.type === 'profile'
            ? asset.id === businessId
              ? [{ ok: 1 }]
              : []
            : await this.dataSource.query<{ ok: number }[]>(
                `SELECT 1 AS ok FROM "catalogue_items" WHERE "id" = $1 AND "businessId" = $2 AND "itemType" = $3 AND "deletedAt" IS NULL`,
                [asset.id, businessId, asset.type],
              );
      if (!row) {
        throw new BadRequestException(
          `${asset.type} ${asset.id} is not one of your listings`,
        );
      }
    }
    if (dto.audience?.branchIds?.length) {
      const rows = await this.dataSource.query<{ id: string }[]>(
        `SELECT "id" FROM "branches" WHERE "id" = ANY($1::uuid[]) AND "businessId" = $2`,
        [dto.audience.branchIds, businessId],
      );
      if (rows.length !== dto.audience.branchIds.length) {
        throw new BadRequestException('Branch not found or unauthorized');
      }
    }
  }

  private apply(campaign: SponsoredCampaign, dto: SaveCampaignDto) {
    if (dto.name !== undefined) campaign.name = dto.name;
    if (dto.objective !== undefined) campaign.objective = dto.objective;
    if (dto.goalId !== undefined) campaign.goalId = dto.goalId;
    if (dto.assets !== undefined) campaign.assets = dto.assets;
    if (dto.audience !== undefined) {
      campaign.audience = dto.audience;
      if (dto.audience.radiusKm !== undefined)
        campaign.radius = `${dto.audience.radiusKm}km`;
    }
    if (dto.placements !== undefined) campaign.placements = dto.placements;
    if (dto.schedule !== undefined) {
      campaign.schedule = dto.schedule;
      campaign.duration = `${dto.schedule.durationDays} Days`;
    }
    if (dto.budgetMode !== undefined) campaign.budgetMode = dto.budgetMode;
    if (dto.budget !== undefined) campaign.budget = dto.budget;
    if (dto.dailyBudget !== undefined) campaign.dailyBudget = dto.dailyBudget;
    if (dto.branchId !== undefined) campaign.branchId = dto.branchId;
    // Keep `budget` the total either way: the admin console reads it.
    if (campaign.budgetMode === 'daily')
      campaign.budget = this.totalBudget(campaign);
  }

  async create(
    kind: SponsoredCampaignKind,
    businessId: string,
    dto: SaveCampaignDto,
  ) {
    await this.assertAssetsOwned(businessId, dto);
    const campaign = this.campaignRepo.create({
      businessId,
      kind,
      name: dto.name ?? `Untitled ${this.label(kind).toLowerCase()}`,
      status: SponsoredCampaignStatus.DRAFT,
      budget: 0,
      spent: 0,
    });
    this.apply(campaign, dto);
    return this.view(await this.campaignRepo.save(campaign));
  }

  async update(
    kind: SponsoredCampaignKind,
    id: string,
    businessId: string,
    dto: SaveCampaignDto,
  ) {
    const campaign = await this.findOwned(kind, id, businessId);
    const editable =
      campaign.status === SponsoredCampaignStatus.DRAFT ||
      (campaign.status === SponsoredCampaignStatus.PENDING &&
        !campaign.launchedAt);
    if (!editable) {
      // Once money is committed only cosmetic fields may change.
      const keys = Object.keys(dto).filter(
        (key) => dto[key as keyof SaveCampaignDto] !== undefined,
      );
      const disallowed = keys.filter(
        (key) => !['name', 'placements'].includes(key),
      );
      if (
        campaign.status === SponsoredCampaignStatus.ENDED ||
        disallowed.length
      ) {
        throw new ConflictException(
          campaign.status === SponsoredCampaignStatus.ENDED
            ? `An ended ${this.label(kind).toLowerCase()} cannot be edited`
            : `Only name and placements can change after launch (got: ${disallowed.join(', ')})`,
        );
      }
    }
    await this.assertAssetsOwned(businessId, dto);
    this.apply(campaign, dto);
    return this.view(await this.campaignRepo.save(campaign));
  }

  async remove(kind: SponsoredCampaignKind, id: string, businessId: string) {
    const campaign = await this.findOwned(kind, id, businessId);
    if (
      campaign.launchedAt ||
      campaign.status !== SponsoredCampaignStatus.DRAFT
    ) {
      throw new ConflictException(
        'Only drafts can be deleted; end a launched campaign instead',
      );
    }
    await this.campaignRepo.softRemove(campaign);
    return { id, deleted: true };
  }

  /** Everything launch needs, as one list of problems. */
  private launchProblems(campaign: SponsoredCampaign): string[] {
    const problems: string[] = [];
    if (!campaign.name?.trim()) problems.push('name');
    const assets = campaign.assets ?? [];
    if (campaign.kind === SponsoredCampaignKind.BOOST) {
      if (assets.length !== 1) problems.push('exactly one asset');
      if (!campaign.goalId) problems.push('goalId');
    } else {
      if (assets.length === 0) problems.push('at least one asset');
      if (!campaign.objective) problems.push('objective');
    }
    if (!campaign.schedule?.durationDays)
      problems.push('schedule.durationDays');
    if (this.totalBudget(campaign) < MIN_CAMPAIGN_BUDGET) {
      problems.push(
        `a budget of at least ₦${MIN_CAMPAIGN_BUDGET.toLocaleString()}`,
      );
    }
    return problems;
  }

  async launch(
    kind: SponsoredCampaignKind,
    id: string,
    businessId: string,
    user: CampaignUser,
    dto: LaunchCampaignDto,
  ) {
    const campaign = await this.findOwned(kind, id, businessId);
    if (campaign.launchedAt) {
      throw new ConflictException(
        `This ${this.label(kind).toLowerCase()} is already launched`,
      );
    }
    const problems = this.launchProblems(campaign);
    if (problems.length) {
      throw new BadRequestException(
        `Before launching, add: ${problems.join(', ')}`,
      );
    }

    const total = this.totalBudget(campaign);
    const funding = dto.fundingSource ?? 'wallet';
    if (funding === 'card') {
      const wallet = await this.walletService.getSummary(businessId);
      const shortfall = round2(total - wallet.spendable);
      if (shortfall > 0) {
        const checkout = await this.walletService.startTopUp(
          businessId,
          user,
          {
            amount: Math.max(shortfall, AD_WALLET_MIN_TOPUP),
            callbackUrl: dto.callbackUrl,
          },
          { campaignId: campaign.id, campaignKind: kind },
        );
        campaign.status = SponsoredCampaignStatus.PENDING;
        campaign.fundingSource = 'card';
        campaign.paymentReference = checkout.reference;
        await this.campaignRepo.save(campaign);
        return { ...this.view(campaign), checkout };
      }
    }

    return this.view(await this.launchFromWallet(campaign, funding));
  }

  /** Reserve the budget and go live (or scheduled). */
  private async launchFromWallet(
    campaign: SponsoredCampaign,
    funding: 'wallet' | 'card',
  ) {
    const total = this.totalBudget(campaign);
    await this.walletService.reserve(
      campaign.businessId,
      campaign.id,
      total,
      `${this.label(campaign.kind)}: ${campaign.name}`,
    );

    const now = new Date();
    const requested = campaign.schedule?.startAt
      ? new Date(campaign.schedule.startAt)
      : null;
    const start =
      campaign.schedule?.instantLaunch || !requested || requested <= now
        ? now
        : requested;
    campaign.startDate = start;
    campaign.endDate = new Date(
      start.getTime() + campaign.schedule!.durationDays * DAY_MS,
    );
    campaign.budget = total;
    campaign.fundingSource = funding;
    campaign.launchedAt = now;
    campaign.status =
      start <= now
        ? SponsoredCampaignStatus.ACTIVE
        : SponsoredCampaignStatus.PENDING;
    const saved = await this.campaignRepo.save(campaign);

    // The platform billing view (admin console) lists these.
    await this.invoiceRepo.save(
      this.invoiceRepo.create({
        campaignId: campaign.id,
        invoiceNo: `INV-${campaign.kind === SponsoredCampaignKind.BOOST ? 'B' : 'C'}-${campaign.id.slice(0, 8).toUpperCase()}`,
        type: funding === 'card' ? 'Card top-up' : 'Ad wallet',
        amount: total,
        status: CampaignTransactionStatus.PAID,
        date: now,
      }),
    );
    return saved;
  }

  /** Wallet listener: a paid card top-up launches the campaign it was for. */
  async launchAfterTopUp(payment: Payment): Promise<void> {
    const campaignId = (payment.metadata as { campaignId?: string } | null)
      ?.campaignId;
    if (!campaignId) return;
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId, businessId: payment.businessId },
    });
    if (
      !campaign ||
      campaign.launchedAt ||
      campaign.paymentReference !== payment.reference
    ) {
      return;
    }
    await this.launchFromWallet(campaign, 'card');
    this.logger.log(
      `Campaign ${campaign.id} launched after top-up ${payment.reference}`,
    );
  }

  async pause(kind: SponsoredCampaignKind, id: string, businessId: string) {
    const campaign = await this.findOwned(kind, id, businessId);
    if (
      !campaign.launchedAt ||
      ![
        SponsoredCampaignStatus.ACTIVE,
        SponsoredCampaignStatus.PENDING,
      ].includes(campaign.status)
    ) {
      throw new ConflictException(
        'Only a live or scheduled campaign can be paused',
      );
    }
    // Pausing stops spending but keeps the reserve, so resume needs no funds.
    const now = new Date();
    await this.settleOne(campaign, now);
    campaign.status = SponsoredCampaignStatus.PAUSED;
    campaign.pausedAt = now;
    return this.view(await this.campaignRepo.save(campaign));
  }

  async resume(kind: SponsoredCampaignKind, id: string, businessId: string) {
    const campaign = await this.findOwned(kind, id, businessId);
    if (campaign.status !== SponsoredCampaignStatus.PAUSED) {
      throw new ConflictException('Only a paused campaign can be resumed');
    }
    const now = new Date();
    // The paused stretch is not part of the run: push the schedule back by it
    // so pacing neither charges for it nor shortens the campaign.
    const pausedMs = campaign.pausedAt
      ? now.getTime() - campaign.pausedAt.getTime()
      : 0;
    if (pausedMs > 0 && campaign.startDate && campaign.endDate) {
      campaign.startDate = new Date(campaign.startDate.getTime() + pausedMs);
      campaign.endDate = new Date(campaign.endDate.getTime() + pausedMs);
    }
    campaign.pausedAt = null;
    campaign.status =
      campaign.startDate && campaign.startDate > now
        ? SponsoredCampaignStatus.PENDING
        : SponsoredCampaignStatus.ACTIVE;
    return this.view(await this.campaignRepo.save(campaign));
  }

  async end(kind: SponsoredCampaignKind, id: string, businessId: string) {
    const campaign = await this.findOwned(kind, id, businessId);
    if (campaign.status === SponsoredCampaignStatus.ENDED) {
      throw new ConflictException('Already ended');
    }
    if (!campaign.launchedAt) {
      throw new ConflictException(
        'A draft has nothing to end; delete it instead',
      );
    }
    if (campaign.status === SponsoredCampaignStatus.ACTIVE) {
      await this.settleOne(campaign, new Date());
    }
    await this.finish(campaign);
    return this.view(campaign);
  }

  /** Mark ended and give back whatever reserve is left. */
  private async finish(campaign: SponsoredCampaign) {
    const left = round2(num(campaign.budget) - num(campaign.spent));
    if (left > 0) {
      await this.walletService.release(
        campaign.businessId,
        campaign.id,
        left,
        `${this.label(campaign.kind)} ended: ${campaign.name}`,
      );
    }
    campaign.status = SponsoredCampaignStatus.ENDED;
    if (!campaign.endDate || campaign.endDate > new Date())
      campaign.endDate = new Date();
    await this.campaignRepo.save(campaign);
  }

  // ─── pacing ───────────────────────────────────────────────────────────

  /**
   * Spend what the schedule says should be spent by `now`, evenly over the
   * campaign's run. Nothing bills per impression yet, so pacing is linear.
   */
  private async settleOne(campaign: SponsoredCampaign, now: Date) {
    if (!campaign.startDate || !campaign.endDate) return;
    const totalMs = campaign.endDate.getTime() - campaign.startDate.getTime();
    if (totalMs <= 0) return;
    const elapsed =
      Math.min(now.getTime(), campaign.endDate.getTime()) -
      campaign.startDate.getTime();
    if (elapsed <= 0) return;
    const budget = num(campaign.budget);
    const target = round2(budget * Math.min(1, elapsed / totalMs));
    const due = round2(target - num(campaign.spent));
    if (due < 1) return;
    await this.walletService.spend(
      campaign.businessId,
      campaign.id,
      due,
      `${this.label(campaign.kind)} delivery: ${campaign.name}`,
    );
    campaign.spent = round2(num(campaign.spent) + due);
  }

  /** Hourly: start scheduled campaigns, spend on live ones, end finished ones. */
  @Cron(CronExpression.EVERY_HOUR)
  async settle(
    now: Date = new Date(),
  ): Promise<{ started: number; ended: number; renewed: number }> {
    let started = 0;
    let ended = 0;
    let renewed = 0;
    const campaigns = await this.campaignRepo.find({
      where: {
        status: In([
          SponsoredCampaignStatus.ACTIVE,
          SponsoredCampaignStatus.PENDING,
        ]),
      },
    });
    for (const campaign of campaigns) {
      if (!campaign.launchedAt) continue; // awaiting card payment
      try {
        if (campaign.status === SponsoredCampaignStatus.PENDING) {
          if (campaign.startDate && campaign.startDate <= now) {
            campaign.status = SponsoredCampaignStatus.ACTIVE;
            await this.campaignRepo.save(campaign);
            started += 1;
          } else {
            continue;
          }
        }
        await this.settleOne(campaign, now);
        if (campaign.endDate && campaign.endDate <= now) {
          if (campaign.schedule?.autoRenew && (await this.renew(campaign))) {
            renewed += 1;
          } else if (campaign.status !== SponsoredCampaignStatus.ENDED) {
            await this.finish(campaign);
            ended += 1;
          }
        } else {
          await this.campaignRepo.save(campaign);
        }
      } catch (err) {
        this.logger.error(
          `Settling campaign ${campaign.id} failed: ${(err as Error).message}`,
        );
      }
    }
    return { started, ended, renewed };
  }

  /**
   * Run again for the same duration if the wallet can fund it. The finished
   * run is ended (its leftover released) and a copy is launched, so each run
   * keeps its own budget, pacing and stats.
   */
  private async renew(campaign: SponsoredCampaign): Promise<boolean> {
    const total = this.totalBudget(campaign);
    const left = round2(num(campaign.budget) - num(campaign.spent));
    const spendable = (await this.walletService.getSummary(campaign.businessId))
      .spendable;
    if (spendable + Math.max(0, left) < total) return false;

    await this.finish(campaign);
    const next = this.campaignRepo.create({
      businessId: campaign.businessId,
      branchId: campaign.branchId,
      kind: campaign.kind,
      name: campaign.name,
      objective: campaign.objective,
      goalId: campaign.goalId,
      assets: campaign.assets,
      audience: campaign.audience,
      placements: campaign.placements,
      schedule: { ...campaign.schedule!, instantLaunch: true, startAt: null },
      budgetMode: campaign.budgetMode,
      budget: campaign.budgetMode === 'daily' ? 0 : total,
      dailyBudget: campaign.dailyBudget,
      radius: campaign.radius,
      duration: campaign.duration,
      status: SponsoredCampaignStatus.DRAFT,
      spent: 0,
      renewedFromId: campaign.id,
    });
    const saved = await this.campaignRepo.save(next);
    try {
      await this.launchFromWallet(saved, campaign.fundingSource);
      return true;
    } catch (err) {
      await this.campaignRepo.softRemove(saved);
      this.logger.warn(
        `Auto-renew of ${campaign.id} failed: ${(err as Error).message}`,
      );
      return false;
    }
  }

  // ─── performance ──────────────────────────────────────────────────────

  /** Deal offer ids a campaign promotes, including every branch row of a deal. */
  private async dealOfferIds(
    campaigns: SponsoredCampaign[],
  ): Promise<Map<string, string[]>> {
    const byCampaign = new Map<string, string[]>();
    const assetIds = [
      ...new Set(
        campaigns.flatMap((c) =>
          (c.assets ?? []).filter((a) => a.type === 'deal').map((a) => a.id),
        ),
      ),
    ];
    if (assetIds.length === 0) return byCampaign;
    const rows = await this.dataSource.query<
      { assetId: string; offerId: string }[]
    >(
      `SELECT a."id" AS "assetId", o."id" AS "offerId"
       FROM "catalogue_offers" a
       JOIN "catalogue_offers" o
         ON o."id" = a."id" OR (a."dealGroupId" IS NOT NULL AND o."dealGroupId" = a."dealGroupId")
       WHERE a."id" = ANY($1::uuid[])`,
      [assetIds],
    );
    for (const campaign of campaigns) {
      const ids = (campaign.assets ?? [])
        .filter((asset) => asset.type === 'deal')
        .flatMap((asset) =>
          rows
            .filter((row) => row.assetId === asset.id)
            .map((row) => row.offerId),
        );
      byCampaign.set(campaign.id, [...new Set(ids)]);
    }
    return byCampaign;
  }

  /** Claims, redemptions and revenue of promoted deals during each campaign's run. */
  private async outcomes(campaigns: SponsoredCampaign[]) {
    const offers = await this.dealOfferIds(campaigns);
    let claims = 0;
    let redemptions = 0;
    let revenue = 0;
    for (const campaign of campaigns) {
      const ids = offers.get(campaign.id) ?? [];
      if (!ids.length || !campaign.startDate) continue;
      const until =
        campaign.endDate && campaign.endDate < new Date()
          ? campaign.endDate
          : new Date();
      const [row] = await this.dataSource.query<
        { claims: number; redemptions: number; revenue: string }[]
      >(
        `SELECT COUNT(*) FILTER (WHERE c."status" <> 'expired')::int AS claims,
                COUNT(*) FILTER (WHERE c."status" = 'redeemed')::int AS redemptions,
                COALESCE(SUM(o."calculatedPrice") FILTER (WHERE c."status" = 'redeemed'), 0) AS revenue
         FROM "catalogue_offer_claims" c JOIN "catalogue_offers" o ON o."id" = c."offerId"
         WHERE c."offerId" = ANY($1::uuid[]) AND c."createdAt" BETWEEN $2 AND $3 AND c."deletedAt" IS NULL`,
        [ids, campaign.startDate, until],
      );
      claims += num(row?.claims);
      redemptions += num(row?.redemptions);
      revenue += num(row?.revenue);
    }
    return { claims, redemptions, revenue: round2(revenue) };
  }

  async stats(kind: SponsoredCampaignKind, id: string, businessId: string) {
    const campaign = await this.findOwned(kind, id, businessId);
    const budget = num(campaign.budget);
    const spent = num(campaign.spent);
    const offerIds =
      (await this.dealOfferIds([campaign])).get(campaign.id) ?? [];
    const outcome = await this.outcomes([campaign]);
    const from = campaign.startDate;
    const until =
      campaign.endDate && campaign.endDate < new Date()
        ? campaign.endDate
        : new Date();

    let saves = 0;
    let rhythm: { hour: number; claims: number }[] = [];
    let byBranch: { branchId: string; name: string; claims: number }[] = [];
    let series: { date: string; spend: number; claims: number }[] = [];
    if (from) {
      if (offerIds.length) {
        const [saveRow] = await this.dataSource.query<{ n: number }[]>(
          `SELECT COUNT(*)::int AS n FROM "deal_saves"
           WHERE "offerId" = ANY($1::uuid[]) AND "createdAt" BETWEEN $2 AND $3`,
          [offerIds, from, until],
        );
        saves = num(saveRow?.n);
        rhythm = (
          await this.dataSource.query<{ hour: number; claims: number }[]>(
            `SELECT EXTRACT(HOUR FROM (c."createdAt" + interval '1 hour'))::int AS hour, COUNT(*)::int AS claims
             FROM "catalogue_offer_claims" c
             WHERE c."offerId" = ANY($1::uuid[]) AND c."createdAt" BETWEEN $2 AND $3
             GROUP BY 1 ORDER BY 1`,
            [offerIds, from, until],
          )
        ).map((row) => ({ hour: num(row.hour), claims: num(row.claims) }));
        byBranch = (
          await this.dataSource.query<
            { branchId: string; name: string; claims: number }[]
          >(
            `SELECT o."branchId" AS "branchId", b."name" AS name, COUNT(*)::int AS claims
             FROM "catalogue_offer_claims" c
             JOIN "catalogue_offers" o ON o."id" = c."offerId"
             JOIN "branches" b ON b."id" = o."branchId"
             WHERE c."offerId" = ANY($1::uuid[]) AND c."createdAt" BETWEEN $2 AND $3
             GROUP BY o."branchId", b."name" ORDER BY claims DESC`,
            [offerIds, from, until],
          )
        ).map((row) => ({ ...row, claims: num(row.claims) }));
      }
      const spendRows = await this.dataSource.query<
        { date: string; spend: string }[]
      >(
        `SELECT to_char(("createdAt" + interval '1 hour')::date, 'YYYY-MM-DD') AS date, SUM("amount") AS spend
         FROM "ad_wallet_transactions"
         WHERE "campaignId" = $1 AND "type" = 'spend'
         GROUP BY 1 ORDER BY 1`,
        [campaign.id],
      );
      const claimRows = offerIds.length
        ? await this.dataSource.query<{ date: string; claims: number }[]>(
            `SELECT to_char((c."createdAt" + interval '1 hour')::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS claims
             FROM "catalogue_offer_claims" c
             WHERE c."offerId" = ANY($1::uuid[]) AND c."createdAt" BETWEEN $2 AND $3
             GROUP BY 1 ORDER BY 1`,
            [offerIds, from, until],
          )
        : [];
      const dates = [
        ...new Set([
          ...spendRows.map((r) => r.date),
          ...claimRows.map((r) => r.date),
        ]),
      ].sort();
      series = dates.map((date) => ({
        date,
        spend: round2(num(spendRows.find((r) => r.date === date)?.spend)),
        claims: num(claimRows.find((r) => r.date === date)?.claims),
      }));
    }

    return {
      id: campaign.id,
      kind: campaign.kind,
      status: campaign.status,
      kpis: {
        budget: round2(budget),
        spent: round2(spent),
        left: round2(Math.max(0, budget - spent)),
        percentConsumed: budget > 0 ? Math.round((spent / budget) * 100) : 0,
        redemptions: outcome.redemptions,
        grossRevenue: outcome.revenue,
        reach: campaign.impressions ?? 0,
        returnOnSpend: spent > 0 ? round2(outcome.revenue / spent) : null,
      },
      funnel: [
        {
          id: 'impressions',
          label: 'Impressions',
          value: campaign.impressions ?? 0,
        },
        { id: 'taps', label: 'Taps & views', value: campaign.clicks ?? 0 },
        { id: 'saves', label: 'Saves', value: saves },
        { id: 'claims', label: 'Claims', value: outcome.claims },
        { id: 'redeemed', label: 'Redeemed', value: outcome.redemptions },
      ],
      rhythm,
      byBranch,
      series,
    };
  }

  // ─── helpers for the wizards ──────────────────────────────────────────

  options(kind: SponsoredCampaignKind) {
    const common = {
      radiusKm: RADIUS_OPTIONS_KM,
      placements: PLACEMENTS,
      daypartWindows: DAYPART_WINDOWS,
      durationsDays: DURATION_OPTIONS_DAYS,
      budgetModes: ['total', 'daily'],
      minBudget: MIN_CAMPAIGN_BUDGET,
    };
    return kind === SponsoredCampaignKind.BOOST
      ? {
          ...common,
          goals: BOOST_GOALS,
          audienceScopes: AUDIENCE_SCOPES,
          budgetTiers: BOOST_BUDGET_TIERS,
        }
      : {
          ...common,
          objectives: PROMOTION_OBJECTIVES,
          strategies: PROMOTION_STRATEGIES,
          cohorts: PROMOTION_COHORTS,
          budgetTiers: PROMOTION_BUDGET_TIERS,
        };
  }

  /** Reach and claims estimate for a budget (see FORECAST for the model). */
  forecast(dto: ForecastDto) {
    const durationDays = dto.durationDays ?? 7;
    const budget =
      dto.budget ??
      (dto.dailyBudget !== undefined ? dto.dailyBudget * durationDays : 0);
    const radius = dto.radiusKm ?? 3;
    const cap =
      FORECAST.populationByRadiusKm[radius] ??
      Math.round(FORECAST.populationByRadiusKm[10] * Math.min(1, radius / 10));
    const reachMin = Math.min(
      cap,
      Math.round(budget * FORECAST.reachPerNairaMin),
    );
    const reachMax = Math.min(
      cap,
      Math.round(budget * FORECAST.reachPerNairaMax),
    );
    return {
      budget: round2(budget),
      durationDays,
      dailyPace: round2(budget / durationDays),
      radiusKm: radius,
      reachMin,
      reachMax,
      claimsMin: Math.round(reachMin * FORECAST.claimRateMin),
      claimsMax: Math.round(reachMax * FORECAST.claimRateMax),
      audienceCapped: budget * FORECAST.reachPerNairaMax > cap,
      isEstimate: true,
    };
  }

  /** Listings a campaign can feature, for the content step. */
  async eligibleAssets(businessId: string) {
    const deals = await this.dataSource.query<
      {
        id: string;
        title: string;
        image: string | null;
        price: string;
        wasPrice: string | null;
        claims: number;
      }[]
    >(
      `SELECT DISTINCT ON (COALESCE(o."dealGroupId", o."id"))
              o."id" AS id, o."name" AS title, o."mainImage" AS image, o."calculatedPrice" AS price,
              (SELECT SUM(ci."price") FROM "catalogue_offer_items" oi JOIN "catalogue_items" ci ON ci."id" = oi."itemId" WHERE oi."offerId" = o."id") AS "wasPrice",
              (SELECT COUNT(*)::int FROM "catalogue_offer_claims" c WHERE c."offerId" = o."id") AS claims
       FROM "catalogue_offers" o
       WHERE o."businessId" = $1 AND o."status" = 'active' AND o."deletedAt" IS NULL
         AND (o."endDate" IS NULL OR o."endDate" > now())
       ORDER BY COALESCE(o."dealGroupId", o."id"), o."createdAt" DESC`,
      [businessId],
    );
    const items = await this.dataSource.query<
      {
        id: string;
        title: string;
        image: string | null;
        price: string;
        wasPrice: string | null;
        type: string;
      }[]
    >(
      `SELECT ci."id" AS id, ci."name" AS title, ci."mainImage" AS image, ci."price" AS price,
              ci."compareAtPrice" AS "wasPrice", ci."itemType" AS type
       FROM "catalogue_items" ci
       WHERE ci."businessId" = $1 AND ci."status" = 'active' AND ci."isSuspended" = false AND ci."deletedAt" IS NULL
       ORDER BY ci."createdAt" DESC LIMIT 100`,
      [businessId],
    );
    const [business] = await this.dataSource.query<
      { id: string; name: string; logo: string | null }[]
    >(
      `SELECT "id", "name", "logoUrl" AS logo FROM "businesses" WHERE "id" = $1`,
      [businessId],
    );
    return [
      ...deals.map((deal) => ({
        type: 'deal' as const,
        id: deal.id,
        title: deal.title,
        image: deal.image,
        price: num(deal.price),
        wasPrice: deal.wasPrice === null ? null : num(deal.wasPrice),
        priorClaims: num(deal.claims),
      })),
      ...items.map((item) => ({
        type: item.type === 'service' ? 'service' : 'product',
        id: item.id,
        title: item.title,
        image: item.image,
        price: num(item.price),
        wasPrice: item.wasPrice === null ? null : num(item.wasPrice),
        priorClaims: null,
      })),
      ...(business
        ? [
            {
              type: 'profile' as const,
              id: business.id,
              title: business.name,
              image: business.logo,
              price: null,
              wasPrice: null,
              priorClaims: null,
            },
          ]
        : []),
    ];
  }
}
