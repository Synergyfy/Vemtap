import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { tierLadder } from './network-tiers';
import {
  ReferralStatusFilter,
  ReferralsQueryDto,
} from './dto/referrals-query.dto';

const NOW = `(now() AT TIME ZONE 'UTC')`;
const NEARBY_METERS = 10_000;
const NEARBY_LIMIT = 3;
const RECENT_LIMIT = 5;

/** A referred business's standing, from its verification and account state. */
const STATUS_SQL = `CASE
  WHEN r."status" = 'suspended' OR r."verificationStatus" IN ('rejected', 'failed')
    THEN 'notQualified'
  WHEN r."verificationStatus" = 'verified' OR r."isVerified" THEN 'verified'
  WHEN r."verificationStatus" = 'needs_review' THEN 'pending'
  ELSE 'registered'
END`;

/** Businesses that signed up with `$1` (the referrer's code), with their status. */
const REFERRED_SQL = `
  SELECT r."id", r."name", r."logoUrl", r."uniqueCode", r."city", r."state",
         r."createdAt", r."verifiedAt", c."name" AS category,
         ${STATUS_SQL} AS status
  FROM "businesses" r
  LEFT JOIN "categories" c ON c."id" = r."categoryId"
  WHERE r."referralCode" = $1 AND r."deletedAt" IS NULL
`;

interface ReferredRow {
  id: string;
  name: string;
  logoUrl: string | null;
  uniqueCode: string;
  city: string | null;
  state: string | null;
  createdAt: string;
  verifiedAt: string | null;
  category: string | null;
  status: Exclude<ReferralStatusFilter, 'all'>;
}

const num = (value: unknown) => Number(value) || 0;

/**
 * The business's referral network: businesses it brought to VemTap through
 * its referral link, the milestone ladder their verification climbs, and the
 * VemTap merchants near its main branch.
 */
