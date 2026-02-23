import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Payment, PaymentPurpose } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { ConflictException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: Repository<Payment>;
  let httpService: HttpService;

  const mockPaymentRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepo = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyTransaction', () => {
    it('should return true if paystack status is success', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: { status: true, data: { status: 'success' } },
        }),
      );

      const result = await service.verifyTransaction('ref_123');
      expect(result).toBe(true);
    });

    it('should return false if paystack status is not success', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: { status: true, data: { status: 'failed' } },
        }),
      );

      const result = await service.verifyTransaction('ref_123');
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockHttpService.get.mockImplementation(() => {
        throw new Error('Network error');
      });
      const result = await service.verifyTransaction('ref_123');
      expect(result).toBe(false);
    });
  });

  describe('recordPayment', () => {
    it('should create and save payment', async () => {
      const dto = {
        reference: 'ref_123',
        amount: 5000,
        purpose: PaymentPurpose.ORDER,
        status: undefined as any,
      };
      mockPaymentRepo.findOneBy.mockResolvedValue(null);
      mockPaymentRepo.create.mockReturnValue(dto);
      mockPaymentRepo.save.mockResolvedValue({ id: 'pay_1', ...dto });

      const result = await service.recordPayment(dto as any);
      expect(result.id).toBe('pay_1');
      expect(mockPaymentRepo.save).toHaveBeenCalled();
    });

    it('should handle idempotency (return existing if identical)', async () => {
      const dto = {
        reference: 'ref_123',
        amount: 5000,
        purpose: PaymentPurpose.ORDER,
      };
      mockPaymentRepo.findOneBy.mockResolvedValue({ ...dto, id: 'pay_1' });

      const result = await service.recordPayment(dto as any);
      expect(result.id).toBe('pay_1');
      expect(mockPaymentRepo.save).not.toHaveBeenCalled();
    });

    it('should throw conflict if reference exists with different details', async () => {
      const dto = {
        reference: 'ref_123',
        amount: 5000,
        purpose: PaymentPurpose.ORDER,
      };
      mockPaymentRepo.findOneBy.mockResolvedValue({ ...dto, amount: 9000 }); // Different amount

      await expect(service.recordPayment(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
