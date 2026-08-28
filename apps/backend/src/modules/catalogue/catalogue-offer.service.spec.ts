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
  let businessRepo: any;
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
      save: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'offer-saved', ...dto })),
      create: jest.fn().mockImplementation((dto) => dto),
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
      getActiveSubscription: jest.fn().mockResolvedValue(null),
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

  describe('findAllOffersPublicGlobal', () => {
    const makeOfferQb = () => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
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
      claimRepo.count.mockResolvedValue(5);

      const result = await service.findAllOffersPublicGlobal({
        sortBy: 'popular',
        page: 1,
        limit: 10,
      });

      expect(qb.orderBy).toHaveBeenCalledWith(
        expect.stringContaining('catalogue_offer_claims'),
        'DESC',
      );
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result.data[0].claimedCount).toBe(5);
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe('offer-1');
    });

    it('orders by a weighted views+claims score for sortBy=featured', async () => {
      const qb = makeOfferQb();
      offerRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      claimRepo.count.mockResolvedValue(2);

      const result = await service.findAllOffersPublicGlobal({
        sortBy: 'featured',
        page: 1,
        limit: 10,
      });

      expect(qb.orderBy).toHaveBeenCalledWith(
        expect.stringContaining('offer.views'),
        'DESC',
      );
      expect(result.data[0].claimedCount).toBe(2);
    });
  });

  describe('Admin Deals Management', () => {
    it('auto-features deals on creation when plan has autoFeatureDeals enabled', async () => {
      subscriptionsService.getActiveSubscription = jest.fn().mockResolvedValue({
        plan: { autoFeatureDeals: true },
      });
      branchRepo.findOne.mockResolvedValue({ id: 'branch-1', businessId: 'biz-1' });
      itemRepo.find.mockResolvedValue([
        { id: 'item-1', name: 'Burger', basePrice: 50, branches: [{ id: 'branch-1' }] },
      ]);
      offerRepo.create = jest.fn().mockImplementation((d) => ({ ...d }));
      offerRepo.save = jest.fn().mockImplementation((d) => Promise.resolve({ id: 'offer-auto-1', ...d }));

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
      subscriptionsService.getActiveSubscription = jest.fn().mockResolvedValue({
        plan: { autoFeatureDeals: false },
      });
      branchRepo.findOne.mockResolvedValue({ id: 'branch-1', businessId: 'biz-1' });
      itemRepo.find.mockResolvedValue([
        { id: 'item-1', name: 'Burger', basePrice: 50, branches: [{ id: 'branch-1' }] },
      ]);
      offerRepo.create = jest.fn().mockImplementation((d) => ({ ...d }));
      offerRepo.save = jest.fn().mockImplementation((d) => Promise.resolve({ id: 'offer-normal-1', ...d }));

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
              items: [{ basePrice: 100 }],
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
        getRawMany: jest.fn().mockResolvedValue([{ offerId: 'offer-admin-1', count: '7' }]),
      };
      claimRepo.createQueryBuilder = jest.fn().mockReturnValue(claimQb);

      subscriptionsService.getActiveSubscription = jest.fn().mockResolvedValue({
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
});
