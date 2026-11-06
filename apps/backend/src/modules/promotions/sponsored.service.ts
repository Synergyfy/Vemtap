import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  SponsoredCampaign,
  SponsoredCampaignStatus,
} from '../discovery/entities/sponsored-campaign.entity';
import { SponsoredEventType } from '../discovery/entities/sponsored-campaign-event.entity';
import { CatalogueOfferService } from '../catalogue/catalogue-offer.service';
import { DAYPART_WINDOWS, WALKIN_RADIUS_KM } from './promotions.constants';

const num = (value: unknown) => Number(value ?? 0) || 0;
/** Campaign schedules and dayparts are in Lagos time (UTC+1), as `stats`. */
const WAT_OFFSET_MS = 60 * 60 * 1000;
const DEFAULT_RADIUS_KM = 3;
const HOUR_MS = 60 * 60 * 1000;

export type SponsoredPlacement = 'home' | 'feed';

interface CampaignOffer {
  offerId: string;
  lat: number | null;
  lng: number | null;
}

interface Area {
  id: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface SponsoredEventInput {
  campaignId: string;
  offerId: string;
  type: SponsoredEventType;
}

function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Puts live boosts and promotion campaigns in front of consumers (Home
 * "Featured" rail = `home`, Featured Deals page = `feed`) and records their
 * views and taps.
 */
@Injectable()
export class SponsoredService {
  constructor(
    @InjectRepository(SponsoredCampaign)
    private readonly campaignRepo: Repository<SponsoredCampaign>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly offers: CatalogueOfferService,
  ) {}

  /** Whether the campaign's weekdays and daypart windows include `now`. */
  isInSchedule(campaign: SponsoredCampaign, now: Date): boolean {
    const local = new Date(now.getTime() + WAT_OFFSET_MS);
    const schedule = campaign.schedule;
    if (
      schedule?.weekdays?.length &&
      !schedule.weekdays.includes(local.getUTCDay())
    ) {
      return false;
    }
    if (!schedule?.dayparting || !schedule.windows?.length) return true;
    const at = local.getUTCHours() * 60 + local.getUTCMinutes();
    return schedule.windows.some((id) => {
      const window = DAYPART_WINDOWS.find((candidate) => candidate.id === id);
      if (!window) return false;
      const start = minutes(window.start);
      const end = minutes(window.end);
      // A window past midnight (late night) wraps round.
      return start <= end ? at >= start && at < end : at >= start || at < end;
    });
  }

  /** Every public branch row of each campaign's promoted deals, with its location. */
  private async campaignOffers(
    campaigns: SponsoredCampaign[],
  ): Promise<Map<string, CampaignOffer[]>> {
    const byCampaign = new Map<string, CampaignOffer[]>();
    const assetIds = [
      ...new Set(
        campaigns.flatMap((c) =>
          (c.assets ?? []).filter((a) => a.type === 'deal').map((a) => a.id),
        ),
      ),
    ];
    if (!assetIds.length) return byCampaign;
    const rows = await this.dataSource.query<
      {
        assetId: string;
        offerId: string;
        lat: string | null;
        lng: string | null;
      }[]
    >(
      `SELECT a."id" AS "assetId", o."id" AS "offerId", b."latitude" AS lat, b."longitude" AS lng
       FROM "catalogue_offers" a
       JOIN "catalogue_offers" o
         ON o."id" = a."id" OR (a."dealGroupId" IS NOT NULL AND o."dealGroupId" = a."dealGroupId")
       LEFT JOIN "branches" b ON b."id" = o."branchId"
       WHERE a."id" = ANY($1::uuid[]) AND o."deletedAt" IS NULL`,
      [assetIds],
    );
    for (const campaign of campaigns) {
      const ids = new Set(
        (campaign.assets ?? [])
          .filter((a) => a.type === 'deal')
          .map((a) => a.id),
      );
      const seen = new Set<string>();
      byCampaign.set(
        campaign.id,
        rows
          .filter(
            (row) =>
              ids.has(row.assetId) &&
              !seen.has(row.offerId) &&
              seen.add(row.offerId),
          )
          .map((row) => ({
            offerId: row.offerId,
            lat: row.lat === null ? null : Number(row.lat),
            lng: row.lng === null ? null : Number(row.lng),
          })),
      );
    }
    return byCampaign;
  }

