import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { getMetadataArgsStorage } from 'typeorm';

/**
 * pg returns `decimal`/`numeric` columns as strings ("8000.00"). Any such
 * column serialised straight off an entity reaches the app as a string, and a
 * client schema expecting a number rejects the whole response — which is how
 * `GET /catalogue/offers/admin` broke the Business hub (CatalogueOffer's
 * price columns had no transformer). Attach `numericTransformer` to every
 * decimal column so it is read as a number.
 *
 * Columns that predate this guard are listed below so it can land without a
 * sweeping behaviour change across billing, POS and FOS code. The list only
 * shrinks: a new untransformed column fails, and so does a listed column that
 * has since been fixed (remove it from the list).
 */
const KNOWN_UNTRANSFORMED = [
  'AddOn.price',
  'AffiliateCommission.amount',
  'AffiliateProfile.availableBalance',
  'AffiliateProfile.totalEarnings',
  'AffiliateProfile.withdrawalsCount',
  'AffiliateWithdrawalRequest.amount',
  'Business.balance',
  'BusinessAddOn.totalPaid',
  'BusinessReferralCommission.amount',
  'BusinessReferralCommission.rate',
  'CatalogueCartItem.snapshotPrice',
  'Cluster.latitude',
  'Cluster.longitude',
  'Coupon.amount',
  'Coupon.maxDiscountAmount',
  'Coupon.minSubtotal',
  'CouponRedemption.discountAmount',
  'CouponRedemption.finalAmount',
  'CouponRedemption.originalAmount',
  'CouponRedemption.taxAmount',
  'CreditPlan.price',
  'DiscoveryInvoice.subtotal',
  'DiscoveryInvoice.tax',
  'DiscoveryInvoice.total',
  'InvoiceLineItem.total',
  'InvoiceLineItem.unitPrice',
  'Message.cost',
  'MessageCampaign.actualCost',
  'MessageCampaign.estimatedCost',
  'MessageLog.cost',
  'Order.agreedPrice',
  'Order.totalPrice',
  'Order.unitPrice',
  'Payment.amount',
  'Plan.monthlyPrice',
  'Plan.quarterlyPrice',
  'Plan.yearlyPrice',
  'PosCashDrop.amount',
  'Product.costPrice',
  'Product.customizationFee',
  'Product.originalPrice',
  'Product.price',
  'Quote.currentPrice',
  'QuoteNegotiation.priceOffered',
  'RotatorClusterOffer.weight',
  'Setting.affiliateDirectCommission',
  'Setting.affiliateFirstPaymentCommission',
  'Setting.affiliateIndirectCommission',
  'Setting.affiliateMinimumWithdrawal',
  'Setting.affiliateRecurringCommission',
  'Setting.creditPriceAi',
  'Setting.creditPriceEmail',
  'Setting.creditPriceSms',
  'Setting.creditPriceWhatsapp',
  'Setting.messagingCostEmail',
  'Setting.messagingCostSms',
  'Setting.messagingCostWhatsapp',
  'SponsoredCampaign.budget',
  'SponsoredCampaign.spent',
  'SponsoredCampaignTransaction.amount',
  'SubscriptionTaxConfig.rate',
];

/** Every `*.entity.ts` under src, so a new entity is covered without editing this file. */
function entityFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return entityFiles(path);
    return name.endsWith('.entity.ts') ? [path] : [];
  });
}

/** `Class.property` for every decimal/numeric column read back without a transformer. */
function untransformedDecimalColumns(): string[] {
  for (const file of entityFiles(join(__dirname, '..', '..'))) {
    // Loading the module is the point: its decorators register the columns.
    // Dynamic import() needs --experimental-vm-modules under this Jest setup.

    require(file);
  }
  return getMetadataArgsStorage()
    .columns.filter(
      (column) =>
        ['decimal', 'numeric'].includes(String(column.options.type)) &&
        !column.options.transformer,
    )
    .map(
      (column) =>
        `${(column.target as { name: string }).name}.${column.propertyName}`,
    )
    .sort();
}

describe('decimal columns', () => {
  const offenders = untransformedDecimalColumns();

  it('read back as numbers (numericTransformer) unless already listed', () => {
    const unexpected = offenders.filter(
      (column) => !KNOWN_UNTRANSFORMED.includes(column),
    );
    expect(unexpected).toEqual([]);
  });

  it('keep the known list honest: fixed columns are removed from it', () => {
    const fixed = KNOWN_UNTRANSFORMED.filter(
      (column) => !offenders.includes(column),
    );
    expect(fixed).toEqual([]);
  });

  it('cover every catalogue offer price column', () => {
    expect(
      offenders.filter((column) => column.startsWith('CatalogueOffer.')),
    ).toEqual([]);
  });
});
