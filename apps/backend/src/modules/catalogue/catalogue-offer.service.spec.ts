import { Test, TestingModule } from '@nestjs/testing';
import { CatalogueOfferService } from './catalogue-offer.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
  CatalogueOfferPricingType,
} from './entities/catalogue-offer.entity';
import { CatalogueItem } from './entities/catalogue-item.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueOfferClaim, CatalogueOfferClaimStatus } from './entities/catalogue-offer-claim.entity';
import { Otp } from '../auth/entities/otp.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MailService } from '../mail/mail.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { In } from 'typeorm';

describe('CatalogueOfferService', () => {
  let service: CatalogueOfferService;
  let offerRepo: any;
  let claimRepo: any;
  let otpRepo: any;
  let mailService: any;

  const mockOffer = {
    id: 'offer-1',
    name: 'Summer Burger Promo',
    status: CatalogueOfferStatus.ACTIVE,
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-07-31'),
    quantity: 10,
    businessId: 'biz-1',
    pricingType: CatalogueOfferPricingType.SUM,
  };

  const mockOtpRecord = {
    id: 'otp-1',
    email: 'chidi@example.com',
    code: '1234',
    expiresAt: new Date(Date.now() + 600000), // 10 min
    isVerified: false,
    metadata: {
      offerId: 'offer-1',
      firstName: 'Chidi',
      lastName: 'Okonkwo',
      email: 'chidi@example.com',
      phone: '+2348012345678',
    },
  };

  const mockClaim = {
    id: 'claim-1',
    offerId: 'offer-1',
    claimCode: 'VEM-CLAIM-123456',
    status: CatalogueOfferClaimStatus.CLAIMED,
    expiresAt: new Date(Date.now() + 604800000), // 7 days
    offer: mockOffer,
  };

  beforeEach(async () => {
    offerRepo = {
      findOne: jest.fn(),
      increment: jest.fn(),
    };
    claimRepo = {
      count: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((claim) => Promise.resolve({ id: 'claim-123', ...claim })),
      findOne: jest.fn(),
    };
    otpRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((otp) => Promise.resolve({ id: 'otp-123', ...otp })),
      findOne: jest.fn(),
    };
    mailService = {
      sendOtp: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogueOfferService,
        { provide: getRepositoryToken(CatalogueOffer), useValue: offerRepo },
        { provide: getRepositoryToken(CatalogueItem), useValue: {} },
        { provide: getRepositoryToken(Branch), useValue: {} },
        { provide: getRepositoryToken(CatalogueOfferClaim), useValue: claimRepo },
        { provide: getRepositoryToken(Otp), useValue: otpRepo },
        {
          provide: SubscriptionsService,
          useValue: {
            getCapabilities: jest.fn().mockResolvedValue({
              capabilities: {
                catalogueOffers: { enabled: true, limit: 'unlimited' },
              },
            }),
          },
        },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<CatalogueOfferService>(CatalogueOfferService);
  });

  describe('requestClaimOtp', () => {
    it('should send OTP when offer is active and has capacity', async () => {
      offerRepo.findOne.mockResolvedValue(mockOffer);
      claimRepo.count.mockResolvedValue(2);

      const result = await service.requestClaimOtp({
        offerId: 'offer-1',
        firstName: 'Chidi',
        email: 'chidi@example.com',
        phone: '+2348012345678',
      });

      expect(result.message).toBe('Verification OTP sent successfully');
      expect(otpRepo.create).toHaveBeenCalled();
      expect(otpRepo.save).toHaveBeenCalled();
      expect(mailService.sendOtp).toHaveBeenCalledWith('chidi@example.com', expect.any(String));
    });

    it('should throw NotFoundException if offer does not exist', async () => {
      offerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.requestClaimOtp({
          offerId: 'invalid-offer',
          firstName: 'Chidi',
          email: 'chidi@example.com',
          phone: '+2348012345678',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if claim limit is reached', async () => {
      offerRepo.findOne.mockResolvedValue(mockOffer);
      claimRepo.count.mockResolvedValue(10); // Matches limit 10

      await expect(
        service.requestClaimOtp({
          offerId: 'offer-1',
          firstName: 'Chidi',
          email: 'chidi@example.com',
          phone: '+2348012345678',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyClaim', () => {
    it('should verify OTP and return a unique claim code', async () => {
      otpRepo.findOne.mockResolvedValue(mockOtpRecord);
      offerRepo.findOne.mockResolvedValue(mockOffer);
      claimRepo.count.mockResolvedValue(0);

      const result = await service.verifyClaim({
        email: 'chidi@example.com',
        code: '1234',
        offerId: 'offer-1',
      });

      expect(result.message).toBe('Deal claimed successfully');
      expect(result.claim.claimCode).toMatch(/^VEM-CLAIM-[A-Z0-9]{6}$/);
      expect(claimRepo.save).toHaveBeenCalled();
      expect(otpRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if OTP code is incorrect', async () => {
      otpRepo.findOne.mockResolvedValue(mockOtpRecord);

      await expect(
        service.verifyClaim({
          email: 'chidi@example.com',
          code: 'wrong-code',
          offerId: 'offer-1',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('redeemClaim', () => {
    it('should redeem claim successfully and increment offer visits', async () => {
      claimRepo.findOne.mockResolvedValue(mockClaim);

      const result = await service.redeemClaim('VEM-CLAIM-123456', 'biz-1');

      expect(result.success).toBe(true);
      expect(result.claim.status).toBe(CatalogueOfferClaimStatus.REDEEMED);
      expect(claimRepo.save).toHaveBeenCalled();
      expect(offerRepo.increment).toHaveBeenCalledWith({ id: 'offer-1' }, 'visits', 1);
    });

    it('should throw ForbiddenException if businessId does not match', async () => {
      claimRepo.findOne.mockResolvedValue(mockClaim);

      await expect(
        service.redeemClaim('VEM-CLAIM-123456', 'different-biz')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already redeemed', async () => {
      claimRepo.findOne.mockResolvedValue({
        ...mockClaim,
        status: CatalogueOfferClaimStatus.REDEEMED,
      });

      await expect(
        service.redeemClaim('VEM-CLAIM-123456', 'biz-1')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
