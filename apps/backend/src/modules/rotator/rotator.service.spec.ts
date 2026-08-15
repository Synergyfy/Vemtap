import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RotatorService } from './rotator.service';
import { Cluster } from '../clusters/entities/cluster.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { Branch } from '../branches/entities/branch.entity';
import { RotatorConfig } from './entities/rotator-config.entity';
import { RotatorClusterConfig } from './entities/rotator-cluster-config.entity';
import { RotatorClusterOffer } from './entities/rotator-cluster-offer.entity';
import { RotatorDealSchedule } from './entities/rotator-deal-schedule.entity';
import { RotatorEligibilityService } from './rotator-eligibility.service';
import { RotatorEngineService } from './rotator-engine.service';
import { RotatorCacheService } from './rotator-cache.service';
import { RotatorAnalyticsService } from './rotator-analytics.service';
import { RotatorEventType } from './entities/rotator-impression.entity';
import { ClusterEventType } from './dto/rotator.dto';

describe('RotatorService.recordClusterEvent', () => {
  let service: RotatorService;
  let module: TestingModule;

  const clusterRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const offerRepo = {
    findOne: jest.fn(),
  };

  const analytics = {
    recordViewOrClick: jest.fn().mockResolvedValue(undefined),
  };

  const emptyRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((d: object) => d),
    save: jest.fn((d: object) => Promise.resolve({ id: 'row-1', ...d })),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  function validOffer(overrides: Record<string, unknown> = {}) {
    return {
      id: 'offer-1',
      status: 'active',
      startDate: new Date(Date.now() - 60_000),
      endDate: null,
      branch: {
        id: 'b-1',
        clusterId: 'cl-1',
        isActive: true,
        joinDiscoveryNetwork: true,
        allowPromotions: true,
      },
      business: { id: 'biz-1', status: 'active' },
      ...overrides,
    };
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    module = await Test.createTestingModule({
      providers: [
        RotatorService,
        { provide: getRepositoryToken(Cluster), useValue: clusterRepo },
        { provide: getRepositoryToken(RotatorConfig), useValue: emptyRepo },
        {
          provide: getRepositoryToken(RotatorClusterConfig),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(RotatorClusterOffer),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(RotatorDealSchedule),
          useValue: emptyRepo,
        },
        { provide: getRepositoryToken(CatalogueOffer), useValue: offerRepo },
        { provide: getRepositoryToken(Branch), useValue: emptyRepo },
        {
          provide: RotatorEligibilityService,
          useValue: {
            getCluster: jest.fn(),
            getGlobalConfig: jest.fn().mockResolvedValue({ windowSeconds: 60 }),
            getClusterConfig: jest.fn(),
            getEligiblePool: jest.fn(),
            invalidateGlobalConfigCache: jest.fn(),
          },
        },
        {
          provide: RotatorEngineService,
          useValue: { getCurrentResult: jest.fn(), preview: jest.fn() },
        },
        {
          provide: RotatorCacheService,
          useValue: {
            invalidateCluster: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: RotatorAnalyticsService, useValue: analytics },
      ],
    }).compile();

    service = module.get(RotatorService);
  });

  it('records a view event for a deal that belongs to the cluster', async () => {
    clusterRepo.findOne.mockResolvedValue({ id: 'cl-1' });
    offerRepo.findOne.mockResolvedValue(validOffer());

    const result = await service.recordClusterEvent(
      'CL-ABC123DEF',
      { type: ClusterEventType.VIEW, offerId: 'offer-1' },
      'sess-token',
    );

    expect(result).toEqual({
      success: true,
      offerId: 'offer-1',
    });
    expect(analytics.recordViewOrClick).toHaveBeenCalledWith(
      RotatorEventType.VIEW,
      'cl-1',
      'offer-1',
      { sessionToken: 'sess-token', windowId: null },
    );
  });

  it('records a click event with an explicit current window id', async () => {
    clusterRepo.findOne.mockResolvedValue({ id: 'cl-1' });
    offerRepo.findOne.mockResolvedValue(validOffer());
    const currentWindow = Math.floor(Date.now() / 60_000);

    await service.recordClusterEvent(
      'CL-ABC123DEF',
      {
        type: ClusterEventType.CLICK,
        offerId: 'offer-1',
        windowId: currentWindow,
      },
      null,
    );

    expect(analytics.recordViewOrClick).toHaveBeenCalledWith(
      RotatorEventType.CLICK,
      'cl-1',
      'offer-1',
      { sessionToken: null, windowId: currentWindow },
    );
  });

  it('ignores a forged window id far from the current window', async () => {
    clusterRepo.findOne.mockResolvedValue({ id: 'cl-1' });
    offerRepo.findOne.mockResolvedValue(validOffer());
    const eligibility = module.get(RotatorEligibilityService);
    (eligibility.getGlobalConfig as jest.Mock).mockResolvedValue({
      windowSeconds: 60,
    });
    const now = Date.now();
    const currentWindow = Math.floor(now / 60_000);

    await service.recordClusterEvent(
      'CL-ABC123DEF',
      {
        type: ClusterEventType.VIEW,
        offerId: 'offer-1',
        windowId: currentWindow + 500,
      },
      'sess-token',
    );

    expect(analytics.recordViewOrClick).toHaveBeenCalledWith(
      RotatorEventType.VIEW,
      'cl-1',
      'offer-1',
      { sessionToken: 'sess-token', windowId: null },
    );
  });

  it('rejects a deal that is not active', async () => {
    clusterRepo.findOne.mockResolvedValue({ id: 'cl-1' });
    offerRepo.findOne.mockResolvedValue({
      id: 'offer-1',
      status: 'paused',
      endDate: null,
      branch: { id: 'b-1', clusterId: 'cl-1' },
    });

    await expect(
      service.recordClusterEvent(
        'CL-ABC123DEF',
        { type: ClusterEventType.VIEW, offerId: 'offer-1' },
        null,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(analytics.recordViewOrClick).not.toHaveBeenCalled();
  });

  it('rejects an expired deal', async () => {
    clusterRepo.findOne.mockResolvedValue({ id: 'cl-1' });
    offerRepo.findOne.mockResolvedValue({
      id: 'offer-1',
      status: 'active',
      endDate: new Date(Date.now() - 60_000),
      branch: { id: 'b-1', clusterId: 'cl-1' },
    });

    await expect(
      service.recordClusterEvent(
        'CL-ABC123DEF',
        { type: ClusterEventType.VIEW, offerId: 'offer-1' },
        null,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(analytics.recordViewOrClick).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the cluster QR code is unknown', async () => {
    clusterRepo.findOne.mockResolvedValue(null);

    await expect(
      service.recordClusterEvent(
        'CL-NOPE',
        { type: ClusterEventType.VIEW, offerId: 'offer-1' },
        null,
      ),
    ).rejects.toThrow(NotFoundException);
    expect(analytics.recordViewOrClick).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the deal does not exist', async () => {
    clusterRepo.findOne.mockResolvedValue({ id: 'cl-1' });
    offerRepo.findOne.mockResolvedValue(null);

    await expect(
      service.recordClusterEvent(
        'CL-ABC123DEF',
        { type: ClusterEventType.VIEW, offerId: 'offer-missing' },
        null,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a deal that does not belong to the cluster', async () => {
    clusterRepo.findOne.mockResolvedValue({ id: 'cl-1' });
    offerRepo.findOne.mockResolvedValue({
      id: 'offer-1',
      branch: { id: 'b-9', clusterId: 'cl-other' },
    });

    await expect(
      service.recordClusterEvent(
        'CL-ABC123DEF',
        { type: ClusterEventType.CLICK, offerId: 'offer-1' },
        null,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(analytics.recordViewOrClick).not.toHaveBeenCalled();
  });

  it('rejects a deal that has not started yet', async () => {
    clusterRepo.findOne.mockResolvedValue({ id: 'cl-1' });
    offerRepo.findOne.mockResolvedValue(
      validOffer({ startDate: new Date(Date.now() + 60_000) }),
    );

    await expect(
      service.recordClusterEvent(
        'CL-ABC123DEF',
        { type: ClusterEventType.VIEW, offerId: 'offer-1' },
        null,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(analytics.recordViewOrClick).not.toHaveBeenCalled();
  });

  it('rejects a deal whose business is suspended', async () => {
    clusterRepo.findOne.mockResolvedValue({ id: 'cl-1' });
    offerRepo.findOne.mockResolvedValue(
      validOffer({ business: { id: 'biz-1', status: 'suspended' } }),
    );

    await expect(
      service.recordClusterEvent(
        'CL-ABC123DEF',
        { type: ClusterEventType.VIEW, offerId: 'offer-1' },
        null,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(analytics.recordViewOrClick).not.toHaveBeenCalled();
  });

  it('rejects a deal whose branch is not discoverable', async () => {
    clusterRepo.findOne.mockResolvedValue({ id: 'cl-1' });
    offerRepo.findOne.mockResolvedValue(
      validOffer({
        branch: {
          id: 'b-1',
          clusterId: 'cl-1',
          isActive: true,
          joinDiscoveryNetwork: false,
          allowPromotions: true,
        },
      }),
    );

    await expect(
      service.recordClusterEvent(
        'CL-ABC123DEF',
        { type: ClusterEventType.VIEW, offerId: 'offer-1' },
        null,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(analytics.recordViewOrClick).not.toHaveBeenCalled();
  });

  it('invalidates all cluster caches in deterministic order across batches', async () => {
    const eligibility = module.get(RotatorEligibilityService);
    (eligibility.getGlobalConfig as jest.Mock).mockResolvedValue({
      rotationMode: 'automatic',
      distribution: 'balanced',
      featuredSlotsMode: 'automatic',
      featuredSlotCount: null,
      windowSeconds: 60,
      frequencyWindowHours: 24,
    });
    clusterRepo.find
      .mockResolvedValueOnce(
        Array.from({ length: 1000 }, (_, i) => ({ id: `cl-${i}` })),
      )
      .mockResolvedValueOnce(
        Array.from({ length: 3 }, (_, i) => ({ id: `cl-1000-${i}` })),
      );

    await service.updateGlobalConfig({ windowSeconds: 120 });

    const cache = module.get(RotatorCacheService);
    expect((cache.invalidateCluster as jest.Mock).mock.calls).toHaveLength(
      1003,
    );
    const findCalls = clusterRepo.find.mock.calls as Array<
      Array<{ order?: { id: string } }>
    >;
    expect(findCalls).toHaveLength(2);
    for (const call of findCalls) {
      expect(call[0]?.order).toEqual({ id: 'ASC' });
    }
  });
});
