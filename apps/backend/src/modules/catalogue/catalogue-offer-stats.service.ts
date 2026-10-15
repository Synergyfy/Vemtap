import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
  OfferClaimLimitPeriod,
} from './entities/catalogue-offer.entity';
import {
  CatalogueOfferClaim,
  CatalogueOfferClaimStatus,
} from './entities/catalogue-offer-claim.entity';
import { claimLimitWindowStart } from './utils/offer-rules.utils';
import { OfferLedgerQueryDto, OfferLedgerStatus } from './dto/offer-ledger.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Default chart range when the caller gives none. */
const DEFAULT_RANGE_DAYS = 30;
/** Longest range a daily series is built for. */
const MAX_RANGE_DAYS = 366;

export interface OfferStatsRange {
  from?: string;
  to?: string;
}

export interface OfferSeriesPoint {
  /** Lagos calendar day, `YYYY-MM-DD`. */
  date: string;
  claims: number;
  redeemed: number;
}

export interface OfferBranchStats {
  offerId: string;
  branchId: string;
  branchName: string | null;
  status: CatalogueOfferStatus;
  claims: number;
  redeemed: number;
  revenue: number;
}

export interface OfferStats {
  dealGroupId: string | null;
  offerIds: string[];
  name: string;
  status: CatalogueOfferStatus;
  views: number;
  likes: number;
  saves: number;
  /** Claims holding a voucher (claimed or redeemed) — what `quantity` counts. */
  claims: number;
  redeemed: number;
  /** Expired claims, including claimed ones past their expiry date. */
  expired: number;
  /** Claimed, not redeemed, not past expiry. */
  activeUnclaimed: number;
  /** redeemed / claims, 0–1. */
  redemptionRate: number;
  /** Sum of the deal price over redeemed claims. */
  revenue: number;
  /** Original price minus deal price, over redeemed claims. */
  discountGiven: number;
  quantity: number | null;
  remaining: number | null;
  daysLeft: number | null;
  range: { from: string; to: string };
  series: OfferSeriesPoint[];
  byBranch: OfferBranchStats[];
}

export interface OfferLedgerRow {
  id: string;
  claimCode: string;
  status: OfferLedgerStatus;
  customerName: string;
  /** Masked email or phone; never the full value. */
  contact: string | null;
  dealName: string;
  dealGroupId: string;
  offerId: string;
  branchId: string;
  branchName: string | null;
  /** The deal price the customer pays (the offer's `calculatedPrice`). */
  amount: number;
  /** Item prices minus the deal price, floored at 0. */
  discountGiven: number;
  claimedAt: string;
  redeemedAt: string | null;
  expiresAt: string | null;
  /** Redemption time when redeemed, otherwise claim time. Rows sort on it. */
  activityAt: string;
}

export interface OfferLedgerPage {
  data: OfferLedgerRow[];
  total: number;
  page: number;
  limit: number;
  /** Over every row matching branch/deal/date, regardless of `status`. */
  totals: {
    claims: number;
    redeemed: number;
    expired: number;
    netRevenue: number;
    discountGiven: number;
  };
}

/** When a ledger row happened: redemption if redeemed, otherwise the claim. */
const LEDGER_ACTIVITY_SQL =
  'COALESCE("claim"."redeemedAt", "claim"."createdAt")';
const LEDGER_EXPIRED_SQL =
  '("claim"."status" = :expiredStatus OR ("claim"."status" = :claimedStatus AND "claim"."expiresAt" < :now))';
const LEDGER_STATUS_SQL: Record<OfferLedgerStatus, string> = {
  [OfferLedgerStatus.REDEEMED]: '"claim"."status" = :redeemedStatus',
  [OfferLedgerStatus.EXPIRED]: LEDGER_EXPIRED_SQL,
  [OfferLedgerStatus.CLAIMED]:
    '("claim"."status" = :claimedStatus AND ("claim"."expiresAt" IS NULL OR "claim"."expiresAt" >= :now))',
};
/** Sum of the offer's item prices — what the customer would have paid. */
const LEDGER_ORIGINAL_PRICE_SQL = `(SELECT COALESCE(SUM("ledgerItem"."price"), 0) FROM "catalogue_offer_items" "ledgerLink" JOIN "catalogue_items" "ledgerItem" ON "ledgerItem"."id" = "ledgerLink"."itemId" WHERE "ledgerLink"."offerId" = "offer"."id")`;

