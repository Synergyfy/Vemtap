import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LoyaltyService } from '../loyalty/loyalty.service';
import {
  DORMANT_CUSTOMER_DAYS,
  LAPSED_CUSTOMER_DAYS,
  NEW_CUSTOMER_DAYS,
  VIP_MIN_SPEND,
  VIP_MIN_VISITS,
} from '../../common/utils/customer-segments';
import { AnalyticsRangeQueryDto } from './dto/analytics-range.dto';
import {
  EVENTS_SQL,
  FROM,
  PER_CUSTOMER_SQL,
  PREV_FROM,
  SALES_SQL,
  TO,
  TOUCHES_SQL,
  inBranch,
  inWindow,
  local,
} from './business-analytics.sql';

const DAY_MS = 86_400_000;
const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 366;
const TOP_LIMIT = 5;

export interface AnalyticsRange {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  days: number;
  branchId: string | null;
}

export interface Comparison {
  current: number;
  previous: number;
}

const num = (value: unknown) => Number(value) || 0;
const round2 = (value: number) => Math.round(value * 100) / 100;
const ratio = (part: number, whole: number) =>
  whole > 0 ? round2(part / whole) : 0;
const compare = (current: unknown, previous: unknown): Comparison => ({
  current: round2(num(current)),
  previous: round2(num(previous)),
});

/**
 * Range-based analytics for one business: overview, customers, deals, POS and
 * locations. Every figure comes from grouped SQL over the business's own rows
 * (no per-row lookups), compared against the previous period of the same
 * length. Amounts are naira; the app formats them.
 */
