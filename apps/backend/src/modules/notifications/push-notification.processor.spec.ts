import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  PushNotificationProcessor,
  PUSH_NOTIFICATION_QUEUE,
  type PushNotificationJobData,
  type PushFanOutJobData,
} from './push-notification.processor';
import { PushToken, PushTransport } from './entities/push-token.entity';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';

/** The ticket Expo hands back for a message it accepted. */
const acceptedTicket = { id: 'ticket-1', status: 'ok' };

const sendPushNotificationsAsync = jest
  .fn()
  .mockResolvedValue([acceptedTicket]);

jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn().mockImplementation(() => ({ sendPushNotificationsAsync })),
}));

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

/**
 * A query-builder double that records the clauses it is told to apply.
 *
 * `getMany` applies the `userId IN (...)` filter the real query builder
 * performs, so a test cannot pass because the double handed back a row for a
 * user that was never requested.
 */
function queryBuilderDouble(rows: any[]) {
  let userIds: string[] | null = null;
  const qb: any = {
    select: jest.fn(() => qb),
    where: jest.fn((_clause: string, params?: any) => {
      if (params && Array.isArray(params.ids)) {
        userIds = params.ids;
      }
      return qb;
    }),
    orderBy: jest.fn(() => qb),
    andWhere: jest.fn(() => qb),
    getMany: jest.fn(async () =>
      userIds
        ? rows.filter((row) => userIds!.includes(row.userId ?? row.id))
        : rows,
    ),
  };
  return qb;
}

const expoToken = (suffix: string) => `ExponentPushToken[${suffix}]`;

function tokenRow(
  id: string,
  userId: string,
  token: string,
  transport: PushTransport = PushTransport.EXPO,
) {
  return { id, userId, token, transport, platform: 'ios', lastUsedAt: null };
}

