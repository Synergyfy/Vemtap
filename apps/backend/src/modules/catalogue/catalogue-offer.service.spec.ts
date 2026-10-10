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
import { Business } from '../businesses/entities/business.entity';
import {
  CatalogueOfferClaim,
  CatalogueOfferClaimStatus,
} from './entities/catalogue-offer-claim.entity';
import { CatalogueDealGift } from './entities/catalogue-deal-gift.entity';
import { Otp } from '../auth/entities/otp.entity';
import { User } from '../users/entities/user.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MailService } from '../mail/mail.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
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
  let businessRepo: any;
  let itemRepo: any;
  let aiCreditService: any;
  let openAiClient: any;
  let clustersService: any;
  let dealGiftRepo: any;

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
      save: jest
        .fn()
        .mockImplementation((dto) =>
          Promise.resolve({ id: 'offer-saved', ...dto }),
        ),
      create: jest.fn().mockImplementation((dto) => dto),
    };
    claimRepo = {
      count: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
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
      sendDealGiftEmail: jest.fn().mockResolvedValue(true),
    };

    subscriptionsService = {
      getCapabilities: jest.fn().mockResolvedValue({
        capabilities: {
          catalogueOffers: { enabled: true, limit: 'unlimited' },
        },
      }),
      activeSubscription: jest.fn().mockResolvedValue(null),
    };

    branchRepo = { findOne: jest.fn().mockResolvedValue(null) };
    businessRepo = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    itemRepo = { find: jest.fn().mockResolvedValue([]) };
    aiCreditService = { consume: jest.fn().mockResolvedValue(undefined) };
    openAiClient = {
      isAvailable: jest.fn().mockReturnValue(false),
      analyze: jest.fn(),
    };
    clustersService = {
      invalidateForBranch: jest.fn().mockResolvedValue(undefined),
    };
    dealGiftRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((gift) =>
          Promise.resolve({ id: 'gift-123', ...gift }),
        ),
      findOne: jest.fn(),
      softRemove: jest.fn().mockImplementation((gift) => Promise.resolve(gift)),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogueOfferService,
        { provide: getRepositoryToken(CatalogueOffer), useValue: offerRepo },
        { provide: getRepositoryToken(CatalogueItem), useValue: itemRepo },
        { provide: getRepositoryToken(Branch), useValue: branchRepo },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: claimRepo,
        },
        {
          provide: getRepositoryToken(CatalogueDealGift),
          useValue: dealGiftRepo,
        },
        { provide: getRepositoryToken(Otp), useValue: otpRepo },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn().mockResolvedValue(null) },
        },
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

    it('should create an offer from sourceProductId without requiring explicit itemIds', async () => {
      const createDto = {
        name: 'Product Deal',
        description: '',
        sourceProductId: 'prod-123',
        pricingType: CatalogueOfferPricingType.FIXED_DISCOUNT_AMOUNT,
        discountValue: 500,
        branchId: 'branch-1',
      };

      branchRepo.findOne.mockResolvedValue({
        id: 'branch-1',
        businessId: 'biz-1',
      });
      itemRepo.find.mockResolvedValue([
        {
          id: 'prod-123',
          name: 'Nike Shoes',
          branches: [{ id: 'branch-1' }],
          price: 2000,
        },
      ]);
      offerRepo.create = jest.fn().mockImplementation((dto) => dto);
      offerRepo.save = jest
        .fn()
        .mockImplementation((dto) =>
          Promise.resolve({ id: 'deal-created', ...dto }),
        );

      const result = await service.createOffer(createDto, 'biz-1');
      expect(result.sourceProductId).toBe('prod-123');
      expect(result.calculatedPrice).toBe(1500);
      expect(result.description).toBe('');
    });

    it('should calculate correct price for FIXED_DISCOUNT_PRICE when fixedPrice is provided', async () => {
      const createDto = {
        name: 'Fixed Price Deal',
        pricingType: CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE,
        fixedPrice: 1200,
        branchId: 'branch-1',
        itemIds: ['item-1'],
      };

      branchRepo.findOne.mockResolvedValue({
        id: 'branch-1',
        businessId: 'biz-1',
      });
      itemRepo.find.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Meal',
          branches: [{ id: 'branch-1' }],
          price: 2000,
        },
      ]);
      offerRepo.create = jest.fn().mockImplementation((dto) => dto);
      offerRepo.save = jest
        .fn()
        .mockImplementation((dto) =>
          Promise.resolve({ id: 'deal-created', ...dto }),
        );

      const result = await service.createOffer(createDto, 'biz-1');
      expect(result.calculatedPrice).toBe(1200);
    });

    it('should calculate correct price for FIXED_DISCOUNT_PRICE when fixedPrice is omitted but discountValue is provided', async () => {
      const createDto = {
        name: 'Fixed Discount Deal',
        pricingType: CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE,
        discountValue: 400,
        branchId: 'branch-1',
        itemIds: ['item-1'],
      };

      branchRepo.findOne.mockResolvedValue({
        id: 'branch-1',
        businessId: 'biz-1',
      });
      itemRepo.find.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Meal',
          branches: [{ id: 'branch-1' }],
          price: 2000,
        },
      ]);
      offerRepo.create = jest.fn().mockImplementation((dto) => dto);
      offerRepo.save = jest
        .fn()
        .mockImplementation((dto) =>
          Promise.resolve({ id: 'deal-created', ...dto }),
        );

      const result = await service.createOffer(createDto, 'biz-1');
      expect(result.calculatedPrice).toBe(1600);
    });

    it('should handle percentage discount and defensively handle flat amount > 100 sent as discountValue without negative numbers', async () => {
      const normalPercentDto = {
        name: '20% Deal',
        pricingType: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
        discountValue: 20,
        branchId: 'branch-1',
        itemIds: ['item-1'],
      };

      branchRepo.findOne.mockResolvedValue({
        id: 'branch-1',
        businessId: 'biz-1',
      });
      itemRepo.find.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Item',
          branches: [{ id: 'branch-1' }],
          price: 2000,
        },
      ]);
      offerRepo.create = jest.fn().mockImplementation((dto) => dto);
      offerRepo.save = jest
        .fn()
        .mockImplementation((dto) =>
          Promise.resolve({ id: 'deal-created', ...dto }),
        );

      const resultNormal = await service.createOffer(normalPercentDto, 'biz-1');
      expect(resultNormal.calculatedPrice).toBe(1600);

      // Defensively test flat Naira amount (e.g. ₦500) mistakenly sent under percentage_discount
      const flatAmountMistakeDto = {
        name: 'Mistake Naira Deal',
        pricingType: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
        discountValue: 500,
        branchId: 'branch-1',
        itemIds: ['item-1'],
      };
      const resultFlat = await service.createOffer(
        flatAmountMistakeDto,
        'biz-1',
      );
      expect(resultFlat.calculatedPrice).toBe(1500); // 2000 - 500, never -8000
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

  describe('findAllOffersPublicGlobal', () => {
    const makeOfferQb = () => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'offer-1',
            name: 'Deal',
            description: 'desc',
            pricingType: 'sum',
            fixedPrice: null,
            discountValue: null,
            calculatedPrice: 100,
            status: 'active',
            branchId: 'branch-1',
            branch: {
              name: 'Branch',
              business: { category: { name: 'Food' } },
            },
            items: [{ price: 100 }],
            quantity: 10,
            startDate: null,
            endDate: null,
            maxClaimsPerCustomer: 1,
            audienceTarget: 'all',
            terms: [],
            claimCodePrefix: 'VEM',
          },
        ],
        1,
      ]),
    });

    it('orders by claim count for sortBy=popular and returns claimedCount', async () => {
      const qb = makeOfferQb();
      offerRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      claimRepo.find.mockResolvedValue(
        Array.from({ length: 5 }, () => ({ offerId: 'offer-1' })),
      );

      const result = await service.findAllOffersPublicGlobal({
        sortBy: 'popular',
        page: 1,
        limit: 10,
      });

      expect(qb.addSelect).toHaveBeenCalledWith(
        expect.stringContaining('catalogue_offer_claims'),
        'popularityscore',
      );
      expect(qb.orderBy).toHaveBeenCalledWith('popularityscore', 'DESC');
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result.data[0].claimedCount).toBe(5);
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe('offer-1');
    });

    it('orders by a weighted views+claims score for sortBy=featured', async () => {
      const qb = makeOfferQb();
      offerRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      claimRepo.find.mockResolvedValue([
        { offerId: 'offer-1' },
        { offerId: 'offer-1' },
      ]);

      const result = await service.findAllOffersPublicGlobal({
        sortBy: 'featured',
        page: 1,
        limit: 10,
      });

      expect(qb.addSelect).toHaveBeenCalledWith(
        expect.stringContaining('offer.views'),
        'featuredscore',
      );
      expect(qb.orderBy).toHaveBeenCalledWith('featuredscore', 'DESC');
      expect(result.data[0].claimedCount).toBe(2);
    });
  });

  describe('Admin Deals Management', () => {
    it('auto-features deals on creation when plan has autoFeatureDeals enabled', async () => {
      subscriptionsService.activeSubscription = jest.fn().mockResolvedValue({
        plan: { autoFeatureDeals: true },
      });
      branchRepo.findOne.mockResolvedValue({
        id: 'branch-1',
        businessId: 'biz-1',
      });
      itemRepo.find.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Burger',
          price: 50,
          branches: [{ id: 'branch-1' }],
        },
      ]);
      offerRepo.create = jest.fn().mockImplementation((d) => ({ ...d }));
      offerRepo.save = jest
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: 'offer-auto-1', ...d }),
        );

      const result = await service.createOffer(
        {
          name: 'Platinum Deal',
          description: 'Auto-featured deal',
          pricingType: CatalogueOfferPricingType.SUM,
          branchId: 'branch-1',
          itemIds: ['item-1'],
        },
        'biz-1',
      );

      expect(result.isFeatured).toBe(true);
    });

    it('does not auto-feature deals on creation when plan has autoFeatureDeals disabled', async () => {
      subscriptionsService.activeSubscription = jest.fn().mockResolvedValue({
        plan: { autoFeatureDeals: false },
      });
      branchRepo.findOne.mockResolvedValue({
        id: 'branch-1',
        businessId: 'biz-1',
      });
      itemRepo.find.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Burger',
          price: 50,
          branches: [{ id: 'branch-1' }],
        },
      ]);
      offerRepo.create = jest.fn().mockImplementation((d) => ({ ...d }));
      offerRepo.save = jest
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: 'offer-normal-1', ...d }),
        );

      const result = await service.createOffer(
        {
          name: 'Normal Deal',
          description: 'Regular deal',
          pricingType: CatalogueOfferPricingType.SUM,
          branchId: 'branch-1',
          itemIds: ['item-1'],
        },
        'biz-1',
      );

      expect(result.isFeatured).toBe(false);
    });

    it('returns paginated admin deals with formatted details', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 'offer-admin-1',
              name: 'Admin Deal',
              description: 'Desc',
              mainImage: 'https://image.com/1.jpg',
              galleryImages: [],
              status: CatalogueOfferStatus.ACTIVE,
              pricingType: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
              discountValue: 15,
              calculatedPrice: 85,
              views: 25,
              isFeatured: true,
              businessId: 'biz-1',
              branchId: 'branch-1',
              business: { id: 'biz-1', name: 'Azure Bistro' },
              branch: { id: 'branch-1', name: 'Lekki Branch' },
              items: [{ price: 100 }],
              startDate: new Date('2026-01-01'),
              endDate: new Date('2026-12-31'),
              createdAt: new Date('2026-01-01'),
            },
          ],
          1,
        ]),
      };
      offerRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      const claimQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ offerId: 'offer-admin-1', count: '7' }]),
      };
      claimRepo.createQueryBuilder = jest.fn().mockReturnValue(claimQb);

      subscriptionsService.activeSubscription = jest.fn().mockResolvedValue({
        plan: { id: 'plan-plat', name: 'Platinum Plan', isFree: false },
      });

      const result = await service.getAdminDeals({ page: 1, limit: 10 });
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('offer-admin-1');
      expect(result.data[0].claimsCount).toBe(7);
      expect(result.data[0].viewsCount).toBe(25);
      expect(result.data[0].isFeatured).toBe(true);
      expect(result.data[0].business.name).toBe('Azure Bistro');
      expect(result.data[0].branch.name).toBe('Lekki Branch');
      expect(result.data[0].subscriptionPlan.name).toBe('Platinum Plan');
      expect(result.meta.total).toBe(1);
    });

    it('returns deals stats accurately', async () => {
      offerRepo.count = jest.fn().mockImplementation((options) => {
        if (options?.where?.isFeatured) return Promise.resolve(4);
        return Promise.resolve(20);
      });

      const qbActive: any = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(15),
      };
      const qbExpired: any = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      };

      offerRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(qbActive)
        .mockReturnValueOnce(qbExpired);

      const stats = await service.getAdminDealsStats();
      expect(stats.totalDeals).toBe(20);
      expect(stats.activeDeals).toBe(15);
      expect(stats.featuredDeals).toBe(4);
      expect(stats.expiredDeals).toBe(3);
    });

    it('toggles featured status of a deal', async () => {
      offerRepo.findOne.mockResolvedValue({
        id: 'offer-toggle',
        isFeatured: false,
        branchId: 'branch-1',
      });
      offerRepo.save.mockImplementation((d: any) => Promise.resolve({ ...d }));

      const result = await service.toggleDealFeatured('offer-toggle');
      expect(result.id).toBe('offer-toggle');
      expect(result.isFeatured).toBe(true);
      expect(result.message).toContain('marked as featured');
    });

    it('throws NotFoundException when toggling non-existent deal', async () => {
      offerRepo.findOne.mockResolvedValue(null);
      await expect(service.toggleDealFeatured('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns list of businesses for admin filter dropdown', async () => {
      const qb: any = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'b-1', name: 'Alpha Cafe' },
          { id: 'b-2', name: 'Beta Bistro' },
        ]),
      };
      businessRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      const result = await service.getAdminBusinessesList({ search: 'Alpha' });
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ id: 'b-1', name: 'Alpha Cafe' });
    });
  });

  describe('sendDealGift', () => {
    const mockSenderUser = {
      id: 'sender-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      phone: '+2348000000000',
    } as any;

    it('throws UnauthorizedException if user is not authenticated', async () => {
      await expect(
        service.sendDealGift(
          {
            offerId: 'offer-1',
            recipientEmail: 'friend@example.com',
          },
          undefined,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('successfully sends deal gift email to recipient and stores record', async () => {
      const activeOffer = {
        ...mockOffer,
        status: CatalogueOfferStatus.ACTIVE,
        items: [{ price: '100' }],
        calculatedPrice: 80,
        branch: {
          name: 'Main Branch',
          address: '123 Main St',
          business: { name: 'Burger Queen', slug: 'burger-queen' },
        },
      };
      offerRepo.findOne.mockResolvedValue(activeOffer);
      claimRepo.count.mockResolvedValue(0);

      const result = await service.sendDealGift(
        {
          offerId: 'offer-1',
          recipientEmail: 'friend@example.com',
          senderName: 'John Doe',
          note: 'Enjoy lunch on me!',
        },
        mockSenderUser,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('friend@example.com');
      expect(result.giftToken).toBeDefined();
      expect(dealGiftRepo.save).toHaveBeenCalled();
      expect(mailService.sendDealGiftEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'friend@example.com',
          senderName: 'John Doe',
          note: 'Enjoy lunch on me!',
        }),
      );
    });

    it('passes callerOrigin and custom frontendBaseUrl to mailService', async () => {
      const activeOffer = {
        id: 'offer-2',
        name: 'Free Coffee',
        status: CatalogueOfferStatus.ACTIVE,
        items: [],
        calculatedPrice: 0,
        branch: {
          name: 'Central',
          business: { name: 'Cafe Hub', uniqueCode: 'cafe-hub' },
        },
      };
      offerRepo.findOne.mockResolvedValue(activeOffer);
      claimRepo.count.mockResolvedValue(0);

      await service.sendDealGift(
        {
          offerId: 'offer-2',
          recipientEmail: 'coffee@example.com',
          frontendBaseUrl: 'http://localhost:3005',
        },
        mockSenderUser,
        'http://localhost:3000',
      );

      expect(mailService.sendDealGiftEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'coffee@example.com',
          frontendBaseUrl: 'http://localhost:3005',
        }),
      );
    });

    it('throws NotFoundException if offer is not found', async () => {
      offerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.sendDealGift(
          {
            offerId: 'non-existent',
            recipientEmail: 'friend@example.com',
          },
          mockSenderUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if deal has expired', async () => {
      const expiredOffer = {
        ...mockOffer,
        endDate: new Date('2020-01-01'),
      };
      offerRepo.findOne.mockResolvedValue(expiredOffer);

      await expect(
        service.sendDealGift(
          {
            offerId: 'offer-1',
            recipientEmail: 'friend@example.com',
          },
          mockSenderUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if recipient reached max claims', async () => {
      const limitedOffer = {
        ...mockOffer,
        maxClaimsPerCustomer: 1,
        items: [],
      };
      offerRepo.findOne.mockResolvedValue(limitedOffer);
      claimRepo.count.mockResolvedValue(1);

      await expect(
        service.sendDealGift(
          {
            offerId: 'offer-1',
            recipientEmail: 'friend@example.com',
          },
          mockSenderUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a deal gift and soft-removes the record', async () => {
      const gift = {
        id: 'gift-1',
        token: 'token-abc',
        status: 'pending',
      };
      dealGiftRepo.findOne.mockResolvedValue(gift);

      const result = await service.rejectDealGift('token-abc', 'Too far away');

      expect(result.success).toBe(true);
      expect(dealGiftRepo.softRemove).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          rejectionReason: 'Too far away',
        }),
      );
    });
  });

  describe('findMyClaims', () => {
    const customer = {
      id: 'user-1',
      email: 'Customer@Example.com',
      phone: '+2348000000000',
    } as any;

    /** A claim row in the shape `toMyClaim` consumes. */
    const claimRow = (overrides: Record<string, unknown> = {}) => ({
      id: 'claim-1',
      claimCode: 'VEM1-APO1LUNCH-7F2A',
      status: CatalogueOfferClaimStatus.CLAIMED,
      expiresAt: new Date('2026-12-01T00:00:00Z'),
      createdAt: new Date('2026-10-08T00:00:00Z'),
      updatedAt: new Date('2026-10-08T00:00:00Z'),
      userId: 'user-1',
      email: 'customer@example.com',
      phone: '+2348000000000',
      offer: {
        id: 'offer-1',
        name: 'Apo Lunch Combo',
        mainImage: null,
        calculatedPrice: 8500,
        pricingType: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
        discountValue: 15,
        branchId: 'branch-1',
        items: [{ price: 10000 }],
        branch: {
          id: 'branch-1',
          name: 'Apo Branch',
          address: 'Apo Roundabout',
          business: { name: 'Patrick Ventures', logoUrl: null },
        },
      },
      ...overrides,
    });

    /**
     * Captures the query as the builder methods receive it, then hands back
     * `rows` from `getManyAndCount`. `where` is flattened for assertions.
     */
    const mockClaimQb = (rows: any[]) => {
      const calls: Record<string, any[][]> = {
        where: [],
        andWhere: [],
        orderBy: [],
        take: [],
        skip: [],
      };
      const qb: any = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn((...args: any[]) => {
          calls.where.push(args);
          return qb;
        }),
        andWhere: jest.fn((...args: any[]) => {
          calls.andWhere.push(args);
          return qb;
        }),
        orderBy: jest.fn((...args: any[]) => {
          calls.orderBy.push(args);
          return qb;
        }),
        take: jest.fn((...args: any[]) => {
          calls.take.push(args);
          return qb;
        }),
        skip: jest.fn((...args: any[]) => {
          calls.skip.push(args);
          return qb;
        }),
        getMany: jest.fn().mockResolvedValue(rows),
        getManyAndCount: jest.fn().mockResolvedValue([rows, rows.length]),
      };
      claimRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      return { qb, calls };
    };

    it('scopes rows to the caller by id or email or phone', async () => {
      const { calls } = mockClaimQb([claimRow()]);

      await service.findMyClaims(customer, {});

      const [condition, params] = calls.where[0];
      expect(condition).toContain('claim.userId = :userId');
      expect(condition).toContain('LOWER(claim.email) = LOWER(:email)');
      expect(condition).toContain('claim.phone = :phone');
      // The email is compared case-folded in SQL, so the raw account value is
      // passed as-is — matching how the claim was recorded, not a normalised
      // copy of it.
      expect(params).toEqual({
        userId: 'user-1',
        email: 'Customer@Example.com',
        phone: '+2348000000000',
      });
    });

    it('maps a claimed pass to the ACTIVE response shape', async () => {
      mockClaimQb([claimRow()]);

      const result = (await service.findMyClaims(customer, {
        page: 1,
        limit: 10,
      })) as any;

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.data[0].status).toBe('ACTIVE');
      // Value, not reference: the mapped row is not the same Date instance.
      expect(result.data[0].claimedAt).toEqual(new Date('2026-10-08T00:00:00Z'));
      expect(result.data[0].offer.businessName).toBe('Patrick Ventures');
      expect(result.data[0].offer.originalPrice).toBe(10000);
      expect(result.data[0].offer.calculatedPrice).toBe(8500);
      expect(result.data[0].offer.discountPercent).toBe(15);
    });

    it('returns the legacy bare array when pagination is omitted', async () => {
      mockClaimQb([claimRow()]);

      const result = (await service.findMyClaims(customer, {})) as any[];

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('claim-1');
    });

    it('filters ACTIVE by not-yet-expired claimed rows', async () => {
      const { calls } = mockClaimQb([claimRow()]);

      await service.findMyClaims(customer, { status: 'ACTIVE' as any });

      const joined = calls.andWhere.map(([sql]) => sql).join(' ');
      expect(joined).toContain('claim.status = :claimed');
      expect(joined).toContain('claim.expiresAt >= :now');
    });

    it('treats a claimed pass past its expiry as EXPIRED', async () => {
      const expired = claimRow({
        expiresAt: new Date('2026-10-07T00:00:00Z'),
      });
      mockClaimQb([expired]);

      const result = (await service.findMyClaims(customer, {
        page: 1,
        limit: 10,
      })) as any;

      expect(result.data[0].status).toBe('EXPIRED');
    });

    it('reports redeemed passes with their redeemedAt timestamp', async () => {
      const redeemed = claimRow({
        status: CatalogueOfferClaimStatus.REDEEMED,
        updatedAt: new Date('2026-10-09T12:00:00Z'),
      });
      mockClaimQb([redeemed]);

      const result = (await service.findMyClaims(customer, {
        page: 1,
        limit: 10,
      })) as any;

      expect(result.data[0].status).toBe('REDEEMED');
      expect(result.data[0].redeemedAt).toEqual(
        new Date('2026-10-09T12:00:00Z'),
      );
    });

    it('matches q against offer, business, branch and claim code', async () => {
      const { calls } = mockClaimQb([claimRow()]);

      await service.findMyClaims(customer, { q: '  APO LUNCH  ' } as any);

      const [sql, params] = calls.andWhere[0];
      expect(sql).toContain('LOWER(offer.name) LIKE :q');
      expect(sql).toContain('LOWER(business.name) LIKE :q');
      expect(sql).toContain('LOWER(branch.name) LIKE :q');
      expect(sql).toContain('LOWER(claim.claimCode) LIKE :q');
      // Trimmed and case-folded so the caller's casing never decides a match.
      expect(params.q).toBe('%apo lunch%');
    });

    it('does not filter on an empty q', async () => {
      const { calls } = mockClaimQb([claimRow()]);

      await service.findMyClaims(customer, { q: '   ' } as any);

      const joined = calls.andWhere.map(([sql]) => sql).join(' ');
      expect(joined).not.toContain('LIKE :q');
    });

    it('applies q before counting so total matches the page', async () => {
      const { qb, calls } = mockClaimQb([claimRow()]);

      await service.findMyClaims(customer, { q: 'apo', page: 2, limit: 5 });

      expect(calls.andWhere.length).toBe(1);
      // Page 2 of 5 skips 5, and the order is applied before either.
      expect(calls.skip[0][0]).toBe(5);
      expect(calls.take[0][0]).toBe(5);
      expect(calls.orderBy[0]).toEqual(['claim.createdAt', 'DESC']);
      expect(qb.getManyAndCount).toHaveBeenCalled();
    });
  });

  describe('findMyGifts', () => {
    const customer = { id: 'user-1', email: 'customer@example.com' } as any;

    const giftRow = (overrides: Record<string, unknown> = {}) => ({
      id: 'gift-1',
      recipientEmail: 'friend@example.com',
      recipientName: 'Sam Taylor',
      note: 'Enjoy lunch on me!',
      status: 'pending',
      createdAt: new Date('2026-10-08T00:00:00Z'),
      acceptedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      offerId: 'offer-1',
      branchId: 'branch-1',
      offer: {
        id: 'offer-1',
        name: 'Apo Lunch Combo',
        mainImage: null,
        calculatedPrice: 8500,
        items: [{ price: 10000 }],
      },
      branch: { id: 'branch-1', name: 'Apo Branch' },
      business: { id: 'biz-1', name: 'Patrick Ventures' },
      ...overrides,
    });

    const mockGiftQb = (rows: any[]) => {
      const calls: Record<string, any[][]> = { where: [], andWhere: [] };
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn((...args: any[]) => {
          calls.where.push(args);
          return qb;
        }),
        andWhere: jest.fn((...args: any[]) => {
          calls.andWhere.push(args);
          return qb;
        }),
        withDeleted: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
        getManyAndCount: jest.fn().mockResolvedValue([rows, rows.length]),
      };
      dealGiftRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      return { qb, calls };
    };

    it('scopes gifts to the caller as the sender', async () => {
      const { calls } = mockGiftQb([giftRow()]);

      await service.findMyGifts(customer, {});

      expect(calls.where[0][0]).toBe('gift.senderId = :senderId');
      expect(calls.where[0][1]).toEqual({ senderId: 'user-1' });
    });

    it('opts soft-deleted rows back in so declined gifts still show', async () => {
      const { qb } = mockGiftQb([giftRow()]);

      await service.findMyGifts(customer, {});

      expect(qb.withDeleted).toHaveBeenCalled();
    });

    it('returns the legacy bare array when pagination is omitted', async () => {
      mockGiftQb([giftRow()]);

      const result = (await service.findMyGifts(customer, {})) as any[];

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].recipientEmail).toBe('friend@example.com');
      expect(result[0].status).toBe('pending');
      expect(result[0].offer.name).toBe('Apo Lunch Combo');
      expect(result[0].offer.originalPrice).toBe(10000);
      expect(result[0].businessName).toBe('Patrick Ventures');
    });

    it('surfaces a declined gift with its reason and date', async () => {
      mockGiftQb([
        giftRow({
          status: 'rejected',
          rejectedAt: new Date('2026-10-09T10:00:00Z'),
          rejectionReason: 'Location is too far',
        }),
      ]);

      const result = (await service.findMyGifts(customer, {
        page: 1,
        limit: 10,
      })) as any;

      expect(result.data[0].status).toBe('rejected');
      expect(result.data[0].rejectionReason).toBe('Location is too far');
      expect(result.data[0].rejectedAt).toEqual(
        new Date('2026-10-09T10:00:00Z'),
      );
    });

    it('stays sendable without an offer relation attached', async () => {
      // A deleted offer cascades the relation away, so the row must still map.
      mockGiftQb([giftRow({ offer: null })]);

      const result = (await service.findMyGifts(customer, {
        page: 1,
        limit: 10,
      })) as any;

      expect(result.data[0].offer.id).toBe('offer-1');
      expect(result.data[0].offer.name).toBe('');
      expect(result.data[0].offer.calculatedPrice).toBe(0);
    });

    it('filters by recipient outcome', async () => {
      const { calls } = mockGiftQb([giftRow()]);

      await service.findMyGifts(customer, { status: 'accepted' as any });

      expect(calls.andWhere[0][0]).toBe('gift.status = :status');
      expect(calls.andWhere[0][1]).toEqual({ status: 'accepted' });
    });

    it('matches q against recipient, sender and offer name', async () => {
      const { calls } = mockGiftQb([giftRow()]);

      await service.findMyGifts(customer, { q: ' SAM ' } as any);

      const [sql, params] = calls.andWhere[0];
      expect(sql).toContain('LOWER(gift.recipientEmail) LIKE :q');
      expect(sql).toContain('LOWER(gift.recipientName) LIKE :q');
      expect(sql).toContain('LOWER(gift.senderName) LIKE :q');
      expect(sql).toContain('LOWER(offer.name) LIKE :q');
      expect(params.q).toBe('%sam%');
    });

    it('paginates and counts on the same query', async () => {
      const { qb } = mockGiftQb([giftRow()]);

      const result = (await service.findMyGifts(customer, {
        page: 3,
        limit: 5,
      })) as any;

      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(qb.getManyAndCount).toHaveBeenCalled();
    });
  });
});