@Injectable()
export class BusinessAnalyticsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  /**
   * Resolves `from`/`to` (default: the last 30 days up to now) and the
   * previous period, and checks the branch belongs to the business.
   */
  async resolveRange(
    businessId: string,
    query: AnalyticsRangeQueryDto,
    now = new Date(),
  ): Promise<AnalyticsRange> {
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const to = query.to ? new Date(query.to) : now;
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY_MS);
    if (from.getTime() >= to.getTime()) {
      throw new BadRequestException('`from` must be before `to`');
    }
    const span = to.getTime() - from.getTime();
    if (span > MAX_RANGE_DAYS * DAY_MS) {
      throw new BadRequestException(
        `The range cannot be longer than ${MAX_RANGE_DAYS} days`,
      );
    }

    const branchId = query.branchId ?? null;
    if (branchId) {
      const owned = await this.dataSource.query<unknown[]>(
        `SELECT 1 FROM "branches" WHERE "id" = $1 AND "businessId" = $2 AND "deletedAt" IS NULL`,
        [branchId, businessId],
      );
      if (!owned.length) {
        throw new NotFoundException('Branch not found');
      }
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      previousFrom: new Date(from.getTime() - span).toISOString(),
      previousTo: from.toISOString(),
      days: Math.max(1, Math.round(span / DAY_MS)),
      branchId,
    };
  }

  private params(businessId: string, range: AnalyticsRange) {
    return [
      businessId,
      range.previousFrom,
      range.from,
      range.to,
      range.branchId,
    ];
  }

  private run<T = Record<string, unknown>>(
    sql: string,
    businessId: string,
    range: AnalyticsRange,
  ): Promise<T[]> {
    return this.dataSource.query(sql, this.params(businessId, range));
  }

  /* ------------------------------------------------------------------------ */
  /* Shared pieces                                                            */
  /* ------------------------------------------------------------------------ */

  private async salesTotals(businessId: string, range: AnalyticsRange) {
    const [row] = await this.run(
      `WITH sales AS (${SALES_SQL})
       SELECT
         COALESCE(SUM(amount) FILTER (WHERE at >= ${FROM}), 0) AS revenue,
         COALESCE(SUM(amount) FILTER (WHERE at < ${FROM}), 0) AS "previousRevenue",
         COUNT(*) FILTER (WHERE at >= ${FROM})::int AS orders,
         COUNT(*) FILTER (WHERE at < ${FROM})::int AS "previousOrders",
         COALESCE(SUM(amount) FILTER (WHERE at >= ${FROM} AND channel = 'pos'), 0) AS "posRevenue",
         COUNT(*) FILTER (WHERE at >= ${FROM} AND channel = 'pos')::int AS "posOrders",
         COALESCE(SUM(amount) FILTER (WHERE at >= ${FROM} AND channel = 'order'), 0) AS "orderRevenue",
         COUNT(*) FILTER (WHERE at >= ${FROM} AND channel = 'order')::int AS "orderOrders"
       FROM sales`,
      businessId,
      range,
    );
    return row ?? {};
  }

  private async eventTotals(businessId: string, range: AnalyticsRange) {
    const rows = await this.run<{
      kind: string;
      current: number;
      previous: number;
    }>(
      `WITH events AS (${EVENTS_SQL})
       SELECT kind,
              COUNT(*) FILTER (WHERE at >= ${FROM})::int AS current,
              COUNT(*) FILTER (WHERE at < ${FROM})::int AS previous
       FROM events
       GROUP BY kind`,
      businessId,
      range,
    );
    const totals: Record<string, Comparison> = {};
    for (const kind of [
      'visit',
      'claim',
      'redemption',
      'save',
      'chat',
      'review',
    ]) {
      const row = rows.find((r) => r.kind === kind);
      totals[kind] = compare(row?.current, row?.previous);
    }
    return totals;
  }

  /** Lifetime deal views at the business (views are a running counter). */
  private async dealViews(businessId: string, range: AnalyticsRange) {
    const [row] = await this.run<{ views: number; likes: number }>(
      `SELECT COALESCE(SUM(o."views"), 0)::int AS views,
              COALESCE(SUM(o."likesCount"), 0)::int AS likes
       FROM "catalogue_offers" o
       WHERE o."businessId" = $1 AND o."deletedAt" IS NULL AND ${inBranch(`o."branchId"`)}
         AND $2::text IS NOT NULL AND $3::text IS NOT NULL AND $4::text IS NOT NULL`,
      businessId,
      range,
    );
    return { views: num(row?.views), likes: num(row?.likes) };
  }

  private async customerSplit(businessId: string, range: AnalyticsRange) {
    const [row] = await this.run(
      `WITH touches AS (${TOUCHES_SQL}), per AS (${PER_CUSTOMER_SQL})
       SELECT
         COUNT(*) FILTER (WHERE "activeInPeriod")::int AS active,
         COUNT(*) FILTER (WHERE "activeInPeriod" AND "firstAt" >= ${FROM})::int AS "new",
         COUNT(*) FILTER (WHERE "activeInPeriod" AND "firstAt" < ${FROM})::int AS returning,
         COUNT(*) FILTER (WHERE "activeInPeriod" AND visits >= 2)::int AS repeaters,
         COUNT(*) FILTER (WHERE "activeInPrevious")::int AS "previousActive",
         COUNT(*) FILTER (
           WHERE "activeInPrevious" AND "firstAt" >= ${PREV_FROM} AND "firstAt" < ${FROM}
         )::int AS "previousNew"
       FROM per`,
      businessId,
      range,
    );
    const active = num(row?.active);
    return {
      active,
      new: num(row?.new),
      returning: num(row?.returning),
      repeatRate: ratio(num(row?.repeaters), active),
      previousActive: num(row?.previousActive),
      previousNew: num(row?.previousNew),
    };
  }

  private async hourly(businessId: string, range: AnalyticsRange) {
    const rows = await this.run<{
      hour: number;
      orders: number;
      revenue: string;
    }>(
      `WITH sales AS (${SALES_SQL})
       SELECT EXTRACT(HOUR FROM ${local('at')})::int AS hour,
              COUNT(*)::int AS orders, COALESCE(SUM(amount), 0) AS revenue
       FROM sales WHERE at >= ${FROM}
       GROUP BY 1`,
      businessId,
      range,
    );
    return Array.from({ length: 24 }, (_, hour) => {
      const row = rows.find((r) => num(r.hour) === hour);
      return {
        hour,
        orders: num(row?.orders),
        revenue: round2(num(row?.revenue)),
      };
    });
  }

  /** Day-of-week × hour activity grid (0 = Sunday), sales and visits. */
  private async heatmap(businessId: string, range: AnalyticsRange) {
    const rows = await this.run<{ dow: number; hour: number; count: number }>(
      `WITH sales AS (${SALES_SQL}), events AS (${EVENTS_SQL}),
            activity AS (
              SELECT at FROM sales
              UNION ALL SELECT at FROM events WHERE kind = 'visit'
            )
       SELECT EXTRACT(DOW FROM ${local('at')})::int AS dow,
              EXTRACT(HOUR FROM ${local('at')})::int AS hour,
              COUNT(*)::int AS count
       FROM activity WHERE at >= ${FROM}
       GROUP BY 1, 2`,
      businessId,
      range,
    );
    return rows.map((r) => ({
      dow: num(r.dow),
      hour: num(r.hour),
      count: num(r.count),
    }));
  }

  private async topItems(
    businessId: string,
    range: AnalyticsRange,
    limit = TOP_LIMIT,
  ) {
    const rows = await this.run<{
      name: string;
      quantity: number;
      revenue: string;
      dealQuantity: number;
    }>(
      `WITH lines AS (
         SELECT psi."productName" AS name,
                (psi."quantity" - COALESCE(psi."refundedQuantity", 0)) AS quantity,
                psi."totalPrice"::numeric AS revenue, 0 AS "dealQuantity"
         FROM "pos_sale_items" psi
         JOIN "pos_sales" ps ON ps."id" = psi."saleId"
         WHERE ps."businessId" = $1 AND ps."deletedAt" IS NULL AND psi."deletedAt" IS NULL
           AND ps."status" <> 'refunded'
           AND COALESCE(ps."orderedAt", ps."createdAt") >= ${FROM}
           AND COALESCE(ps."orderedAt", ps."createdAt") < ${TO}
           AND ${inBranch(`ps."branchId"`)}
         UNION ALL
         SELECT ci."name",
                (coi."quantity" - COALESCE(coi."refundedQuantity", 0)),
                (coi."priceAtOrder" * coi."quantity")::numeric,
                CASE WHEN coi."offerId" IS NOT NULL THEN coi."quantity" ELSE 0 END
         FROM "catalogue_order_items" coi
         JOIN "catalogue_orders" co ON co."id" = coi."orderId"
         JOIN "catalogue_items" ci ON ci."id" = coi."itemId"
         WHERE co."businessId" = $1 AND co."deletedAt" IS NULL AND coi."deletedAt" IS NULL
           AND co."status" NOT IN ('cancelled', 'rejected', 'refunded')
           AND NOT EXISTS (
             SELECT 1 FROM "pos_sales" x WHERE x."orderId" = co."id" AND x."deletedAt" IS NULL
           )
           AND co."createdAt" >= ${FROM} AND co."createdAt" < ${TO}
           AND ${inBranch(`co."branchId"`)}
           AND $2::text IS NOT NULL
       )
       SELECT name, SUM(quantity)::int AS quantity, COALESCE(SUM(revenue), 0) AS revenue,
              SUM("dealQuantity")::int AS "dealQuantity"
       FROM lines
       GROUP BY name
       ORDER BY SUM(revenue) DESC, name
       LIMIT ${Number(limit)}`,
      businessId,
      range,
    );
    return rows.map((r) => ({
      name: r.name,
      quantity: num(r.quantity),
      revenue: round2(num(r.revenue)),
      dealShare: ratio(num(r.dealQuantity), num(r.quantity)),
    }));
  }

  /** Sales per cashier, with the time their register sessions were open. */
  private async cashiers(businessId: string, range: AnalyticsRange) {
    const rows = await this.run<{
      userId: string;
      firstName: string | null;
      lastName: string | null;
      role: string | null;
      jobTitle: string | null;
      tickets: number;
      sales: string;
      activeMinutes: number;
      tillName: string | null;
    }>(
      `WITH sales AS (${SALES_SQL}),
            per AS (
              SELECT "cashierId", COUNT(*)::int AS tickets, COALESCE(SUM(amount), 0) AS sales
              FROM sales
              WHERE channel = 'pos' AND at >= ${FROM} AND "cashierId" IS NOT NULL
              GROUP BY "cashierId"
            ),
            sessions AS (
              SELECT s."cashierId",
                     SUM(EXTRACT(EPOCH FROM (
                       LEAST(COALESCE(s."closedAt", now() AT TIME ZONE 'UTC'), ${TO})
                       - GREATEST(s."openedAt", ${FROM})
                     )) / 60)::int AS "activeMinutes",
                     (ARRAY_AGG(t."name" ORDER BY s."openedAt" DESC)
                        FILTER (WHERE t."name" IS NOT NULL))[1] AS "tillName"
              FROM "pos_register_sessions" s
              LEFT JOIN "pos_tills" t ON t."id" = s."tillId"
              WHERE s."businessId" = $1 AND s."deletedAt" IS NULL
                AND s."openedAt" < ${TO}
                AND COALESCE(s."closedAt", now() AT TIME ZONE 'UTC') > ${FROM}
                AND ${inBranch(`s."branchId"`)}
              GROUP BY s."cashierId"
            )
       SELECT per."cashierId" AS "userId", u."firstName", u."lastName", u."role",
              u."jobTitle", per.tickets, per.sales,
              COALESCE(sessions."activeMinutes", 0) AS "activeMinutes",
              sessions."tillName"
       FROM per
       LEFT JOIN "users" u ON u."id" = per."cashierId"
       LEFT JOIN sessions ON sessions."cashierId" = per."cashierId"
       ORDER BY per.sales DESC
       LIMIT 20`,
      businessId,
      range,
    );
    return rows.map((r) => ({
      userId: r.userId,
      name: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
      role: r.jobTitle || r.role || null,
      tickets: num(r.tickets),
      sales: round2(num(r.sales)),
      activeMinutes: Math.max(0, num(r.activeMinutes)),
      tillName: r.tillName ?? null,
    }));
  }

  /* ------------------------------------------------------------------------ */
  /* Overview                                                                 */
  /* ------------------------------------------------------------------------ */

  async getOverview(businessId: string, query: AnalyticsRangeQueryDto) {
    const range = await this.resolveRange(businessId, query);

    const [
      sales,
      events,
      views,
      customers,
      series,
      hourly,
      weekdays,
      topDeal,
      topItems,
      team,
      branchCount,
    ] = await Promise.all([
      this.salesTotals(businessId, range),
      this.eventTotals(businessId, range),
      this.dealViews(businessId, range),
      this.customerSplit(businessId, range),
      this.dailySeries(businessId, range),
      this.hourly(businessId, range),
      this.weekdays(businessId, range),
      this.topDeal(businessId, range),
      this.topItems(businessId, range),
      this.cashiers(businessId, range),
      this.branchCount(businessId, range),
    ]);

    const orders = compare(sales.orders, sales.previousOrders);
    const revenue = compare(sales.revenue, sales.previousRevenue);
    const interactionKinds = ['visit', 'claim', 'save', 'chat', 'review'];
    const interactions = {
      current:
        orders.current +
        interactionKinds.reduce((sum, k) => sum + events[k].current, 0),
      previous:
        orders.previous +
        interactionKinds.reduce((sum, k) => sum + events[k].previous, 0),
    };

    return {
      range,
      branchCount,
      revenue,
      orders,
      averageOrderValue: {
        current: round2(ratio(revenue.current, orders.current) || 0),
        previous: round2(ratio(revenue.previous, orders.previous) || 0),
      },
      interactions,
      activity: {
        dealViews: views.views,
        visits: events.visit.current,
        claims: events.claim.current,
        redemptions: events.redemption.current,
        saves: events.save.current,
        chats: events.chat.current,
        reviews: events.review.current,
        newCustomers: customers.new,
        returningCustomers: customers.returning,
      },
      redemptionRate: {
        current: ratio(events.redemption.current, events.claim.current),
        previous: ratio(events.redemption.previous, events.claim.previous),
      },
      customers,
      channels: [
        {
          id: 'pos',
          revenue: round2(num(sales.posRevenue)),
          orders: num(sales.posOrders),
        },
        {
          id: 'orders',
          revenue: round2(num(sales.orderRevenue)),
          orders: num(sales.orderOrders),
        },
      ],
      sources: [
        { id: 'deals', count: events.claim.current + events.save.current },
        { id: 'visits', count: events.visit.current },
        { id: 'pos', count: num(sales.posOrders) },
        { id: 'orders', count: num(sales.orderOrders) },
        { id: 'chats', count: events.chat.current },
      ],
      series,
      hourly,
      weekdays,
      topDeal,
      topItems,
      team,
    };
  }

  private async branchCount(businessId: string, range: AnalyticsRange) {
    if (range.branchId) return 1;
    const [row] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM "branches"
       WHERE "businessId" = $1 AND "deletedAt" IS NULL AND "isActive" = true`,
      [businessId],
    );
    return num(row?.count);
  }

  /** One point per local day of the period, with the previous period aligned. */
  private async dailySeries(businessId: string, range: AnalyticsRange) {
    const rows = await this.run<{
      day: string;
      revenue: string;
      orders: number;
      visits: number;
      customers: number;
      previousRevenue: string;
    }>(
      `WITH sales AS (${SALES_SQL}), events AS (${EVENTS_SQL}),
            days AS (
              SELECT generate_series(
                date_trunc('day', ${local(FROM)}),
                date_trunc('day', ${local(`${TO} - interval '1 microsecond'`)}),
                interval '1 day'
              ) AS day
            ),
            offset_days AS (
              SELECT (date_trunc('day', ${local(FROM)}) - date_trunc('day', ${local(PREV_FROM)})) AS gap
            ),
            sale_days AS (
              SELECT date_trunc('day', ${local('at')}) AS day, SUM(amount) AS revenue,
                     COUNT(*)::int AS orders,
                     COUNT(DISTINCT uid)::int AS customers
              FROM sales GROUP BY 1
            ),
            visit_days AS (
              SELECT date_trunc('day', ${local('at')}) AS day, COUNT(*)::int AS visits
              FROM events WHERE kind = 'visit' GROUP BY 1
            )
       SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
              COALESCE(s.revenue, 0) AS revenue, COALESCE(s.orders, 0) AS orders,
              COALESCE(v.visits, 0) AS visits, COALESCE(s.customers, 0) AS customers,
              COALESCE(p.revenue, 0) AS "previousRevenue"
       FROM days d
       CROSS JOIN offset_days o
       LEFT JOIN sale_days s ON s.day = d.day
       LEFT JOIN visit_days v ON v.day = d.day
       LEFT JOIN sale_days p ON p.day = d.day - o.gap
       ORDER BY d.day`,
      businessId,
      range,
    );
    return rows.map((r) => ({
      date: r.day,
      revenue: round2(num(r.revenue)),
      orders: num(r.orders),
      visits: num(r.visits),
      customers: num(r.customers),
      previousRevenue: round2(num(r.previousRevenue)),
    }));
  }

  private async weekdays(businessId: string, range: AnalyticsRange) {
    const rows = await this.run<{
      dow: number;
      revenue: string;
      orders: number;
    }>(
      `WITH sales AS (${SALES_SQL})
       SELECT EXTRACT(DOW FROM ${local('at')})::int AS dow,
              COALESCE(SUM(amount), 0) AS revenue, COUNT(*)::int AS orders
       FROM sales WHERE at >= ${FROM}
       GROUP BY 1`,
      businessId,
      range,
    );
    return Array.from({ length: 7 }, (_, dow) => {
      const row = rows.find((r) => num(r.dow) === dow);
      return {
        dow,
        revenue: round2(num(row?.revenue)),
        orders: num(row?.orders),
      };
    });
  }

  /** The deal with the most claims in the period and its share of claims. */
  private async topDeal(businessId: string, range: AnalyticsRange) {
    const [row] = await this.run<{
      name: string;
      branchName: string | null;
      claims: number;
      total: number;
    }>(
      `WITH claims AS (
         SELECT o."name", o."branchId"
         FROM "catalogue_offer_claims" c
         JOIN "catalogue_offers" o ON o."id" = c."offerId"
         WHERE o."businessId" = $1 AND c."deletedAt" IS NULL
           AND c."createdAt" >= ${FROM} AND c."createdAt" < ${TO}
           AND ${inBranch(`o."branchId"`)} AND $2::text IS NOT NULL
       )
       SELECT c."name", b."name" AS "branchName", COUNT(*)::int AS claims,
              (SELECT COUNT(*)::int FROM claims) AS total
       FROM claims c
       LEFT JOIN "branches" b ON b."id" = c."branchId"
       GROUP BY c."name", b."name"
       ORDER BY COUNT(*) DESC, c."name"
       LIMIT 1`,
      businessId,
      range,
    );
    if (!row) return null;
    return {
      name: row.name,
      branchName: row.branchName,
      claims: num(row.claims),
      share: ratio(num(row.claims), num(row.total)),
    };
  }

  /* ------------------------------------------------------------------------ */
  /* Customers                                                                */
  /* ------------------------------------------------------------------------ */

  async getCustomers(businessId: string, query: AnalyticsRangeQueryDto) {
    const range = await this.resolveRange(businessId, query);

    const [totals, growth, firstTouch, topRows, events, points, heatmap] =
      await Promise.all([
        this.run(
          `WITH touches AS (${TOUCHES_SQL}), per AS (${PER_CUSTOMER_SQL})
           SELECT
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE "firstAt" < ${FROM})::int AS "previousTotal",
             COUNT(*) FILTER (WHERE "activeInPeriod")::int AS active,
             COUNT(*) FILTER (WHERE "activeInPrevious")::int AS "previousActive",
             COUNT(*) FILTER (WHERE "firstAt" >= ${FROM})::int AS "new",
             COUNT(*) FILTER (WHERE "firstAt" >= ${PREV_FROM} AND "firstAt" < ${FROM})::int
               AS "previousNew",
             COUNT(*) FILTER (WHERE "activeInPeriod" AND "firstAt" < ${FROM})::int AS returning,
             COUNT(*) FILTER (WHERE visits >= 2)::int AS repeaters,
             COUNT(*) FILTER (WHERE "firstAt" < ${FROM} AND visits >= 2)::int AS "previousRepeaters",
             COUNT(*) FILTER (
               WHERE "lastAt" < ${TO} - make_interval(days => ${DORMANT_CUSTOMER_DAYS})
             )::int AS dormant,
             COUNT(*) FILTER (
               WHERE "lastAt" < ${FROM} - make_interval(days => ${DORMANT_CUSTOMER_DAYS})
             )::int AS "previousDormant",
             COALESCE(SUM("periodSpend"), 0) AS "periodSpend",
             COUNT(*) FILTER (WHERE "periodPurchases" > 0)::int AS "periodBuyers",
             COUNT(*) FILTER (WHERE visits >= ${VIP_MIN_VISITS} OR spend >= ${VIP_MIN_SPEND})::int
               AS vip,
             COALESCE(SUM(spend) FILTER (
               WHERE visits >= ${VIP_MIN_VISITS} OR spend >= ${VIP_MIN_SPEND}
             ), 0) AS "vipSpend",
             COUNT(*) FILTER (
               WHERE NOT (visits >= ${VIP_MIN_VISITS} OR spend >= ${VIP_MIN_SPEND})
                 AND visits >= 2
                 AND "lastAt" >= ${TO} - make_interval(days => ${LAPSED_CUSTOMER_DAYS})
             )::int AS regular,
             COALESCE(SUM(spend) FILTER (
               WHERE NOT (visits >= ${VIP_MIN_VISITS} OR spend >= ${VIP_MIN_SPEND})
                 AND visits >= 2
                 AND "lastAt" >= ${TO} - make_interval(days => ${LAPSED_CUSTOMER_DAYS})
             ), 0) AS "regularSpend",
             COUNT(*) FILTER (
               WHERE "firstAt" >= ${TO} - make_interval(days => ${NEW_CUSTOMER_DAYS})
             )::int AS "recentNew",
             COALESCE(SUM(spend) FILTER (
               WHERE "firstAt" >= ${TO} - make_interval(days => ${NEW_CUSTOMER_DAYS})
             ), 0) AS "recentNewSpend",
             COUNT(*) FILTER (
               WHERE "lastAt" < ${TO} - make_interval(days => ${LAPSED_CUSTOMER_DAYS})
             )::int AS lapsed,
             COALESCE(SUM(spend) FILTER (
               WHERE "lastAt" < ${TO} - make_interval(days => ${LAPSED_CUSTOMER_DAYS})
             ), 0) AS "lapsedSpend",
             COALESCE(SUM(spend), 0) AS "lifetimeSpend",
             COALESCE(SUM(visits) FILTER (WHERE "activeInPeriod"), 0)::int AS "activeVisits"
           FROM per`,
          businessId,
          range,
        ),
        this.customerGrowth(businessId, range),
        this.run<{ kind: string; count: number }>(
          `WITH touches AS (${TOUCHES_SQL}),
                firsts AS (
                  SELECT DISTINCT ON (uid) uid, kind, at FROM touches
                  WHERE at < ${TO}
                  ORDER BY uid, at
                )
           SELECT kind, COUNT(*)::int AS count FROM firsts
           WHERE at >= ${FROM} AND $2::text IS NOT NULL
           GROUP BY kind`,
          businessId,
          range,
        ),
        this.run<{
          uid: string;
          visits: number;
          spend: string;
          lastAt: string | null;
          firstName: string | null;
          lastName: string | null;
          avatar: string | null;
        }>(
          `WITH touches AS (${TOUCHES_SQL}), per AS (${PER_CUSTOMER_SQL})
           SELECT per.uid, per.visits, per."periodSpend" AS spend, per."lastAt",
                  u."firstName", u."lastName", u."avatar"
           FROM per
           JOIN "users" u ON u."id" = per.uid
           WHERE per."activeInPeriod" AND per."periodSpend" > 0
           ORDER BY per."periodSpend" DESC, per.visits DESC
           LIMIT ${TOP_LIMIT}`,
          businessId,
          range,
        ),
        this.eventTotals(businessId, range),
        this.run<{ issued: number }>(
          `SELECT COALESCE(SUM(pt."amount"), 0)::int AS issued
           FROM "point_transactions" pt
           WHERE pt."businessId" = $1 AND pt."deletedAt" IS NULL AND pt."type" = 'earned'
             AND pt."createdAt" >= ${FROM} AND pt."createdAt" < ${TO}
             AND ${inBranch(`pt."branchId"`)} AND $2::text IS NOT NULL`,
          businessId,
          range,
        ),
        this.heatmap(businessId, range),
      ]);

    const row = totals[0] ?? {};
    const total = num(row.total);
    const active = num(row.active);
    const pointsByUser =
      await this.loyaltyService.getBusinessPointsForCustomers(
        topRows.map((r) => r.uid),
        businessId,
      );
    const [salesRow] = await this.run<{ orders: number }>(
      `WITH sales AS (${SALES_SQL})
       SELECT COUNT(*) FILTER (WHERE at >= ${FROM})::int AS orders FROM sales`,
      businessId,
      range,
    );

    const segment = (count: unknown, spend: unknown) => ({
      count: num(count),
      share: ratio(num(count), total),
      spend: round2(num(spend)),
    });

    return {
      range,
      total: compare(total, row.previousTotal),
      active: compare(active, row.previousActive),
      new: compare(row.new, row.previousNew),
      returning: num(row.returning),
      dormant: compare(row.dormant, row.previousDormant),
      repeatRate: {
        current: ratio(num(row.repeaters), total),
        previous: ratio(num(row.previousRepeaters), num(row.previousTotal)),
      },
      averageSpend: round2(ratio(num(row.periodSpend), num(row.periodBuyers))),
      visitsPerActiveCustomer: round2(
        ratio(num(row.activeVisits), active) * (30 / range.days),
      ),
      segments: {
        vip: segment(row.vip, row.vipSpend),
        regular: segment(row.regular, row.regularSpend),
        new: segment(row.recentNew, row.recentNewSpend),
        lapsed: segment(row.lapsed, row.lapsedSpend),
      },
      growth,
      acquisition: firstTouch.map((r) => ({
        kind: r.kind,
        count: num(r.count),
      })),
      touchpoints: {
        visits: events.visit.current,
        claims: events.claim.current,
        saves: events.save.current,
        chats: events.chat.current,
        reviews: events.review.current,
        orders: num(salesRow?.orders),
        pointsIssued: num(points[0]?.issued),
      },
      topCustomers: topRows.map((r) => {
        const pointsBalance = pointsByUser.get(r.uid) ?? 0;
        return {
          userId: r.uid,
          name: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
          avatarUrl: r.avatar ?? null,
          visits: num(r.visits),
          spend: round2(num(r.spend)),
          lastVisitAt: r.lastAt,
          pointsBalance,
          tier: this.loyaltyService.tierForPoints(pointsBalance),
        };
      }),
      heatmap,
    };
  }

  /** New vs returning active customers per week of the period. */
  private async customerGrowth(businessId: string, range: AnalyticsRange) {
    const rows = await this.run<{
      week: string;
      newCustomers: number;
      returning: number;
    }>(
      `WITH touches AS (${TOUCHES_SQL}),
            firsts AS (SELECT uid, MIN(at) AS "firstAt" FROM touches GROUP BY uid),
            weeks AS (
              SELECT generate_series(
                date_trunc('week', ${local(FROM)}),
                date_trunc('week', ${local(`${TO} - interval '1 microsecond'`)}),
                interval '1 week'
              ) AS week
            ),
            active AS (
              SELECT DISTINCT date_trunc('week', ${local('t.at')}) AS week, t.uid
              FROM touches t
              WHERE t.at >= ${FROM} AND t.at < ${TO} AND $2::text IS NOT NULL
            )
       SELECT to_char(w.week, 'YYYY-MM-DD') AS week,
              COUNT(a.uid) FILTER (
                WHERE date_trunc('week', ${local('f."firstAt"')}) = w.week
              )::int AS "newCustomers",
              COUNT(a.uid) FILTER (
                WHERE date_trunc('week', ${local('f."firstAt"')}) < w.week
              )::int AS returning
       FROM weeks w
       LEFT JOIN active a ON a.week = w.week
       LEFT JOIN firsts f ON f.uid = a.uid
       GROUP BY w.week
       ORDER BY w.week`,
      businessId,
      range,
    );
    return rows.map((r) => ({
      weekStart: r.week,
      new: num(r.newCustomers),
      returning: num(r.returning),
    }));
  }

  /* ------------------------------------------------------------------------ */
  /* Deals                                                                    */
  /* ------------------------------------------------------------------------ */

  async getDeals(businessId: string, query: AnalyticsRangeQueryDto) {
    const range = await this.resolveRange(businessId, query);

    const deals = await this.run<{
      id: string;
      name: string;
      offerType: string | null;
      pricingType: string | null;
      discountValue: string | null;
      price: string | null;
      endDate: string | null;
      live: boolean;
      branches: number;
      views: number;
      likes: number;
      saves: number;
      claims: number;
      previousClaims: number;
      redeemed: number;
      revenue: string;
    }>(
      `WITH offers AS (
         SELECT o.*, COALESCE(o."dealGroupId", o."id") AS "groupId"
         FROM "catalogue_offers" o
         WHERE o."businessId" = $1 AND o."deletedAt" IS NULL AND ${inBranch(`o."branchId"`)}
       ),
       claims AS (
         SELECT off."groupId",
                COUNT(*) FILTER (WHERE c."createdAt" >= ${FROM} AND c."createdAt" < ${TO})::int AS claims,
                COUNT(*) FILTER (WHERE c."createdAt" >= ${PREV_FROM} AND c."createdAt" < ${FROM})::int
                  AS "previousClaims",
                COUNT(*) FILTER (WHERE c."redeemedAt" >= ${FROM} AND c."redeemedAt" < ${TO})::int
                  AS redeemed,
                COALESCE(SUM(off."calculatedPrice") FILTER (
                  WHERE c."redeemedAt" >= ${FROM} AND c."redeemedAt" < ${TO}
                ), 0) AS revenue
         FROM "catalogue_offer_claims" c
         JOIN offers off ON off."id" = c."offerId"
         WHERE c."deletedAt" IS NULL AND ${inWindow(`c."createdAt"`)}
            OR (c."deletedAt" IS NULL AND c."redeemedAt" >= ${FROM} AND c."redeemedAt" < ${TO})
         GROUP BY off."groupId"
       ),
       saves AS (
         SELECT off."groupId", COUNT(*)::int AS saves
         FROM "deal_saves" s JOIN offers off ON off."id" = s."offerId"
         WHERE s."deletedAt" IS NULL
         GROUP BY off."groupId"
       )
       SELECT g."groupId" AS id,
              (ARRAY_AGG(g."name" ORDER BY g."createdAt"))[1] AS name,
              (ARRAY_AGG(g."offerType" ORDER BY g."createdAt"))[1] AS "offerType",
              (ARRAY_AGG(g."pricingType" ORDER BY g."createdAt"))[1] AS "pricingType",
              (ARRAY_AGG(g."discountValue" ORDER BY g."createdAt"))[1] AS "discountValue",
              (ARRAY_AGG(g."calculatedPrice" ORDER BY g."createdAt"))[1] AS price,
              MAX(g."endDate") AS "endDate",
              BOOL_OR(g."status" = 'active' AND (g."endDate" IS NULL OR g."endDate" > now() AT TIME ZONE 'UTC')) AS live,
              COUNT(DISTINCT g."branchId")::int AS branches,
              COALESCE(SUM(g."views"), 0)::int AS views,
              COALESCE(SUM(g."likesCount"), 0)::int AS likes,
              COALESCE(MAX(s.saves), 0)::int AS saves,
              COALESCE(MAX(c.claims), 0)::int AS claims,
              COALESCE(MAX(c."previousClaims"), 0)::int AS "previousClaims",
              COALESCE(MAX(c.redeemed), 0)::int AS redeemed,
              COALESCE(MAX(c.revenue), 0) AS revenue
       FROM offers g
       LEFT JOIN claims c ON c."groupId" = g."groupId"
       LEFT JOIN saves s ON s."groupId" = g."groupId"
       GROUP BY g."groupId"
       ORDER BY COALESCE(MAX(c.claims), 0) DESC, COALESCE(SUM(g."views"), 0) DESC
       LIMIT 50`,
      businessId,
      range,
    );

    const rows = deals.map((d) => {
      const views = num(d.views);
      const claims = num(d.claims);
      const redeemed = num(d.redeemed);
      const revenue = round2(num(d.revenue));
      return {
        id: d.id,
        name: d.name,
        offerType: d.offerType,
        pricingType: d.pricingType,
        discountValue: d.discountValue != null ? num(d.discountValue) : null,
        price: d.price != null ? round2(num(d.price)) : null,
        endDate: d.endDate,
        live: Boolean(d.live),
        branches: num(d.branches),
        views,
        likes: num(d.likes),
        saves: num(d.saves),
        claims,
        previousClaims: num(d.previousClaims),
        redeemed,
        revenue,
        claimRate: ratio(claims, views),
        averageBasket: round2(ratio(revenue, redeemed)),
      };
    });

    const sum = (
      key:
        | 'views'
        | 'saves'
        | 'claims'
        | 'previousClaims'
        | 'redeemed'
        | 'revenue',
    ) => rows.reduce((total, row) => total + row[key], 0);
    const views = sum('views');
    const claims = sum('claims');

    return {
      range,
      totals: {
        views,
        claims: { current: claims, previous: sum('previousClaims') },
        redeemed: sum('redeemed'),
        revenue: round2(sum('revenue')),
        claimRate: ratio(claims, views),
        live: rows.filter((r) => r.live).length,
        ended: rows.filter((r) => !r.live).length,
      },
      funnel: {
        views,
        saves: sum('saves'),
        claims,
        redeemed: sum('redeemed'),
      },
      deals: rows,
    };
  }

  /* ------------------------------------------------------------------------ */
  /* POS                                                                      */
  /* ------------------------------------------------------------------------ */

  async getPos(businessId: string, query: AnalyticsRangeQueryDto) {
    const range = await this.resolveRange(businessId, query);
    const posWhere = `ps."businessId" = $1 AND ps."deletedAt" IS NULL AND ${inBranch(`ps."branchId"`)}`;
    const at = `COALESCE(ps."orderedAt", ps."createdAt")`;

    const [
      totals,
      items,
      refunds,
      variance,
      hourly,
      tenders,
      topItems,
      cashiers,
    ] = await Promise.all([
      this.run(
        `SELECT
             COALESCE(SUM(ps."total") FILTER (WHERE ${at} >= ${FROM}), 0) AS sales,
             COALESCE(SUM(ps."total") FILTER (WHERE ${at} < ${FROM}), 0) AS "previousSales",
             COUNT(*) FILTER (WHERE ${at} >= ${FROM})::int AS tickets,
             COUNT(*) FILTER (WHERE ${at} < ${FROM})::int AS "previousTickets",
             COALESCE(SUM(ps."tipAmount") FILTER (WHERE ${at} >= ${FROM}), 0) AS tips,
             COALESCE(SUM(ps."discountAmount") FILTER (WHERE ${at} >= ${FROM}), 0) AS discounts
           FROM "pos_sales" ps
           WHERE ${posWhere} AND ps."status" <> 'refunded' AND ${inWindow(at)}`,
        businessId,
        range,
      ),
      this.run(
        `SELECT COALESCE(SUM(psi."quantity" - COALESCE(psi."refundedQuantity", 0)), 0)::int AS items
           FROM "pos_sale_items" psi
           JOIN "pos_sales" ps ON ps."id" = psi."saleId"
           WHERE ${posWhere} AND psi."deletedAt" IS NULL AND ps."status" <> 'refunded'
             AND ${at} >= ${FROM} AND ${at} < ${TO} AND $2::text IS NOT NULL`,
        businessId,
        range,
      ),
      this.run(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(ps."total"), 0) AS amount
           FROM "pos_sales" ps
           WHERE ${posWhere} AND ps."status" IN ('refunded', 'partial_refund')
             AND COALESCE(ps."refundedAt", ps."updatedAt") >= ${FROM}
             AND COALESCE(ps."refundedAt", ps."updatedAt") < ${TO} AND $2::text IS NOT NULL`,
        businessId,
        range,
      ),
      this.run(
        `SELECT COALESCE(SUM(s."variance"), 0) AS variance,
                  COUNT(*) FILTER (WHERE s."variance" IS NOT NULL)::int AS counted,
                  COUNT(*)::int AS sessions
           FROM "pos_register_sessions" s
           WHERE s."businessId" = $1 AND s."deletedAt" IS NULL AND ${inBranch(`s."branchId"`)}
             AND s."openedAt" >= ${FROM} AND s."openedAt" < ${TO} AND $2::text IS NOT NULL`,
        businessId,
        range,
      ),
      this.run<{ hour: number; sales: string; tickets: number }>(
        `SELECT EXTRACT(HOUR FROM ${local(at)})::int AS hour,
                  COALESCE(SUM(ps."total"), 0) AS sales, COUNT(*)::int AS tickets
           FROM "pos_sales" ps
           WHERE ${posWhere} AND ps."status" <> 'refunded'
             AND ${at} >= ${FROM} AND ${at} < ${TO} AND $2::text IS NOT NULL
           GROUP BY 1`,
        businessId,
        range,
      ),
      this.run<{ method: string; count: number; amount: string }>(
        `WITH tenders AS (
             SELECT ps."id", ps."paymentMethod"::text AS method, ps."total"::numeric AS amount
             FROM "pos_sales" ps
             WHERE ${posWhere} AND ps."status" <> 'refunded' AND ps."paymentMethod" <> 'split'
               AND ${at} >= ${FROM} AND ${at} < ${TO}
             UNION ALL
             SELECT ps."id", sp."method"::text, sp."amount"::numeric
             FROM "pos_split_payments" sp
             JOIN "pos_sales" ps ON ps."id" = sp."saleId"
             WHERE ${posWhere} AND sp."deletedAt" IS NULL AND ps."status" <> 'refunded'
               AND ps."paymentMethod" = 'split'
               AND ${at} >= ${FROM} AND ${at} < ${TO} AND $2::text IS NOT NULL
           )
           SELECT method, COUNT(DISTINCT "id")::int AS count, COALESCE(SUM(amount), 0) AS amount
           FROM tenders GROUP BY method ORDER BY SUM(amount) DESC`,
        businessId,
        range,
      ),
      this.posTopItems(businessId, range),
      this.cashiers(businessId, range),
    ]);

    const t = totals[0] ?? {};
    const tickets = num(t.tickets);
    const sales = round2(num(t.sales));
    const itemsSold = num(items[0]?.items);
    const tenderTotal = tenders.reduce((sum, r) => sum + num(r.amount), 0);

    return {
      range,
      sales: compare(sales, t.previousSales),
      tickets: compare(tickets, t.previousTickets),
      averageTicket: {
        current: round2(ratio(sales, tickets)),
        previous: round2(ratio(num(t.previousSales), num(t.previousTickets))),
      },
      itemsSold,
      itemsPerTicket: round2(ratio(itemsSold, tickets)),
      tips: round2(num(t.tips)),
      discounts: round2(num(t.discounts)),
      refunds: {
        count: num(refunds[0]?.count),
        amount: round2(num(refunds[0]?.amount)),
        rate: ratio(num(refunds[0]?.count), tickets + num(refunds[0]?.count)),
      },
      drawer: {
        variance: round2(num(variance[0]?.variance)),
        countedSessions: num(variance[0]?.counted),
        sessions: num(variance[0]?.sessions),
      },
      hourly: Array.from({ length: 24 }, (_, hour) => {
        const row = hourly.find((r) => num(r.hour) === hour);
        return {
          hour,
          sales: round2(num(row?.sales)),
          tickets: num(row?.tickets),
        };
      }),
      tenders: tenders.map((r) => ({
        method: r.method,
        count: num(r.count),
        amount: round2(num(r.amount)),
        share: ratio(num(r.amount), tenderTotal),
      })),
      topItems,
      cashiers,
    };
  }

  private async posTopItems(businessId: string, range: AnalyticsRange) {
    const at = `COALESCE(ps."orderedAt", ps."createdAt")`;
    const rows = await this.run<{
      name: string;
      quantity: number;
      revenue: string;
      tickets: number;
    }>(
      `SELECT psi."productName" AS name,
              SUM(psi."quantity" - COALESCE(psi."refundedQuantity", 0))::int AS quantity,
              COALESCE(SUM(psi."totalPrice"), 0) AS revenue,
              COUNT(DISTINCT ps."id")::int AS tickets
       FROM "pos_sale_items" psi
       JOIN "pos_sales" ps ON ps."id" = psi."saleId"
       WHERE ps."businessId" = $1 AND ps."deletedAt" IS NULL AND psi."deletedAt" IS NULL
         AND ps."status" <> 'refunded' AND ${inBranch(`ps."branchId"`)}
         AND ${at} >= ${FROM} AND ${at} < ${TO} AND $2::text IS NOT NULL
       GROUP BY psi."productName"
       ORDER BY SUM(psi."totalPrice") DESC, psi."productName"
       LIMIT ${TOP_LIMIT}`,
      businessId,
      range,
    );
    return rows.map((r) => ({
      name: r.name,
      quantity: num(r.quantity),
      revenue: round2(num(r.revenue)),
      tickets: num(r.tickets),
    }));
  }

  /* ------------------------------------------------------------------------ */
  /* Locations                                                                */
  /* ------------------------------------------------------------------------ */

  async getLocations(businessId: string, query: AnalyticsRangeQueryDto) {
    const range = await this.resolveRange(businessId, query);

    const [branches, heatmap] = await Promise.all([
      this.run<{
        branchId: string;
        name: string;
        code: string | null;
        address: string | null;
        city: string | null;
        isMainBranch: boolean;
        isActive: boolean;
        revenue: string;
        previousRevenue: string;
        orders: number;
        previousOrders: number;
        posTickets: number;
        onlineOrders: number;
        customers: number;
        visits: number;
        claims: number;
        redemptions: number;
        dealViews: number;
        rating: string | null;
        reviews: number;
      }>(
        `WITH sales AS (${SALES_SQL}), events AS (${EVENTS_SQL}),
              sale_totals AS (
                SELECT "branchId",
                       COALESCE(SUM(amount) FILTER (WHERE at >= ${FROM}), 0) AS revenue,
                       COALESCE(SUM(amount) FILTER (WHERE at < ${FROM}), 0) AS "previousRevenue",
                       COUNT(*) FILTER (WHERE at >= ${FROM})::int AS orders,
                       COUNT(*) FILTER (WHERE at < ${FROM})::int AS "previousOrders",
                       COUNT(*) FILTER (WHERE at >= ${FROM} AND channel = 'pos')::int AS "posTickets",
                       COUNT(*) FILTER (WHERE at >= ${FROM} AND channel = 'order')::int AS "onlineOrders",
                       COUNT(DISTINCT uid) FILTER (WHERE at >= ${FROM})::int AS customers
                FROM sales GROUP BY "branchId"
              ),
              event_totals AS (
                SELECT "branchId",
                       COUNT(*) FILTER (WHERE kind = 'visit' AND at >= ${FROM})::int AS visits,
                       COUNT(*) FILTER (WHERE kind = 'claim' AND at >= ${FROM})::int AS claims,
                       COUNT(*) FILTER (WHERE kind = 'redemption' AND at >= ${FROM})::int AS redemptions
                FROM events GROUP BY "branchId"
              ),
              offer_totals AS (
                SELECT o."branchId", COALESCE(SUM(o."views"), 0)::int AS "dealViews"
                FROM "catalogue_offers" o
                WHERE o."businessId" = $1 AND o."deletedAt" IS NULL
                GROUP BY o."branchId"
              ),
              review_totals AS (
                SELECT o."branchId", AVG(r."rating") AS rating, COUNT(r."rating")::int AS reviews
                FROM "deal_reviews" r
                JOIN "catalogue_offers" o ON o."id" = r."offerId"
                WHERE o."businessId" = $1 AND r."deletedAt" IS NULL AND r."status" = 'approved'
                GROUP BY o."branchId"
              )
         SELECT b."id" AS "branchId", b."name", COALESCE(b."username", b."uniqueCode") AS code,
                b."address", b."city", b."isMainBranch", b."isActive",
                COALESCE(s.revenue, 0) AS revenue, COALESCE(s."previousRevenue", 0) AS "previousRevenue",
                COALESCE(s.orders, 0) AS orders, COALESCE(s."previousOrders", 0) AS "previousOrders",
                COALESCE(s."posTickets", 0) AS "posTickets",
                COALESCE(s."onlineOrders", 0) AS "onlineOrders",
                COALESCE(s.customers, 0) AS customers,
                COALESCE(e.visits, 0) AS visits, COALESCE(e.claims, 0) AS claims,
                COALESCE(e.redemptions, 0) AS redemptions,
                COALESCE(ot."dealViews", 0) AS "dealViews",
                rt.rating, COALESCE(rt.reviews, 0) AS reviews
         FROM "branches" b
         LEFT JOIN sale_totals s ON s."branchId" = b."id"
         LEFT JOIN event_totals e ON e."branchId" = b."id"
         LEFT JOIN offer_totals ot ON ot."branchId" = b."id"
         LEFT JOIN review_totals rt ON rt."branchId" = b."id"
         WHERE b."businessId" = $1 AND b."deletedAt" IS NULL AND ${inBranch(`b."id"`)}
         ORDER BY COALESCE(s.revenue, 0) DESC, b."name"`,
        businessId,
        range,
      ),
      this.heatmap(businessId, range),
    ]);

    const rows = branches.map((b) => ({
      branchId: b.branchId,
      name: b.name,
      code: b.code,
      address: [b.address, b.city].filter(Boolean).join(', ') || null,
      isMainBranch: Boolean(b.isMainBranch),
      isActive: Boolean(b.isActive),
      revenue: compare(b.revenue, b.previousRevenue),
      orders: compare(b.orders, b.previousOrders),
      averageOrderValue: round2(ratio(num(b.revenue), num(b.orders))),
      posTickets: num(b.posTickets),
      onlineOrders: num(b.onlineOrders),
      customers: num(b.customers),
      visits: num(b.visits),
      claims: num(b.claims),
      redemptions: num(b.redemptions),
      dealViews: num(b.dealViews),
      rating: b.rating != null ? Math.round(num(b.rating) * 10) / 10 : null,
      reviews: num(b.reviews),
    }));

    const totalRevenue = rows.reduce((sum, r) => sum + r.revenue.current, 0);
    const best = rows.reduce((max, r) => Math.max(max, r.revenue.current), 0);

    return {
      range,
      totals: {
        branches: rows.length,
        revenue: compare(
          totalRevenue,
          rows.reduce((sum, r) => sum + r.revenue.previous, 0),
        ),
        orders: rows.reduce((sum, r) => sum + r.orders.current, 0),
        visits: rows.reduce((sum, r) => sum + r.visits, 0),
        dealViews: rows.reduce((sum, r) => sum + r.dealViews, 0),
      },
      branches: rows.map((r) => ({
        ...r,
        revenueShare: ratio(r.revenue.current, totalRevenue),
        percentOfBest:
          best > 0 ? Math.round((r.revenue.current / best) * 100) : 0,
      })),
      heatmap,
    };
  }

  /* ------------------------------------------------------------------------ */
  /* Audit                                                                    */
  /* ------------------------------------------------------------------------ */

  /** Supervisor overrides in the period, for the export's audit section. */
  async getOverrides(businessId: string, range: AnalyticsRange) {
    const rows = await this.run<{
      createdAt: string;
      action: string;
      reason: string | null;
      referenceId: string | null;
      supervisor: string | null;
      requestedBy: string | null;
      branchName: string | null;
    }>(
      `SELECT l."createdAt", l."action", l."reason", l."referenceId",
              TRIM(CONCAT(sup."firstName", ' ', sup."lastName")) AS supervisor,
              TRIM(CONCAT(req."firstName", ' ', req."lastName")) AS "requestedBy",
              b."name" AS "branchName"
       FROM "pos_override_logs" l
       LEFT JOIN "users" sup ON sup."id" = l."supervisorId"
       LEFT JOIN "users" req ON req."id" = l."requestedById"
       LEFT JOIN "branches" b ON b."id" = l."branchId"
       WHERE l."businessId" = $1 AND l."deletedAt" IS NULL AND ${inBranch(`l."branchId"`)}
         AND l."createdAt" >= ${FROM} AND l."createdAt" < ${TO} AND $2::text IS NOT NULL
       ORDER BY l."createdAt" DESC
       LIMIT 1000`,
      businessId,
      range,
    );
    return rows;
  }
}