describe('PushNotificationProcessor', () => {
  let processor: PushNotificationProcessor;
  let pushTokenRepo: {
    createQueryBuilder: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let userRepo: { createQueryBuilder: jest.Mock; update: jest.Mock };
  let contactRepo: { update: jest.Mock };

  // The worker branches on the job name, so the double has to name it the same
  // way the service would: a single-recipient job carries `targetId`.
  const job = (data: PushNotificationJobData | PushFanOutJobData) =>
    ({
      name: 'targetId' in data ? 'send' : 'fanout',
      data,
    }) as any;

  const pushTokenRows = (rows: any[]) => {
    pushTokenRepo.createQueryBuilder.mockReturnValue(queryBuilderDouble(rows));
  };
  const legacyUserRows = (rows: any[]) => {
    userRepo.createQueryBuilder.mockReturnValue(queryBuilderDouble(rows));
  };

  const sentMessages = () =>
    sendPushNotificationsAsync.mock.calls.flatMap(
      ([messages]: any) => messages,
    );

  beforeEach(async () => {
    jest.clearAllMocks();
    sendPushNotificationsAsync.mockResolvedValue([acceptedTicket]);

    // Built before the module so the doubles are seeded (and asserted on)
    // rather than assigned by the provider factory mid-compile. `update` and
    // `softDelete` return promises because the real repository does, and
    // `invalidate` chains `.catch()` onto them — a bare `jest.fn()` throws there
    // and the resulting rejection is swallowed by `allSettled`, which would let
    // a broken invalidation pass.
    pushTokenRepo = {
      createQueryBuilder: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    userRepo = {
      createQueryBuilder: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    contactRepo = { update: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushNotificationProcessor,
        { provide: getRepositoryToken(PushToken), useValue: pushTokenRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Contact), useValue: contactRepo },
      ],
    }).compile();

    processor = module.get(PushNotificationProcessor);

    // Default: no registered tokens, so a test only states what it cares about.
    pushTokenRows([]);
    legacyUserRows([]);
  });

  it('is registered against the push queue', () => {
    expect(PUSH_NOTIFICATION_QUEUE).toBe('notifications-push');
  });

  describe('multi-device fan-out', () => {
    /**
     * Regression: `resolveMany` collapsed a user's `push_tokens` rows to the most
     * recently updated one, so a second device silently received nothing. The
     * table exists precisely to hold several — the entity notes the old single
     * `users.pushToken` column "capped a user at one device".
     */
    it('delivers to every device a user has registered', async () => {
      pushTokenRows([
        tokenRow('pt-1', 'user-1', expoToken('phone')),
        tokenRow('pt-2', 'user-1', expoToken('tablet')),
      ]);

      await processor.process(
        job({
          targetId: 'user-1',
          isUser: true,
          title: 'Order ready',
          body: 'Your order is ready',
        }),
      );

      const recipients = sentMessages().map((m) => m.to);
      expect(recipients).toEqual(
        expect.arrayContaining([expoToken('phone'), expoToken('tablet')]),
      );
      expect(recipients).toHaveLength(2);
    });

    it('does not also send the legacy single-slot token for a user who has rows', async () => {
      pushTokenRows([tokenRow('pt-1', 'user-1', expoToken('phone'))]);
      legacyUserRows([{ id: 'user-1', pushToken: 'legacy-sub' }]);

      await processor.process(
        job({
          targetId: 'user-1',
          isUser: true,
          title: 't',
          body: 'b',
        }),
      );

      const recipients = sentMessages().map((m) => m.to);
      expect(recipients).toEqual([expoToken('phone')]);
      expect(recipients).not.toContain('legacy-sub');
    });

    it('falls back to the legacy column for a user with no push_tokens row', async () => {
      pushTokenRows([tokenRow('pt-1', 'user-2', expoToken('other'))]);
      legacyUserRows([{ id: 'user-1', pushToken: expoToken('legacy') }]);

      await processor.process(
        job({
          targetId: 'user-1',
          isUser: true,
          title: 't',
          body: 'b',
        }),
      );

      expect(sentMessages().map((m) => m.to)).toEqual([expoToken('legacy')]);
    });

    it('skips silently when the user has no token at all', async () => {
      pushTokenRows([]);
      legacyUserRows([{ id: 'user-1', pushToken: null }]);

      await processor.process(
        job({
          targetId: 'user-1',
          isUser: true,
          title: 't',
          body: 'b',
        }),
      );

      expect(sendPushNotificationsAsync).not.toHaveBeenCalled();
    });
  });

  describe('deep links', () => {
    /**
     * Regression: the prefix was `/messaging` — the socket namespace — while the
     * app resolves taps through a `/messages/<id>` allowlist. Every messaging
     * push tap therefore matched nothing and stayed on the home screen.
     */
    it('builds a /messages deep link from a threadId', async () => {
      pushTokenRows([tokenRow('pt-1', 'user-1', expoToken('phone'))]);

      await processor.process(
        job({
          targetId: 'user-1',
          isUser: true,
          title: 'New message',
          body: 'hi',
          data: { threadId: 'thread-9' },
        }),
      );

      expect(sentMessages()[0].data.url).toBe('/messages/thread-9');
    });

    it('prefers an explicit url over the threadId fallback', async () => {
      pushTokenRows([tokenRow('pt-1', 'user-1', expoToken('phone'))]);

      await processor.process(
        job({
          targetId: 'user-1',
          isUser: true,
          title: 't',
          body: 'b',
          data: { threadId: 'thread-9', url: '/orders/order-3' },
        }),
      );

      expect(sentMessages()[0].data.url).toBe('/orders/order-3');
    });

    /**
     * Regression: the order-status push carried `orderId` but no `url` and no
     * `threadId`, so the deep link resolved to undefined and the tap could only
     * launch the app.
     */
    it('keeps an explicit order url so the tap has a destination', async () => {
      pushTokenRows([tokenRow('pt-1', 'user-1', expoToken('phone'))]);

      await processor.process(
        job({
          targetId: 'user-1',
          isUser: true,
          title: 'Order ready',
          body: 'b',
          data: { orderId: 'order-7', url: '/orders/order-7' },
        }),
      );

      expect(sentMessages()[0].data.url).toBe('/orders/order-7');
    });

    it('leaves the url undefined when the payload has no destination', async () => {
      pushTokenRows([tokenRow('pt-1', 'user-1', expoToken('phone'))]);

      await processor.process(
        job({
          targetId: 'user-1',
          isUser: true,
          title: 't',
          body: 'b',
          data: { orderId: 'order-7' },
        }),
      );

      expect(sentMessages()[0].data.url).toBeUndefined();
    });
  });

  describe('ticket errors', () => {
    it('drops a token the provider reports as unregistered', async () => {
      pushTokenRows([tokenRow('pt-1', 'user-1', expoToken('dead'))]);
      sendPushNotificationsAsync.mockResolvedValueOnce([
        {
          id: 'ticket-2',
          status: 'error',
          message: 'gone',
          details: { error: 'DeviceNotRegistered' },
        },
      ]);

      await processor.process(
        job({
          targetId: 'user-1',
          isUser: true,
          title: 't',
          body: 'b',
        }),
      );

      expect(pushTokenRepo.softDelete).toHaveBeenCalledWith('pt-1');
    });

    it("keeps the token when the limit is ours, not the device's", async () => {
      pushTokenRows([tokenRow('pt-1', 'user-1', expoToken('busy'))]);
      sendPushNotificationsAsync.mockResolvedValueOnce([
        {
          id: 'ticket-3',
          status: 'error',
          message: 'slow down',
          details: { error: 'MessageRateExceeded' },
        },
      ]);

      await processor.process(
        job({
          targetId: 'user-1',
          isUser: true,
          title: 't',
          body: 'b',
        }),
      );

      expect(pushTokenRepo.softDelete).not.toHaveBeenCalled();
    });

    it('marks a delivered token as used', async () => {
      pushTokenRows([tokenRow('pt-1', 'user-1', expoToken('phone'))]);

      await processor.process(
        job({
          targetId: 'user-1',
          isUser: true,
          title: 't',
          body: 'b',
        }),
      );

      expect(pushTokenRepo.update).toHaveBeenCalledWith('pt-1', {
        lastUsedAt: expect.any(Date),
      });
    });
  });

  describe('fan-out', () => {
    it('delivers to every device of every targeted user', async () => {
      pushTokenRows([
        tokenRow('pt-1', 'user-1', expoToken('a')),
        tokenRow('pt-2', 'user-2', expoToken('b')),
        tokenRow('pt-3', 'user-2', expoToken('c')),
      ]);
      // The fan-out also reads preferences off the same repository.
      userRepo.createQueryBuilder.mockReturnValue(
        queryBuilderDouble([
          { id: 'user-1', notificationPreferences: null },
          { id: 'user-2', notificationPreferences: null },
        ]),
      );

      await processor.process(
        job({ userIds: ['user-1', 'user-2'], title: 't', body: 'b' }),
      );

      expect(sentMessages().map((m) => m.to)).toEqual(
        expect.arrayContaining([
          expoToken('a'),
          expoToken('b'),
          expoToken('c'),
        ]),
      );
    });
  });
});
