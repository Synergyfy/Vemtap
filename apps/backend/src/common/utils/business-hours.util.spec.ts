import {
  normalizeDayHours,
  normalizeOpeningHours,
} from './business-hours.util';

describe('normalizeDayHours', () => {
  it('returns null for null/undefined', () => {
    expect(normalizeDayHours(null)).toBeNull();
    expect(normalizeDayHours(undefined)).toBeNull();
  });

  it('accepts the canonical shape { from, to, isClosed }', () => {
    expect(
      normalizeDayHours({ from: '09:00', to: '18:00', isClosed: false }),
    ).toEqual({
      from: '09:00',
      to: '18:00',
      isClosed: false,
    });
  });

  it('accepts the legacy shape { open, close, closed }', () => {
    expect(
      normalizeDayHours({ open: '08:00', close: '17:00', closed: true }),
    ).toEqual({
      from: '08:00',
      to: '17:00',
      isClosed: true,
    });
  });

  it('accepts the automation shape { startTime, endTime, isOpen }', () => {
    expect(
      normalizeDayHours({ startTime: '10:00', endTime: '22:00', isOpen: true }),
    ).toEqual({
      from: '10:00',
      to: '22:00',
      isClosed: false,
    });
    expect(
      normalizeDayHours({
        startTime: '10:00',
        endTime: '22:00',
        isOpen: false,
      }),
    ).toEqual({
      from: '10:00',
      to: '22:00',
      isClosed: true,
    });
  });

  it('prefers canonical keys over legacy keys when both present', () => {
    expect(
      normalizeDayHours({
        from: '09:00',
        to: '18:00',
        open: '08:00',
        close: '17:00',
        isClosed: false,
      }),
    ).toEqual({ from: '09:00', to: '18:00', isClosed: false });
  });

  it('parses a string range', () => {
    expect(normalizeDayHours('09:00-18:00')).toEqual({
      from: '09:00',
      to: '18:00',
      isClosed: false,
    });
  });

  it('defaults isClosed to false when no closed flag is present', () => {
    expect(normalizeDayHours({ from: '09:00', to: '18:00' })).toEqual({
      from: '09:00',
      to: '18:00',
      isClosed: false,
    });
  });
});

describe('normalizeOpeningHours', () => {
  it('returns an empty map for null', () => {
    expect(normalizeOpeningHours(null)).toEqual({});
  });

  it('normalizes every day entry across shapes', () => {
    const input = {
      monday: { from: '09:00', to: '18:00', isClosed: false },
      tuesday: { open: '08:00', close: '17:00', closed: true },
      wednesday: { startTime: '10:00', endTime: '22:00', isOpen: true },
    };
    expect(normalizeOpeningHours(input)).toEqual({
      monday: { from: '09:00', to: '18:00', isClosed: false },
      tuesday: { from: '08:00', to: '17:00', isClosed: true },
      wednesday: { from: '10:00', to: '22:00', isClosed: false },
    });
  });
});
