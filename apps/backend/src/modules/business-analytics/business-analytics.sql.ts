/**
 * SQL shared by the business analytics queries.
 *
 * Every statement uses the same parameter layout so fragments compose:
 *
 *   $1 business id · $2 previous-period start · $3 period start ·
 *   $4 period end (exclusive) · $5 branch id or null
 *
 * Bounds arrive as ISO strings and are turned into UTC wall time here: the
 * columns are `timestamp without time zone` holding UTC, and handing the
 * driver a `Date` would serialise it in the server's local zone.
 */
export const BUSINESS_TZ = 'Africa/Lagos';

export const PREV_FROM = `($2::timestamptz AT TIME ZONE 'UTC')`;
export const FROM = `($3::timestamptz AT TIME ZONE 'UTC')`;
export const TO = `($4::timestamptz AT TIME ZONE 'UTC')`;

export const inBranch = (column: string) =>
  `($5::uuid IS NULL OR ${column} = $5::uuid)`;

/** A UTC timestamp column as business-local wall time, for hour/day buckets. */
export const local = (column: string) =>
  `((${column}) AT TIME ZONE 'UTC' AT TIME ZONE '${BUSINESS_TZ}')`;

/** Previous-period start to period end. */
export const inWindow = (column: string) =>
  `${column} >= ${PREV_FROM} AND ${column} < ${TO}`;

/**
 * Every sale in the window, one row each: POS sales and catalogue orders that
 * were not settled through the till (a POS order paid at the till already has
 * its `pos_sales` row, so it is counted once).
 */
export const SALES_SQL = `
  SELECT ps."id", ps."branchId", ps."customerId" AS uid, ps."total"::numeric AS amount,
         COALESCE(ps."orderedAt", ps."createdAt") AS at, 'pos'::text AS channel,
         ps."cashierId", ps."paymentMethod"::text AS "paymentMethod"
  FROM "pos_sales" ps
  WHERE ps."businessId" = $1 AND ps."deletedAt" IS NULL AND ps."status" <> 'refunded'
    AND ${inWindow(`COALESCE(ps."orderedAt", ps."createdAt")`)}
    AND ${inBranch(`ps."branchId"`)}
  UNION ALL
  SELECT co."id", co."branchId", co."customerId", co."totalAmount"::numeric,
         co."createdAt", 'order'::text, NULL::uuid, NULL::text
  FROM "catalogue_orders" co
  WHERE co."businessId" = $1 AND co."deletedAt" IS NULL
    AND co."status" NOT IN ('cancelled', 'rejected', 'refunded')
    AND NOT EXISTS (
      SELECT 1 FROM "pos_sales" x WHERE x."orderId" = co."id" AND x."deletedAt" IS NULL
    )
    AND ${inWindow(`co."createdAt"`)}
    AND ${inBranch(`co."branchId"`)}
`;

/**
 * Engagement in the window that is not a sale: visits, deal claims and
 * redemptions, deal saves, conversations and deal reviews.
 */
export const EVENTS_SQL = `
  SELECT v."branchId", v."customerId" AS uid, v."createdAt" AS at, 'visit'::text AS kind
  FROM "visits" v
  WHERE v."businessId" = $1 AND v."deletedAt" IS NULL
    AND ${inWindow(`v."createdAt"`)} AND ${inBranch(`v."branchId"`)}
  UNION ALL
  SELECT o."branchId", c."userId", c."createdAt", 'claim'
  FROM "catalogue_offer_claims" c
  JOIN "catalogue_offers" o ON o."id" = c."offerId"
  WHERE o."businessId" = $1 AND c."deletedAt" IS NULL
    AND ${inWindow(`c."createdAt"`)} AND ${inBranch(`o."branchId"`)}
  UNION ALL
  SELECT o."branchId", c."userId", c."redeemedAt", 'redemption'
  FROM "catalogue_offer_claims" c
  JOIN "catalogue_offers" o ON o."id" = c."offerId"
  WHERE o."businessId" = $1 AND c."deletedAt" IS NULL AND c."redeemedAt" IS NOT NULL
    AND ${inWindow(`c."redeemedAt"`)} AND ${inBranch(`o."branchId"`)}
  UNION ALL
  SELECT o."branchId", s."userId", s."createdAt", 'save'
  FROM "deal_saves" s
  JOIN "catalogue_offers" o ON o."id" = s."offerId"
  WHERE o."businessId" = $1 AND s."deletedAt" IS NULL
    AND ${inWindow(`s."createdAt"`)} AND ${inBranch(`o."branchId"`)}
  UNION ALL
  SELECT t."branchId", t."customerId", t."createdAt", 'chat'
  FROM "conversation_threads" t
  WHERE t."businessId" = $1 AND t."deletedAt" IS NULL
    AND ${inWindow(`t."createdAt"`)} AND ${inBranch(`t."branchId"`)}
  UNION ALL
  SELECT o."branchId", r."userId", r."createdAt", 'review'
  FROM "deal_reviews" r
  JOIN "catalogue_offers" o ON o."id" = r."offerId"
  WHERE o."businessId" = $1 AND r."deletedAt" IS NULL
    AND ${inWindow(`r."createdAt"`)} AND ${inBranch(`o."branchId"`)}
`;

