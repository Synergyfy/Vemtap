/**
 * Shape of `Business.posSettings`. One jsonb column holds every POS-wide
 * preference so a settings screen is one read and one write; anything with its
 * own lifecycle (tills, peripherals, staff PINs) lives in its own table.
 */
export type PosOrderType = 'dine_in' | 'takeaway';

export type PosAutoPrintTrigger = 'sale' | 'refund' | 'kitchen';

export interface PosPermissionPolicy {
  voidRequiresPin?: boolean;
  refundRequiresPin?: boolean;
  reprintRequiresPin?: boolean;
  drawerOpenRequiresPin?: boolean;
  discountOverrideRequiresPin?: boolean;
  /** Largest discount a cashier may give without a supervisor, in percent. */
  discountMaxPercent?: number;
  /** Largest discount a cashier may give without a supervisor, in naira. */
  discountMaxAmount?: number;
  idleLockMinutes?: number;
}

export interface PosTransferRail {
  enabled?: boolean;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface PosTenderRails {
  cash?: boolean;
  card?: boolean;
  transfer?: PosTransferRail;
  oneTap?: boolean;
  houseTab?: { enabled?: boolean; limit?: number };
}

export interface PosSettings {
  currency?: string;

  // Receipt
  receiptHeader?: string;
  receiptFooter?: string;
  receiptAddress?: string;
  receiptPhone?: string;
  receiptWidth?: 58 | 80;
  autoPrintReceipt?: boolean;
  autoPrintOn?: PosAutoPrintTrigger[];
  printKitchenChits?: boolean;
  showLogo?: boolean;
  tin?: string;

  // Tax and surcharges
  taxEnabled?: boolean;
  taxRate?: number;
  taxLabel?: string;
  pricesIncludeTax?: boolean;
  takeawayVatExempt?: boolean;
  serviceChargeEnabled?: boolean;
  serviceChargeRate?: number;
  serviceChargeWaivable?: boolean;
  packagingFee?: number;
  packagingAutoApply?: boolean;

  // Guest self-ordering
  selfOrderingEnabled?: boolean;
  maxQrOrderValue?: number;
  rushPause?: boolean;

  // Operations
  tableCount?: number;
  offlineBufferLimit?: number;
  autoSyncIntervalSec?: number;
  defaultPrepMinutes?: number;

  // Loyalty and alerts
  loyaltyEnabled?: boolean;
  loyaltyRedeemThreshold?: number;
  lowStockAlerts?: boolean;
  dailySalesSummary?: boolean;
  newOrderAlert?: boolean;
  staffActivityAlerts?: boolean;

