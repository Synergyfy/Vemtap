import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { SegmentCriteriaDto } from '../dto/segment-criteria.dto';

/** One SQL statement plus its positional parameters. */
export interface BuiltQuery {
  sql: string;
  params: unknown[];
}

export interface SegmentReach {
  size: number;
  reachableByPush: number;
  reachableBySms: number;
  reachableByEmail: number;
  /** Members who opted out of promotions (all channels, or marketing). */
  excludedFromPromotions: number;
}

export interface SegmentInsights extends SegmentReach {
  totalSpend: number;
  avgOrderValue: number;
  /** Average visits / purchases per member. */
  visitFrequency: number;
  /** Members' spend in the last 30 days vs the 30 before, as a fraction. */
  spendDelta: number | null;
  aovDelta: number | null;
  branchSplit: { branchId: string; name: string; percent: number }[];
  favourites: { itemId: string; name: string; orders: number }[];
  samplePatrons: {
    userId: string;
    name: string;
    avatarUrl: string | null;
    lastVisit: string | null;
    spend: number;
  }[];
}

/**
 * Everything a customer did at a business, one row per event: POS sales and
 * catalogue orders (with an amount), visits, and claims of the business's
 * deals by a signed-in customer. `$1` is always the business id.
 */
const TOUCHES_SQL = `
  SELECT ps."customerId" AS uid, ps."branchId" AS "branchId", ps."total"::numeric AS amount,
         ps."createdAt" AS at, 'pos' AS kind
  FROM "pos_sales" ps
  WHERE ps."businessId" = $1 AND ps."customerId" IS NOT NULL
    AND ps."deletedAt" IS NULL AND ps."status" <> 'refunded'
  UNION ALL
  SELECT co."customerId", co."branchId", co."totalAmount"::numeric, co."createdAt", 'order'
  FROM "catalogue_orders" co
  WHERE co."businessId" = $1 AND co."customerId" IS NOT NULL
    AND co."deletedAt" IS NULL AND co."status" NOT IN ('cancelled', 'rejected', 'refunded')
  UNION ALL
  SELECT v."customerId", v."branchId", 0, v."createdAt", 'visit'
  FROM "visits" v
  WHERE v."businessId" = $1 AND v."customerId" IS NOT NULL AND v."deletedAt" IS NULL
  UNION ALL
  SELECT c."userId", o."branchId", 0, c."createdAt", 'claim'
  FROM "catalogue_offer_claims" c
  JOIN "catalogue_offers" o ON o."id" = c."offerId"
  WHERE o."businessId" = $1 AND c."userId" IS NOT NULL AND c."deletedAt" IS NULL
`;

/**
 * Who a promotion can reach, by the same consent rules messages are sent
 * under (`ComplianceService`, notification preferences):
 *
 * - out of promotions: opted out of everything, or turned marketing off;
 * - push: a device token and push not turned off;
 * - SMS / email: a phone / email, the channel not turned off, and (when the
 *   customer keeps an opt-in list) the channel on it.
 */
const REACH_SQL = `
  WITH m AS (
    SELECT u.*,
           (COALESCE(u."optOut", false)
             OR COALESCE(u."notificationPreferences"->>'marketing', '') = 'false') AS "isOut",
           NULLIF(COALESCE(u."optInChannels", ''), '') AS channels
    FROM "users" u
    WHERE u."id" = ANY($1::uuid[])
  )
  SELECT
    COUNT(*) FILTER (WHERE "isOut")::int AS excluded,
    COUNT(*) FILTER (
      WHERE NOT "isOut"
        AND COALESCE(m."notificationPreferences"->>'push', '') <> 'false'
        AND (EXISTS (
               SELECT 1 FROM "push_tokens" t WHERE t."userId" = m."id" AND t."deletedAt" IS NULL
             ) OR m."pushToken" IS NOT NULL)
    )::int AS push,
    COUNT(*) FILTER (
      WHERE NOT "isOut"
        AND COALESCE(m."phone", '') <> ''
        AND COALESCE(m."notificationPreferences"->>'sms', '') <> 'false'
        AND (channels IS NULL OR 'SMS' = ANY(string_to_array(channels, ',')))
    )::int AS sms,
    COUNT(*) FILTER (
      WHERE NOT "isOut"
        AND COALESCE(m."email", '') <> ''
        AND COALESCE(m."notificationPreferences"->>'email', '') <> 'false'
        AND (channels IS NULL OR 'EMAIL' = ANY(string_to_array(channels, ',')))
    )::int AS email
  FROM m
`;

