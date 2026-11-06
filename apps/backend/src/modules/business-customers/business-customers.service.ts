import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { SegmentCriteriaService } from '../contacts/services/segment-criteria.service';
import {
  DORMANT_CUSTOMER_DAYS,
  LAPSED_CUSTOMER_DAYS,
  NEW_CUSTOMER_DAYS,
  VIP_MIN_SPEND,
  VIP_MIN_VISITS,
} from '../../common/utils/customer-segments';
import { csvCell } from '../business-analytics/business-analytics-export.service';
import { BusinessCustomerNote } from './entities/business-customer-note.entity';
import {
  CustomerDirectoryQueryDto,
  CustomerSegment,
  SaveCustomerNoteDto,
} from './dto/business-customers.dto';

const NOW = `(now() AT TIME ZONE 'UTC')`;
const EXPORT_LIMIT = 5000;
const TIMELINE_LIMIT = 5;

const num = (value: unknown) => Number(value) || 0;
const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Every touch a signed-in customer made at the business, newest last, with a
 * short reference for the "last interaction" line. `$1` is the business id,
 * `$2` an optional branch id.
 */
const TOUCHES_SQL = `
  SELECT ps."customerId" AS uid, ps."branchId", ps."total"::numeric AS amount,
         COALESCE(ps."orderedAt", ps."createdAt") AS at, 'pos'::text AS kind,
         ps."receiptNumber"::text AS ref
  FROM "pos_sales" ps
  WHERE ps."businessId" = $1 AND ps."customerId" IS NOT NULL AND ps."deletedAt" IS NULL
    AND ps."status" <> 'refunded' AND ($2::uuid IS NULL OR ps."branchId" = $2::uuid)
  UNION ALL
  SELECT co."customerId", co."branchId", co."totalAmount"::numeric, co."createdAt", 'order',
         UPPER(LEFT(co."id"::text, 8))
  FROM "catalogue_orders" co
  WHERE co."businessId" = $1 AND co."customerId" IS NOT NULL AND co."deletedAt" IS NULL
    AND co."status" NOT IN ('cancelled', 'rejected', 'refunded')
    AND NOT EXISTS (
      SELECT 1 FROM "pos_sales" x WHERE x."orderId" = co."id" AND x."deletedAt" IS NULL
    )
    AND ($2::uuid IS NULL OR co."branchId" = $2::uuid)
  UNION ALL
  SELECT v."customerId", v."branchId", 0, v."createdAt", 'visit', NULL
  FROM "visits" v
  WHERE v."businessId" = $1 AND v."customerId" IS NOT NULL AND v."deletedAt" IS NULL
    AND ($2::uuid IS NULL OR v."branchId" = $2::uuid)
  UNION ALL
  SELECT b."customerId", b."branchId", 0, b."createdAt", 'booking', b."itemName"
  FROM "bookings" b
  WHERE b."businessId" = $1 AND b."customerId" IS NOT NULL AND b."deletedAt" IS NULL
    AND b."cancelledAt" IS NULL AND ($2::uuid IS NULL OR b."branchId" = $2::uuid)
  UNION ALL
  SELECT c."userId", o."branchId", 0, c."createdAt", 'claim', o."name"
  FROM "catalogue_offer_claims" c
  JOIN "catalogue_offers" o ON o."id" = c."offerId"
  WHERE o."businessId" = $1 AND c."userId" IS NOT NULL AND c."deletedAt" IS NULL
    AND ($2::uuid IS NULL OR o."branchId" = $2::uuid)
  UNION ALL
  SELECT t."customerId", t."branchId", 0, t."createdAt", 'chat', NULL
  FROM "conversation_threads" t
  WHERE t."businessId" = $1 AND t."customerId" IS NOT NULL AND t."deletedAt" IS NULL
    AND ($2::uuid IS NULL OR t."branchId" = $2::uuid)
`;

