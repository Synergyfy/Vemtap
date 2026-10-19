import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { DealVelocityService } from './deal-velocity.service';

type ClaimRow = { branchId: string; claims: string };

/** Records the clauses it is told to apply, and replays the rows it was given. */
function queryBuilderDouble(rows: ClaimRow[]) {
  const self = {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
  return self;
}

/**
 * Builds the service over fresh doubles. The service asks for the current
 * window first and the same hours last week second, so the claim repository
 * replays `current` then `baseline`.
 */
async function build(
  current: ClaimRow[] = [{ branchId: 'branch-1', claims: '14' }],
  baseline: ClaimRow[] = [{ branchId: 'branch-1', claims: '10' }],
) {
  let calls = 0;
  const claimRepo = {
    createQueryBuilder: jest.fn(() =>
      queryBuilderDouble(calls++ === 0 ? current : baseline),
    ),
  };
  const notificationRepo = { findOne: jest.fn().mockResolvedValue(null) };
  const userRepo = {
    find: jest.fn().mockResolvedValue([{ id: 'owner-1' }]),
  };
  const notificationsService = {
    createMany: jest.fn().mockResolvedValue([]),
  };

  const module = await Test.createTestingModule({
    providers: [
      DealVelocityService,
      { provide: getRepositoryToken(CatalogueOfferClaim), useValue: claimRepo },
      { provide: getRepositoryToken(Notification), useValue: notificationRepo },
      { provide: getRepositoryToken(User), useValue: userRepo },
      { provide: NotificationsService, useValue: notificationsService },
      { provide: ConfigService, useValue: { get: jest.fn() } },
    ],
  }).compile();

  return {
    service: module.get(DealVelocityService),
    claimRepo,
    notificationRepo,
    userRepo,
    notificationsService,
  };
}

describe('DealVelocityService', () => {
  describe('spike detection', () => {
    it('alerts the branch when claims run well above the same hour last week', async () => {
      const { service, notificationsService } = await build();

      const result = await service.run();

      expect(result).toEqual({ checked: 1, notified: 1 });
      expect(notificationsService.createMany).toHaveBeenCalledTimes(1);
    });

    it('carries the counts and the gap in the payload, not just the prose', async () => {
      const { service, notificationsService } = await build();

      await service.run();

      const [userIds, title, message, type, actionUrl, metadata, eventType] =
        notificationsService.createMany.mock.calls[0];
      expect(userIds).toEqual(['owner-1']);
      expect(title).toContain('Velocity');
      expect(message).toContain('14');
      expect(type).toBe('warning');
      expect(actionUrl).toBe('/deals');
      expect(eventType).toBe('deal_spike');
      expect(metadata).toEqual(
        expect.objectContaining({
          stat: expect.objectContaining({
            value: '14',
            trend: '40% vs last week',
          }),
        }),
      );
    });

    it('does not alert when the branch is busy but not spiking', async () => {
      const { service, notificationsService } = await build(
        [{ branchId: 'branch-1', claims: '6' }],
        [{ branchId: 'branch-1', claims: '6' }],
      );

      const result = await service.run();

      expect(result.notified).toBe(0);
      expect(notificationsService.createMany).not.toHaveBeenCalled();
    });

    it('does not alert below the absolute floor', async () => {
      const { service, notificationsService } = await build(
        [{ branchId: 'branch-1', claims: '2' }],
        [],
      );

      const result = await service.run();

      expect(result.notified).toBe(0);
      expect(notificationsService.createMany).not.toHaveBeenCalled();
    });

    it('treats a first-ever claim run as having no baseline to compare against', async () => {
      const { service, notificationsService } = await build(
        [{ branchId: 'branch-1', claims: '6' }],
        [],
      );

      const result = await service.run();

      expect(result.notified).toBe(1);
      const metadata = notificationsService.createMany.mock.calls[0][5];
      expect(metadata.stat.trend).toBe('no claims last week');
    });

    it('skips a branch with nobody to tell', async () => {
      const { service, userRepo, notificationsService } = await build();
      userRepo.find.mockResolvedValue([]);

      const result = await service.run();

      expect(result.notified).toBe(0);
      expect(notificationsService.createMany).not.toHaveBeenCalled();
    });
  });

  describe('cooldown', () => {
    it('stays quiet when this branch was already told within the cooldown', async () => {
      const { service, notificationRepo, notificationsService } = await build();
      notificationRepo.findOne.mockResolvedValue({ id: 'earlier-alert' });

      const result = await service.run();

      expect(result.notified).toBe(0);
      expect(notificationsService.createMany).not.toHaveBeenCalled();
    });

    it('asks about the recipients, so one venue cannot suppress another', async () => {
      const { service, notificationRepo } = await build();

      await service.run();

      expect(notificationRepo.findOne).toHaveBeenCalledTimes(1);
      const { where } = notificationRepo.findOne.mock.calls[0][0];
      expect(where.type).toBe('deal_spike');
      expect(where.userId._value).toEqual(['owner-1']);
    });
  });

  describe('query shape', () => {
    it('counts each window as one grouped aggregate rather than per branch', async () => {
      const { service, claimRepo } = await build();

      await service.run();

      expect(claimRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });

    it('counts claims per branch, not per offer or per claim', async () => {
      const { service, claimRepo } = await build();

      await service.run();

      const qb = claimRepo.createQueryBuilder.mock.results[0].value;
      expect(qb.groupBy).toHaveBeenCalledWith('offer."branchId"');
    });
  });

  describe('resilience', () => {
    it('keeps scanning after one branch fails to alert', async () => {
      const { service, userRepo, notificationsService } = await build(
        [
          { branchId: 'branch-1', claims: '14' },
          { branchId: 'branch-2', claims: '14' },
        ],
        [
          { branchId: 'branch-1', claims: '10' },
          { branchId: 'branch-2', claims: '10' },
        ],
      );
      userRepo.find.mockImplementation(
        ({ where }: { where: { branchId: string }[] }) =>
          Promise.resolve([{ id: `owner-${where[0].branchId}` }]),
      );
      notificationsService.createMany
        .mockRejectedValueOnce(new Error('socket closed'))
        .mockResolvedValueOnce([]);

      const result = await service.run();

      expect(result).toEqual({ checked: 2, notified: 1 });
      expect(notificationsService.createMany).toHaveBeenCalledTimes(2);
    });
  });
});