  /** Active districts and clusters by id, with their centre and radius. */
  private async areas(
    campaigns: SponsoredCampaign[],
  ): Promise<Map<string, Area>> {
    const ids = [
      ...new Set(campaigns.flatMap((c) => c.audience?.clusterIds ?? [])),
    ];
    if (!ids.length) return new Map();
    const rows = await this.dataSource.query<
      { id: string; lat: string; lng: string; radiusMeters: number }[]
    >(
      `SELECT "id", "latitude" AS lat, "longitude" AS lng, "radiusMeters"
       FROM "clusters"
       WHERE "id" = ANY($1::uuid[]) AND "isActive" = true AND "deletedAt" IS NULL
         AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL`,
      [ids],
    );
    return new Map(
      rows.map((row) => [
        row.id,
        {
          id: row.id,
          lat: Number(row.lat),
          lng: Number(row.lng),
          radiusKm: num(row.radiusMeters) / 1000,
        },
      ]),
    );
  }

  /**
   * Which of `businessIds` the customer has used: a claim, visit, order or POS
   * sale — the same activity that makes someone a customer in segments.
   */
  private async customerOf(
    customerId: string,
    businessIds: string[],
  ): Promise<Set<string>> {
    if (!businessIds.length) return new Set();
    const rows = await this.dataSource.query<{ businessId: string }[]>(
      `SELECT ps."businessId" FROM "pos_sales" ps
       WHERE ps."customerId" = $1 AND ps."businessId" = ANY($2::uuid[])
         AND ps."deletedAt" IS NULL AND ps."status" <> 'refunded'
       UNION
       SELECT co."businessId" FROM "catalogue_orders" co
       WHERE co."customerId" = $1 AND co."businessId" = ANY($2::uuid[])
         AND co."deletedAt" IS NULL AND co."status" NOT IN ('cancelled', 'rejected', 'refunded')
       UNION
       SELECT v."businessId" FROM "visits" v
       WHERE v."customerId" = $1 AND v."businessId" = ANY($2::uuid[]) AND v."deletedAt" IS NULL
       UNION
       SELECT o."businessId" FROM "catalogue_offer_claims" c
       JOIN "catalogue_offers" o ON o."id" = c."offerId"
       WHERE c."userId" = $1 AND o."businessId" = ANY($2::uuid[]) AND c."deletedAt" IS NULL`,
      [customerId, businessIds],
    );
    return new Set(rows.map((row) => row.businessId));
  }