/** A claimed voucher past `expiresAt` is shown as expired. */
export function effectiveLedgerStatus(
  status: CatalogueOfferClaimStatus,
  expiresAt: Date | null,
  now: Date,
): OfferLedgerStatus {
  if (status === CatalogueOfferClaimStatus.REDEEMED) {
    return OfferLedgerStatus.REDEEMED;
  }
  if (status === CatalogueOfferClaimStatus.EXPIRED) {
    return OfferLedgerStatus.EXPIRED;
  }
  return expiresAt && expiresAt < now
    ? OfferLedgerStatus.EXPIRED
    : OfferLedgerStatus.CLAIMED;
}

/** "Ada O." — enough for staff to recognise a customer, no more. */
export function ledgerCustomerName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const first = (firstName ?? '').trim();
  const initial = (lastName ?? '').trim().charAt(0).toUpperCase();
  if (!first && !initial) return 'Customer';
  return initial ? `${first} ${initial}.`.trim() : first;
}

/** `ad***@mail.com` or `•••• 5678`; the ledger never shows full contact details. */
export function maskLedgerContact(
  email?: string | null,
  phone?: string | null,
): string | null {
  const trimmedEmail = (email ?? '').trim();
  const at = trimmedEmail.indexOf('@');
  if (at > 0) {
    return `${trimmedEmail.slice(0, Math.min(2, at))}***${trimmedEmail.slice(at)}`;
  }
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length >= 4 ? `•••• ${digits.slice(-4)}` : null;
}

