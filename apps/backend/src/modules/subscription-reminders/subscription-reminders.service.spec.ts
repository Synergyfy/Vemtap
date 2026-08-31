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
import { SubscriptionReminderTemplate } from './entities/subscription-reminder-template.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import { MailService } from '../mail/mail.service';
import { SubscriptionRemindersService } from './subscription-reminders.service';
import { SUBSCRIPTION_RENEWAL_URL } from './subscription-reminders.constants';
import { NotFoundException, BadRequestException } from '@nestjs/common';

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
  let templateRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let notificationsService: { create: jest.Mock };
  let pushService: { sendNotification: jest.Mock };
  let mailService: { sendSubscriptionRenewalReminder: jest.Mock };

  function stubQueries(
    expiring: Subscription[] = [],
    lapsed: Subscription[] = [],
    eligible: string[] = [],
  ) {
    let call = 0;
    subRepo.createQueryBuilder.mockImplementation(() => {
      call++;
      if (call === 1) return makeQueryBuilder(expiring);
      if (call === 2) return makeQueryBuilder(lapsed);
      if (call === 3)
        return makeQueryBuilder(
          [],
          eligible.map((businessId) => ({ businessId })),
        );
      return makeQueryBuilder();
    });
  }

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);

    subRepo = {
      createQueryBuilder: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    branchRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'branch-1',
          businessId: 'biz-1',
          clusterId: 'cluster-1',
          isMainBranch: true,
        },
      ]),
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(
          makeQueryBuilder([], [{ clusterId: 'cluster-1', businesses: '70' }]),
        ),
    };

    clusterRepo = {
      find: jest.fn().mockResolvedValue([{ id: 'cluster-1', name: 'Ikeja' }]),
    };

    businessRepo = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: 'biz-1', ownerId: 'owner-1' }]),
    };

    userRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'owner-1',
          email: 'owner@example.com',
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE,
        },
      ]),
    };

    impressionRepo = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(
          makeQueryBuilder([], [{ clusterId: 'cluster-1', people: '60' }]),
        ),
    };

    templateRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'tmpl-1' })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
    };

    notificationsService = {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
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
        {
          provide: getRepositoryToken(SubscriptionReminderTemplate),
          useValue: templateRepo,
        },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: PushNotificationService, useValue: pushService },
        { provide: MailService, useValue: mailService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'SUBSCRIPTION_REMINDER_STAGES') return '14,7,3';
              if (key === 'SUBSCRIPTION_REMINDER_LAPSED_DAYS') return 7;
              if (key === 'SUBSCRIPTION_REMINDER_CUSTOMER_LOOKBACK_DAYS') return 30;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionRemindersService>(
      SubscriptionRemindersService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runRenewalReminders', () => {
    it('returns zeroed results when there are no targets', async () => {
      stubQueries([], []);

      const result = await service.runRenewalReminders();

      expect(result).toEqual({
        expiring: 0,
        lapsed: 0,
        sentInApp: 0,
        sentPush: 0,
        sentEmail: 0,
        failed: 0,
        skippedNoCluster: 0,
        skippedDisabledTemplate: 0,
      });
      expect(notificationsService.create).not.toHaveBeenCalled();
      expect(pushService.sendNotification).not.toHaveBeenCalled();
    });

    it('sends an in-app + push reminder to the active owner and records the stage', async () => {
      const sub = makeSub({ endDate: daysFromNow(5) });
      stubQueries([sub], []);

      const result = await service.runRenewalReminders();

      expect(result.sentInApp).toBe(1);
      expect(result.sentPush).toBe(1);
      expect(result.failed).toBe(0);

      expect(notificationsService.create).toHaveBeenCalledWith(
        'owner-1',
        expect.stringContaining('Ikeja'),
        expect.stringContaining('60'),
        'warning',
        SUBSCRIPTION_RENEWAL_URL,
      );

      expect(pushService.sendNotification).toHaveBeenCalledWith(
        'owner-1',
        expect.stringContaining('Ikeja'),
        expect.stringContaining('60'),
        expect.objectContaining({
          url: SUBSCRIPTION_RENEWAL_URL,
          category: 'marketing',
          stage: 7,
          clusterId: 'cluster-1',
        }),
      );

      expect(subRepo.update).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({
          lastRenewalReminderStage: 7,
        }),
      );
    });

    it('uses the 14-day copy for subscriptions far from expiry', async () => {
      const sub = makeSub({ id: 'sub-exp', endDate: daysFromNow(12) });
      stubQueries([sub], []);

      await service.runRenewalReminders();

      const { title } = lastCreateCall(notificationsService);
      expect(title).toContain('expire in 12 days');
      expect(subRepo.update).toHaveBeenCalledWith(
        'sub-exp',
        expect.objectContaining({ lastRenewalReminderStage: 14 }),
      );
    });

    it('skips a business that has no cluster membership', async () => {
      branchRepo.find.mockResolvedValueOnce([
        { id: 'branch-1', businessId: 'biz-1', clusterId: null },
      ]);
      const sub = makeSub({ endDate: daysFromNow(5) });
      stubQueries([sub], []);

      const result = await service.runRenewalReminders();

      expect(result.skippedNoCluster).toBe(1);
      expect(result.sentInApp).toBe(0);
      expect(notificationsService.create).not.toHaveBeenCalled();
    });

    it('does not re-remind at an already-sent stage', async () => {
      const sub = makeSub({
        endDate: daysFromNow(5),
        lastRenewalReminderStage: 7,
      });
      stubQueries([sub], []);

      const result = await service.runRenewalReminders();

      expect(result.sentInApp).toBe(0);
      expect(notificationsService.create).not.toHaveBeenCalled();
    });

    it('escalates to the 3-day copy and stage, sending in-app, push, and email', async () => {
      const sub = makeSub({
        endDate: daysFromNow(2),
        lastRenewalReminderStage: 7,
      });
      stubQueries([sub], []);

      const result = await service.runRenewalReminders();

      expect(result.sentInApp).toBe(1);
      expect(result.sentPush).toBe(1);
      expect(result.sentEmail).toBe(1);

      const { title, message } = lastCreateCall(notificationsService);
      expect(title).toContain('Last call');
      expect(message).toContain('2 days');

      expect(mailService.sendSubscriptionRenewalReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'owner@example.com',
          customerName: 'John Doe',
          daysLeft: 2,
          isLapsed: false,
          planName: 'Pro',
        }),
      );

      expect(subRepo.update).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({ lastRenewalReminderStage: 3 }),
      );
    });

    it('sends the expired copy and email once for lapsed subscriptions', async () => {
      const sub = makeSub({
        id: 'sub-lapsed',
        endDate: daysFromNow(-2),
        lastRenewalReminderStage: 3,
      });
      stubQueries([], [sub], []);

      const result = await service.runRenewalReminders();

      expect(result.sentInApp).toBe(1);
      expect(result.sentEmail).toBe(1);

      const { title, type } = lastCreateCall(notificationsService);
      expect(title).toContain('left the Ikeja deals feed');
      expect(type).toBe('error');

      expect(mailService.sendSubscriptionRenewalReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          isLapsed: true,
          email: 'owner@example.com',
        }),
      );

      expect(subRepo.update).toHaveBeenCalledWith(
        'sub-lapsed',
        expect.objectContaining({ lastRenewalReminderStage: 0 }),
      );
    });

    it('applies customized templates when present in database', async () => {
      const customTemplate = {
        id: 'tmpl-7',
        stage: 7,
        name: 'Custom 7-Day',
        titleTemplate: 'Attention {{businessName}}: {{clusterName}} expires in {{daysLeft}} days',
        messageTemplate: 'Hello {{ownerName}}, you have {{daysText}} to renew your {{planName}}.',
        type: 'warning',
        actionUrl: '/custom-renew',
        isEnabled: true,
        sendPush: true,
        sendInApp: true,
        sendEmail: false,
      };
      templateRepo.find.mockResolvedValue([customTemplate]);

      const sub = makeSub({ endDate: daysFromNow(5) });
      stubQueries([sub], []);

      await service.runRenewalReminders();

      const { title, message, actionUrl } = lastCreateCall(notificationsService);
      expect(title).toContain('Attention Ikeja Store: Ikeja expires in 5 days');
      expect(message).toContain('Hello John Doe, you have 5 days to renew your Pro.');
      expect(actionUrl).toBe('/custom-renew');
    });

    it('skips reminder when custom template is disabled (isEnabled: false)', async () => {
      const disabledTemplate = {
        id: 'tmpl-7',
        stage: 7,
        name: 'Disabled 7-Day',
        titleTemplate: 'Title',
        messageTemplate: 'Msg',
        isEnabled: false,
      };
      templateRepo.find.mockResolvedValue([disabledTemplate]);

      const sub = makeSub({ endDate: daysFromNow(5) });
      stubQueries([sub], []);

      const result = await service.runRenewalReminders();

      expect(result.skippedDisabledTemplate).toBe(1);
      expect(result.sentInApp).toBe(0);
      expect(notificationsService.create).not.toHaveBeenCalled();
    });
  });

  describe('Template Management CRUD', () => {
    it('returns placeholders documentation', async () => {
      const placeholders = await service.getPlaceholders();
      expect(placeholders).toBeDefined();
      expect(placeholders.length).toBeGreaterThan(0);
      expect(placeholders.some((p) => p.placeholder === '{{clusterName}}')).toBe(true);
    });

    it('gets templates with default seeding if empty', async () => {
      templateRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([
        { stage: 14, name: '14-Day' },
      ]);

      const list = await service.getTemplates();
      expect(list).toBeDefined();
      expect(templateRepo.save).toHaveBeenCalled();
    });

    it('creates a new custom template', async () => {
      templateRepo.findOne.mockResolvedValue(null);

      const result = await service.createTemplate({
        stage: 21,
        name: '21-Day Advance Notice',
        titleTemplate: 'Your plan expires in {{daysLeft}} days',
        messageTemplate: 'Renew early for discounts',
      });

      expect(result).toBeDefined();
      expect(templateRepo.save).toHaveBeenCalled();
    });

    it('throws BadRequestException when creating a template for an existing stage', async () => {
      templateRepo.findOne.mockResolvedValue({ id: 'tmpl-1', stage: 14 });

      await expect(
        service.createTemplate({
          stage: 14,
          name: 'Duplicate 14-Day',
          titleTemplate: 'Title',
          messageTemplate: 'Msg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates an existing template', async () => {
      const existing = {
        id: 'tmpl-1',
        stage: 14,
        name: '14-Day Reminder',
        titleTemplate: 'Old Title',
      };
      templateRepo.findOne.mockResolvedValue(existing);

      const result = await service.updateTemplate('tmpl-1', {
        name: 'New 14-Day Reminder',
        titleTemplate: 'Updated Title for {{clusterName}}',
      });

      expect(result.name).toBe('New 14-Day Reminder');
      expect(result.titleTemplate).toBe('Updated Title for {{clusterName}}');
      expect(templateRepo.save).toHaveBeenCalled();
    });

    it('resets a template to default configuration', async () => {
      const custom = {
        id: 'tmpl-1',
        stage: 14,
        name: 'Modified 14-Day',
        titleTemplate: 'Custom Title',
      };
      templateRepo.findOne.mockResolvedValue(custom);

      const result = await service.resetTemplate('tmpl-1');
      expect(result.titleTemplate).toContain('{{clusterName}}');
      expect(templateRepo.save).toHaveBeenCalled();
    });

    it('previews template rendering with sample variables', async () => {
      const preview = await service.previewTemplate({
        titleTemplate: 'Hello {{ownerName}}, your {{planName}} at {{businessName}} ends in {{daysLeft}} days!',
        messageTemplate: 'Reach {{people}} shoppers in {{clusterName}} by renewing at {{renewalUrl}}.',
        variables: {
          businessName: 'My Awesome Mart',
          ownerName: 'Sarah Connor',
          planName: 'VIP Growth',
          daysLeft: 10,
        },
      });

      expect(preview.title).toBe(
        'Hello Sarah Connor, your VIP Growth at My Awesome Mart ends in 10 days!',
      );
      expect(preview.message).toContain('Reach 1,840 shoppers in Ikeja Tech Hub');
    });
  });
});