/** Per-customer roll-up of their touches. */
const PER_CUSTOMER_SQL = `
  SELECT uid,
         COUNT(*) FILTER (WHERE kind IN ('pos', 'order', 'visit')) AS visits,
         COUNT(*) FILTER (WHERE kind IN ('pos', 'order')) AS purchases,
         COALESCE(SUM(amount), 0) AS spend,
         MAX(at) AS "lastAt"
  FROM touches
  GROUP BY uid
`;

/**
 * Turns a segment's rule set into a customer-id query and computes reach and
 * insights over a set of members. All SQL is parameterised; criteria values
 * never reach the statement text.
 */
@Injectable()
export class SegmentCriteriaService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * SQL selecting the user ids matching `criteria` among the business's
   * customers. Exposed for tests; callers use `memberIds`.
   */
  buildMemberQuery(
    businessId: string,
    criteria: SegmentCriteriaDto = {},
  ): BuiltQuery {
    const params: unknown[] = [businessId];
    const p = (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    };
    const where: string[] = [];

    const recency = criteria.recency;
    if (recency?.visitedWithinDays) {
      where.push(
        `per."lastAt" >= now() - (${p(recency.visitedWithinDays)} * interval '1 day')`,
      );
    }
    if (recency?.notVisitedForDays) {
      where.push(
        `per."lastAt" < now() - (${p(recency.notVisitedForDays)} * interval '1 day')`,
      );
    }
    if (recency?.minVisits) {
      where.push(`per.visits >= ${p(recency.minVisits)}`);
    }

    const spend = criteria.spend;
    if (spend?.minTotal !== undefined) {
      where.push(`per.spend >= ${p(spend.minTotal)}`);
    }
    if (spend?.minAverageTicket !== undefined) {
      where.push(
        `per.purchases > 0 AND per.spend / per.purchases >= ${p(spend.minAverageTicket)}`,
      );
    }

    if (criteria.location?.branchIds?.length) {
      where.push(`EXISTS (
        SELECT 1 FROM touches t
        WHERE t.uid = per.uid AND t."branchId" = ANY(${p(criteria.location.branchIds)}::uuid[])
      )`);
    }

    const deals = criteria.deals;
    if (deals) {
      const filters = [
        `o."businessId" = $1`,
        `c."userId" = per.uid`,
        `c."deletedAt" IS NULL`,
      ];
      if (deals.offerIds?.length) {
        // A deal published to several branches is one group: match any row of it.
        filters.push(`(
          c."offerId" = ANY(${p(deals.offerIds)}::uuid[])
          OR o."dealGroupId" IN (
            SELECT g."dealGroupId" FROM "catalogue_offers" g
            WHERE g."id" = ANY($${params.length}::uuid[]) AND g."dealGroupId" IS NOT NULL
          )
        )`);
      }
      if (deals.withinDays) {
        filters.push(
          `c."createdAt" >= now() - (${p(deals.withinDays)} * interval '1 day')`,
        );
      }
      const threshold = deals.redeemedAtLeast ?? 1;
      if (deals.redeemedAtLeast) filters.push(`c."status" = 'redeemed'`);
      where.push(`(
        SELECT COUNT(*) FROM "catalogue_offer_claims" c
        JOIN "catalogue_offers" o ON o."id" = c."offerId"
        WHERE ${filters.join(' AND ')}
      ) >= ${p(threshold)}`);
    }

    const menu = criteria.menu;
    if (menu?.itemIds?.length) {
      const items = p(menu.itemIds);
      where.push(`(
        COALESCE((
          SELECT SUM(oi."quantity") FROM "catalogue_order_items" oi
          JOIN "catalogue_orders" co ON co."id" = oi."orderId"
          WHERE co."customerId" = per.uid AND co."businessId" = $1
            AND co."status" NOT IN ('cancelled', 'rejected', 'refunded')
            AND oi."itemId" = ANY(${items}::uuid[])
        ), 0)
        + COALESCE((
          SELECT SUM(si."quantity") FROM "pos_sale_items" si
          JOIN "pos_sales" ps ON ps."id" = si."saleId"
          WHERE ps."customerId" = per.uid AND ps."businessId" = $1
            AND ps."status" <> 'refunded'
            AND si."productId" = ANY(${items}::uuid[])
        ), 0)
      ) >= ${p(menu.orderedAtLeast ?? 1)}`);
    }

    const sql = `
      WITH touches AS (${TOUCHES_SQL}),
           per AS (${PER_CUSTOMER_SQL})
      SELECT per.uid AS "userId" FROM per
      ${where.length ? `WHERE ${where.join('\n        AND ')}` : ''}
    `;
    return { sql, params };
  }

  async memberIds(
    businessId: string,
    criteria: SegmentCriteriaDto = {},
  ): Promise<string[]> {
    const { sql, params } = this.buildMemberQuery(businessId, criteria);
    const rows = await this.dataSource.query<{ userId: string }[]>(sql, params);
    return rows.map((row) => row.userId);
  }

  /** How many of `userIds` can be reached on each channel. */
  async reach(userIds: string[]): Promise<SegmentReach> {
    if (userIds.length === 0) {
      return {
        size: 0,
        reachableByPush: 0,
        reachableBySms: 0,
        reachableByEmail: 0,
        excludedFromPromotions: 0,
      };
    }
    const [row] = await this.dataSource.query<
      { push: number; sms: number; email: number; excluded: number }[]
    >(REACH_SQL, [userIds]);
    return {
      size: userIds.length,
      reachableByPush: Number(row?.push ?? 0),
      reachableBySms: Number(row?.sms ?? 0),
      reachableByEmail: Number(row?.email ?? 0),
      excludedFromPromotions: Number(row?.excluded ?? 0),
    };
  }

  async preview(
    businessId: string,
    criteria: SegmentCriteriaDto,
  ): Promise<SegmentReach> {
    return this.reach(await this.memberIds(businessId, criteria));
  }

  /** Spending, frequency, branch mix, favourites and sample patrons for members. */
  async insights(
    businessId: string,
    userIds: string[],
  ): Promise<SegmentInsights> {
    const base = await this.reach(userIds);
    const empty: SegmentInsights = {
      ...base,
      totalSpend: 0,
      avgOrderValue: 0,
      visitFrequency: 0,
      spendDelta: null,
      aovDelta: null,
      branchSplit: [],
      favourites: [],
      samplePatrons: [],
    };
    if (userIds.length === 0) return empty;

    const scoped = `WITH touches AS (${TOUCHES_SQL})`;
    const params = [businessId, userIds];

    const [totals] = await this.dataSource.query<
      {
        spend: string;
        purchases: number;
        visits: number;
        spendRecent: string;
        purchasesRecent: number;
        spendPrior: string;
        purchasesPrior: number;
      }[]
    >(
      `${scoped}
       SELECT
         COALESCE(SUM(amount), 0) AS spend,
         COUNT(*) FILTER (WHERE kind IN ('pos', 'order'))::int AS purchases,
         COUNT(*) FILTER (WHERE kind IN ('pos', 'order', 'visit'))::int AS visits,
         COALESCE(SUM(amount) FILTER (WHERE at >= now() - interval '30 days'), 0) AS "spendRecent",
         COUNT(*) FILTER (WHERE kind IN ('pos', 'order') AND at >= now() - interval '30 days')::int AS "purchasesRecent",
         COALESCE(SUM(amount) FILTER (WHERE at >= now() - interval '60 days' AND at < now() - interval '30 days'), 0) AS "spendPrior",
         COUNT(*) FILTER (WHERE kind IN ('pos', 'order') AND at >= now() - interval '60 days' AND at < now() - interval '30 days')::int AS "purchasesPrior"
       FROM touches WHERE uid = ANY($2::uuid[])`,
      params,
    );

    const branchRows = await this.dataSource.query<
      { branchId: string; name: string; touches: number }[]
    >(
      `${scoped}
       SELECT t."branchId" AS "branchId", b."name" AS name, COUNT(*)::int AS touches
       FROM touches t JOIN "branches" b ON b."id" = t."branchId"
       WHERE t.uid = ANY($2::uuid[])
       GROUP BY t."branchId", b."name"
       ORDER BY touches DESC`,
      params,
    );

    const favourites = await this.dataSource.query<
      { itemId: string; name: string; orders: number }[]
    >(
      `SELECT x."itemId" AS "itemId", MAX(x.name) AS name, SUM(x.qty)::int AS orders
       FROM (
         SELECT oi."itemId", ci."name", oi."quantity" AS qty
         FROM "catalogue_order_items" oi
         JOIN "catalogue_orders" co ON co."id" = oi."orderId"
         JOIN "catalogue_items" ci ON ci."id" = oi."itemId"
         WHERE co."businessId" = $1 AND co."customerId" = ANY($2::uuid[])
           AND co."status" NOT IN ('cancelled', 'rejected', 'refunded')
         UNION ALL
         SELECT si."productId", si."productName", si."quantity"
         FROM "pos_sale_items" si
         JOIN "pos_sales" ps ON ps."id" = si."saleId"
         WHERE ps."businessId" = $1 AND ps."customerId" = ANY($2::uuid[])
           AND ps."status" <> 'refunded' AND si."productId" IS NOT NULL
       ) x
       GROUP BY x."itemId"
       ORDER BY orders DESC
       LIMIT 5`,
      params,
    );

    const patrons = await this.dataSource.query<
      {
        userId: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        lastAt: Date | null;
        spend: string;
      }[]
    >(
      `${scoped}
       SELECT u."id" AS "userId", u."firstName" AS "firstName", u."lastName" AS "lastName",
              u."avatar" AS avatar, MAX(t.at) AS "lastAt", COALESCE(SUM(t.amount), 0) AS spend
       FROM touches t JOIN "users" u ON u."id" = t.uid
       WHERE t.uid = ANY($2::uuid[])
       GROUP BY u."id"
       ORDER BY spend DESC, "lastAt" DESC NULLS LAST
       LIMIT 5`,
      params,
    );

    const spend = Number(totals?.spend ?? 0);
    const purchases = Number(totals?.purchases ?? 0);
    const visits = Number(totals?.visits ?? 0);
    const recent = Number(totals?.spendRecent ?? 0);
    const prior = Number(totals?.spendPrior ?? 0);
    const aovRecent = totals?.purchasesRecent
      ? recent / totals.purchasesRecent
      : 0;
    const aovPrior = totals?.purchasesPrior ? prior / totals.purchasesPrior : 0;
    const totalTouches = branchRows.reduce(
      (sum, row) => sum + Number(row.touches),
      0,
    );

    return {
      ...base,
      totalSpend: round(spend),
      avgOrderValue: purchases ? round(spend / purchases) : 0,
      visitFrequency: round(visits / userIds.length),
      spendDelta: prior > 0 ? round((recent - prior) / prior, 4) : null,
      aovDelta:
        aovPrior > 0 ? round((aovRecent - aovPrior) / aovPrior, 4) : null,
      branchSplit: branchRows.map((row) => ({
        branchId: row.branchId,
        name: row.name,
        percent: totalTouches
          ? round((Number(row.touches) / totalTouches) * 100, 1)
          : 0,
      })),
      favourites: favourites.map((row) => ({
        itemId: row.itemId,
        name: row.name,
        orders: Number(row.orders),
      })),
      samplePatrons: patrons.map((row) => ({
        userId: row.userId,
        name:
          [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Customer',
        avatarUrl: row.avatar ?? null,
        lastVisit: row.lastAt ? new Date(row.lastAt).toISOString() : null,
        spend: round(Number(row.spend)),
      })),
    };
  }

  /** Choices for the criteria builder chips. */
  async criteriaOptions(businessId: string) {
    const [deals, menuItems, branches] = await Promise.all([
      this.dataSource.query<{ id: string; name: string }[]>(
        `SELECT DISTINCT ON (COALESCE(o."dealGroupId", o."id")) o."id" AS id, o."name" AS name
         FROM "catalogue_offers" o
         WHERE o."businessId" = $1 AND o."deletedAt" IS NULL
         ORDER BY COALESCE(o."dealGroupId", o."id"), o."createdAt" DESC`,
        [businessId],
      ),
      this.dataSource.query<{ id: string; name: string }[]>(
        `SELECT ci."id" AS id, ci."name" AS name FROM "catalogue_items" ci
         WHERE ci."businessId" = $1 AND ci."deletedAt" IS NULL AND ci."status" <> 'archived'
         ORDER BY ci."name" LIMIT 200`,
        [businessId],
      ),
      this.dataSource.query<{ id: string; name: string }[]>(
        `SELECT b."id" AS id, b."name" AS name FROM "branches" b
         WHERE b."businessId" = $1 AND b."deletedAt" IS NULL
         ORDER BY b."isMainBranch" DESC, b."name"`,
        [businessId],
      ),
    ]);
    return {
      deals,
      menuItems,
      branches,
      recency: [
        {
          id: 'active_7',
          label: 'Active in the last 7 days',
          criteria: { visitedWithinDays: 7 },
        },
        {
          id: 'active_30',
          label: 'Active in the last 30 days',
          criteria: { visitedWithinDays: 30 },
        },
        {
          id: 'lapsed_60',
          label: 'Not seen for 60+ days',
          criteria: { notVisitedForDays: 60 },
        },
        { id: 'regulars', label: '5+ visits', criteria: { minVisits: 5 } },
      ],
      spend: [
        {
          id: 'high_ticket',
          label: 'Average ticket ₦20,000+',
          criteria: { minAverageTicket: 20000 },
        },
        {
          id: 'big_spenders',
          label: 'Lifetime spend ₦100,000+',
          criteria: { minTotal: 100000 },
        },
      ],
    };
  }
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
