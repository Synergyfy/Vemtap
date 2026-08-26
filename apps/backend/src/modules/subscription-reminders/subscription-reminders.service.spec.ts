import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { Cluster } from '../clusters/entities/cluster.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { RotatorImpression } from '../rotator/entities/rotator-impression.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import { MailService } from '../mail/mail.service';
import { SubscriptionRemindersService } from './subscription-reminders.service';
import { SUBSCRIPTION_RENEWAL_URL } from './subscription-reminders.constants';

const NOW = new Date('2026-08-26T08:00:00Z');

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  const base: Subscription = {
    id: 'sub-1',
    businessId: 'biz-1',
    planId: 'plan-1',
    status: SubscriptionStatus.ACTIVE,
    endDate: daysFromNow(5),
    startDate: new Date('2026-08-01T00:00:00Z'),
    lastRenewalReminderAt: null,
    lastRenewalReminderStage: null,
    plan: {
      id: 'plan-1',
      name: 'Pro',
      discoveryEnabled: true,
    } as unknown as Subscription['plan'],
    business: {
      id: 'biz-1',
      ownerId: 'owner-1',
      businessName: 'Ikeja Store',
    } as unknown as Subscription['business'],
  };
  return { ...base, ...overrides };
}

/** Typed accessor for the latest in-app notification created by the service. */
function lastCreateCall(mock: { create: jest.Mock }): {
  ownerId: string;
  title: string;
  message: string;
  type: string;
  actionUrl: string | null;
} {
  const call = mock.create.mock.calls[
    mock.create.mock.calls.length - 1
  ] as unknown as [string, string, string, string, string | null];
  return {
    ownerId: call[0],
    title: call[1],
    message: call[2],
    type: call[3],
    actionUrl: call[4],
  };
}

function makeQueryBuilder(
  getManyResult: unknown[] = [],
  getRawManyResult: unknown[] = [],
) {
  return {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(getManyResult),
    getRawMany: jest.fn().mockResolvedValue(getRawManyResult),
  };
}

