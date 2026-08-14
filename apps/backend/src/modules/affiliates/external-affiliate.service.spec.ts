import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { ExternalAffiliateService } from './external-affiliate.service';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

describe('ExternalAffiliateService', () => {
  let service: ExternalAffiliateService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'VEMTAP_AFFILIATE_KEY') return 'test-key';
        if (key === 'VEMTAP_AFFILIATE_BASE_URL') return 'http://test-api.com';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalAffiliateService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ExternalAffiliateService>(ExternalAffiliateService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateReferralCode', () => {
    it('should return valid response when code is valid', async () => {
      const mockResponse: AxiosResponse = {
        data: { valid: true, affiliateId: 'aff-123' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.validateReferralCode('REF123');

      expect(result).toEqual({ valid: true, affiliateId: 'aff-123' });
      expect(httpService.get).toHaveBeenCalledWith(
        'http://test-api.com/referrals/REF123/validate',
        expect.any(Object),
      );
    });

    it('should return invalid when API fails', async () => {
      httpService.get.mockReturnValue(throwError(() => new Error('API Error')));

      const result = await service.validateReferralCode('REF123');

      expect(result).toEqual({ valid: false });
    });
  });

  describe('recordReferral', () => {
    it('should call the record endpoint with correct data', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      httpService.post.mockReturnValue(of(mockResponse));

      await service.recordReferral(
        {
          referralCode: 'REF123',
          businessId: 'b1',
          businessName: 'Test Biz',
          ownerName: 'John Doe',
          email: 'test@biz.com',
          phone: '123456',
          planName: 'Gold',
          planId: 'plan-1',
          amountPaid: 10000,
          isFirstPayment: true,
          rate: 30,
          externalReference: 'PAY_1',
        },
        'affiliate-ref:PAY_1',
      );

      expect(httpService.post).toHaveBeenCalledWith(
        'http://test-api.com/referrals/record',
        {
          referralCode: 'REF123',
          businessId: 'b1',
          businessName: 'Test Biz',
          ownerName: 'John Doe',
          email: 'test@biz.com',
          phone: '123456',
          planName: 'Gold',
          planId: 'plan-1',
          amountPaid: 10000,
          isFirstPayment: true,
          rate: 30,
          externalReference: 'PAY_1',
        },
        expect.any(Object),
      );
    });
  });

  describe('processWithdrawal', () => {
    it('should call the process withdrawal endpoint', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      httpService.post.mockReturnValue(of(mockResponse));

      await service.processWithdrawal(
        {
          email: 'test@user.com',
          amount: 1000,
          bankName: 'Test Bank',
          accountNumber: '1234567890',
          accountName: 'Test User',
          externalReference: 'REF-001',
        },
        'affiliate-wd:REF-001',
      );

      expect(httpService.post).toHaveBeenCalledWith(
        'http://test-api.com/withdrawals/process',
        {
          email: 'test@user.com',
          amount: 1000,
          bankName: 'Test Bank',
          accountNumber: '1234567890',
          accountName: 'Test User',
          externalReference: 'REF-001',
        },
        expect.any(Object),
      );
    });
  });
});
