import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export interface CursorPayload {
  id: string;
  v?: string | number | null;
  d?: 'ASC' | 'DESC';
  /** Set when `v` came from a Date; comparison uses millisecond precision. */
  t?: 'ts';
}

export function encodeCursor(payload: CursorPayload): string {
  try {
    const json = JSON.stringify(payload);
    return Buffer.from(json, 'utf8').toString('base64url');
  } catch {
    return '';
  }
}

function parseCursorPayload(json: string): CursorPayload | null {
  const parsed: unknown = JSON.parse(json);
  if (
    parsed &&
    typeof parsed === 'object' &&
    'id' in parsed &&
    typeof (parsed as { id?: unknown }).id === 'string'
  ) {
    return parsed as CursorPayload;
  }
  return null;
}

export function decodeCursor(cursor?: string | null): CursorPayload | null {
  if (!cursor || typeof cursor !== 'string') {
    return null;
  }
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = parseCursorPayload(json);
    if (parsed) return parsed;
    return null;
  } catch {
    // Fallback try standard base64 if base64url fails
    try {
      const json = Buffer.from(cursor, 'base64').toString('utf8');
      return parseCursorPayload(json);
    } catch {
      return null;
    }
  }
}

/**
 * Serialize a cursor sort value for storage in the opaque cursor.
 *
 * Dates must be emitted as naive local timestamps (`YYYY-MM-DD HH:mm:ss.SSS`,
 * no timezone designator), NOT `toISOString()`. Postgres `timestamp` columns
 * (`@CreateDateColumn`) hold naive values and the `pg` driver parses them as
 * local time; formatting the parsed Date's local components round-trips back to
 * the exact stored digits. `toISOString()` shifts by the process/DB timezone
 * offset, and the shifted cursor matches zero rows on the next page.
 */
