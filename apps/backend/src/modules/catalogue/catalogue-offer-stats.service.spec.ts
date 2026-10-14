import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CatalogueOfferStatsService } from './catalogue-offer-stats.service';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from './entities/catalogue-offer.entity';
import {
  CatalogueOfferClaim,
  CatalogueOfferClaimStatus,
} from './entities/catalogue-offer-claim.entity';

describe('CatalogueOfferStatsService', () => {
  let service: CatalogueOfferStatsService;
  let offerRepo: any;
  let claimRepo: any;

  // Wednesday 14 Oct 2026, 14:00 Lagos.
  const NOW = new Date('2026-10-14T13:00:00Z');

  const offer = (overrides: Partial<CatalogueOffer> = {}) =>
    ({
      id: 'o1',
      dealGroupId: 'g1',
      businessId: 'biz-1',
      branchId: 'b1',
      branch: { name: 'Wuse' },
      name: 'Lunch deal',
      status: CatalogueOfferStatus.ACTIVE,
      calculatedPrice: 8000,
      quantity: 10,
      views: 100,
      likesCount: 7,
      endDate: new Date('2026-10-20T12:00:00Z'),
      items: [{ price: 10000 }],
      ...overrides,
    }) as unknown as CatalogueOffer;

  const claim = (
    status: CatalogueOfferClaimStatus,
    createdAt: string,
    extra: Partial<CatalogueOfferClaim> = {},
  ) =>
    ({
      id: Math.random().toString(36),
      offerId: 'o1',
      status,
      createdAt: new Date(createdAt),
      expiresAt: new Date('2026-10-21T00:00:00Z'),
      redeemedAt: null,
      ...extra,
    }) as unknown as CatalogueOfferClaim;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);
    offerRepo = { findOne: jest.fn(), find: jest.fn() };
    claimRepo = {
      find: jest.fn().mockResolvedValue([]),
      manager: { query: jest.fn().mockResolvedValue([{ count: 4 }]) },
    };
    const module = await Test.createTestingModule({
      providers: [
        CatalogueOfferStatsService,
        { provide: getRepositoryToken(CatalogueOffer), useValue: offerRepo },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: claimRepo,
        },
      ],
    }).compile();
    service = module.get(CatalogueOfferStatsService);
  });

  afterEach(() => jest.useRealTimers());

  it('counts claims the same way the voucher limit does and derives revenue', async () => {
    offerRepo.findOne.mockResolvedValue(offer());
    claimRepo.find.mockResolvedValue([
      claim(CatalogueOfferClaimStatus.CLAIMED, '2026-10-13T10:00:00Z'),
      // Claimed but past expiry: still holds a voucher, but counts as expired.
      claim(CatalogueOfferClaimStatus.CLAIMED, '2026-10-05T10:00:00Z', {
        expiresAt: new Date('2026-10-12T00:00:00Z'),
      }),
      claim(CatalogueOfferClaimStatus.REDEEMED, '2026-10-13T11:00:00Z', {
        redeemedAt: new Date('2026-10-14T09:00:00Z'),
      }),
      claim(CatalogueOfferClaimStatus.EXPIRED, '2026-10-01T10:00:00Z'),
    ]);

    const stats = await service.getOfferStats('o1', 'biz-1');

    expect(stats).toMatchObject({
      views: 100,
      likes: 7,
      saves: 4,
      claims: 3,
      redeemed: 1,
      expired: 2,
      activeUnclaimed: 1,
      redemptionRate: 0.3333,
      revenue: 8000,
      discountGiven: 2000,
      quantity: 10,
      remaining: 7,
      daysLeft: 6,
    });
    expect(stats.byBranch).toEqual([
      expect.objectContaining({
        branchName: 'Wuse',
        claims: 3,
        redeemed: 1,
        revenue: 8000,
      }),
    ]);
  });

  it('builds a daily series in Lagos days over the requested range', async () => {
    offerRepo.findOne.mockResolvedValue(offer());
    claimRepo.find.mockResolvedValue([
      // 23:30 UTC on the 12th is 00:30 on the 13th in Lagos.
      claim(CatalogueOfferClaimStatus.CLAIMED, '2026-10-12T23:30:00Z'),
      claim(CatalogueOfferClaimStatus.REDEEMED, '2026-10-13T08:00:00Z', {
        redeemedAt: new Date('2026-10-14T08:00:00Z'),
      }),
    ]);

    const stats = await service.getOfferStats('o1', 'biz-1', {
      from: '2026-10-12T12:00:00Z',
      to: '2026-10-14T12:00:00Z',
    });

    expect(stats.series).toEqual([
      { date: '2026-10-12', claims: 0, redeemed: 0 },
      { date: '2026-10-13', claims: 2, redeemed: 0 },
      { date: '2026-10-14', claims: 0, redeemed: 1 },
    ]);
  });

  it('defaults to a 30-day series ending today', async () => {
    offerRepo.findOne.mockResolvedValue(offer());
    const stats = await service.getOfferStats('o1', 'biz-1');
    expect(stats.series).toHaveLength(30);
    expect(stats.series[29].date).toBe('2026-10-14');
  });

  it('sums a deal group and breaks it down by branch', async () => {
    offerRepo.find.mockResolvedValue([
      offer(),
      offer({
        id: 'o2',
        branchId: 'b2',
        branch: { name: 'Garki' } as any,
        quantity: 5,
        views: 20,
        status: CatalogueOfferStatus.INACTIVE,
      }),
    ]);
    claimRepo.find.mockResolvedValue([
      claim(CatalogueOfferClaimStatus.REDEEMED, '2026-10-13T08:00:00Z', {
        offerId: 'o2',
        redeemedAt: new Date('2026-10-13T12:00:00Z'),
      }),
    ]);

    const stats = await service.getGroupStats('g1', 'biz-1');

    expect(stats).toMatchObject({
      views: 120,
      claims: 1,
      quantity: 15,
      remaining: 14,
      status: 'active',
    });
    expect(stats.byBranch.map((b) => [b.branchName, b.claims])).toEqual([
      ['Wuse', 0],
      ['Garki', 1],
    ]);
  });

  it('404s for a deal of another business', async () => {
    offerRepo.findOne.mockResolvedValue(null);
    await expect(service.getOfferStats('o1', 'biz-2')).rejects.toThrow(
      NotFoundException,
    );
    offerRepo.find.mockResolvedValue([]);
    await expect(service.getGroupStats('g1', 'biz-2')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('summarises today and the last 30 days, counting a multi-branch deal once', async () => {
    offerRepo.find.mockResolvedValue([
      offer(),
      offer({ id: 'o2', branchId: 'b2' }),
      offer({
        id: 'o3',
        dealGroupId: 'g3',
        status: CatalogueOfferStatus.INACTIVE,
      }),
    ]);
    claimRepo.find.mockResolvedValue([
      // Today (Lagos) and redeemed today.
      claim(CatalogueOfferClaimStatus.REDEEMED, '2026-10-14T08:00:00Z', {
        redeemedAt: new Date('2026-10-14T10:00:00Z'),
      }),
      // Yesterday, redeemed within 30 days.
      claim(CatalogueOfferClaimStatus.REDEEMED, '2026-10-01T08:00:00Z', {
        redeemedAt: new Date('2026-10-02T10:00:00Z'),
      }),
      // Redeemed too long ago to count.
      claim(CatalogueOfferClaimStatus.REDEEMED, '2026-08-01T08:00:00Z', {
        redeemedAt: new Date('2026-08-02T10:00:00Z'),
      }),
    ]);

    expect(await service.getSummary('biz-1')).toEqual({
      branchId: null,
      activeDeals: 1,
      activeOffers: 2,
      claimsToday: 1,
      redeemedToday: 1,
      netRevenue30d: 16000,
      discountGiven30d: 4000,
    });
  });
});
