import {
  encodeCursor,
  decodeCursor,
  serializeCursorValue,
  cursorValueFor,
} from './cursor-pagination.util';

describe('cursor-pagination.util', () => {
  describe('serializeCursorValue', () => {
    it('emits naive local timestamps (not UTC ISO) for Date values', () => {
      // A Date parsed from a naive Postgres timestamp round-trips through its
      // LOCAL components. `toISOString()` would shift by the timezone offset
      // and produce a cursor that matches zero rows.
      const date = new Date(2026, 9, 8, 18, 46, 13, 63);
      expect(serializeCursorValue(date)).toBe('2026-10-08 18:46:13.063');
      expect(serializeCursorValue(date)).not.toContain('T');
      expect(serializeCursorValue(date)).not.toContain('Z');
    });

    it('passes strings and numbers through', () => {
      expect(serializeCursorValue('abc')).toBe('abc');
      expect(serializeCursorValue(42)).toBe(42);
      expect(serializeCursorValue(null)).toBeNull();
      expect(serializeCursorValue(undefined)).toBeNull();
    });
  });

  describe('cursorValueFor', () => {
    it('flags Date values with t=ts so comparison truncates to milliseconds', () => {
      expect(cursorValueFor(new Date(2026, 9, 8, 18, 46, 13, 63))).toEqual({
        v: '2026-10-08 18:46:13.063',
        t: 'ts',
      });
    });

    it('does not flag non-Date values', () => {
      expect(cursorValueFor('abc')).toEqual({ v: 'abc' });
      expect(cursorValueFor(7)).toEqual({ v: 7 });
      expect(cursorValueFor(null)).toBeNull();
    });
  });

  describe('encode/decode round-trip', () => {
    it('restores the payload', () => {
      const cursor = encodeCursor({
        id: 'uuid-1',
        v: '2026-10-08 18:46:13.063',
        t: 'ts',
        d: 'DESC',
      });
      expect(decodeCursor(cursor)).toEqual({
        id: 'uuid-1',
        v: '2026-10-08 18:46:13.063',
        t: 'ts',
        d: 'DESC',
      });
    });

    it('returns null for garbage', () => {
      expect(decodeCursor('not-a-cursor')).toBeNull();
      expect(decodeCursor(undefined)).toBeNull();
    });
  });
});
