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
import {
  CatalogueOfferClaim,
  CatalogueOfferClaimStatus,
} from './entities/catalogue-offer-claim.entity';
import { Otp } from '../auth/entities/otp.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MailService } from '../mail/mail.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { In } from 'typeorm';

import { AiCreditService } from '../ai-copilot/services/ai-credit.service';
import { OpenAIClient } from '../ai-copilot/openai/openai.client';
import { ClustersService } from '../clusters/clusters.service';

describe('CatalogueOfferService', () => {
  let service: CatalogueOfferService;
  let offerRepo: any;
  let claimRepo: any;
  let otpRepo: any;
  let mailService: any;
  let subscriptionsService: any;
  let branchRepo: any;
  let itemRepo: any;
  let aiCreditService: any;
  let openAiClient: any;
  let clustersService: any;

  const mockOffer = {
    id: 'offer-1',
    name: 'Summer Burger Promo',
    status: CatalogueOfferStatus.ACTIVE,
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-12-31'),
    quantity: 10,
    businessId: 'biz-1',
    pricingType: CatalogueOfferPricingType.SUM,
    branch: { uniqueCode: 'BR123XYZ9' },
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
    claimCode: 'VEM-BR123XYZ9-123456',
    status: CatalogueOfferClaimStatus.CLAIMED,
    expiresAt: new Date(Date.now() + 604800000), // 7 days
    offer: mockOffer,
  };

  beforeEach(async () => {
    mockOtpRecord.isVerified = false;
    mockClaim.status = CatalogueOfferClaimStatus.CLAIMED;

    offerRepo = {
      findOne: jest.fn(),
      increment: jest.fn(),
    };
    claimRepo = {
      count: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((claim) =>
          Promise.resolve({ id: 'claim-123', ...claim }),
        ),
      findOne: jest.fn(),
    };
    otpRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((otp) => {
        otpRecord.isVerified = otp.isVerified;
        return Promise.resolve({ id: 'otp-123', ...otp });
      }),
      findOne: jest.fn(),
    };
    const otpRecord = mockOtpRecord;
    mailService = {
      sendOtp: jest.fn().mockResolvedValue(true),
    };

    subscriptionsService = {
      getCapabilities: jest.fn().mockResolvedValue({
        capabilities: {
          catalogueOffers: { enabled: true, limit: 'unlimited' },
        },
      }),
    };

    branchRepo = { findOne: jest.fn().mockResolvedValue(null) };
    itemRepo = { find: jest.fn().mockResolvedValue([]) };
    aiCreditService = { consume: jest.fn().mockResolvedValue(undefined) };
    openAiClient = {
      isAvailable: jest.fn().mockReturnValue(false),
      analyze: jest.fn(),
    };
    clustersService = {
      invalidateForBranch: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogueOfferService,
        { provide: getRepositoryToken(CatalogueOffer), useValue: offerRepo },
        { provide: getRepositoryToken(CatalogueItem), useValue: itemRepo },
        { provide: getRepositoryToken(Branch), useValue: branchRepo },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: claimRepo,
        },
        { provide: getRepositoryToken(Otp), useValue: otpRepo },
        { provide: SubscriptionsService, useValue: subscriptionsService },
        { provide: MailService, useValue: mailService },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(null),
            del: jest.fn().mockResolvedValue(null),
          },
        },
        { provide: AiCreditService, useValue: aiCreditService },
        { provide: OpenAIClient, useValue: openAiClient },
        { provide: ClustersService, useValue: clustersService },
      ],
    }).compile();

    service = module.get<CatalogueOfferService>(CatalogueOfferService);
  });

  describe('createOffer', () => {
    it('should create an offer with galleryImages', async () => {
      const createDto = {
        name: 'Summer Deal',
        description: 'Great summer deal',
        pricingType: CatalogueOfferPricingType.SUM,
        branchId: 'branch-1',
        itemIds: ['item-1'],
        mainImage: 'https://image.com/main.jpg',
        galleryImages: [
          'https://image.com/gal1.jpg',
          'https://image.com/gal2.jpg',
        ],
      };
      const savedOffer = {
        id: 'offer-new',
        ...createDto,
        businessId: 'biz-1',
        calculatedPrice: 100,
      };

      branchRepo.findOne.mockResolvedValue({
        id: 'branch-1',
        businessId: 'biz-1',
      });
      itemRepo.find.mockResolvedValue([
        { id: 'item-1', branches: [{ id: 'branch-1' }], price: 100 },
      ]);
      offerRepo.create = jest.fn().mockReturnValue(savedOffer);
      offerRepo.save = jest.fn().mockResolvedValue(savedOffer);

      const result = await service.createOffer(createDto, 'biz-1');
      expect(result.mainImage).toBe('https://image.com/main.jpg');
      expect(result.galleryImages).toEqual([
        'https://image.com/gal1.jpg',
        'https://image.com/gal2.jpg',
      ]);
    });

    it('should throw ForbiddenException if catalogue disabled', async () => {
      subscriptionsService.getCapabilities = jest.fn().mockResolvedValue({
        capabilities: { catalogueOffers: { enabled: false } },
      });

      await expect(
        service.createOffer({ name: 'Test' } as any, 'biz-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateOffer', () => {
    it('should update galleryImages on an offer', async () => {
      const existingOffer = {
        id: 'offer-1',
        name: 'Old Deal',
        galleryImages: ['https://image.com/old.jpg'],
        businessId: 'biz-1',
        branchId: 'branch-1',
        items: [{ id: 'item-1', branches: [{ id: 'branch-1' }], price: 100 }],
        calculatedPrice: 50,
      };
      offerRepo.findOne = jest.fn().mockResolvedValue(existingOffer);
      offerRepo.save = jest.fn().mockImplementation((o) => Promise.resolve(o));

      const updateDto = {
        galleryImages: [
          'https://image.com/new1.jpg',
          'https://image.com/new2.jpg',
        ],
      };
      const result = await service.updateOffer('offer-1', updateDto, 'biz-1');
      expect(result.galleryImages).toEqual([
        'https://image.com/new1.jpg',
        'https://image.com/new2.jpg',
      ]);
    });

    it('should throw NotFoundException if offer not found', async () => {
      offerRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(
        service.updateOffer('invalid', {} as any, 'biz-1'),
      ).rejects.toThrow(NotFoundException);
    });
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
      expect(mailService.sendOtp).toHaveBeenCalledWith(
        'chidi@example.com',
        expect.any(String),
      );
    });

    it('should throw NotFoundException if offer does not exist', async () => {
      offerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.requestClaimOtp({
          offerId: 'invalid-offer',
          firstName: 'Chidi',
          email: 'chidi@example.com',
          phone: '+2348012345678',
        }),
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
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyClaim', () => {
    it('should verify OTP and return a unique claim code', async () => {
      otpRepo.findOne.mockResolvedValue(mockOtpRecord);
      offerRepo.findOne.mockResolvedValue(mockOffer);
      claimRepo.count.mockResolvedValue(0);
      claimRepo.findOne.mockResolvedValue(null); // No existing claim

      const result = await service.verifyClaim({
        email: 'chidi@example.com',
        code: '1234',
        offerId: 'offer-1',
      });

      expect(result.message).toBe('Deal claimed successfully');
      expect(result.claim.claimCode).toMatch(/^VEM-[A-Z0-9]{9}-[A-Z0-9]{4}$/);
      expect(claimRepo.save).toHaveBeenCalled();
      expect(otpRepo.save).toHaveBeenCalled();
    });

    it('should return existing claim details if already claimed (idempotency)', async () => {
      otpRepo.findOne.mockResolvedValue(mockOtpRecord);
      offerRepo.findOne.mockResolvedValue(mockOffer);
      claimRepo.findOne.mockResolvedValue(mockClaim); // Existing claim

      const result = await service.verifyClaim({
        email: 'chidi@example.com',
        code: '1234',
        offerId: 'offer-1',
      });

      expect(result.message).toBe('Deal already claimed');
      expect(result.claim.claimCode).toBe('VEM-BR123XYZ9-123456');
    });

    it('should throw BadRequestException if OTP code is incorrect', async () => {
      otpRepo.findOne.mockResolvedValue(mockOtpRecord);

      await expect(
        service.verifyClaim({
          email: 'chidi@example.com',
          code: 'wrong-code',
          offerId: 'offer-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('redeemClaim', () => {
    it('should redeem claim successfully and increment offer visits', async () => {
      claimRepo.findOne.mockResolvedValue(mockClaim);

      const result = await service.redeemClaim('VEM-BR123XYZ9-123456', 'biz-1');

      expect(result.success).toBe(true);
      expect(result.claim.status).toBe(CatalogueOfferClaimStatus.REDEEMED);
      expect(claimRepo.save).toHaveBeenCalled();
      expect(offerRepo.increment).toHaveBeenCalledWith(
        { id: 'offer-1' },
        'visits',
        1,
      );
    });

    it('should throw ForbiddenException if businessId does not match', async () => {
      claimRepo.findOne.mockResolvedValue(mockClaim);

      await expect(
        service.redeemClaim('VEM-BR123XYZ9-123456', 'different-biz'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already redeemed', async () => {
      claimRepo.findOne.mockResolvedValue({
        ...mockClaim,
        status: CatalogueOfferClaimStatus.REDEEMED,
      });

      await expect(
        service.redeemClaim('VEM-BR123XYZ9-123456', 'biz-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateTerms', () => {
    it('should consume AI credit and return terms using OpenAI when available', async () => {
      openAiClient.isAvailable.mockReturnValue(true);
      openAiClient.analyze.mockResolvedValue(
        JSON.stringify({
          terms: ['Term 1', 'Term 2', 'Term 3'],
        }),
      );

      const result = await service.generateTerms(
        { title: 'Buy 1 Get 1', description: 'Free item offer' },
        'biz-1',
      );

      expect(aiCreditService.consume).toHaveBeenCalledWith('biz-1');
      expect(result.terms).toEqual(['Term 1', 'Term 2', 'Term 3']);
    });

    it('should consume AI credit and return fallback terms when OpenAI is unavailable', async () => {
      openAiClient.isAvailable.mockReturnValue(false);

      const result = await service.generateTerms(
        {
          title: 'Free Delivery Deal',
          description: 'Includes free delivery on orders',
        },
        'biz-1',
      );

      expect(aiCreditService.consume).toHaveBeenCalledWith('biz-1');
      expect(result.terms.length).toBeGreaterThan(0);
      expect(result.terms.some((t) => t.includes('Free Delivery Deal'))).toBe(
        true,
      );
    });
  });
});
