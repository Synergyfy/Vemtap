import { OfferClaimLimitPeriod } from '../entities/catalogue-offer.entity';
import {
  claimLimitWindowStart,
  describeRedemptionWindows,
  isWithinRedemptionWindows,
} from './offer-rules.utils';

describe('claimLimitWindowStart', () => {
  // Wednesday 14 Oct 2026, 23:30 UTC = Thursday 15 Oct 00:30 in Lagos.
  const now = new Date('2026-10-14T23:30:00Z');

  it('has no window for a lifetime limit', () => {
    expect(
      claimLimitWindowStart(OfferClaimLimitPeriod.LIFETIME, now),
    ).toBeNull();
    expect(claimLimitWindowStart(undefined, now)).toBeNull();
  });

  it('starts the day at Lagos midnight', () => {
    expect(
      claimLimitWindowStart(OfferClaimLimitPeriod.DAY, now)?.toISOString(),
    ).toBe('2026-10-14T23:00:00.000Z');
  });

  it('starts the week on Lagos Monday', () => {
    expect(
      claimLimitWindowStart(OfferClaimLimitPeriod.WEEK, now)?.toISOString(),
    ).toBe('2026-10-11T23:00:00.000Z');
  });

  it('starts the month on the 1st in Lagos', () => {
    expect(
      claimLimitWindowStart(OfferClaimLimitPeriod.MONTH, now)?.toISOString(),
    ).toBe('2026-09-30T23:00:00.000Z');
  });
});

describe('isWithinRedemptionWindows', () => {
  const weekdayLunch = [
    { weekdays: [1, 2, 3, 4, 5], start: '12:00', end: '16:30' },
  ];

  it('allows any time when there are no windows', () => {
    expect(isWithinRedemptionWindows(null)).toBe(true);
    expect(isWithinRedemptionWindows([])).toBe(true);
  });

  it('uses Lagos wall-clock time', () => {
    // 11:30 UTC = 12:30 WAT, Wednesday.
    expect(
      isWithinRedemptionWindows(weekdayLunch, new Date('2026-10-14T11:30:00Z')),
    ).toBe(true);
    // 10:30 UTC = 11:30 WAT, before the window.
    expect(
      isWithinRedemptionWindows(weekdayLunch, new Date('2026-10-14T10:30:00Z')),
    ).toBe(false);
    // Saturday lunch is outside a weekday window.
    expect(
      isWithinRedemptionWindows(weekdayLunch, new Date('2026-10-17T11:30:00Z')),
    ).toBe(false);
  });

  it('includes both ends of a window', () => {
    expect(
      isWithinRedemptionWindows(weekdayLunch, new Date('2026-10-14T15:30:00Z')),
    ).toBe(true);
  });

  it('handles windows that run past midnight', () => {
    const lateFriday = [{ weekdays: [5], start: '22:00', end: '02:00' }];
    // Friday 23:00 WAT.
    expect(
      isWithinRedemptionWindows(lateFriday, new Date('2026-10-16T22:00:00Z')),
    ).toBe(true);
    // Saturday 01:30 WAT still belongs to Friday's window.
    expect(
      isWithinRedemptionWindows(lateFriday, new Date('2026-10-17T00:30:00Z')),
    ).toBe(true);
    // Saturday 23:00 WAT does not.
    expect(
      isWithinRedemptionWindows(lateFriday, new Date('2026-10-17T22:00:00Z')),
    ).toBe(false);
  });

  it('describes windows for error messages', () => {
    expect(
      describeRedemptionWindows([
        ...weekdayLunch,
        { weekdays: [], start: '18:00', end: '20:00' },
      ]),
    ).toBe('Mon, Tue, Wed, Thu, Fri 12:00–16:30; Daily 18:00–20:00');
  });
});
