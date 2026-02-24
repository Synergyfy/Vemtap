import { PricingUtil } from './pricing.util';

describe('PricingUtil', () => {
  it('should calculate quarterly price correctly', () => {
    // 20000 * 0.9 * 3 = 54000
    expect(PricingUtil.calculateQuarterlyPrice(20000)).toBe(54000);
  });

  it('should calculate yearly price correctly', () => {
    // 20000 * 0.8 * 12 = 192000
    expect(PricingUtil.calculateYearlyPrice(20000)).toBe(192000);
  });

  it('should handle zero price', () => {
    expect(PricingUtil.calculateQuarterlyPrice(0)).toBe(0);
    expect(PricingUtil.calculateYearlyPrice(0)).toBe(0);
  });

  it('should handle negative price safely (treat as 0 or simply calculate)', () => {
    // Implementation treats <= 0 as 0
    expect(PricingUtil.calculateQuarterlyPrice(-100)).toBe(0);
    expect(PricingUtil.calculateYearlyPrice(-100)).toBe(0);
  });

  it('should handle floating point prices', () => {
    // 100.50 * 0.9 = 90.45 * 3 = 271.35
    expect(PricingUtil.calculateQuarterlyPrice(100.5)).toBeCloseTo(271.35);

    // 100.50 * 0.8 = 80.40 * 12 = 964.8
    expect(PricingUtil.calculateYearlyPrice(100.5)).toBeCloseTo(964.8);
  });
});
