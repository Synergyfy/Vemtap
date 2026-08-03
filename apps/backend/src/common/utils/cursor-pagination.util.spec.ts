import {
  encodeCursor,
  decodeCursor,
  paginateWithCursor,
} from './cursor-pagination.util';

describe('CursorPaginationUtil', () => {
  describe('encodeCursor & decodeCursor', () => {
    it('should encode and decode a cursor correctly', () => {
      const payload = {
        id: 'uuid-123',
        v: '2026-07-30T00:00:00.000Z',
        d: 'DESC' as const,
      };
      const encoded = encodeCursor(payload);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = decodeCursor(encoded);
      expect(decoded).toEqual(payload);
    });

    it('should return null for invalid cursor strings', () => {
      expect(decodeCursor(null)).toBeNull();
      expect(decodeCursor(undefined)).toBeNull();
      expect(decodeCursor('')).toBeNull();
      expect(decodeCursor('invalid-base64-string')).toBeNull();
    });
  });

  describe('paginateWithCursor', () => {
    let mockQueryBuilder: any;

    beforeEach(() => {
      mockQueryBuilder = {
        clone: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(25),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: '1', createdAt: new Date('2026-07-30T10:00:00Z') },
          { id: '2', createdAt: new Date('2026-07-30T09:00:00Z') },
        ]),
      };
      mockQueryBuilder.clone.mockReturnValue(mockQueryBuilder);
    });

    it('should paginate items correctly without cursor', async () => {
      const result = await paginateWithCursor({
        queryBuilder: mockQueryBuilder,
        limit: 10,
        page: 1,
      });

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextCursor).toBeNull();
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(11);
    });

    it('should generate nextCursor when hasNextPage is true', async () => {
      const mockItems = Array.from({ length: 11 }, (_, i) => ({
        id: `id-${i + 1}`,
        createdAt: new Date(2026, 0, 30, 12, 0 - i),
      }));
      mockQueryBuilder.getMany.mockResolvedValue(mockItems);

      const result = await paginateWithCursor({
        queryBuilder: mockQueryBuilder,
        limit: 10,
      });

      expect(result.data.length).toBe(10);
      expect(result.hasNextPage).toBe(true);
      expect(result.nextCursor).not.toBeNull();

      const decoded = decodeCursor(result.nextCursor);
      expect(decoded?.id).toBe('id-10');
    });
  });
});