/**
 * Everything a signed-in customer ever did at the business (no time bound),
 * one row per touch. `kind` separates purchases (`pos`, `order`) from visits,
 * bookings, claims, saves and chats.
 */
export const TOUCHES_SQL = `
  SELECT ps."customerId" AS uid, ps."branchId", ps."total"::numeric AS amount,
         COALESCE(ps."orderedAt", ps."createdAt") AS at, 'pos'::text AS kind
  FROM "pos_sales" ps
  WHERE ps."businessId" = $1 AND ps."customerId" IS NOT NULL
    AND ps."deletedAt" IS NULL AND ps."status" <> 'refunded' AND ${inBranch(`ps."branchId"`)}
  UNION ALL
  SELECT co."customerId", co."branchId", co."totalAmount"::numeric, co."createdAt", 'order'
  FROM "catalogue_orders" co
  WHERE co."businessId" = $1 AND co."customerId" IS NOT NULL AND co."deletedAt" IS NULL
    AND co."status" NOT IN ('cancelled', 'rejected', 'refunded')
    AND NOT EXISTS (
      SELECT 1 FROM "pos_sales" x WHERE x."orderId" = co."id" AND x."deletedAt" IS NULL
    )
    AND ${inBranch(`co."branchId"`)}
  UNION ALL
  SELECT v."customerId", v."branchId", 0, v."createdAt", 'visit'
  FROM "visits" v
  WHERE v."businessId" = $1 AND v."customerId" IS NOT NULL AND v."deletedAt" IS NULL
    AND ${inBranch(`v."branchId"`)}
  UNION ALL
  SELECT b."customerId", b."branchId", 0, b."createdAt", 'booking'
  FROM "bookings" b
  WHERE b."businessId" = $1 AND b."customerId" IS NOT NULL AND b."deletedAt" IS NULL
    AND b."cancelledAt" IS NULL AND ${inBranch(`b."branchId"`)}
  UNION ALL
  SELECT c."userId", o."branchId", 0, c."createdAt", 'claim'
  FROM "catalogue_offer_claims" c
  JOIN "catalogue_offers" o ON o."id" = c."offerId"
  WHERE o."businessId" = $1 AND c."userId" IS NOT NULL AND c."deletedAt" IS NULL
    AND ${inBranch(`o."branchId"`)}
  UNION ALL
  SELECT s."userId", o."branchId", 0, s."createdAt", 'save'
  FROM "deal_saves" s
  JOIN "catalogue_offers" o ON o."id" = s."offerId"
  WHERE o."businessId" = $1 AND s."deletedAt" IS NULL AND ${inBranch(`o."branchId"`)}
  UNION ALL
  SELECT t."customerId", t."branchId", 0, t."createdAt", 'chat'
  FROM "conversation_threads" t
  WHERE t."businessId" = $1 AND t."customerId" IS NOT NULL AND t."deletedAt" IS NULL
    AND ${inBranch(`t."branchId"`)}
`;

/** Per-customer roll-up over `touches`, with the period split. */
export const PER_CUSTOMER_SQL = `
  SELECT uid,
         COUNT(*) FILTER (WHERE kind IN ('pos', 'order', 'visit', 'booking'))::int AS visits,
         COUNT(*) FILTER (WHERE kind IN ('pos', 'order'))::int AS purchases,
         COALESCE(SUM(amount), 0)::numeric AS spend,
         COALESCE(SUM(amount) FILTER (WHERE at >= ${FROM} AND at < ${TO}), 0)::numeric
           AS "periodSpend",
         COUNT(*) FILTER (
           WHERE kind IN ('pos', 'order') AND at >= ${FROM} AND at < ${TO}
         )::int AS "periodPurchases",
         MIN(at) AS "firstAt",
         MAX(at) FILTER (WHERE at < ${TO}) AS "lastAt",
         BOOL_OR(at >= ${FROM} AND at < ${TO}) AS "activeInPeriod",
         BOOL_OR(at >= ${PREV_FROM} AND at < ${FROM}) AS "activeInPrevious"
  FROM touches
  WHERE at < ${TO}
  GROUP BY uid
`;