/** Per-customer roll-up and the segment flags the directory filters on. */
const SEGMENTED_SQL = `
  WITH touches AS (${TOUCHES_SQL}),
  per AS (
    SELECT uid,
           COUNT(*) FILTER (WHERE kind IN ('pos', 'order', 'visit', 'booking'))::int AS visits,
           COUNT(*) FILTER (WHERE kind IN ('pos', 'order'))::int AS orders,
           COUNT(*) FILTER (WHERE kind = 'claim')::int AS claims,
           COUNT(*) FILTER (WHERE kind = 'booking')::int AS bookings,
           COALESCE(SUM(amount), 0)::numeric AS spend,
           MIN(at) AS "firstAt",
           MAX(at) AS "lastAt"
    FROM touches GROUP BY uid
  ),
  latest AS (
    SELECT DISTINCT ON (uid) uid, kind AS "lastKind", ref AS "lastRef"
    FROM touches ORDER BY uid, at DESC
  ),
  seg AS (
    SELECT per.*, latest."lastKind", latest."lastRef",
           (per.visits >= ${VIP_MIN_VISITS} OR per.spend >= ${VIP_MIN_SPEND}) AS frequent,
           (per."firstAt" >= ${NOW} - make_interval(days => ${NEW_CUSTOMER_DAYS})) AS "isNew",
           (per."lastAt" < ${NOW} - make_interval(days => ${LAPSED_CUSTOMER_DAYS})) AS inactive
    FROM per JOIN latest USING (uid)
  )
`;

const SEGMENT_WHERE: Record<CustomerSegment, string> = {
  all: 'TRUE',
  frequent: 'seg.frequent',
  new: 'seg."isNew"',
  inactive: 'seg.inactive',
  returning: 'seg.visits >= 2 AND NOT seg.frequent AND NOT seg.inactive',
};

const SEGMENT_NAMES: Record<CustomerSegment, string> = {
  all: 'All Customers',
  frequent: 'Frequent Customers',
  returning: 'Returning Customers',
  new: 'New Customers',
  inactive: 'Inactive Customers',
};

const SORT_ORDER: Record<string, string> = {
  recent: 'seg."lastAt" DESC',
  spend: 'seg.spend DESC, seg."lastAt" DESC',
  visits: 'seg.visits DESC, seg."lastAt" DESC',
  name: `LOWER(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) ASC`,
};

const SEARCH_WHERE = `(
  $3::text IS NULL
  OR (COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) ILIKE $3
  OR u."email" ILIKE $3 OR u."phone" ILIKE $3
)`;

interface DirectoryRow {
  uid: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  visits: number;
  orders: number;
  claims: number;
  bookings: number;
  spend: string;
  firstAt: string;
  lastAt: string;
  lastKind: string;
  lastRef: string | null;
  frequent: boolean;
  isNew: boolean;
  inactive: boolean;
}

/**
 * The business's customer directory and per-customer dossier: everyone who
 * bought, visited, booked, claimed a deal or chatted, with notes the
 * business keeps on them.
 */
