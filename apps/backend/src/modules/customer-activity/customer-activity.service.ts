import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ACTIVITY_ROWS_SQL, KIND_FILTER } from './customer-activity.sql';
import type { ActivityQueryDto } from './dto/activity-query.dto';

export interface ActivityCustomer {
  id: string;
  email?: string | null;
  phone?: string | null;
}

export interface ActivityRow {
  kind: 'claim' | 'order' | 'booking' | 'visit' | 'review' | 'comment';
  id: string;
  at: Date;
  refId: string | null;
  businessId: string | null;
  businessName: string | null;
  businessCode: string | null;
  businessLogo: string | null;
  branchName: string | null;
  branchAddress: string | null;
  title: string | null;
  image: string | null;
  amount: number | null;
  rating: number | null;
  body: string | null;
  reply: string | null;
  status: string | null;
}

type RawRow = Omit<ActivityRow, 'amount' | 'rating'> & {
  amount: string | number | null;
  rating: string | number | null;
};

@Injectable()
export class CustomerActivityService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  private params(customer: ActivityCustomer, from?: string) {
    return [
      customer.id,
      (customer.email ?? '').toLowerCase(),
      customer.phone ?? '',
      from ?? null,
    ];
  }

  /** Newest first, one shape for every kind of activity. */
  async list(customer: ActivityCustomer, query: ActivityQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const kinds = KIND_FILTER[query.kind ?? 'all'];
    const params: unknown[] = this.params(customer, query.from);
    const kindClause = kinds ? `WHERE a.kind = ANY($5::text[])` : '';
    if (kinds) params.push(kinds);

    const base = `SELECT * FROM (${ACTIVITY_ROWS_SQL}) a ${kindClause}`;
    const [rows, totals] = await Promise.all([
      this.dataSource.query<RawRow[]>(
        `${base} ORDER BY a."at" DESC, a.id LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
        params,
      ),
      this.dataSource.query<{ total: string }[]>(
        `SELECT COUNT(*)::int AS total FROM (${base}) t`,
        params,
      ),
    ]);

    return {
      data: rows.map((row) => ({
        ...row,
        amount: row.amount == null ? null : Number(row.amount),
        rating: row.rating == null ? null : Number(row.rating),
      })),
      total: Number(totals[0]?.total ?? 0),
      page,
      limit,
    };
  }

  /** Counts for the activity header, over the same rows the list shows. */
  async summary(customer: ActivityCustomer, from?: string) {
    const [row] = await this.dataSource.query<
      {
        claimed: string;
        redeemed: string;
        orders: string;
        bookings: string;
        visits: string;
        reviews: string;
        businesses: string;
      }[]
    >(
      `SELECT
         COUNT(*) FILTER (WHERE kind = 'claim')::int AS claimed,
         COUNT(*) FILTER (WHERE kind = 'claim' AND status = 'redeemed')::int AS redeemed,
         COUNT(*) FILTER (WHERE kind = 'order')::int AS orders,
         COUNT(*) FILTER (WHERE kind = 'booking')::int AS bookings,
         COUNT(*) FILTER (WHERE kind IN ('visit', 'order'))::int AS visits,
         COUNT(*) FILTER (WHERE kind IN ('review', 'comment'))::int AS reviews,
         COUNT(DISTINCT "businessId")::int AS businesses
       FROM (${ACTIVITY_ROWS_SQL}) a`,
      this.params(customer, from),
    );
    return {
      claimed: Number(row?.claimed ?? 0),
      redeemed: Number(row?.redeemed ?? 0),
      orders: Number(row?.orders ?? 0),
      bookings: Number(row?.bookings ?? 0),
      visits: Number(row?.visits ?? 0),
      reviews: Number(row?.reviews ?? 0),
      businesses: Number(row?.businesses ?? 0),
    };
  }
}
