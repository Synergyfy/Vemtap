/**
 * Everything one customer has done on VemTap, as rows of one shape.
 *
 * Parameters: $1 user id, $2 lower-cased email, $3 phone ('' when none),
 * $4 from (ISO string, or NULL for all time). Claims are matched by the same
 * rule as `GET /me/claims` (linked user, or the account's email / phone, for
 * claims made before the link existed). Visits recorded together with an
 * order are left out — the order row already stands for that visit.
 */
const FROM = `($4::text IS NULL OR x."at" >= ($4::timestamptz AT TIME ZONE 'UTC'))`;

export const ACTIVITY_ROWS_SQL = `
SELECT * FROM (
  SELECT 'claim'::text AS kind, c.id::text AS id, c."createdAt" AS "at",
         o.id::text AS "refId", b.id::text AS "businessId", b.name AS "businessName",
         b."uniqueCode" AS "businessCode", b."logoUrl" AS "businessLogo",
         br.name AS "branchName", br.address AS "branchAddress",
         o.name AS title, o."mainImage" AS image, o."calculatedPrice"::numeric AS amount,
         NULL::int AS rating, NULL::text AS body, NULL::text AS reply,
         CASE WHEN c.status::text = 'redeemed' THEN 'redeemed'
              WHEN c.status::text = 'expired' OR c."expiresAt" < now() AT TIME ZONE 'UTC' THEN 'expired'
              ELSE 'active' END AS status
    FROM catalogue_offer_claims c
    JOIN catalogue_offers o ON o.id = c."offerId"
    LEFT JOIN branches br ON br.id = o."branchId"
    LEFT JOIN businesses b ON b.id = br."businessId"
   WHERE c."deletedAt" IS NULL
     AND (c."userId" = $1::uuid OR LOWER(c.email) = $2 OR ($3 <> '' AND c.phone = $3))
  UNION ALL
  SELECT 'order', ord.id::text, ord."createdAt", ord.id::text, b.id::text, b.name,
         b."uniqueCode", b."logoUrl", br.name, br.address,
         NULL, (SELECT ci."mainImage" FROM catalogue_order_items li
                  JOIN catalogue_items ci ON ci.id = li."itemId"
                 WHERE li."orderId" = ord.id AND ci."mainImage" IS NOT NULL LIMIT 1),
         ord."totalAmount"::numeric, NULL, NULL, NULL, ord.status::text
    FROM catalogue_orders ord
    LEFT JOIN branches br ON br.id = ord."branchId"
    LEFT JOIN businesses b ON b.id = ord."businessId"
   WHERE ord."deletedAt" IS NULL AND ord."customerId" = $1::uuid
  UNION ALL
  SELECT 'booking', bk.id::text, bk."createdAt", bk.id::text, b.id::text, b.name,
         b."uniqueCode", b."logoUrl", br.name, br.address,
         bk."itemName", ci."mainImage", NULL, NULL, NULL, NULL, bk.status::text
    FROM bookings bk
    LEFT JOIN branches br ON br.id = bk."branchId"
    LEFT JOIN businesses b ON b.id = bk."businessId"
    LEFT JOIN catalogue_items ci ON ci.id = bk."itemId"
   WHERE bk."deletedAt" IS NULL AND bk."customerId" = $1::uuid
  UNION ALL
  SELECT 'visit', v.id::text, v."createdAt", br.id::text, b.id::text, b.name,
         b."uniqueCode", b."logoUrl", br.name, br.address,
         NULL, NULL, NULL, NULL, NULL, NULL, v.status::text
    FROM visits v
    LEFT JOIN branches br ON br.id = v."branchId"
    LEFT JOIN businesses b ON b.id = COALESCE(v."businessId", br."businessId")
   WHERE v."deletedAt" IS NULL AND v."customerId" = $1::uuid AND v."orderId" IS NULL
  UNION ALL
  SELECT 'review', r.id::text, r."createdAt", o.id::text, b.id::text, b.name,
         b."uniqueCode", b."logoUrl", br.name, br.address,
         o.name, o."mainImage", NULL, r.rating, r.comment, r."merchantReply", r.status::text
    FROM deal_reviews r
    JOIN catalogue_offers o ON o.id = r."offerId"
    LEFT JOIN branches br ON br.id = o."branchId"
    LEFT JOIN businesses b ON b.id = br."businessId"
   WHERE r."deletedAt" IS NULL AND r."userId" = $1::uuid
  UNION ALL
  SELECT 'comment', pc.id::text, pc."createdAt", ci.id::text, b.id::text, b.name,
         b."uniqueCode", b."logoUrl", NULL, NULL,
         ci.name, ci."mainImage", NULL, pc.rating, pc.comment, pc."merchantReply", 'published'
    FROM catalogue_item_comments pc
    JOIN catalogue_items ci ON ci.id = pc."itemId"
    LEFT JOIN businesses b ON b.id = pc."businessId"
   WHERE pc."deletedAt" IS NULL AND pc."userId" = $1::uuid
) x
WHERE ${FROM}
`;

/** Which row kinds each filter keeps. */
export const KIND_FILTER: Record<string, string[] | null> = {
  all: null,
  claims: ['claim'],
  orders: ['order'],
  bookings: ['booking'],
  visits: ['visit', 'order'],
  reviews: ['review', 'comment'],
};