  permissions?: PosPermissionPolicy;
  tenderRails?: PosTenderRails;
}

/** What a business gets before it has saved anything. */
export const DEFAULT_POS_SETTINGS: Required<
  Pick<
    PosSettings,
    | 'currency'
    | 'receiptWidth'
    | 'autoPrintReceipt'
    | 'autoPrintOn'
    | 'printKitchenChits'
    | 'showLogo'
    | 'taxEnabled'
    | 'taxRate'
    | 'taxLabel'
    | 'pricesIncludeTax'
    | 'takeawayVatExempt'
    | 'serviceChargeEnabled'
    | 'serviceChargeRate'
    | 'serviceChargeWaivable'
    | 'packagingFee'
    | 'packagingAutoApply'
    | 'selfOrderingEnabled'
    | 'maxQrOrderValue'
    | 'rushPause'
    | 'tableCount'
    | 'offlineBufferLimit'
    | 'autoSyncIntervalSec'
    | 'defaultPrepMinutes'
    | 'loyaltyEnabled'
    | 'permissions'
    | 'tenderRails'
  >
> = {
  currency: 'NGN',
  receiptWidth: 80,
  autoPrintReceipt: false,
  autoPrintOn: [],
  printKitchenChits: false,
  showLogo: true,
  taxEnabled: false,
  taxRate: 7.5,
  taxLabel: 'VAT',
  pricesIncludeTax: false,
  takeawayVatExempt: false,
  serviceChargeEnabled: false,
  serviceChargeRate: 0,
  serviceChargeWaivable: true,
  packagingFee: 0,
  packagingAutoApply: false,
  selfOrderingEnabled: true,
  // 0 means no cap.
  maxQrOrderValue: 0,
  rushPause: false,
  tableCount: 0,
  offlineBufferLimit: 200,
  autoSyncIntervalSec: 60,
  defaultPrepMinutes: 15,
  loyaltyEnabled: false,
  permissions: {
    voidRequiresPin: false,
    refundRequiresPin: false,
    reprintRequiresPin: false,
    drawerOpenRequiresPin: false,
    discountOverrideRequiresPin: false,
    discountMaxPercent: 100,
    discountMaxAmount: 0,
    idleLockMinutes: 0,
  },
  tenderRails: {
    cash: true,
    card: true,
    transfer: { enabled: true },
    oneTap: false,
    houseTab: { enabled: false, limit: 0 },
  },
};

/** Stored settings over the defaults, nested objects merged one level deep. */
/** Copy of `value` without keys whose value is undefined. */
export function definedOnly<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

/**
 * Stored settings over the defaults, nested objects merged one level deep.
 * Undefined values never override a default.
 */
export function resolvePosSettings(stored?: PosSettings | null): PosSettings {
  const saved = definedOnly(stored ?? {});
  const rails = definedOnly(saved.tenderRails ?? {});
  return {
    ...DEFAULT_POS_SETTINGS,
    ...saved,
    permissions: {
      ...DEFAULT_POS_SETTINGS.permissions,
      ...definedOnly(saved.permissions ?? {}),
    },
    tenderRails: {
      ...DEFAULT_POS_SETTINGS.tenderRails,
      ...rails,
      transfer: {
        ...DEFAULT_POS_SETTINGS.tenderRails.transfer,
        ...definedOnly(rails.transfer ?? {}),
      },
      houseTab: {
        ...DEFAULT_POS_SETTINGS.tenderRails.houseTab,
        ...definedOnly(rails.houseTab ?? {}),
      },
    },
  };
}

export interface PosCharges {
  /** Net of discounts, before tax and surcharges. */
  netSubtotal: number;
  tax: number;
  serviceCharge: number;
  packagingFee: number;
  total: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Tax, service charge and packaging for a ticket. The single place that turns a
 * business's settings into money, so the till, held tickets, order payments and
 * the split preview can never disagree about a total.
 *
 * - Service charge is a percentage of the net subtotal; tax is not charged on it.
 * - With `pricesIncludeTax`, tax is the share already inside the prices and is
 *   not added again.
 * - Packaging is a flat fee on takeaway tickets when `packagingAutoApply` is on.
 */
export function computePosCharges(
  stored: PosSettings | null | undefined,
  netSubtotal: number,
  options: { orderType?: PosOrderType; waiveServiceCharge?: boolean } = {},
): PosCharges {
  const settings = resolvePosSettings(stored);
  const net = round2(Math.max(0, netSubtotal));
  const orderType = options.orderType ?? 'dine_in';

  const taxExempt = orderType === 'takeaway' && settings.takeawayVatExempt;
  const rate =
    settings.taxEnabled && !taxExempt ? (settings.taxRate ?? 0) / 100 : 0;
  const tax = settings.pricesIncludeTax
    ? round2(net - net / (1 + rate))
    : round2(net * rate);

  const waived = options.waiveServiceCharge && settings.serviceChargeWaivable;
  const serviceCharge =
    settings.serviceChargeEnabled && !waived
      ? round2((net * (settings.serviceChargeRate ?? 0)) / 100)
      : 0;

  const packagingFee =
    orderType === 'takeaway' && settings.packagingAutoApply
      ? round2(settings.packagingFee ?? 0)
      : 0;

  const total = round2(
    net + (settings.pricesIncludeTax ? 0 : tax) + serviceCharge + packagingFee,
  );

  return { netSubtotal: net, tax, serviceCharge, packagingFee, total };
}
