import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export interface CursorPayload {
  id: string;
  v?: string | number | null;
  d?: 'ASC' | 'DESC';
}

export function encodeCursor(payload: CursorPayload): string {
  try {
    const json = JSON.stringify(payload);
    return Buffer.from(json, 'utf8').toString('base64url');
  } catch {
    return '';
  }
}

export function decodeCursor(cursor?: string | null): CursorPayload | null {
  if (!cursor || typeof cursor !== 'string') {
    return null;
  }
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object' && parsed.id) {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    // Fallback try standard base64 if base64url fails
    try {
      const json = Buffer.from(cursor, 'base64').toString('utf8');
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object' && parsed.id) {
        return parsed as CursorPayload;
      }
    } catch {
      return null;
    }
    return null;
  }
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
          `(${colSort} ${opVal} :${paramValKey} OR (${colSort} = :${paramValKey} AND ${colId} ${opId} :${paramIdKey}))`,
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
      nextCursor = encodeCursor({
        id: String(lastItem[idField]),
        v:
          sortField in lastItem
            ? lastItem[sortField] instanceof Date
              ? lastItem[sortField].toISOString()
              : lastItem[sortField]
            : null,
        d: sortOrder,
      });
    }

    if (page > 1 || decodedCursor) {
      prevCursor = encodeCursor({
        id: String(firstItem[idField]),
        v:
          sortField in firstItem
            ? firstItem[sortField] instanceof Date
              ? firstItem[sortField].toISOString()
              : firstItem[sortField]
            : null,
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