@Injectable()
export class BusinessCustomersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(BusinessCustomerNote)
    private readonly notes: Repository<BusinessCustomerNote>,
    private readonly loyaltyService: LoyaltyService,
    private readonly segmentCriteria: SegmentCriteriaService,
  ) {}

  private async checkBranch(businessId: string, branchId?: string) {
    if (!businessId) throw new BadRequestException('Business ID is required');
    if (!branchId) return;
    const owned = await this.dataSource.query<unknown[]>(
      `SELECT 1 FROM "branches" WHERE "id" = $1 AND "businessId" = $2 AND "deletedAt" IS NULL`,
      [branchId, businessId],
    );
    if (!owned.length) throw new NotFoundException('Branch not found');
  }

  private segmentOf(
    row: Pick<DirectoryRow, 'frequent' | 'isNew' | 'inactive' | 'visits'>,
  ) {
    if (row.frequent) return 'frequent';
    if (row.isNew) return 'new';
    if (row.inactive) return 'inactive';
    if (row.visits >= 2) return 'returning';
    return 'occasional';
  }

  private async directoryRows(
    businessId: string,
    query: CustomerDirectoryQueryDto,
    limit: number,
    offset: number,
  ) {
    const segment = query.segment ?? 'all';
    const sort = SORT_ORDER[query.sort ?? 'recent'];
    const search = query.search?.trim() ? `%${query.search.trim()}%` : null;
    return this.dataSource.query<DirectoryRow[]>(
      `${SEGMENTED_SQL}
       SELECT seg.*, u."firstName", u."lastName", u."email", u."phone", u."avatar"
       FROM seg JOIN "users" u ON u."id" = seg.uid
       WHERE ${SEGMENT_WHERE[segment]} AND ${SEARCH_WHERE}
       ORDER BY ${sort}, seg.uid
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [businessId, query.branchId ?? null, search],
    );
  }

  private async withPoints(businessId: string, rows: DirectoryRow[]) {
    const points = await this.loyaltyService.getBusinessPointsForCustomers(
      rows.map((row) => row.uid),
      businessId,
    );
    return rows.map((row) => {
      const pointsBalance = points.get(row.uid) ?? 0;
      return {
        userId: row.uid,
        name: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
        email: row.email,
        phone: row.phone,
        avatarUrl: row.avatar,
        segment: this.segmentOf(row),
        visits: num(row.visits),
        orders: num(row.orders),
        claims: num(row.claims),
        bookings: num(row.bookings),
        spend: round2(num(row.spend)),
        pointsBalance,
        tier: this.loyaltyService.tierForPoints(pointsBalance),
        firstSeenAt: row.firstAt,
        lastSeenAt: row.lastAt,
        lastInteraction: { kind: row.lastKind, reference: row.lastRef },
      };
    });
  }

  async getDirectory(businessId: string, query: CustomerDirectoryQueryDto) {
    await this.checkBranch(businessId, query.branchId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim() ? `%${query.search.trim()}%` : null;

    const [counts, rows] = await Promise.all([
      this.dataSource.query<Record<string, string | number>[]>(
        `${SEGMENTED_SQL}
         SELECT
           COUNT(*) FILTER (WHERE ${SEARCH_WHERE})::int AS "all",
           COUNT(*) FILTER (WHERE ${SEGMENT_WHERE.frequent} AND ${SEARCH_WHERE})::int AS frequent,
           COUNT(*) FILTER (WHERE ${SEGMENT_WHERE.returning} AND ${SEARCH_WHERE})::int AS returning,
           COUNT(*) FILTER (WHERE ${SEGMENT_WHERE.new} AND ${SEARCH_WHERE})::int AS "new",
           COUNT(*) FILTER (WHERE ${SEGMENT_WHERE.inactive} AND ${SEARCH_WHERE})::int AS inactive,
           COUNT(*)::int AS customers,
           COALESCE(SUM(seg.spend), 0) AS "totalSpend",
           COALESCE(SUM(seg.spend) FILTER (WHERE seg.frequent), 0) AS "frequentSpend",
           COUNT(*) FILTER (WHERE seg.frequent)::int AS "frequentCustomers",
           COUNT(*) FILTER (
             WHERE seg."lastAt" < ${NOW} - make_interval(days => ${DORMANT_CUSTOMER_DAYS})
           )::int AS dormant
         FROM seg JOIN "users" u ON u."id" = seg.uid`,
        [businessId, query.branchId ?? null, search],
      ),
      this.directoryRows(businessId, query, limit, (page - 1) * limit),
    ]);

    const c = counts[0] ?? {};
    const segment = query.segment ?? 'all';
    const total = num(c[segment]);
    const totalSpend = num(c.totalSpend);
    return {
      data: await this.withPoints(businessId, rows),
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
      meta: {
        segmentCounts: {
          all: num(c.all),
          frequent: num(c.frequent),
          returning: num(c.returning),
          new: num(c.new),
          inactive: num(c.inactive),
        },
        insight: {
          customers: num(c.customers),
          frequentCustomers: num(c.frequentCustomers),
          frequentSpendShare:
            totalSpend > 0 ? round2(num(c.frequentSpend) / totalSpend) : 0,
          averageSpend:
            num(c.customers) > 0 ? round2(totalSpend / num(c.customers)) : 0,
          dormant: num(c.dormant),
        },
      },
    };
  }

  async exportCsv(businessId: string, query: CustomerDirectoryQueryDto) {
    await this.checkBranch(businessId, query.branchId);
    const rows = await this.withPoints(
      businessId,
      await this.directoryRows(businessId, query, EXPORT_LIMIT, 0),
    );
    const header = [
      'Name',
      'Email',
      'Phone',
      'Segment',
      'Visits',
      'Orders',
      'Deals claimed',
      'Bookings',
      'Spend (NGN)',
      'Points',
      'Tier',
      'First seen',
      'Last seen',
    ];
    const lines = [
      header.map(csvCell).join(','),
      ...rows.map((row) =>
        [
          row.name,
          row.email,
          row.phone,
          row.segment,
          row.visits,
          row.orders,
          row.claims,
          row.bookings,
          row.spend,
          row.pointsBalance,
          row.tier,
          new Date(row.firstSeenAt).toISOString(),
          new Date(row.lastSeenAt).toISOString(),
        ]
          .map(csvCell)
          .join(','),
      ),
    ];
    const buffer = Buffer.from(`${lines.join('\r\n')}\r\n`, 'utf8');
    return {
      filename: `customers-${new Date().toISOString().slice(0, 10)}.csv`,
      mimeType: 'text/csv',
      contentBase64: buffer.toString('base64'),
      sizeBytes: buffer.length,
      records: rows.length,
    };
  }

  async getDossier(businessId: string, userId: string) {
    if (!businessId) throw new BadRequestException('Business ID is required');
    const params = [businessId, null, userId];
    const [summary, preferred, purchases, claims, ledger, note] =
      await Promise.all([
        this.dataSource.query<
          (DirectoryRow & {
            createdAt: string;
            firstKind: string;
            redeemed: number;
          })[]
        >(
          `${SEGMENTED_SQL}
         SELECT seg.*, u."firstName", u."lastName", u."email", u."phone", u."avatar",
                u."createdAt",
                (SELECT kind FROM touches t WHERE t.uid = seg.uid ORDER BY t.at ASC LIMIT 1)
                  AS "firstKind",
                (SELECT COUNT(*)::int FROM "catalogue_offer_claims" c
                   JOIN "catalogue_offers" o ON o."id" = c."offerId"
                   WHERE o."businessId" = $1 AND c."userId" = seg.uid
                     AND c."deletedAt" IS NULL AND c."redeemedAt" IS NOT NULL) AS redeemed
         FROM seg JOIN "users" u ON u."id" = seg.uid
         WHERE seg.uid = $3::uuid`,
          params,
        ),
        this.dataSource.query<
          { branchId: string; name: string; touches: number }[]
        >(
          `WITH touches AS (${TOUCHES_SQL})
         SELECT t."branchId", b."name", COUNT(*)::int AS touches
         FROM touches t JOIN "branches" b ON b."id" = t."branchId"
         WHERE t.uid = $3::uuid
         GROUP BY t."branchId", b."name"
         ORDER BY touches DESC, b."name"
         LIMIT 1`,
          params,
        ),
        this.dataSource.query<
          {
            id: string;
            kind: string;
            reference: string;
            total: string;
            paymentMethod: string | null;
            items: string | null;
            at: string;
            branchName: string | null;
          }[]
        >(
          `SELECT * FROM (
           SELECT ps."id", 'pos' AS kind, ps."receiptNumber"::text AS reference, ps."total"::text AS total,
                  ps."paymentMethod"::text AS "paymentMethod",
                  (SELECT STRING_AGG(i."productName" || ' (x' || i."quantity" || ')', ', ')
                     FROM "pos_sale_items" i WHERE i."saleId" = ps."id" AND i."deletedAt" IS NULL) AS items,
                  COALESCE(ps."orderedAt", ps."createdAt") AS at, b."name" AS "branchName"
           FROM "pos_sales" ps LEFT JOIN "branches" b ON b."id" = ps."branchId"
           WHERE ps."businessId" = $1 AND ps."customerId" = $2::uuid AND ps."deletedAt" IS NULL
           UNION ALL
           SELECT co."id", 'order', UPPER(LEFT(co."id"::text, 8)), co."totalAmount"::text, NULL,
                  (SELECT STRING_AGG(ci."name" || ' (x' || coi."quantity" || ')', ', ')
                     FROM "catalogue_order_items" coi JOIN "catalogue_items" ci ON ci."id" = coi."itemId"
                     WHERE coi."orderId" = co."id" AND coi."deletedAt" IS NULL),
                  co."createdAt", b."name"
           FROM "catalogue_orders" co LEFT JOIN "branches" b ON b."id" = co."branchId"
           WHERE co."businessId" = $1 AND co."customerId" = $2::uuid AND co."deletedAt" IS NULL
             AND NOT EXISTS (
               SELECT 1 FROM "pos_sales" x WHERE x."orderId" = co."id" AND x."deletedAt" IS NULL
             )
         ) p
         ORDER BY at DESC
         LIMIT ${TIMELINE_LIMIT}`,
          [businessId, userId],
        ),
        this.dataSource.query<
          {
            id: string;
            offerName: string;
            status: string;
            claimCode: string;
            price: string | null;
            originalPrice: string | null;
            claimedAt: string;
            redeemedAt: string | null;
            branchName: string | null;
          }[]
        >(
          `SELECT c."id", o."name" AS "offerName", c."status", c."claimCode",
                o."calculatedPrice"::text AS price,
                (SELECT COALESCE(SUM(ci."price"), 0)::text FROM "catalogue_offer_items" link
                   JOIN "catalogue_items" ci ON ci."id" = link."itemId"
                   WHERE link."offerId" = o."id") AS "originalPrice",
                c."createdAt" AS "claimedAt", c."redeemedAt", b."name" AS "branchName"
         FROM "catalogue_offer_claims" c
         JOIN "catalogue_offers" o ON o."id" = c."offerId"
         LEFT JOIN "branches" b ON b."id" = o."branchId"
         WHERE o."businessId" = $1 AND c."userId" = $2::uuid AND c."deletedAt" IS NULL
         ORDER BY c."createdAt" DESC
         LIMIT ${TIMELINE_LIMIT}`,
          [businessId, userId],
        ),
        this.dataSource.query<
          {
            id: string;
            amount: number;
            type: string;
            reason: string | null;
            createdAt: string;
          }[]
        >(
          `SELECT pt."id", pt."amount", pt."type", pt."reason", pt."createdAt"
         FROM "point_transactions" pt
         WHERE pt."businessId" = $1 AND pt."customerId" = $2::uuid AND pt."deletedAt" IS NULL
         ORDER BY pt."createdAt" DESC
         LIMIT ${TIMELINE_LIMIT}`,
          [businessId, userId],
        ),
        this.dataSource.query<
          {
            note: string;
            tags: string[];
            updatedAt: string;
            firstName: string | null;
            lastName: string | null;
          }[]
        >(
          `SELECT n."note", n."tags", n."updatedAt", u."firstName", u."lastName"
         FROM "business_customer_notes" n
         LEFT JOIN "users" u ON u."id" = n."updatedById"
         WHERE n."businessId" = $1 AND n."userId" = $2::uuid AND n."deletedAt" IS NULL`,
          [businessId, userId],
        ),
      ]);

    const row = summary[0];
    if (!row) throw new NotFoundException('Customer not found');

    const [card] = await this.withPoints(businessId, [row]);
    const months = Math.max(
      1,
      (Date.now() - new Date(row.firstAt).getTime()) / (30 * 86_400_000),
    );
    const spend = num(row.spend);
    const orders = num(row.orders);
    const claimCount = num(row.claims);

    return {
      ...card,
      memberSince: row.createdAt,
      preferredBranch: preferred[0]
        ? { id: preferred[0].branchId, name: preferred[0].name }
        : null,
      firstInteraction: { kind: row.firstKind, at: row.firstAt },
      metrics: {
        visitsPerMonth: round2(num(row.visits) / months),
        averageOrder: orders > 0 ? round2(spend / orders) : 0,
        redeemed: num(row.redeemed),
        redemptionRate:
          claimCount > 0 ? round2(num(row.redeemed) / claimCount) : 0,
      },
      recentPurchases: purchases.map((p) => ({
        id: p.id,
        kind: p.kind,
        reference: p.reference,
        total: round2(num(p.total)),
        paymentMethod: p.paymentMethod,
        items: p.items ?? '',
        at: p.at,
        branchName: p.branchName,
      })),
      recentClaims: claims.map((c) => {
        const price = num(c.price);
        const original = num(c.originalPrice);
        return {
          id: c.id,
          offerName: c.offerName,
          status: c.status,
          claimCode: c.claimCode,
          saved: original > price ? round2(original - price) : 0,
          claimedAt: c.claimedAt,
          redeemedAt: c.redeemedAt,
          branchName: c.branchName,
        };
      }),
      loyaltyLedger: ledger.map((entry) => ({
        id: entry.id,
        points:
          entry.type === 'redeemed'
            ? -Math.abs(num(entry.amount))
            : num(entry.amount),
        reason: entry.reason,
        at: entry.createdAt,
      })),
      note: note[0]
        ? {
            note: note[0].note,
            tags: note[0].tags ?? [],
            updatedAt: note[0].updatedAt,
            updatedBy:
              `${note[0].firstName ?? ''} ${note[0].lastName ?? ''}`.trim() ||
              null,
          }
        : null,
    };
  }

  /**
   * Whether the user has any recorded touch with the business (a POS sale,
   * order, booking, claim and so on) — the same test the directory uses.
   */
  async isKnownCustomer(businessId: string, userId: string): Promise<boolean> {
    const known = await this.dataSource.query<unknown[]>(
      `WITH touches AS (${TOUCHES_SQL}) SELECT 1 FROM touches WHERE uid = $3::uuid LIMIT 1`,
      [businessId, null, userId],
    );
    return known.length > 0;
  }

  /**
   * Spend, frequency, branch mix, favourites and sample patrons for one of
   * the directory's built-in segments, in the shape saved segments report.
   */
  async segmentInsights(businessId: string, segment: CustomerSegment) {
    if (!businessId) throw new BadRequestException('Business ID is required');
    const rows = await this.dataSource.query<{ uid: string }[]>(
      `${SEGMENTED_SQL} SELECT seg.uid FROM seg WHERE ${SEGMENT_WHERE[segment]}`,
      [businessId, null],
    );
    const insights = await this.segmentCriteria.insights(
      businessId,
      rows.map((row) => row.uid),
    );
    return { segmentId: segment, name: SEGMENT_NAMES[segment], ...insights };
  }

  /** The subset of `userIds` that have bought from or visited the business. */
  async filterKnownCustomers(
    businessId: string,
    userIds: string[],
  ): Promise<string[]> {
    if (!userIds.length) return [];
    const rows = await this.dataSource.query<{ uid: string }[]>(
      `WITH touches AS (${TOUCHES_SQL}) SELECT DISTINCT uid FROM touches WHERE uid = ANY($3::uuid[])`,
      [businessId, null, userIds],
    );
    return rows.map((row) => row.uid);
  }

  /** Create or update the business's note and tags on a customer it knows. */
  async saveNote(
    businessId: string,
    userId: string,
    staffId: string,
    dto: SaveCustomerNoteDto,
  ) {
    if (dto.note === undefined && dto.tags === undefined) {
      throw new BadRequestException('Send a note, tags or both');
    }
    const known = await this.dataSource.query<unknown[]>(
      `WITH touches AS (${TOUCHES_SQL}) SELECT 1 FROM touches WHERE uid = $3::uuid LIMIT 1`,
      [businessId, null, userId],
    );
    if (!known.length) throw new NotFoundException('Customer not found');

    const existing = await this.notes.findOne({
      where: { businessId, userId },
    });
    const row =
      existing ?? this.notes.create({ businessId, userId, note: '', tags: [] });
    if (dto.note !== undefined) row.note = dto.note.trim();
    if (dto.tags !== undefined) row.tags = dto.tags;
    row.updatedById = staffId;
    const saved = await this.notes.save(row);
    return {
      note: saved.note,
      tags: saved.tags,
      updatedAt: saved.updatedAt,
    };
  }
}
