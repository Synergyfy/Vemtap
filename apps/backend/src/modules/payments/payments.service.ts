import { Injectable, ConflictException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export type PaystackTransactionStatus =
  | 'success'
  | 'pending'
  | 'failed'
  | 'abandoned';

export interface VerifiedTransaction {
  reference: string;
  status: PaystackTransactionStatus;
  amount: number; // kobo (lowest denomination)
  currency: string;
  channel: string;
  gatewayResponse?: string;
  message?: string;
  authorization?: {
    authorization_code?: string;
    reusable?: boolean;
    channel?: string;
  } | null;
  paidAt?: string;
}

export interface InitializeTransactionInput {
  email: string;
  amount: number; // kobo
  reference: string;
  currency?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
  callbackUrl?: string;
}

export interface InitializeTransactionResult {
  reference: string;
  access_code: string;
  authorization_url: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private readonly httpService: HttpService,
  ) {}

  verifyWebhookSignature(signature: string, rawBody: any): boolean {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey || !rawBody) return false;

    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Verify a Paystack transaction reference and return its full status.
   * Returns null when the API cannot be reached or returns an unexpected shape.
   * `pending` covers async payment channels (bank transfer, USSD, etc.) whose
   * status is `ongoing`, `pending`, `processing`, or `queued`.
   */
  async verifyTransaction(reference: string): Promise<VerifiedTransaction | null> {
    try {
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!secretKey) {
        throw new Error('PAYSTACK_SECRET_KEY not configured');
      }

      // Mock for E2E tests
      if (secretKey === 'sk_test_mock_key') {
        return {
          reference,
          status: 'success',
          amount: 5000,
          currency: 'NGN',
          channel: 'card',
          authorization: { authorization_code: 'AUTH_mock' },
        };
      }

      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
            },
          },
        ),
      );

      const data = response.data;
      if (!data?.status || !data.data) {
        return null;
      }

      const txn = data.data;
      return {
        reference: txn.reference || reference,
        status: this.mapTransactionStatus(txn.status),
        amount: Number(txn.amount) || 0,
        currency: txn.currency || 'NGN',
        channel: txn.channel || '',
        gatewayResponse: txn.gateway_response,
        message: txn.message,
        authorization: txn.authorization || null,
        paidAt: txn.paid_at,
      };
    } catch (error) {
      this.logger.error(
        `Paystack Verification Error: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  private mapTransactionStatus(status: string): PaystackTransactionStatus {
    switch (status) {
      case 'success':
        return 'success';
      case 'ongoing':
      case 'pending':
      case 'processing':
      case 'queued':
        return 'pending';
      case 'abandoned':
        return 'abandoned';
      default:
        return 'failed';
    }
  }

  /**
   * Initialize a transaction server-side so the frontend only needs the
   * returned access_code (never the secret key), and so we can attach
   * identifying metadata for webhook reconciliation.
   */
  async initializeTransaction(
    input: InitializeTransactionInput,
  ): Promise<InitializeTransactionResult | null> {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY not configured');
    }

    if (secretKey === 'sk_test_mock_key') {
      return {
        reference: input.reference,
        access_code: `mock-${input.reference}`,
        authorization_url: '',
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.paystack.co/transaction/initialize',
          {
            email: input.email,
            amount: input.amount,
            reference: input.reference,
            currency: input.currency || 'NGN',
            metadata: input.metadata,
            channels: input.channels,
            callback_url: input.callbackUrl,
          },
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data = response.data;
      if (!data?.status) return null;
      return data.data as InitializeTransactionResult;
    } catch (error) {
      this.logger.error(
        `Paystack Initialize Error: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async chargeAuthorization(
    amount: number,
    email: string,
    authorization_code: string,
  ): Promise<any> {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `https://api.paystack.co/transaction/charge_authorization`,
          {
            amount: Math.round(amount * 100), // Convert to kobo
            email,
            authorization_code,
          },
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data = response.data;
      if (data.status && data.data.status === 'success') {
        return data.data;
      }
      return null;
    } catch (error) {
      this.logger.error(`Paystack Charge Error: ${error.message}`, error.stack);
      return null;
    }
  }

  async findByReference(reference: string): Promise<Payment | null> {
    return this.paymentRepository.findOneBy({ reference });
  }

  async recordPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const existing = await this.paymentRepository.findOneBy({
      reference: createPaymentDto.reference,
    });

    if (existing) {
      // Idempotency: If exact same payment is recorded, return it.
      // If conflicting details, throw error.
      if (
        existing.amount == createPaymentDto.amount &&
        existing.purpose == createPaymentDto.purpose
      ) {
        // Upgrade a Pending intent to Success when the payment is confirmed
        // (via client callback or webhook) without creating a duplicate row.
        if (
          existing.status === PaymentStatus.PENDING &&
          createPaymentDto.status === PaymentStatus.SUCCESS
        ) {
          existing.status = createPaymentDto.status;
          existing.metadata = createPaymentDto.metadata ?? existing.metadata;
          existing.businessId = createPaymentDto.businessId ?? existing.businessId;
          existing.userId = createPaymentDto.userId ?? existing.userId;
          return this.paymentRepository.save(existing);
        }
        return existing;
      }
      throw new ConflictException(
        'Payment reference already exists with different details',
      );
    }

    const payment = this.paymentRepository.create(createPaymentDto);
    return this.paymentRepository.save(payment);
  }
}
