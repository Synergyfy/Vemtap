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
      this.claimRepository.manager.query(
        `SELECT COUNT(*)::int AS "count" FROM "deal_saves" WHERE "offerId" = ANY($1)`,
        [offerIds],
      ) as Promise<{ count: number }[]>,
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