/** `YYYY-MM-DD` of the Lagos calendar day `at` falls on. */
function lagosDay(at: Date): string {
  return new Date(at.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Read-side numbers for the deal performance screen and the deals hub
 * header. Everything is derived from existing rows: offer counters, claims
 * (`createdAt`, `redeemedAt`, `status`, `expiresAt`) and `deal_saves`.
 */
@Injectable()
export class CatalogueOfferStatsService {
  constructor(
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(CatalogueOfferClaim)
    private readonly claimRepository: Repository<CatalogueOfferClaim>,
  ) {}

  /** Stats for one offer (one branch). */
  async getOfferStats(
    id: string,
    businessId: string,
    range: OfferStatsRange = {},
  ) {
    const offer = await this.offerRepository.findOne({
      where: { id, businessId },
      relations: ['items', 'branch'],
    });
    if (!offer) throw new NotFoundException('Deal not found');
    return this.build([offer], range);
  }

  /** Stats for every branch of a deal, summed, with a per-branch breakdown. */
  async getGroupStats(
    dealGroupId: string,
    businessId: string,
    range: OfferStatsRange = {},
  ) {
    const offers = await this.offerRepository.find({
      where: [
        { dealGroupId, businessId },
        { id: dealGroupId, businessId },
      ],
      relations: ['items', 'branch'],
    });
    if (offers.length === 0) throw new NotFoundException('Deal not found');
    return this.build(offers, range);
  }

  /**
   * Header numbers for the business's deals, optionally for one branch:
   * live deals, today's claims and redemptions, and the last 30 days of
   * redeemed revenue and discount given.
   */
  async getSummary(businessId: string, branchId?: string) {
    const offers = await this.offerRepository.find({
      where: { businessId, ...(branchId && { branchId }) },
      relations: ['items'],
    });
    const offerIds = offers.map((offer) => offer.id);
    const now = new Date();
    const todayStart = claimLimitWindowStart(OfferClaimLimitPeriod.DAY, now)!;
    const since30 = new Date(now.getTime() - 30 * DAY_MS);

    const claims = offerIds.length
      ? await this.claimRepository.find({
          where: { offerId: In(offerIds) },
          select: ['id', 'offerId', 'status', 'createdAt', 'redeemedAt'],
        })
      : [];
    const byId = new Map(offers.map((offer) => [offer.id, offer]));

    let claimsToday = 0;
    let redeemedToday = 0;
    let netRevenue30d = 0;
    let discountGiven30d = 0;
    for (const claim of claims) {
      if (claim.createdAt >= todayStart) claimsToday += 1;
      if (
        claim.status !== CatalogueOfferClaimStatus.REDEEMED ||
        !claim.redeemedAt
      ) {
        continue;
      }
      if (claim.redeemedAt >= todayStart) redeemedToday += 1;
      if (claim.redeemedAt >= since30) {
        const offer = byId.get(claim.offerId);
        if (!offer) continue;
        netRevenue30d += Number(offer.calculatedPrice) || 0;
        discountGiven30d += this.discountPerClaim(offer);
      }
    }

    const live = offers.filter(
      (offer) =>
        offer.status === CatalogueOfferStatus.ACTIVE &&
        (!offer.endDate || new Date(offer.endDate) > now),
    );
    return {
      branchId: branchId ?? null,
      activeDeals: new Set(live.map((offer) => offer.dealGroupId ?? offer.id))
        .size,
      activeOffers: live.length,
      claimsToday,
      redeemedToday,
      netRevenue30d: round2(netRevenue30d),
      discountGiven30d: round2(discountGiven30d),
    };
  }

  /**
   * The owner's deal redemption ledger: one row per claim, newest activity
   * first, filtered by effective status, branch, deal and date. Totals cover
   * every row the branch/deal/date filters match, so the summary stays put
   * while the owner flips between status tabs.
   */
  async getLedger(
    businessId: string,
    query: OfferLedgerQueryDto = {},
  ): Promise<OfferLedgerPage> {
    const now = new Date();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const scoped = (select: boolean) => {
      const qb = this.claimRepository.createQueryBuilder('claim');
      if (select) {
        qb.innerJoinAndSelect('claim.offer', 'offer').leftJoinAndSelect(
          'offer.branch',
          'branch',
        );
      } else {
        qb.innerJoin('claim.offer', 'offer');
      }
      qb.where('offer.businessId = :businessId', { businessId }).setParameters({
        now,
        claimedStatus: CatalogueOfferClaimStatus.CLAIMED,
        redeemedStatus: CatalogueOfferClaimStatus.REDEEMED,
        expiredStatus: CatalogueOfferClaimStatus.EXPIRED,
      });
      if (query.branchId) {
        qb.andWhere('offer.branchId = :branchId', { branchId: query.branchId });
      }
      if (query.dealGroupId) {
        qb.andWhere(
          '(offer.dealGroupId = :dealGroupId OR offer.id = :dealGroupId)',
          {
            dealGroupId: query.dealGroupId,
          },
        );
      }
      if (query.from) {
        qb.andWhere(`${LEDGER_ACTIVITY_SQL} >= :from`, {
          from: new Date(query.from),
        });
      }
      if (query.to) {
        qb.andWhere(`${LEDGER_ACTIVITY_SQL} <= :to`, {
          to: new Date(query.to),
        });
      }
      return qb;
    };

    const filtered = (select: boolean) => {
      const qb = scoped(select);
      if (query.status) qb.andWhere(LEDGER_STATUS_SQL[query.status]);
      return qb;
    };

    const [claims, total, rawTotals] = await Promise.all([
      filtered(true)
        .orderBy(LEDGER_ACTIVITY_SQL, 'DESC')
        .addOrderBy('claim.id', 'DESC')
        .offset((page - 1) * limit)
        .limit(limit)
        .getMany(),
      filtered(false).getCount(),
      scoped(false)
        .select('COUNT(*)', 'claims')
        .addSelect(
          `COUNT(*) FILTER (WHERE ${LEDGER_STATUS_SQL[OfferLedgerStatus.REDEEMED]})`,
          'redeemed',
        )
        .addSelect(`COUNT(*) FILTER (WHERE ${LEDGER_EXPIRED_SQL})`, 'expired')
        .addSelect(
          `COALESCE(SUM("offer"."calculatedPrice") FILTER (WHERE ${LEDGER_STATUS_SQL[OfferLedgerStatus.REDEEMED]}), 0)`,
          'netRevenue',
        )
        .addSelect(
          `COALESCE(SUM(GREATEST(0, ${LEDGER_ORIGINAL_PRICE_SQL} - "offer"."calculatedPrice")) FILTER (WHERE ${LEDGER_STATUS_SQL[OfferLedgerStatus.REDEEMED]}), 0)`,
          'discountGiven',
        )
        .getRawOne<Record<string, string | number | null>>(),
    ]);

    // Item prices for just this page's offers, in one query.
    const offerIds = [...new Set(claims.map((claim) => claim.offerId))];
    const offersWithItems = offerIds.length
      ? await this.offerRepository.find({
          where: { id: In(offerIds) },
          relations: ['items'],
        })
      : [];
    const originalPriceOf = new Map(
      offersWithItems.map((offer) => [
        offer.id,
        (offer.items ?? []).reduce(
          (sum, item) => sum + (Number(item.price) || 0),
          0,
        ),
      ]),
    );

    const data = claims.map((claim): OfferLedgerRow => {
      const offer = claim.offer;
      const amount = Number(offer.calculatedPrice) || 0;
      const original = originalPriceOf.get(offer.id) ?? 0;
      return {
        id: claim.id,
        claimCode: claim.claimCode,
        status: effectiveLedgerStatus(claim.status, claim.expiresAt, now),
        customerName: ledgerCustomerName(claim.firstName, claim.lastName),
        contact: maskLedgerContact(claim.email, claim.phone),
        dealName: offer.name,
        dealGroupId: offer.dealGroupId ?? offer.id,
        offerId: offer.id,
        branchId: offer.branchId,
        branchName: offer.branch?.name ?? null,
        amount: round2(amount),
        discountGiven: round2(Math.max(0, original - amount)),
        claimedAt: claim.createdAt.toISOString(),
        redeemedAt: claim.redeemedAt?.toISOString() ?? null,
        expiresAt: claim.expiresAt?.toISOString() ?? null,
        activityAt: (claim.redeemedAt ?? claim.createdAt).toISOString(),
      };
    });

    const count = (key: string) => Number(rawTotals?.[key] ?? 0) || 0;
    return {
      data,
      total,
      page,
      limit,
      totals: {
        claims: count('claims'),
        redeemed: count('redeemed'),
        expired: count('expired'),
        netRevenue: round2(count('netRevenue')),
        discountGiven: round2(count('discountGiven')),
      },
    };
  }

  private discountPerClaim(offer: CatalogueOffer): number {
    const original = (offer.items ?? []).reduce(
      (sum, item) => sum + Number(item.price || 0),
      0,
    );
    return Math.max(0, original - Number(offer.calculatedPrice || 0));
  }

  private resolveRange(range: OfferStatsRange): { from: Date; to: Date } {
    const to = range.to ? new Date(range.to) : new Date();
    const from = range.from
      ? new Date(range.from)
      : new Date(to.getTime() - (DEFAULT_RANGE_DAYS - 1) * DAY_MS);
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from > to
    ) {
      return this.resolveRange({});
    }
    const span = (to.getTime() - from.getTime()) / DAY_MS;
    return span > MAX_RANGE_DAYS
      ? { from: new Date(to.getTime() - MAX_RANGE_DAYS * DAY_MS), to }
      : { from, to };
  }

  private async build(
    offers: CatalogueOffer[],
    rangeInput: OfferStatsRange,
  ): Promise<OfferStats> {
    const offerIds = offers.map((offer) => offer.id);
    const { from, to } = this.resolveRange(rangeInput);
    const now = new Date();

    const [claims, savesRaw] = await Promise.all([
      this.claimRepository.find({
        where: { offerId: In(offerIds) },
        select: [
          'id',
          'offerId',
          'status',
          'createdAt',
          'redeemedAt',
          'expiresAt',
        ],
      }),
      this.claimRepository.manager.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS "count" FROM "deal_saves" WHERE "offerId" = ANY($1)`,
        [offerIds],
      ),
    ]);

    const perOffer = new Map(
      offers.map((offer) => [offer.id, { claims: 0, redeemed: 0 }]),
    );
    let redeemed = 0;
    let expired = 0;
    let activeUnclaimed = 0;
    let revenue = 0;
    let discountGiven = 0;

    // Daily buckets across the range, in Lagos days.
    const series = new Map<string, OfferSeriesPoint>();
    for (let t = from.getTime(); t <= to.getTime() + DAY_MS - 1; t += DAY_MS) {
      const date = lagosDay(new Date(t));
      if (!series.has(date)) series.set(date, { date, claims: 0, redeemed: 0 });
      if (date === lagosDay(to)) break;
    }
    const byId = new Map(offers.map((offer) => [offer.id, offer]));

    for (const claim of claims) {
      const offer = byId.get(claim.offerId)!;
      const tally = perOffer.get(claim.offerId)!;
      const isRedeemed = claim.status === CatalogueOfferClaimStatus.REDEEMED;
      const lapsed =
        claim.status === CatalogueOfferClaimStatus.CLAIMED &&
        Boolean(claim.expiresAt) &&
        new Date(claim.expiresAt) <= now;

      // Same rule as the voucher limit: claimed or redeemed holds a voucher.
      if (claim.status !== CatalogueOfferClaimStatus.EXPIRED) tally.claims += 1;
      if (claim.status === CatalogueOfferClaimStatus.EXPIRED || lapsed) {
        expired += 1;
      }
      if (isRedeemed) {
        tally.redeemed += 1;
        redeemed += 1;
        revenue += Number(offer.calculatedPrice) || 0;
        discountGiven += this.discountPerClaim(offer);
      } else if (
        claim.status === CatalogueOfferClaimStatus.CLAIMED &&
        !lapsed
      ) {
        activeUnclaimed += 1;
      }

      const createdDay = series.get(lagosDay(new Date(claim.createdAt)));
      if (createdDay) createdDay.claims += 1;
      if (isRedeemed && claim.redeemedAt) {
        const redeemedDay = series.get(lagosDay(new Date(claim.redeemedAt)));
        if (redeemedDay) redeemedDay.redeemed += 1;
      }
    }

    const totalClaims = [...perOffer.values()].reduce(
      (sum, t) => sum + t.claims,
      0,
    );
    const quantities = offers.map((offer) => offer.quantity);
    const quantity = quantities.every((q) => q !== null && q !== undefined)
      ? quantities.reduce<number>((sum, q) => sum + Number(q), 0)
      : null;
    const endDates = offers
      .map((offer) => offer.endDate)
      .filter((end): end is Date => Boolean(end))
      .map((end) => new Date(end).getTime());
    const daysLeft = endDates.length
      ? Math.max(0, Math.ceil((Math.max(...endDates) - now.getTime()) / DAY_MS))
      : null;
    const first = offers[0];

    return {
      dealGroupId: first.dealGroupId ?? (offers.length === 1 ? null : first.id),
      offerIds,
      name: first.name,
      status: offers.some(
        (offer) => offer.status === CatalogueOfferStatus.ACTIVE,
      )
        ? CatalogueOfferStatus.ACTIVE
        : CatalogueOfferStatus.INACTIVE,
      views: offers.reduce((sum, offer) => sum + (offer.views ?? 0), 0),
      likes: offers.reduce((sum, offer) => sum + (offer.likesCount ?? 0), 0),
      saves: Number(savesRaw?.[0]?.count ?? 0),
      claims: totalClaims,
      redeemed,
      expired,
      activeUnclaimed,
      redemptionRate: totalClaims ? round2(redeemed / totalClaims, 4) : 0,
      revenue: round2(revenue),
      discountGiven: round2(discountGiven),
      quantity,
      remaining: quantity === null ? null : Math.max(0, quantity - totalClaims),
      daysLeft,
      range: { from: from.toISOString(), to: to.toISOString() },
      series: [...series.values()],
      byBranch: offers.map((offer) => {
        const tally = perOffer.get(offer.id)!;
        return {
          offerId: offer.id,
          branchId: offer.branchId,
          branchName: offer.branch?.name ?? null,
          status: offer.status,
          claims: tally.claims,
          redeemed: tally.redeemed,
          revenue: round2(
            tally.redeemed * (Number(offer.calculatedPrice) || 0),
          ),
        };
      }),
    };
  }
}

function round2(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
