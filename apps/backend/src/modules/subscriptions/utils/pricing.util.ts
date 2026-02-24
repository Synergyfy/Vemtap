export class PricingUtil {
  static calculateQuarterlyPrice(monthlyPrice: number): number {
    if (monthlyPrice <= 0) return 0;
    // 10% discount * 3 months
    return monthlyPrice * 0.9 * 3;
  }

  static calculateYearlyPrice(monthlyPrice: number): number {
    if (monthlyPrice <= 0) return 0;
    // 20% discount * 12 months
    return monthlyPrice * 0.8 * 12;
  }
}
