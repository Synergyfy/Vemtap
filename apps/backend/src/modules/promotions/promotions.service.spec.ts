import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import {
  SponsoredCampaign,
  SponsoredCampaignKind,
  SponsoredCampaignStatus,
} from '../discovery/entities/sponsored-campaign.entity';
import { SponsoredCampaignTransaction } from '../discovery/entities/sponsored-campaign-transaction.entity';
import { AdWalletService } from '../ad-wallet/ad-wallet.service';

const DAY = 24 * 60 * 60 * 1000;
const BOOST = SponsoredCampaignKind.BOOST;
const PROMO = SponsoredCampaignKind.PROMOTION;

describe('PromotionsService', () => {
  let service: PromotionsService;
  let campaignRepo: any;
  let invoiceRepo: any;
  let dataSource: any;
  let wallet: any;
  let store: Map<string, any>;

  const boost = (overrides: Record<string, unknown> = {}) => ({
    id: 'c-1',
    businessId: 'biz-1',
    kind: BOOST,
    name: 'Lunch boost',
    status: SponsoredCampaignStatus.DRAFT,
    goalId: 'claims',
    assets: [{ type: 'deal', id: 'offer-1' }],
    schedule: { durationDays: 5, instantLaunch: true },
    budgetMode: 'total',
    budget: '10000.00',
    dailyBudget: null,
    spent: '0.00',
    launchedAt: null,
    pausedAt: null,
    paymentReference: null,
    fundingSource: 'wallet',
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ...overrides,
  });

  beforeEach(async () => {
    store = new Map();
    campaignRepo = {
      findOne: jest.fn(({ where }) =>
        Promise.resolve(store.get(where.id) ?? null),
      ),
      find: jest.fn(() => Promise.resolve([...store.values()])),
      findAndCount: jest.fn(() =>
        Promise.resolve([[...store.values()], store.size]),
      ),
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn((c) => {
        if (!c.id) c.id = `c-${store.size + 1}`;
        store.set(c.id, c);
        return Promise.resolve(c);
      }),
      softRemove: jest.fn((c) => {
        store.delete(c.id);
        return Promise.resolve(c);
      }),
    };
    invoiceRepo = {
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve(d)),
    };
    dataSource = { query: jest.fn().mockResolvedValue([{ ok: 1 }]) };
    wallet = {
      onTopUpCredited: jest.fn(),
      reserve: jest.fn().mockResolvedValue({}),
      spend: jest.fn().mockResolvedValue({}),
      release: jest.fn().mockResolvedValue({}),
      getSummary: jest.fn().mockResolvedValue({ spendable: 0 }),
      startTopUp: jest
        .fn()
        .mockResolvedValue({ reference: 'ADW-9', accessCode: 'AC' }),
    };

    const module = await Test.createTestingModule({
      providers: [
        PromotionsService,
        {
          provide: getRepositoryToken(SponsoredCampaign),
          useValue: campaignRepo,
        },
        {
          provide: getRepositoryToken(SponsoredCampaignTransaction),
          useValue: invoiceRepo,
        },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: AdWalletService, useValue: wallet },
      ],
    }).compile();
    service = module.get(PromotionsService);
  });

  afterEach(() => jest.useRealTimers());

  it('listens for wallet top-ups so card-funded launches complete', () => {
    service.onModuleInit();
    expect(wallet.onTopUpCredited).toHaveBeenCalledWith(expect.any(Function));
  });

  describe('drafts', () => {
    it('creates a draft and keeps budget as the total for daily mode', async () => {
      const draft = await service.create(PROMO, 'biz-1', {
        name: 'Weekend push',
        budgetMode: 'daily',
        dailyBudget: 3000,
        schedule: { durationDays: 7 },
        audience: { radiusKm: 3 },
      });
      expect(draft).toMatchObject({
        status: 'Draft',
        budget: 21000,
        kind: PROMO,
      });
      expect(store.get(draft.id)).toMatchObject({
        radius: '3km',
        duration: '7 Days',
      });
    });

    it('rejects assets that are not the business own listings', async () => {
      dataSource.query.mockResolvedValue([]);
      await expect(
        service.create(BOOST, 'biz-1', {
          assets: [{ type: 'deal', id: 'other-offer' }],
        }),
      ).rejects.toThrow(/not one of your listings/);
    });

    it('only allows name and placements to change after launch', async () => {
      store.set(
        'c-1',
        boost({
          status: SponsoredCampaignStatus.ACTIVE,
          launchedAt: new Date(),
        }),
      );
      await expect(
        service.update(BOOST, 'c-1', 'biz-1', { budget: 50000 }),
      ).rejects.toThrow(/Only name and placements/);
      await expect(
        service.update(BOOST, 'c-1', 'biz-1', { name: 'Renamed' }),
      ).resolves.toMatchObject({
        name: 'Renamed',
      });
    });

    it('deletes drafts only', async () => {
      store.set(
        'c-1',
        boost({
          status: SponsoredCampaignStatus.ACTIVE,
          launchedAt: new Date(),
        }),
      );
      await expect(service.remove(BOOST, 'c-1', 'biz-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('launch', () => {
    it('lists everything missing before launch', async () => {
      store.set('c-1', boost({ goalId: null, assets: [], budget: '500' }));
      await expect(
        service.launch(BOOST, 'c-1', 'biz-1', { id: 'u' }, {}),
      ).rejects.toThrow(
        'Before launching, add: exactly one asset, goalId, a budget of at least ₦2,000',
      );
    });

    it('reserves the budget, goes live and writes an invoice', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-14T10:00:00Z'));
      store.set('c-1', boost());

      const live = await service.launch(BOOST, 'c-1', 'biz-1', { id: 'u' }, {});

      expect(wallet.reserve).toHaveBeenCalledWith(
        'biz-1',
        'c-1',
        10000,
        'Boost: Lunch boost',
      );
      expect(live).toMatchObject({
        status: 'Active',
        startDate: '2026-10-14T10:00:00.000Z',
        endDate: '2026-10-19T10:00:00.000Z',
      });
      expect(invoiceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignId: 'c-1',
          amount: 10000,
          type: 'Ad wallet',
        }),
      );
    });

    it('schedules a future start instead of going live', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-14T10:00:00Z'));
      store.set(
        'c-1',
        boost({
          schedule: { durationDays: 3, startAt: '2026-10-20T08:00:00Z' },
        }),
      );
      const result = await service.launch(
        BOOST,
        'c-1',
        'biz-1',
        { id: 'u' },
        {},
      );
      expect(result.status).toBe('Pending');
    });

    it('does not launch twice', async () => {
      store.set(
        'c-1',
        boost({
          launchedAt: new Date(),
          status: SponsoredCampaignStatus.ACTIVE,
        }),
      );
      await expect(
        service.launch(BOOST, 'c-1', 'biz-1', { id: 'u' }, {}),
      ).rejects.toThrow(ConflictException);
    });

    it('with a card, tops up only the shortfall and waits for payment', async () => {
      wallet.getSummary.mockResolvedValue({ spendable: 4000 });
      store.set('c-1', boost());

      const result: any = await service.launch(
        BOOST,
        'c-1',
        'biz-1',
        { id: 'u', email: 'o@biz.ng' },
        { fundingSource: 'card' },
      );

      expect(wallet.startTopUp).toHaveBeenCalledWith(
        'biz-1',
        { id: 'u', email: 'o@biz.ng' },
        { amount: 6000, callbackUrl: undefined },
        { campaignId: 'c-1', campaignKind: BOOST },
      );
      expect(wallet.reserve).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        status: 'Pending',
        awaitingPayment: true,
        checkout: { reference: 'ADW-9' },
      });
    });

    it('with the saved card, charges the shortfall and goes live at once', async () => {
      wallet.getSummary.mockResolvedValue({ spendable: 4000 });
      wallet.topUpWithSavedCard = jest
        .fn()
        .mockResolvedValue({ status: 'completed', reference: 'ADW-7' });
      store.set('c-1', boost());

      const result: any = await service.launch(
        BOOST,
        'c-1',
        'biz-1',
        { id: 'u', email: 'o@biz.ng' },
        { fundingSource: 'card', useSavedCard: true },
      );

      expect(wallet.topUpWithSavedCard).toHaveBeenCalledWith(
        'biz-1',
        'u',
        { amount: 6000 },
        { forCampaignId: 'c-1', campaignKind: BOOST },
      );
      expect(wallet.startTopUp).not.toHaveBeenCalled();
      expect(wallet.reserve).toHaveBeenCalledWith(
        'biz-1',
        'c-1',
        10000,
        'Boost: Lunch boost',
      );
      expect(result.status).toBe('Active');
      expect(result.checkout).toBeUndefined();
      expect(invoiceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'Saved card', amount: 10000 }),
      );
    });

    it('reserves nothing when the saved card is declined', async () => {
      wallet.getSummary.mockResolvedValue({ spendable: 4000 });
      wallet.topUpWithSavedCard = jest.fn().mockResolvedValue({
        status: 'failed',
        reference: 'ADW-7',
        reason: 'Your saved card was declined',
      });
      store.set('c-1', boost());

      await expect(
        service.launch(
          BOOST,
          'c-1',
          'biz-1',
          { id: 'u' },
          { fundingSource: 'card', useSavedCard: true },
        ),
      ).rejects.toMatchObject({
        message: 'Your saved card was declined',
        status: 402,
      });
      expect(wallet.reserve).not.toHaveBeenCalled();
      expect(store.get('c-1')!.launchedAt).toBeFalsy();
    });

    it('asks checkout to save the card when the owner consents', async () => {
      wallet.getSummary.mockResolvedValue({ spendable: 4000 });
      store.set('c-1', boost());
      await service.launch(
        BOOST,
        'c-1',
        'biz-1',
        { id: 'u', email: 'o@biz.ng' },
        { fundingSource: 'card', saveCard: true },
      );
      expect(wallet.startTopUp).toHaveBeenCalledWith(
        'biz-1',
        expect.anything(),
        expect.objectContaining({ amount: 6000, saveCard: true }),
        expect.anything(),
      );
    });

    it('launches a card-funded campaign once its top-up is credited', async () => {
      store.set(
        'c-1',
        boost({
          status: SponsoredCampaignStatus.PENDING,
          paymentReference: 'ADW-9',
        }),
      );

      await service.launchAfterTopUp({
        reference: 'ADW-9',
        businessId: 'biz-1',
        metadata: { campaignId: 'c-1' },
      } as any);

      expect(wallet.reserve).toHaveBeenCalled();
      expect(store.get('c-1')).toMatchObject({
        status: 'Active',
        fundingSource: 'card',
      });
    });

    it('ignores a top-up for a different payment', async () => {
      store.set(
        'c-1',
        boost({
          status: SponsoredCampaignStatus.PENDING,
          paymentReference: 'ADW-9',
        }),
      );
      await service.launchAfterTopUp({
        reference: 'ADW-1',
        businessId: 'biz-1',
        metadata: { campaignId: 'c-1' },
      } as any);
      expect(wallet.reserve).not.toHaveBeenCalled();
    });
  });

  describe('pacing and lifecycle', () => {
    const start = new Date('2026-10-10T00:00:00Z');
    const live = (overrides: Record<string, unknown> = {}) =>
      boost({
        status: SponsoredCampaignStatus.ACTIVE,
        launchedAt: start,
        startDate: start,
        endDate: new Date(start.getTime() + 5 * DAY),
        ...overrides,
      });

    it('spends evenly over the run', async () => {
      store.set('c-1', live({ spent: '2000' }));
      await service.settle(new Date(start.getTime() + 2.5 * DAY));
      // Half way through a ₦10,000 run, ₦5,000 should be spent: ₦3,000 more.
      expect(wallet.spend).toHaveBeenCalledWith(
        'biz-1',
        'c-1',
        3000,
        'Boost delivery: Lunch boost',
      );
      expect(store.get('c-1').spent).toBe(5000);
    });

    it('starts scheduled campaigns when their time comes', async () => {
      store.set(
        'c-1',
        live({
          status: SponsoredCampaignStatus.PENDING,
          startDate: new Date('2026-10-12T00:00:00Z'),
          endDate: new Date('2026-10-17T00:00:00Z'),
        }),
      );
      const result = await service.settle(new Date('2026-10-12T06:00:00Z'));
      expect(result.started).toBe(1);
      expect(store.get('c-1').status).toBe('Active');
    });

    it('does not touch campaigns still awaiting a card payment', async () => {
      store.set(
        'c-1',
        boost({
          status: SponsoredCampaignStatus.PENDING,
          paymentReference: 'ADW-9',
        }),
      );
      await service.settle(new Date());
      expect(wallet.spend).not.toHaveBeenCalled();
    });

    it('ends finished campaigns and releases any leftover', async () => {
      store.set('c-1', live({ spent: '10000' }));
      const result = await service.settle(new Date(start.getTime() + 6 * DAY));
      expect(result.ended).toBe(1);
      expect(store.get('c-1').status).toBe('Ended');
      expect(wallet.release).not.toHaveBeenCalled(); // fully spent

      store.set(
        'c-2',
        live({ id: 'c-2', spent: '0', status: SponsoredCampaignStatus.ACTIVE }),
      );
      store.delete('c-1');
      wallet.spend.mockClear();
      // Ended mid-run (day 2 of 5), so most of the reserve is left. `end`
      // settles up to the real clock, so pin it inside the run.
      jest.useFakeTimers({ now: new Date(start.getTime() + 2 * DAY) });
      try {
        await service.end(BOOST, 'c-2', 'biz-1');
      } finally {
        jest.useRealTimers();
      }
      expect(wallet.release).toHaveBeenCalled();
    });

    it('renews into a fresh run when the wallet can fund it', async () => {
      wallet.getSummary.mockResolvedValue({ spendable: 20000 });
      store.set(
        'c-1',
        live({
          spent: '10000',
          schedule: { durationDays: 5, autoRenew: true },
        }),
      );

      const result = await service.settle(new Date(start.getTime() + 5 * DAY));

      expect(result.renewed).toBe(1);
      expect(store.get('c-1').status).toBe('Ended');
      const next = [...store.values()].find((c) => c.renewedFromId === 'c-1');
      expect(next).toMatchObject({ status: 'Active', budget: 10000 });
    });

    it('ends instead of renewing when funds are short', async () => {
      wallet.getSummary.mockResolvedValue({ spendable: 100 });
      store.set(
        'c-1',
        live({
          spent: '10000',
          schedule: { durationDays: 5, autoRenew: true },
        }),
      );
      const result = await service.settle(new Date(start.getTime() + 5 * DAY));
      expect(result).toMatchObject({ renewed: 0, ended: 1 });
    });

    it('shifts the schedule by the paused time on resume', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-12T00:00:00Z'));
      store.set(
        'c-1',
        live({
          status: SponsoredCampaignStatus.PAUSED,
          pausedAt: new Date('2026-10-11T00:00:00Z'),
        }),
      );

      const resumed = await service.resume(BOOST, 'c-1', 'biz-1');

      expect(resumed.status).toBe('Active');
      expect(resumed.endDate).toBe('2026-10-16T00:00:00.000Z');
      expect(store.get('c-1').pausedAt).toBeNull();
    });

    it('refuses to pause a draft or resume a live campaign', async () => {
      store.set('c-1', boost());
      await expect(service.pause(BOOST, 'c-1', 'biz-1')).rejects.toThrow(
        ConflictException,
      );
      store.set('c-1', live());
      await expect(service.resume(BOOST, 'c-1', 'biz-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  it('keeps boosts and promotions apart', async () => {
    store.set('c-1', boost());
    campaignRepo.findOne.mockImplementation(({ where }: any) =>
      Promise.resolve(where.kind === BOOST ? store.get(where.id) : null),
    );
    await expect(service.get(PROMO, 'c-1', 'biz-1')).rejects.toThrow(
      'Campaign not found',
    );
  });

  it('forecasts within the radius audience and flags estimates', () => {
    expect(
      service.forecast({ budget: 10000, durationDays: 5, radiusKm: 3 }),
    ).toMatchObject({
      reachMin: 4200,
      reachMax: 6600,
      claimsMin: 32,
      claimsMax: 61,
      dailyPace: 2000,
      isEstimate: true,
      audienceCapped: false,
      audiencePopulation: 40000,
    });
    expect(service.forecast({ budget: 1_000_000, radiusKm: 1 })).toMatchObject({
      reachMax: 8000,
      audienceCapped: true,
      audiencePopulation: 8000,
    });
  });

  it('totals a daily budget over the schedule', () => {
    expect(
      service.totalBudget({
        budgetMode: 'daily',
        dailyBudget: 1500,
        budget: 0,
        schedule: { durationDays: 4 },
      } as any),
    ).toBe(6000);
  });
});
