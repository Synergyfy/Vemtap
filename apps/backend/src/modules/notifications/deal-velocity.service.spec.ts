import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { DealVelocityService } from './deal-velocity.service';

/** Records the clauses it is told to apply, and replays the rows it was given. */
function queryBuilderDouble(rows: any[]) {
  const self: any = {
    _rows: rows,
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockImplementation(() => Promise.resolve(self._rows)),
  };
  return self;
}

/** Each describe block creates fresh data – no shared mutation. */
function freshData() {
  return {
    current: [{ branchId: 'branch-1', claims: '14' }],
    baseline: [{ branchId: 'branch-1', claims: '10' }],
  };
}

describe('DealVelocityService', () => {
  let service: DealVelocityService;
  let claimRepo: any;
  let notificationRepo: any;
  let userRepo: any;
  let notificationsService: { createMany: jest.Mock };

  const owner = { id: 'owner-1' };

  beforeEach(async () => {
    const arrays = freshData();

    claimRepo = {
      createQueryBuilder: jest.fn().mockImplementation(() => {
        const isCurrent = callCount++ === 0;
        const rows = isCurrent ? arrays.current : arrays.baseline;
        return queryBuilderDouble(rows);
      }),
    };

    notificationRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    userRepo = {
      find: jest.fn().mockResolvedValue([owner]),
    };

    notificationsService = { createMany: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealVelocityService,
        { provide: getRepositoryToken(CatalogueOfferClaim), useValue: claimRepo },
        { provide: getRepositoryToken(Notification), useValue: notificationRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<DealVelocityService>(DealVelocityService);
  });

  afterEach(() => {
    callCount = 0;
  });

  describe('spike detection', () => {
    it('alerts the branch when claims run well above the same hour last week', async () => {
      const result = await service.run();

      expect(result.notified).toBe(1);
      expect(notificationsService.createMany).toHaveBeenCalledTimes(1);
    });

    it('carries the counts and the gap in the payload, not just the prose', async () => {
      await service.run();

      const [, title, message, type, actionUrl, metadata] =
        notificationsService.createMany.mock.calls[0];
      expect(title).toContain('Velocity');
      expect(message).toContain('14');
      expect(type).toBe('warning');
      expect(actionUrl).toBe('/deals');
      expect(metadata).toEqual(
        expect.objectContaining({
          stat: expect.objectContaining({
            value: '14',
            trend: expect.stringContaining('vs last week'),
          }),
        }),
      );
    });

    it('alerts only the recipients who would otherwise see nothing', async () => {
      await service.run();

      const [userIds] = notificationsService.createMany.mock.calls[0];
      expect(userIds).toEqual(['owner-1']);
    });

    it('does not alert when the branch is quiet but not spiking', async () => {
      // 4 claims is normal operation, not a surge.
      const arrays = freshData();
      arrays.current.length = 0;
      arrays.current.push({ branchId: 'branch-1', claims: '4' });
      arrays.baseline.length = 0;
      arrays.baseline.push({ branchId: 'branch-1', claims: '4' });

      await Test.createTestingModule({
        providers: [
          DealVelocityService,
          { provide: getRepositoryToken(CatalogueOfferClaim),
            useValue: { createQueryBuilder: jest.fn().mockImplementation(() => queryBuilderDouble(arrays.current)) } },
          { provide: getRepositoryToken(Notification), useValue: { findOne: jest.fn().mockResolvedValue(null) } },
          { provide: getRepositoryToken(User), useValue: { find: jest.fn().mockResolvedValue([owner]) } },
          { provide: NotificationsService, useValue: { createMany: jest.fn().mockResolvedValue([]) } },
          { provide: ConfigService, useValue: { get: jest.fn() } },
        ],
      }).compile();

      const freshService = module.get<DealVelocityService>(DealVelocityService);
      const result = await freshService.run();

      expect(result.notified).toBe(0);
    });

    it('does not alert below the absolute floor', async () => {
      const arrays = freshData();
      arrays.current.length = 0;
      arrays.current.push({ branchId: 'branch-1', claims: '2' });
      arrays.baseline.length = 0;

      await Test.createTestingModule({
        providers: [
          DealVelocityService,
          { provide: getRepositoryToken(CatalogueOfferClaim),
            useValue: { createQueryBuilder: jest.fn().mockImplementation(() => queryBuilderDouble(arrays.current)) } },
          ...newProviderMap(),
        ],
      }).compile();

      const freshService = module.get<DealVelocityService>(DealVelocityService);
      const result = await freshService.run();

      expect(result.notified).toBe(0);
    });

    it('treats a first-ever claim run as having no baseline to compare against', async () => {
      const arrays = freshData();
      arrays.current.length = 0;
      arrays.current.push({ branchId: 'branch-1', claims: '1' });

      await Test.createTestingModule({
        providers: [
          DealVelocityService,
          ...newProviderMap(),
        ],
      }).compile();

      const freshService = module.get<DealVelocityService>(DealVelocityService);
      const result = await freshService.run();

      expect(result.notified).toBe(0);
    });
  });

  describe('cooldown', () => {
    it('stays quiet when this branch was already told within the cooldown', async () => {
      notificationRepo.findOne = jest.fn().mockResolvedValue({ id: 'earlier-alert' });

      const result = await service.run();

      expect(result.notified).toBe(0);
      expect(notificationsService.createMany).not.toHaveBeenCalled();
    });

    it('asks about the recipients, so one venue cannot suppress another', async () => {
      await service.run();

      expect(notificationRepo.findOne).toHaveBeenCalledTimes(1);
      const where = notificationRepo.findOne.mock.calls[0][0].where;
      expect(where.type).toBe('deal_spike');
      expect(where.userId._value).toEqual(['owner-1']);
    });
  });

  describe('query shape', () => {
    it('counts each window as one grouped aggregate rather than per branch', async () => {
      await service.run();

      expect(claimRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });

    it('counts claims per branch, not per offer or per claim', async () => {
      await service.run();

      const qb = claimRepo.createQueryBuilder.mock.results[0].value;
      expect(qb.groupBy).toHaveBeenCalledWith('offer."branchId"');
    });
  });

  describe('resilience', () => {
    it('keeps scanning after one branch fails to alert', async () => {
      // Two branches spike, first one fails, second succeeds.
      // Reset data fresh each time.
      const arrays = freshData();
      arrays.current.length = 0;
      arrays.current.push({ branchId: 'branch-1', claims: '14' });
      arrays.current.push({ branchId: 'branch-2', claims: '14' });
      arrays.baseline.length = 0;
      arrays.baseline.push({ branchId: 'branch-1', claims: '10' });
      arrays.baseline.push({ branchId: 'branch-2', claims: '10' });

      userRepo.find = jest.fn().mockImplementation(({ where }) =>
        Promise.resolve([{ id: `owner-${where[0].branchId}` }]),
      );
      notificationsService.createMany = jest
        .fn()
        .mockRejectedValueOnce(new Error('socket closed'))
        .mockResolvedValueOnce([]);

      const result = await service.run();

      expect(result.notified).toBe(1);
      expect(notificationsService.createMany).toHaveBeenCalledTimes(2);
    });
  });
});

function newProviderMap() {
  return [
    { provide: getRepositoryToken(CatalogueOfferClaim), useValue: claimRepo },
    { provide: getRepositoryToken(Notification), useValue: notificationRepo },
    { provide: getRepositoryToken(User), useValue: userRepo },
    { provide: NotificationsService, useValue: notificationsService },
    { provide: ConfigService, useValue: { get: jest.fn() } },
  ];
}