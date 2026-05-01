import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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

  /**
   * Validates a referral code against the external affiliate system
   */
  async validateReferralCode(
    code: string,
  ): Promise<{ valid: boolean; affiliateId?: string; fullName?: string }> {
    if (!code) return { valid: false };

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/referrals/${code}/validate`, {
          headers: {
            'x-api-key': this.apiKey,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to validate referral code ${code}: ${error.message}`,
      );
      // Fallback to invalid if API is down or returns error
      return { valid: false };
    }
  }

  /**
   * Records a successful referral (triggered by payment)
   */
  async recordReferral(data: {
    referralCode: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    planType: string;
    address?: string;
  }): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/referrals/record`, data, {
          headers: {
            'x-api-key': this.apiKey,
          },
        }),
      );

      return response.status === 201 || response.status === 200;
    } catch (error) {
      this.logger.error(
        `Failed to record referral for ${data.email}: ${error.message}`,
      );
      if (error.response) {
        this.logger.error(
          `Response data: ${JSON.stringify(error.response.data)}`,
        );
      }
      return false;
    }
  }

  /**
   * Syncs a withdrawal request to the external affiliate system
   */
  async processWithdrawal(data: {
    email: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    reference: string;
  }): Promise<boolean> {
    try {
      const payload = {
        email: data.email,
        amount: data.amount,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        externalReference: data.reference,
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/withdrawals/process`, payload, {
          headers: {
            'x-api-key': this.apiKey,
          },
        }),
      );

      return response.status === 201 || response.status === 200;
    } catch (error) {
      this.logger.error(
        `Failed to sync withdrawal for ${data.email}: ${error.message}`,
      );
      return false;
    }
  }
}