export function serializeCursorValue(value: unknown): string | number | null {
  if (value instanceof Date) {
    const pad = (n: number, width = 2) => String(n).padStart(width, '0');
    return (
      `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ` +
      `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}.` +
      `${pad(value.getMilliseconds(), 3)}`
    );
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return null;
}

/**
 * Cursor-payload form of a sort value. Date-valued sorts carry `t: 'ts'` so
 * the query can compare at millisecond precision (`date_trunc`), since JS
 * Dates lose the microseconds Postgres stores and an exact equality would
 * never match.
 */
export function cursorValueFor(
  value: unknown,
): { v: string | number | null; t?: 'ts' } | null {
  if (value instanceof Date) {
    return { v: serializeCursorValue(value), t: 'ts' };
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return { v: value };
  }
  return null;
}

export interface PaginateCursorOptions<T extends ObjectLiteral = any> {
  queryBuilder: SelectQueryBuilder<T>;
  cursor?: string | null;
  nextCursor?: string | null;
  page?: number;
  limit?: number;
  perPage?: number;
  offset?: number;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  idField?: string;
  entityAlias?: string;
  calculateTotal?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  items: T[];
  total: number;
  page: number;
  limit: number;
  perPage: number;
  cursor: string | null;
  nextCursor: string | null;
  prevCursor: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

export async function paginateWithCursor<T extends ObjectLiteral = any>(
  options: PaginateCursorOptions<T>,
): Promise<PaginatedResult<T>> {
  const {
    queryBuilder,
    cursor: rawCursor,
    nextCursor: rawNextCursor,
    page: rawPage,
    limit: rawLimit,
    perPage: rawPerPage,
    offset: rawOffset,
    sortField = 'createdAt',
    sortOrder = 'DESC',
    idField = 'id',
    entityAlias,
    calculateTotal = true,
  } = options;

  const cursorStr = rawCursor || rawNextCursor;
  const limit = Math.max(1, rawLimit || rawPerPage || 10);
  const page = Math.max(
    1,
    rawPage || (rawOffset ? Math.floor(rawOffset / limit) + 1 : 1),
  );

  const decodedCursor = decodeCursor(cursorStr);
  const aliasPrefix = entityAlias ? `${entityAlias}.` : '';
  const colSort = `${aliasPrefix}${sortField}`;
  const colId = `${aliasPrefix}${idField}`;
  // JS Dates only hold milliseconds while Postgres timestamps hold
  // microseconds — compare truncated so the cursor boundary can match.
  const colSortExpr =
    decodedCursor?.t === 'ts'
      ? `date_trunc('milliseconds', ${colSort})`
      : colSort;

  let total = 0;

  if (calculateTotal) {
    try {
      if (typeof queryBuilder.getCount === 'function') {
        total = await queryBuilder.getCount();
      }
    } catch {
      total = 0;
    }
  }

  const qb =
    typeof queryBuilder.clone === 'function'
      ? queryBuilder.clone()
      : queryBuilder;

  if (decodedCursor) {
    const isSameField = sortField === idField;
    const paramValKey = `cursor_val_${Math.random().toString(36).substring(7)}`;
    const paramIdKey = `cursor_id_${Math.random().toString(36).substring(7)}`;

    if (isSameField) {
      const op = sortOrder === 'DESC' ? '<' : '>';
      qb.andWhere(`${colId} ${op} :${paramIdKey}`, {
        [paramIdKey]: decodedCursor.id,
      });
    } else {
      const opVal = sortOrder === 'DESC' ? '<' : '>';
      const opId = sortOrder === 'DESC' ? '<' : '>';
      const cursorVal = decodedCursor.v;

      if (cursorVal !== undefined && cursorVal !== null) {
        qb.andWhere(
          `(${colSortExpr} ${opVal} :${paramValKey} OR (${colSortExpr} = :${paramValKey} AND ${colId} ${opId} :${paramIdKey}))`,
          {
            [paramValKey]: cursorVal,
            [paramIdKey]: decodedCursor.id,
          },
        );
      } else {
        qb.andWhere(`${colId} ${opId} :${paramIdKey}`, {
          [paramIdKey]: decodedCursor.id,
        });
      }
    }
  } else if (page > 1) {
    const skip = (page - 1) * limit;
    qb.skip(skip);
  }

  qb.orderBy(colSort, sortOrder);
  if (sortField !== idField && typeof qb.addOrderBy === 'function') {
    qb.addOrderBy(colId, sortOrder);
  }

  qb.take(limit + 1);

  let rawResults: T[] = [];
  if (typeof qb.getMany === 'function') {
    rawResults = (await qb.getMany()) || [];
  }
  if (rawResults.length === 0 && typeof qb.getManyAndCount === 'function') {
    try {
      const res = await qb.getManyAndCount();
      if (Array.isArray(res)) {
        if (Array.isArray(res[0]) && res[0].length > 0) {
          rawResults = res[0];
        }
        if (total === 0 && typeof res[1] === 'number') {
          total = res[1];
        }
      }
    } catch {
      // ignore
    }
  }

  const hasNextPage = rawResults.length > limit;
  const data = hasNextPage ? rawResults.slice(0, limit) : rawResults;

  let nextCursor: string | null = null;
  let prevCursor: string | null = null;

  if (data.length > 0) {
    const lastItem = data[data.length - 1];
    const firstItem = data[0];

    if (hasNextPage) {
      const meta =
        sortField in lastItem ? cursorValueFor(lastItem[sortField]) : null;
      nextCursor = encodeCursor({
        id: String(lastItem[idField]),
        v: meta?.v ?? null,
        t: meta?.t,
        d: sortOrder,
      });
    }

    if (page > 1 || decodedCursor) {
      const meta =
        sortField in firstItem ? cursorValueFor(firstItem[sortField]) : null;
      prevCursor = encodeCursor({
        id: String(firstItem[idField]),
        v: meta?.v ?? null,
        t: meta?.t,
        d: sortOrder,
      });
    }
  }

  const lastPage = total > 0 ? Math.ceil(total / limit) : 1;

  return {
    data,
    items: data,
    total,
    page,
    limit,
    perPage: limit,
    cursor: cursorStr || null,
    nextCursor,
    prevCursor,
    hasNextPage,
    hasPrevPage: Boolean(prevCursor),
    meta: {
      total,
      page,
      lastPage,
      limit,
      hasNextPage,
    },
  };
}