describe('SubscriptionRemindersService', () => {
  let service: SubscriptionRemindersService;
  let subRepo: { createQueryBuilder: jest.Mock; update: jest.Mock };
  let branchRepo: { find: jest.Mock; createQueryBuilder: jest.Mock };
  let clusterRepo: { find: jest.Mock };
  let businessRepo: { find: jest.Mock };
  let userRepo: { find: jest.Mock };
  let impressionRepo: { createQueryBuilder: jest.Mock };
  let notificationsService: { create: jest.Mock };
  let pushService: { sendNotification: jest.Mock };
  let mailService: { sendSubscriptionRenewalReminder: jest.Mock };

  /**
   * Stubs the three subscription queries in call order: expiring subs, lapsed
   * candidates, and (only consulted when lapsed candidates exist) the set of
   * currently-eligible discovery businesses.
   */
  function mockSubscriptionQueries(opts: {
    expiring: Subscription[];
    lapsed: Subscription[];
    eligibleBusinessIds?: string[];
  }) {
    const expiringQb = makeQueryBuilder(opts.expiring);
    const lapsedQb = makeQueryBuilder(opts.lapsed);
    subRepo.createQueryBuilder
      .mockReturnValueOnce(expiringQb)
      .mockReturnValueOnce(lapsedQb);
    if (opts.lapsed.length > 0) {
      subRepo.createQueryBuilder.mockReturnValueOnce(
        makeQueryBuilder(
          [],
          (opts.eligibleBusinessIds ?? []).map((businessId) => ({
            businessId,
          })),
        ),
      );
    }
  }

  /** Common wiring for a business with one main branch in cluster-1 (Ikeja). */
  function stubClusterMembershipAndOwners() {
    branchRepo.find.mockResolvedValue([
      {
        id: 'branch-1',
        businessId: 'biz-1',
        clusterId: 'cluster-1',
        isMainBranch: true,
      },
    ]);
    clusterRepo.find.mockResolvedValue([{ id: 'cluster-1', name: 'Ikeja' }]);
    businessRepo.find.mockResolvedValue([{ id: 'biz-1', ownerId: 'owner-1' }]);
    userRepo.find.mockResolvedValue([
      {
        id: 'owner-1',
        email: 'owner@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
      },
    ]);
    impressionRepo.createQueryBuilder.mockReturnValue(
      makeQueryBuilder([], [{ clusterId: 'cluster-1', people: '60' }]),
    );
    branchRepo.createQueryBuilder.mockReturnValue(
      makeQueryBuilder([], [{ clusterId: 'cluster-1', businesses: '70' }]),
    );
  }

  beforeEach(async () => {
    subRepo = {
      createQueryBuilder: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    branchRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };
    clusterRepo = { find: jest.fn().mockResolvedValue([]) };
    businessRepo = { find: jest.fn().mockResolvedValue([]) };
    userRepo = { find: jest.fn().mockResolvedValue([]) };
    impressionRepo = { createQueryBuilder: jest.fn() };
    notificationsService = {
      create: jest.fn().mockResolvedValue({ id: 'n-1' }),
    };
    pushService = {
      sendNotification: jest.fn().mockResolvedValue({ queued: true }),
    };
    mailService = {
      sendSubscriptionRenewalReminder: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionRemindersService,
        { provide: getRepositoryToken(Subscription), useValue: subRepo },
        { provide: getRepositoryToken(Branch), useValue: branchRepo },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(Cluster), useValue: clusterRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: getRepositoryToken(RotatorImpression),
          useValue: impressionRepo,
        },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: PushNotificationService, useValue: pushService },
        { provide: MailService, useValue: mailService },
        { provide: ConfigService, useValue: new ConfigService({}) },
      ],
    }).compile();

    service = module.get(SubscriptionRemindersService);
  });

  describe('runRenewalReminders', () => {
    it('returns zeroed results when there are no targets', async () => {
      mockSubscriptionQueries({ expiring: [], lapsed: [] });

      const result = await service.runRenewalReminders();

      expect(result).toEqual({
        expiring: 0,
        lapsed: 0,
        sentInApp: 0,
        sentPush: 0,
        sentEmail: 0,
        failed: 0,
        skippedNoCluster: 0,
      });
      expect(notificationsService.create).not.toHaveBeenCalled();
    });

    it('sends an in-app + push reminder to the active owner and records the stage', async () => {
      mockSubscriptionQueries({
        expiring: [makeSub({ id: 'sub-exp', endDate: daysFromNow(5) })],
        lapsed: [],
      });
      stubClusterMembershipAndOwners();

      const result = await service.runRenewalReminders();

      expect(result.sentInApp).toBe(1);
      expect(result.sentPush).toBe(1);
      expect(result.sentEmail).toBe(0); // Stage 7 does not trigger email
      expect(result.expiring).toBe(1);

      expect(notificationsService.create).toHaveBeenCalledTimes(1);
      const { ownerId, title, message, type, actionUrl } =
        lastCreateCall(notificationsService);
      expect(ownerId).toBe('owner-1');
      expect(type).toBe('warning');
      expect(actionUrl).toBe(SUBSCRIPTION_RENEWAL_URL);
      expect(title).toContain('Ikeja');
      expect(message).toContain('60');
      expect(message).toContain('70');

      expect(pushService.sendNotification).toHaveBeenCalledWith(
        'owner-1',
        title,
        message,
        expect.objectContaining({
          url: SUBSCRIPTION_RENEWAL_URL,
          category: 'marketing',
        }),
      );

      expect(subRepo.update).toHaveBeenCalledWith(
        'sub-exp',
        expect.objectContaining({ lastRenewalReminderStage: 7 }),
      );
    });

    it('uses the 14-day copy for subscriptions far from expiry', async () => {
      mockSubscriptionQueries({
        expiring: [makeSub({ id: 'sub-exp', endDate: daysFromNow(12) })],
        lapsed: [],
      });
      stubClusterMembershipAndOwners();

      await service.runRenewalReminders();

      const { title } = lastCreateCall(notificationsService);
      expect(title).toContain('expire in 12 days');
      expect(subRepo.update).toHaveBeenCalledWith(
        'sub-exp',
        expect.objectContaining({ lastRenewalReminderStage: 14 }),
      );
      expect(
        mailService.sendSubscriptionRenewalReminder,
      ).not.toHaveBeenCalled();
    });

    it('skips a business that has no cluster membership', async () => {
      mockSubscriptionQueries({
        expiring: [makeSub({ id: 'sub-no-cluster', endDate: daysFromNow(5) })],
        lapsed: [],
      });
      branchRepo.find.mockResolvedValue([
        {
          id: 'branch-1',
          businessId: 'biz-1',
          clusterId: null,
          isMainBranch: true,
        },
      ]);

      const result = await service.runRenewalReminders();

      expect(result.skippedNoCluster).toBe(1);
      expect(notificationsService.create).not.toHaveBeenCalled();
    });

    it('does not re-remind at an already-sent stage', async () => {
      mockSubscriptionQueries({
        expiring: [
          makeSub({
            id: 'sub-sent',
            endDate: daysFromNow(5),
            lastRenewalReminderStage: 7,
            lastRenewalReminderAt: NOW,
          }),
        ],
        lapsed: [],
      });
      stubClusterMembershipAndOwners();

      const result = await service.runRenewalReminders();

      expect(result.sentInApp).toBe(0);
      expect(notificationsService.create).not.toHaveBeenCalled();
      expect(subRepo.update).not.toHaveBeenCalled();
    });

    it('escalates to the 3-day copy and stage, sending in-app, push, and email', async () => {
      mockSubscriptionQueries({
        expiring: [
          makeSub({
            id: 'sub-escalate',
            endDate: daysFromNow(2),
            lastRenewalReminderStage: 7,
            lastRenewalReminderAt: NOW,
          }),
        ],
        lapsed: [],
      });
      stubClusterMembershipAndOwners();

      const result = await service.runRenewalReminders();

      expect(result.sentInApp).toBe(1);
      expect(result.sentPush).toBe(1);
      expect(result.sentEmail).toBe(1);

      const { title, type } = lastCreateCall(notificationsService);
      expect(title).toContain('Last call');
      expect(type).toBe('warning');
      expect(subRepo.update).toHaveBeenCalledWith(
        'sub-escalate',
        expect.objectContaining({ lastRenewalReminderStage: 3 }),
      );

      expect(mailService.sendSubscriptionRenewalReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'owner@example.com',
          customerName: 'John Doe',
          planName: 'Pro',
          daysLeft: 2,
          isLapsed: false,
        }),
      );
    });

    it('handles same-day active expiring subscriptions as warning rather than lapsed', async () => {
      mockSubscriptionQueries({
        expiring: [
          makeSub({
            id: 'sub-sameday',
            endDate: new Date(NOW.getTime() + 4 * 60 * 60 * 1000), // 4 hours left
            status: SubscriptionStatus.ACTIVE,
          }),
        ],
        lapsed: [],
      });
      stubClusterMembershipAndOwners();

      const result = await service.runRenewalReminders();

      expect(result.sentInApp).toBe(1);
      const { title, type } = lastCreateCall(notificationsService);
      expect(type).toBe('warning');
      expect(title).toContain('Last call'); // warning copy, NOT lapsed copy
      expect(subRepo.update).toHaveBeenCalledWith(
        'sub-sameday',
        expect.objectContaining({ lastRenewalReminderStage: 3 }),
      );
    });

    it('sends the expired copy and email once for lapsed subscriptions', async () => {
      mockSubscriptionQueries({
        expiring: [],
        lapsed: [
          makeSub({
            id: 'sub-lapsed',
            endDate: daysFromNow(-3),
            status: SubscriptionStatus.EXPIRED,
          }),
        ],
        eligibleBusinessIds: [],
      });
      stubClusterMembershipAndOwners();

      const result = await service.runRenewalReminders();

      expect(result.lapsed).toBe(1);
      expect(result.sentInApp).toBe(1);
      expect(result.sentEmail).toBe(1);
      const { ownerId, title, type } = lastCreateCall(notificationsService);
      expect(ownerId).toBe('owner-1');
      expect(type).toBe('error');
      expect(title).toContain('left the Ikeja deals feed');
      expect(subRepo.update).toHaveBeenCalledWith(
        'sub-lapsed',
        expect.objectContaining({ lastRenewalReminderStage: 0 }),
      );
      expect(mailService.sendSubscriptionRenewalReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'owner@example.com',
          isLapsed: true,
        }),
      );
    });

    it('does not send the expired copy a second time', async () => {
      mockSubscriptionQueries({
        expiring: [],
        lapsed: [
          makeSub({
            id: 'sub-lapsed',
            endDate: daysFromNow(-3),
            status: SubscriptionStatus.EXPIRED,
            lastRenewalReminderStage: 0,
            lastRenewalReminderAt: NOW,
          }),
        ],
        eligibleBusinessIds: [],
      });
      stubClusterMembershipAndOwners();

      const result = await service.runRenewalReminders();

      expect(result.sentInApp).toBe(0);
      expect(notificationsService.create).not.toHaveBeenCalled();
    });

    it('skips lapsed businesses that renewed into an eligible discovery plan', async () => {
      mockSubscriptionQueries({
        expiring: [],
        lapsed: [
          makeSub({
            id: 'sub-lapsed',
            endDate: daysFromNow(-3),
            status: SubscriptionStatus.EXPIRED,
          }),
        ],
        eligibleBusinessIds: ['biz-1'],
      });
      stubClusterMembershipAndOwners();

      const result = await service.runRenewalReminders();

      expect(result.lapsed).toBe(1);
      expect(result.sentInApp).toBe(0);
      expect(notificationsService.create).not.toHaveBeenCalled();
    });

    it('does not notify an inactive owner', async () => {
      mockSubscriptionQueries({
        expiring: [makeSub({ id: 'sub-exp', endDate: daysFromNow(5) })],
        lapsed: [],
      });
      stubClusterMembershipAndOwners();
      userRepo.find.mockResolvedValue([]);

      const result = await service.runRenewalReminders();

      expect(result.sentInApp).toBe(0);
      expect(notificationsService.create).not.toHaveBeenCalled();
    });

    it('isolates errors so a single failed notification does not abort other targets', async () => {
      mockSubscriptionQueries({
        expiring: [
          makeSub({
            id: 'sub-fail',
            businessId: 'biz-fail',
            business: {
              id: 'biz-fail',
              ownerId: 'owner-fail',
              businessName: 'Fail Biz',
            } as unknown as Subscription['business'],
            endDate: daysFromNow(5),
          }),
          makeSub({
            id: 'sub-ok',
            businessId: 'biz-ok',
            business: {
              id: 'biz-ok',
              ownerId: 'owner-ok',
              businessName: 'Ok Biz',
            } as unknown as Subscription['business'],
            endDate: daysFromNow(5),
          }),
        ],
        lapsed: [],
      });

      branchRepo.find.mockResolvedValue([
        {
          id: 'branch-fail',
          businessId: 'biz-fail',
          clusterId: 'cluster-1',
          isMainBranch: true,
        },
        {
          id: 'branch-ok',
          businessId: 'biz-ok',
          clusterId: 'cluster-1',
          isMainBranch: true,
        },
      ]);
      clusterRepo.find.mockResolvedValue([{ id: 'cluster-1', name: 'Ikeja' }]);
      businessRepo.find.mockResolvedValue([
        { id: 'biz-fail', ownerId: 'owner-fail' },
        { id: 'biz-ok', ownerId: 'owner-ok' },
      ]);
      userRepo.find.mockResolvedValue([
        {
          id: 'owner-fail',
          email: 'fail@example.com',
          firstName: 'Fail',
          status: UserStatus.ACTIVE,
        },
        {
          id: 'owner-ok',
          email: 'ok@example.com',
          firstName: 'Ok',
          status: UserStatus.ACTIVE,
        },
      ]);
      impressionRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder([], [{ clusterId: 'cluster-1', people: '60' }]),
      );
      branchRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder([], [{ clusterId: 'cluster-1', businesses: '70' }]),
      );

      // Make the first notification create call reject with an error
      notificationsService.create
        .mockRejectedValueOnce(new Error('Database lock timeout'))
        .mockResolvedValueOnce({ id: 'n-2' });

      const result = await service.runRenewalReminders();

      expect(result.failed).toBe(1);
      expect(result.sentInApp).toBe(1); // Second one succeeded!
      expect(subRepo.update).toHaveBeenCalledWith('sub-ok', expect.anything());
      expect(subRepo.update).not.toHaveBeenCalledWith(
        'sub-fail',
        expect.anything(),
      );
    });
  });
});
