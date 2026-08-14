import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Error thrown when a sync call to the external affiliate system fails.
 * `retryable` indicates whether the failure is transient (network/5xx/429/408)
 * and should be retried, versus a terminal client error (4xx) that won't
 * succeed on retry.
 */
export class AffiliateSyncError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AffiliateSyncError';
  }
}

/**
 * Classifies an Axios/HttpService error into a retryable or terminal error.
 */
export function classifyAffiliateError(error: any): AffiliateSyncError {
  if (error?.response) {
    const status = error.response.status as number;
    const message =
      error.response.data?.message || `Affiliate API error (${status})`;
    const retryable = status >= 500 || status === 408 || status === 429;
    return new AffiliateSyncError(message, retryable, status);
  }
  // Network failures, timeouts, DNS, ECONNREFUSED, etc.
  return new AffiliateSyncError(
    error?.message || 'Affiliate API unreachable',
    true,
  );
}

@Injectable()
export class ExternalAffiliateService {
  private readonly logger = new Logger(ExternalAffiliateService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('VEMTAP_AFFILIATE_BASE_URL') ||
      'http://localhost:4005/api/external';
    this.apiKey = this.configService.get<string>('VEMTAP_AFFILIATE_KEY') || '';
  }

  private get headers() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Validates a referral code against the external affiliate system.
   * Read-only — never throws, falls back to invalid on any error.
   */
  async validateReferralCode(
    code: string,
  ): Promise<{ valid: boolean; affiliateId?: string; fullName?: string }> {
    if (!code) return { valid: false };

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/referrals/${code}/validate`, {
          headers: { 'x-api-key': this.apiKey },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to validate referral code ${code}: ${error.message}`,
      );
      return { valid: false };
    }
  }

  /**
   * Records a successful referral (triggered by payment).
   * Idempotent — the external backend dedups on `Idempotency-Key` /
   * `externalReference`. Throws AffiliateSyncError on failure so the caller
   * (queue processor) can decide whether to retry.
   */
  async recordReferral(
    data: {
      referralCode: string;
      businessId: string;
      businessName: string;
      ownerName: string;
      email: string;
      phone: string;
      planName: string;
      planId?: string;
      address?: string;
      amountPaid: number;
      isFirstPayment: boolean;
      rate: number;
      externalReference: string;
    },
    idempotencyKey: string,
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/referrals/record`, data, {
          headers: {
            ...this.headers,
            'Idempotency-Key': idempotencyKey,
          },
        }),
      );

      return response.status === 201 || response.status === 200;
    } catch (error) {
      this.logger.error(
        `Failed to record referral for ${data.email}: ${error.message}`,
      );
      throw classifyAffiliateError(error);
    }
  }

  /**
   * Syncs a withdrawal request to the external affiliate system.
   * Idempotent via `externalReference` / `Idempotency-Key`.
   */
  async processWithdrawal(
    data: {
      email: string;
      amount: number;
      bankName: string;
      accountNumber: string;
      accountName: string;
      externalReference: string;
    },
    idempotencyKey: string,
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/withdrawals/process`, data, {
          headers: {
            ...this.headers,
            'Idempotency-Key': idempotencyKey,
          },
        }),
      );

      return response.status === 201 || response.status === 200;
    } catch (error) {
      this.logger.error(
        `Failed to sync withdrawal for ${data.email}: ${error.message}`,
      );
      throw classifyAffiliateError(error);
    }
  }
}