  /**
   * Promoted deals for one placement near the viewer: one per live campaign
   * (its nearest branch's deal), ordered by a draw weighted by the budget the
   * campaign has left.
   *
   * Where it shows: inside one of the campaign's districts / clusters when it
   * has any, otherwise within its radius of the branch. Who sees it: anyone,
   * or for a boost audience only past customers (`regulars`, signed in) or
   * only non-customers within 1 km (`walkins`). An unknown viewer location is
   * not excluded, as before.
   */
  async serve(input: {
    placement: SponsoredPlacement;
    lat?: number;
    lng?: number;
    limit?: number;
    customerId?: string | null;
    now?: Date;
    random?: () => number;
  }) {
    const now = input.now ?? new Date();
    const random = input.random ?? Math.random;
    const limit = Math.min(10, Math.max(1, input.limit ?? 3));
    const live = (
      await this.campaignRepo.find({
        where: { status: SponsoredCampaignStatus.ACTIVE },
      })
    ).filter(
      (campaign) =>
        campaign.launchedAt &&
        num(campaign.budget) - num(campaign.spent) > 0 &&
        (!campaign.placements?.length ||
          campaign.placements.includes(input.placement)) &&
        this.isInSchedule(campaign, now),
    );
    if (!live.length) return { data: [] };

    const offersByCampaign = await this.campaignOffers(live);
    const areas = await this.areas(live);
    const audienceBusinesses = [
      ...new Set(
        live
          .filter((campaign) => campaign.audience?.audienceType)
          .map((campaign) => campaign.businessId),
      ),
    ];
    const customerOf = input.customerId
      ? await this.customerOf(input.customerId, audienceBusinesses)
      : new Set<string>();
    const viewer =
      input.lat !== undefined && input.lng !== undefined
        ? { lat: input.lat, lng: input.lng }
        : null;
    const picks: {
      campaign: SponsoredCampaign;
      offerId: string;
      key: number;
    }[] = [];
    for (const campaign of live) {
      const audienceType = campaign.audience?.audienceType;
      const isCustomer = customerOf.has(campaign.businessId);
      if (audienceType === 'regulars' && !isCustomer) continue;
      if (audienceType === 'walkins' && isCustomer) continue;

      const clusterIds = campaign.audience?.clusterIds ?? [];
      if (clusterIds.length && viewer) {
        const inside = clusterIds.some((id) => {
          const area = areas.get(id);
          return area && distanceKm(viewer, area) <= area.radiusKm;
        });
        if (!inside) continue;
      }
      // Inside an area, any branch of the deal will do; otherwise the branch
      // must be within the radius. Walk-ins are always within 1 km.
      let radius = clusterIds.length
        ? Infinity
        : num(campaign.audience?.radiusKm) || DEFAULT_RADIUS_KM;
      if (audienceType === 'walkins')
        radius = Math.min(radius, WALKIN_RADIUS_KM);
      const candidates = (offersByCampaign.get(campaign.id) ?? [])
        .map((offer) => ({
          offer,
          distance:
            viewer && offer.lat !== null && offer.lng !== null
              ? distanceKm(viewer, { lat: offer.lat, lng: offer.lng })
              : viewer
                ? Infinity
                : 0,
        }))
        .filter((candidate) => candidate.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
      if (!candidates.length) continue;
      const weight = Math.max(1, num(campaign.budget) - num(campaign.spent));
      // Weighted shuffle (Efraimidis–Spirakis): bigger budgets lead more often.
      picks.push({
        campaign,
        offerId: candidates[0].offer.offerId,
        key: Math.pow(Math.max(random(), 1e-9), 1 / weight),
      });
    }
    picks.sort((a, b) => b.key - a.key);

    const chosen: typeof picks = [];
    const usedOffers = new Set<string>();
    for (const pick of picks) {
      if (usedOffers.has(pick.offerId)) continue;
      usedOffers.add(pick.offerId);
      chosen.push(pick);
      if (chosen.length >= limit) break;
    }
    const rows = await this.offers.findPublicOffersByIds(
      chosen.map((pick) => pick.offerId),
    );
    const byId = new Map(rows.map((row) => [(row as { id: string }).id, row]));
    return {
      data: chosen
        .filter((pick) => byId.has(pick.offerId))
        .map((pick) => ({
          campaignId: pick.campaign.id,
          offer: byId.get(pick.offerId),
        })),
    };
  }

  /**
   * Record views and taps. Only events for a live campaign and one of its own
   * deals count, and each viewer counts once per campaign, type and hour.
   * Returns how many were new.
   */
  async recordEvents(
    viewerKey: string,
    customerId: string | null,
    events: SponsoredEventInput[],
    now: Date = new Date(),
  ): Promise<{ recorded: number }> {
    const unique = [
      ...new Map(
        // One per campaign and type: the table counts a viewer once an hour.
        events.map((event) => [`${event.campaignId}:${event.type}`, event]),
      ).values(),
    ];
    const campaignIds = [...new Set(unique.map((event) => event.campaignId))];
    if (!campaignIds.length) return { recorded: 0 };
    const campaigns = await this.campaignRepo.find({
      where: { id: In(campaignIds), status: SponsoredCampaignStatus.ACTIVE },
    });
    const offersByCampaign = await this.campaignOffers(campaigns);
    const byId = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
    const valid = unique.filter((event) =>
      (offersByCampaign.get(event.campaignId) ?? []).some(
        (offer) => offer.offerId === event.offerId,
      ),
    );
    if (!valid.length) return { recorded: 0 };

    const hourBucket = new Date(Math.floor(now.getTime() / HOUR_MS) * HOUR_MS);
    const params: unknown[] = [];
    const values = valid.map((event) => {
      const base = params.length;
      params.push(
        event.campaignId,
        byId.get(event.campaignId)!.businessId,
        event.offerId,
        event.type,
        viewerKey,
        customerId,
        hourBucket,
      );
      return `(${Array.from({ length: 7 }, (_, i) => `$${base + i + 1}`).join(', ')})`;
    });
    const inserted = await this.dataSource.query<
      { campaignId: string; type: SponsoredEventType }[]
    >(
      `INSERT INTO "sponsored_campaign_events"
         ("campaignId", "businessId", "offerId", "type", "viewerKey", "customerId", "hourBucket")
       VALUES ${values.join(', ')}
       ON CONFLICT ("campaignId", "type", "viewerKey", "hourBucket") DO NOTHING
       RETURNING "campaignId", "type"`,
      params,
    );

    // Keep the campaign's own counters (admin console, hub list) in step.
    const counts = new Map<string, { impressions: number; clicks: number }>();
    for (const row of inserted) {
      const entry = counts.get(row.campaignId) ?? { impressions: 0, clicks: 0 };
      if (row.type === SponsoredEventType.TAP) entry.clicks += 1;
      else entry.impressions += 1;
      counts.set(row.campaignId, entry);
    }
    for (const [campaignId, entry] of counts) {
      await this.dataSource.query(
        `UPDATE "sponsored_campaigns"
         SET "impressions" = "impressions" + $2, "clicks" = "clicks" + $3
         WHERE "id" = $1`,
        [campaignId, entry.impressions, entry.clicks],
      );
    }
    return { recorded: inserted.length };
  }
}
