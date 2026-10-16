import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import {
  SponsoredCampaign,
  SponsoredCampaignStatus,
} from '../discovery/entities/sponsored-campaign.entity';
import { SponsoredEventType } from '../discovery/entities/sponsored-campaign-event.entity';
import { CatalogueOfferService } from '../catalogue/catalogue-offer.service';
import { SponsoredService } from './sponsored.service';

// Abuja: the viewer, a branch ~1 km away and one ~20 km away.
const VIEWER = { lat: 9.0765, lng: 7.3986 };
const NEAR = { lat: '9.0855', lng: '7.3986' };
const FAR = { lat: '9.2565', lng: '7.3986' };
// Wednesday 2026-10-14, 13:00 in Lagos (12:00 UTC).
const LUNCHTIME = new Date('2026-10-14T12:00:00Z');

describe('SponsoredService', () => {
  let service: SponsoredService;
  let campaigns: Partial<SponsoredCampaign>[];
  let offerRows: {
    assetId: string;
    offerId: string;
    lat: string | null;
    lng: string | null;
  }[];
  let campaignRepo: { find: jest.Mock };
  let dataSource: { query: jest.Mock };
  let catalogue: { findPublicOffersByIds: jest.Mock };

  const campaign = (overrides: Partial<SponsoredCampaign> = {}) =>
    ({
      id: 'c-1',
      businessId: 'biz-1',
      status: SponsoredCampaignStatus.ACTIVE,
      launchedAt: new Date('2026-10-13T08:00:00Z'),
      budget: 10000,
      spent: 2000,
      placements: ['home', 'feed'],
      assets: [{ type: 'deal', id: 'deal-1' }],
      audience: { radiusKm: 3 },
      schedule: { durationDays: 5 },
      ...overrides,
    }) as SponsoredCampaign;

  beforeEach(async () => {
    campaigns = [campaign()];
    offerRows = [{ assetId: 'deal-1', offerId: 'deal-1', ...NEAR }];
    campaignRepo = {
      find: jest.fn(() =>
        Promise.resolve(
          campaigns.filter((c) => c.status === SponsoredCampaignStatus.ACTIVE),
        ),
      ),
    };
    dataSource = {
      query: jest.fn((sql: string) => {
        if (sql.includes('FROM "catalogue_offers" a')) {
          return Promise.resolve(offerRows);
        }
        if (sql.includes('INSERT INTO "sponsored_campaign_events"')) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      }),
    };
    catalogue = {
      findPublicOffersByIds: jest.fn((ids: string[]) =>
        Promise.resolve(ids.map((id) => ({ id, name: `Offer ${id}` }))),
      ),
    };
    const module = await Test.createTestingModule({
      providers: [
        SponsoredService,
        {
          provide: getRepositoryToken(SponsoredCampaign),
          useValue: campaignRepo,
        },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: CatalogueOfferService, useValue: catalogue },
      ],
    }).compile();
    service = module.get(SponsoredService);
  });

  describe('serve', () => {
    const serve = (overrides = {}) =>
      service.serve({
        placement: 'home',
        ...VIEWER,
        now: LUNCHTIME,
        ...overrides,
      });

    it('returns a live campaign’s deal near the viewer as a public offer row', async () => {
      const result = await serve();
      expect(result.data).toEqual([
        { campaignId: 'c-1', offer: { id: 'deal-1', name: 'Offer deal-1' } },
      ]);
    });

    it('leaves out campaigns outside the placement, budget or radius', async () => {
      campaigns = [campaign({ placements: ['push'] })];
      expect((await serve()).data).toEqual([]);

      campaigns = [campaign({ spent: 10000 })];
      expect((await serve()).data).toEqual([]);

      campaigns = [campaign()];
      offerRows = [{ assetId: 'deal-1', offerId: 'deal-1', ...FAR }];
      expect((await serve()).data).toEqual([]);

      // A wider radius reaches it.
      campaigns = [campaign({ audience: { radiusKm: 25 } })];
      expect((await serve()).data).toHaveLength(1);
    });

    it('serves every placement when none were chosen', async () => {
      campaigns = [campaign({ placements: [] })];
      expect((await serve({ placement: 'feed' })).data).toHaveLength(1);
    });

    it('respects dayparting windows and weekdays in Lagos time', async () => {
      campaigns = [
        campaign({
          schedule: { durationDays: 5, dayparting: true, windows: ['dinner'] },
        }),
      ];
      expect((await serve()).data).toEqual([]);
      expect(
        (await serve({ now: new Date('2026-10-14T18:00:00Z') })).data,
      ).toHaveLength(1);

      // Late night wraps past midnight: 00:30 Lagos is inside it.
      campaigns = [
        campaign({
          schedule: { durationDays: 5, dayparting: true, windows: ['late'] },
        }),
      ];
      expect(
        (await serve({ now: new Date('2026-10-14T23:30:00Z') })).data,
      ).toHaveLength(1);

      // Weekends only, on a Wednesday.
      campaigns = [
        campaign({ schedule: { durationDays: 5, weekdays: [0, 6] } }),
      ];
      expect((await serve()).data).toEqual([]);
    });

    it('picks the nearest branch row of a deal and shows each deal once', async () => {
      campaigns = [
        campaign(),
        campaign({ id: 'c-2', businessId: 'biz-1', budget: 50000, spent: 0 }),
      ];
      offerRows = [
        { assetId: 'deal-1', offerId: 'deal-1', ...FAR },
        { assetId: 'deal-1', offerId: 'deal-1b', ...NEAR },
      ];
      const result = await service.serve({
        placement: 'home',
        ...VIEWER,
        now: LUNCHTIME,
        random: () => 0.5,
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].offer).toMatchObject({ id: 'deal-1b' });
      // The bigger remaining budget wins the weighted draw.
      expect(result.data[0].campaignId).toBe('c-2');
    });
  });

  describe('recordEvents', () => {
    const impression = {
      campaignId: 'c-1',
      offerId: 'deal-1',
      type: SponsoredEventType.IMPRESSION,
    };

    it('stores one view per viewer and hour and bumps the counters', async () => {
      dataSource.query.mockImplementation((sql: string) => {
        if (sql.includes('FROM "catalogue_offers" a'))
          return Promise.resolve(offerRows);
        if (sql.includes('INSERT INTO')) {
          return Promise.resolve([
            { campaignId: 'c-1', type: 'impression' },
            { campaignId: 'c-1', type: 'tap' },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await service.recordEvents(
        'viewer-abc123',
        null,
        [
          impression,
          impression,
          { ...impression, type: SponsoredEventType.TAP },
        ],
        new Date('2026-10-14T12:34:56Z'),
      );

      expect(result).toEqual({ recorded: 2 });
      const insert = dataSource.query.mock.calls.find(([sql]) =>
        (sql as string).includes('INSERT INTO'),
      )!;
      expect(insert[0]).toContain(
        'ON CONFLICT ("campaignId", "type", "viewerKey", "hourBucket") DO NOTHING',
      );
      // Two rows (the repeated view is dropped before the insert).
      expect(insert[1]).toHaveLength(14);
      expect(insert[1][6]).toEqual(new Date('2026-10-14T12:00:00Z'));
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE "sponsored_campaigns"'),
        ['c-1', 1, 1],
      );
    });

    it('ignores deals the campaign does not promote, and campaigns not live', async () => {
      expect(
        await service.recordEvents('viewer-abc123', null, [
          { ...impression, offerId: 'other-deal' },
        ]),
      ).toEqual({ recorded: 0 });

      campaigns = [campaign({ status: SponsoredCampaignStatus.ENDED })];
      expect(
        await service.recordEvents('viewer-abc123', null, [impression]),
      ).toEqual({ recorded: 0 });
      expect(
        dataSource.query.mock.calls.some(([sql]) =>
          (sql as string).includes('INSERT INTO'),
        ),
      ).toBe(false);
    });
  });
});
