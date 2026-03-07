import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private readonly httpService: HttpService,
  ) {}

  async verifyTransaction(reference: string): Promise<any> {
    try {
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!secretKey) {
        throw new Error('PAYSTACK_SECRET_KEY not configured');
      }

      // Mock for E2E tests
      if (secretKey === 'sk_test_mock_key') {
        return {
          status: 'success',
          reference,
          amount: 5000,
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
      if (data.status && data.data.status === 'success') {
        return data.data; // Return full data to access authorization
      }
      return false;
    } catch (error) {
      console.error('Paystack Verification Error:', error.message);
      return false;
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
      console.error('Paystack Charge Error:', error.message);
      return null;
    }
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