@Injectable()
export class BusinessNetworkService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private referralLink(code: string) {
    const app = (
      this.config.get<string>('VEMTAP_APP_URL') ?? 'https://vemtap.com'
    ).replace(/\/+$/, '');
    return `${app}/get-started?ref=${encodeURIComponent(code)}`;
  }

  private async business(businessId: string) {
    if (!businessId) throw new BadRequestException('Business ID is required');
    const [row] = await this.dataSource.query<
      { id: string; name: string; uniqueCode: string }[]
    >(
      `SELECT "id", "name", "uniqueCode" FROM "businesses" WHERE "id" = $1 AND "deletedAt" IS NULL`,
      [businessId],
    );
    if (!row) throw new NotFoundException('Business not found');
    return row;
  }

  private card(row: ReferredRow) {
    return {
      id: row.id,
      name: row.name,
      logoUrl: row.logoUrl,
      code: row.uniqueCode,
      category: row.category,
      location: [row.city, row.state].filter(Boolean).join(', ') || null,
      status: row.status,
      joinedAt: row.createdAt,
      verifiedAt: row.verifiedAt,
    };
  }

  async getSummary(businessId: string) {
    const business = await this.business(businessId);
    const [counts, recent, nearby] = await Promise.all([
      this.dataSource.query<Record<string, number>[]>(
        `WITH referred AS (${REFERRED_SQL})
         SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'registered')::int AS registered,
                COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
                COUNT(*) FILTER (WHERE status = 'verified')::int AS verified,
                COUNT(*) FILTER (WHERE status = 'notQualified')::int AS "notQualified",
                COUNT(*) FILTER (WHERE "createdAt" >= ${NOW} - interval '30 days')::int AS "joined30d",
                COUNT(*) FILTER (
                  WHERE "createdAt" >= ${NOW} - interval '60 days'
                    AND "createdAt" < ${NOW} - interval '30 days'
                )::int AS "joinedPrevious30d"
         FROM referred`,
        [business.uniqueCode],
      ),
      this.dataSource.query<ReferredRow[]>(
        `WITH referred AS (${REFERRED_SQL})
         SELECT * FROM referred
         ORDER BY (status = 'verified') DESC, COALESCE("verifiedAt", "createdAt") DESC
         LIMIT ${RECENT_LIMIT}`,
        [business.uniqueCode],
      ),
      this.dataSource.query<
        {
          branchId: string;
          name: string;
          businessName: string;
          category: string | null;
          distanceMeters: number;
          total: number;
        }[]
      >(
        `WITH origin AS (
           SELECT ST_SetSRID(ST_MakePoint(b."longitude", b."latitude"), 4326)::geography AS point
           FROM "branches" b
           WHERE b."businessId" = $1 AND b."deletedAt" IS NULL
             AND b."latitude" IS NOT NULL AND b."longitude" IS NOT NULL
           ORDER BY b."isMainBranch" DESC, b."createdAt"
           LIMIT 1
         ),
         near AS (
           SELECT b."id" AS "branchId", b."name", biz."name" AS "businessName",
                  c."name" AS category,
                  ST_Distance(
                    ST_SetSRID(ST_MakePoint(b."longitude", b."latitude"), 4326)::geography,
                    origin.point
                  ) AS "distanceMeters"
           FROM "branches" b
           JOIN "businesses" biz ON biz."id" = b."businessId"
           LEFT JOIN "categories" c ON c."id" = biz."categoryId"
           CROSS JOIN origin
           WHERE b."businessId" <> $1 AND b."deletedAt" IS NULL AND b."isActive" = true
             AND biz."deletedAt" IS NULL AND biz."status" = 'active'
             AND b."latitude" IS NOT NULL AND b."longitude" IS NOT NULL
             AND ST_DWithin(
               ST_SetSRID(ST_MakePoint(b."longitude", b."latitude"), 4326)::geography,
               origin.point,
               ${NEARBY_METERS}
             )
         )
         SELECT near.*, (SELECT COUNT(*)::int FROM near) AS total
         FROM near
         ORDER BY "distanceMeters"
         LIMIT ${NEARBY_LIMIT}`,
        [businessId],
      ),
    ]);

    const c = counts[0] ?? {};
    const verified = num(c.verified);
    const total = num(c.total);
    return {
      referralCode: business.uniqueCode,
      referralLink: this.referralLink(business.uniqueCode),
      counts: {
        total,
        registered: num(c.registered),
        pending: num(c.pending),
        verified,
        notQualified: num(c.notQualified),
      },
      joined: { current: num(c.joined30d), previous: num(c.joinedPrevious30d) },
      conversionRate:
        total > 0 ? Math.round((verified / total) * 100) / 100 : 0,
      ...tierLadder(verified),
      recent: recent.map((row) => this.card(row)),
      nearby: {
        total: num(nearby[0]?.total),
        radiusMeters: NEARBY_METERS,
        merchants: nearby.map((row) => ({
          branchId: row.branchId,
          name: row.name,
          businessName: row.businessName,
          category: row.category,
          distanceMeters: Math.round(num(row.distanceMeters)),
        })),
      },
    };
  }

  async getReferrals(businessId: string, query: ReferralsQueryDto) {
    const business = await this.business(businessId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = query.status ?? 'all';
    const search = query.search?.trim() ? `%${query.search.trim()}%` : null;
    const params = [business.uniqueCode, status, search];
    const where = `($2::text = 'all' OR status = $2::text) AND ($3::text IS NULL OR name ILIKE $3::text)`;

    const [rows, counts] = await Promise.all([
      this.dataSource.query<ReferredRow[]>(
        `WITH referred AS (${REFERRED_SQL})
         SELECT * FROM referred WHERE ${where}
         ORDER BY "createdAt" DESC, "id"
         LIMIT ${Number(limit)} OFFSET ${(page - 1) * Number(limit)}`,
        params,
      ),
      this.dataSource.query<Record<string, number>[]>(
        `WITH referred AS (${REFERRED_SQL})
         SELECT COUNT(*) FILTER (WHERE ${where})::int AS matching,
                COUNT(*) FILTER (WHERE $3::text IS NULL OR name ILIKE $3::text)::int AS "all",
                COUNT(*) FILTER (
                  WHERE status = 'registered' AND ($3::text IS NULL OR name ILIKE $3::text)
                )::int AS registered,
                COUNT(*) FILTER (
                  WHERE status = 'pending' AND ($3::text IS NULL OR name ILIKE $3::text)
                )::int AS pending,
                COUNT(*) FILTER (
                  WHERE status = 'verified' AND ($3::text IS NULL OR name ILIKE $3::text)
                )::int AS verified,
                COUNT(*) FILTER (
                  WHERE status = 'notQualified' AND ($3::text IS NULL OR name ILIKE $3::text)
                )::int AS "notQualified"
         FROM referred`,
        params,
      ),
    ]);

    const c = counts[0] ?? {};
    const total = num(c.matching);
    return {
      data: rows.map((row) => this.card(row)),
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
      meta: {
        statusCounts: {
          all: num(c.all),
          registered: num(c.registered),
          pending: num(c.pending),
          verified: num(c.verified),
          notQualified: num(c.notQualified),
        },
      },
    };
  }

  /** One referred business: its card, the steps it has completed, and credit. */
  async getReferral(businessId: string, referredId: string) {
    const business = await this.business(businessId);
    const [row] = await this.dataSource.query<
      (ReferredRow & {
        setupAt: string | null;
        submittedAt: string | null;
        firstDealAt: string | null;
      })[]
    >(
      `WITH referred AS (${REFERRED_SQL})
       SELECT referred.*,
              (SELECT MIN(b."createdAt") FROM "branches" b
                 WHERE b."businessId" = referred."id" AND b."deletedAt" IS NULL) AS "setupAt",
              (SELECT MIN(v."createdAt") FROM "verification_checks" v
                 WHERE v."businessId" = referred."id" AND v."deletedAt" IS NULL) AS "submittedAt",
              (SELECT MIN(o."createdAt") FROM "catalogue_offers" o
                 WHERE o."businessId" = referred."id" AND o."deletedAt" IS NULL) AS "firstDealAt"
       FROM referred
       WHERE referred."id" = $2::uuid`,
      [business.uniqueCode, referredId],
    );
    if (!row) throw new NotFoundException('Referral not found');

    const verifiedAt =
      row.status === 'verified' ? (row.verifiedAt ?? row.submittedAt) : null;
    const step = (id: string, at: string | null) => ({
      id,
      at,
      done: Boolean(at),
    });
    return {
      ...this.card(row),
      creditedTo: { id: business.id, name: business.name },
      countsTowardMilestone: row.status === 'verified',
      timeline: [
        step('registered', row.createdAt),
        step('setup', row.setupAt),
        step('submitted', row.submittedAt),
        step('verified', verifiedAt),
        step('firstDeal', row.firstDealAt),
      ],
    };
  }

  /**
   * How the business shows up in consumer discovery for one branch (default:
   * the main one): the feed card customers see, a profile-completeness health
   * index, 7-day engagement against the week before, what is indexed, the
   * branches it appears from, and the branch's discovery settings.
   */
  async getDiscovery(businessId: string, branchId?: string) {
    if (!businessId) throw new BadRequestException('Business ID is required');
    const [branch] = await this.dataSource.query<
      {
        id: string;
        name: string;
        address: string | null;
        city: string | null;
        latitude: number | null;
        businessHours: unknown;
        joinDiscoveryNetwork: boolean;
        receivePartnerRequests: boolean;
        allowPromotions: boolean;
        pushNotifications: boolean;
        smsAlerts: boolean;
        emailSummary: boolean;
      }[]
    >(
      `SELECT b."id", b."name", b."address", b."city", b."latitude", b."businessHours",
              b."joinDiscoveryNetwork", b."receivePartnerRequests", b."allowPromotions",
              b."pushNotifications", b."smsAlerts", b."emailSummary"
       FROM "branches" b
       WHERE b."businessId" = $1 AND b."deletedAt" IS NULL
         AND ($2::uuid IS NULL OR b."id" = $2::uuid)
       ORDER BY b."isMainBranch" DESC, b."createdAt"
       LIMIT 1`,
      [businessId, branchId ?? null],
    );
    if (!branch) throw new NotFoundException('Branch not found');

    const [[profile], [engagement], [catalogue], [topDeal], zones] =
      await Promise.all([
        this.dataSource.query<
          {
            name: string;
            logoUrl: string | null;
            coverImage: string | null;
            description: string | null;
            category: string | null;
            openingHours: unknown;
            verified: boolean;
            isVisible: boolean;
            rating: string | null;
            reviews: number;
          }[]
        >(
          `SELECT biz."name", biz."logoUrl", biz."coverImage", biz."description",
                c."name" AS category, biz."openingHours",
                (biz."verificationStatus" = 'verified' OR biz."isVerified") AS verified,
                biz."isVisible",
                (SELECT AVG(r."rating")::text FROM "deal_reviews" r
                   JOIN "catalogue_offers" o ON o."id" = r."offerId"
                   WHERE o."businessId" = biz."id" AND r."status" = 'approved'
                     AND r."deletedAt" IS NULL) AS rating,
                (SELECT COUNT(r."rating")::int FROM "deal_reviews" r
                   JOIN "catalogue_offers" o ON o."id" = r."offerId"
                   WHERE o."businessId" = biz."id" AND r."status" = 'approved'
                     AND r."deletedAt" IS NULL) AS reviews
         FROM "businesses" biz
         LEFT JOIN "categories" c ON c."id" = biz."categoryId"
         WHERE biz."id" = $1`,
          [businessId],
        ),
        this.dataSource.query<{ current: number; previous: number }[]>(
          `WITH events AS (
           SELECT v."createdAt" AS at FROM "visits" v
           WHERE v."branchId" = $1 AND v."deletedAt" IS NULL
           UNION ALL
           SELECT c."createdAt" FROM "catalogue_offer_claims" c
           JOIN "catalogue_offers" o ON o."id" = c."offerId"
           WHERE o."branchId" = $1 AND c."deletedAt" IS NULL
           UNION ALL
           SELECT s."createdAt" FROM "deal_saves" s
           JOIN "catalogue_offers" o ON o."id" = s."offerId"
           WHERE o."branchId" = $1 AND s."deletedAt" IS NULL
         )
         SELECT COUNT(*) FILTER (WHERE at >= ${NOW} - interval '7 days')::int AS current,
                COUNT(*) FILTER (
                  WHERE at >= ${NOW} - interval '14 days' AND at < ${NOW} - interval '7 days'
                )::int AS previous
         FROM events`,
          [branch.id],
        ),
        this.dataSource.query<
          { items: number; bookable: number; liveDeals: number }[]
        >(
          `SELECT
           (SELECT COUNT(*)::int FROM "catalogue_items" i
              WHERE i."businessId" = $1 AND i."deletedAt" IS NULL) AS items,
           (SELECT COUNT(*)::int FROM "catalogue_items" i
              WHERE i."businessId" = $1 AND i."deletedAt" IS NULL AND i."isBookable" = true) AS bookable,
           (SELECT COUNT(*)::int FROM "catalogue_offers" o
              WHERE o."branchId" = $2 AND o."deletedAt" IS NULL AND o."status" = 'active'
                AND (o."endDate" IS NULL OR o."endDate" > ${NOW})) AS "liveDeals"`,
          [businessId, branch.id],
        ),
        this.dataSource.query<
          {
            name: string;
            pricingType: string | null;
            discountValue: string | null;
            price: string | null;
          }[]
        >(
          `SELECT o."name", o."pricingType", o."discountValue"::text AS "discountValue",
                o."calculatedPrice"::text AS price
         FROM "catalogue_offers" o
         WHERE o."branchId" = $1 AND o."deletedAt" IS NULL AND o."status" = 'active'
           AND (o."endDate" IS NULL OR o."endDate" > ${NOW})
         ORDER BY o."views" DESC NULLS LAST, o."createdAt" DESC
         LIMIT 1`,
          [branch.id],
        ),
        this.dataSource.query<
          {
            id: string;
            name: string;
            city: string | null;
            cluster: string | null;
            active: boolean;
          }[]
        >(
          `SELECT b."id", b."name", b."city", cl."name" AS cluster,
                (b."isActive" AND b."joinDiscoveryNetwork") AS active
         FROM "branches" b
         LEFT JOIN "clusters" cl ON cl."id" = b."clusterId"
         WHERE b."businessId" = $1 AND b."deletedAt" IS NULL
         ORDER BY b."isMainBranch" DESC, b."name"`,
          [businessId],
        ),
      ]);

    const hours = (value: unknown) =>
      value != null &&
      (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0);
    const checks = {
      logo: Boolean(profile?.logoUrl),
      cover: Boolean(profile?.coverImage),
      description: Boolean(profile?.description?.trim()),
      category: Boolean(profile?.category),
      hours: hours(branch.businessHours) || hours(profile?.openingHours),
      location: branch.latitude != null,
      catalogue: num(catalogue?.items) > 0,
      liveDeal: num(catalogue?.liveDeals) > 0,
      verified: Boolean(profile?.verified),
      discoverable: branch.joinDiscoveryNetwork && profile?.isVisible !== false,
    };
    const passed = Object.values(checks).filter(Boolean).length;

    return {
      branch: { id: branch.id, name: branch.name },
      card: {
        name: profile?.name ?? '',
        category: profile?.category ?? null,
        logoUrl: profile?.logoUrl ?? null,
        coverImage: profile?.coverImage ?? null,
        locality:
          [branch.address, branch.city].filter(Boolean).join(', ') || null,
        rating:
          profile?.rating != null
            ? Math.round(num(profile.rating) * 10) / 10
            : null,
        reviews: num(profile?.reviews),
        topDeal: topDeal
          ? {
              name: topDeal.name,
              pricingType: topDeal.pricingType,
              discountValue:
                topDeal.discountValue != null
                  ? num(topDeal.discountValue)
                  : null,
              price: topDeal.price != null ? num(topDeal.price) : null,
            }
          : null,
      },
      health: { score: passed * 10, checks },
      engagement: {
        current: num(engagement?.current),
        previous: num(engagement?.previous),
      },
      index: {
        catalogueItems: num(catalogue?.items),
        bookableServices: num(catalogue?.bookable),
        liveDeals: num(catalogue?.liveDeals),
        hoursSet: checks.hours,
      },
      zones: zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        area: zone.cluster ?? zone.city,
        active: Boolean(zone.active),
      })),
      settings: {
        joinDiscoveryNetwork: branch.joinDiscoveryNetwork,
        receivePartnerRequests: branch.receivePartnerRequests,
        allowPromotions: branch.allowPromotions,
        pushNotifications: branch.pushNotifications,
        smsAlerts: branch.smsAlerts,
        emailSummary: branch.emailSummary,
      },
    };
  }
}
