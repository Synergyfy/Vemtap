export const AFFILIATE_EXTERNAL_SYNC_QUEUE = 'affiliate-external-sync';

export type AffiliateSyncJobName = 'record-referral' | 'process-withdrawal';

export interface RecordReferralJobData {
  referralCode: string;
  businessId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  planName: string;
  planId?: string;
  address?: string;
  /** Actual amount charged for this subscription payment (NGN) */
  amountPaid: number;
  /** Whether this is the referred business's first paid subscription */
  isFirstPayment: boolean;
  /** Commission rate (%) configured in Vemtap for this payment */
  rate: number;
  /** Unique per payment so recurring payments are distinct events */
  externalReference: string;
}

export interface ProcessWithdrawalJobData {
  email: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  externalReference: string;
}

function sanitizeReference(value: string): string {
  // BullMQ disallows ":" in custom job IDs — replace any that slip in.
  return value.replace(/:/g, '-');
}

export function recordReferralJobId(externalReference: string): string {
  return `affiliate-ref-${sanitizeReference(externalReference)}`;
}

export function processWithdrawalJobId(externalReference: string): string {
  return `affiliate-wd-${sanitizeReference(externalReference)}`;
}
