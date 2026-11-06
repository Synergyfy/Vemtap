import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { BusinessDashboardService } from './business-dashboard.service';
import { Visit } from '../visitors/entities/visit.entity';
import { Device } from '../devices/entities/device.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Reward } from '../loyalty/entities/reward.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { PosSale } from '../pos/entities/pos-sale.entity';
import { ConversationThread } from '../messaging/entities/conversation-thread.entity';
import { CatalogueOrder } from '../catalogue-orders/entities/catalogue-order.entity';

/** A query builder whose methods all return it (the service chains freely). */
function chainableQb({ raw = {}, count = 0 } = {}) {
  const builder: Record<string, any> = {};
  for (const method of [
    'select',
    'addSelect',
    'innerJoin',
    'leftJoin',
    'where',
    'andWhere',
    'orWhere',
    'orderBy',
    'groupBy',
    'setParameter',
  ]) {
    builder[method] = jest.fn(() => builder);
  }
  builder.getRawOne = jest.fn().mockResolvedValue(raw);
  builder.getRawMany = jest.fn().mockResolvedValue([]);
  builder.getCount = jest.fn().mockResolvedValue(count);
  builder.getOne = jest.fn().mockResolvedValue(null);
  return builder;
}

describe('BusinessDashboardService', () => {
  let service: BusinessDashboardService;

  const orderRepo = { sum: jest.fn(), count: jest.fn() };
  const threadRepo = { sum: jest.fn() };
  const visitRepo = { count: jest.fn(), find: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const offerRepo = { createQueryBuilder: jest.fn() };
  const claimRepo = { createQueryBuilder: jest.fn() };
  const posSaleRepo = { createQueryBuilder: jest.fn() };
  const emptyRepo = { find: jest.fn() };

  const visit = (createdAt: Date) => ({ createdAt, id: 'v' });

  beforeEach(async () => {
    jest.clearAllMocks();

    orderRepo.sum.mockResolvedValue(482000);
    orderRepo.count.mockResolvedValue(128);
    threadRepo.sum.mockResolvedValue(5);
    visitRepo.count.mockResolvedValue(0);
    visitRepo.find.mockResolvedValue([]);
    businessRepo.findOne.mockResolvedValue({
      name: 'Aurora Grill',
      logoUrl: '',
    });
    offerRepo.createQueryBuilder.mockReturnValue(
      chainableQb({ raw: { sum: '0' } }),
    );
    claimRepo.createQueryBuilder.mockReturnValue(chainableQb({ count: 0 }));
    posSaleRepo.createQueryBuilder.mockReturnValue(
      chainableQb({ raw: { sum: '0' } }),
    );
    for (const repo of Object.values(emptyRepo)) {
      repo.mockResolvedValue([]);
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessDashboardService,
        { provide: getRepositoryToken(Visit), useValue: visitRepo },
        { provide: getRepositoryToken(Device), useValue: emptyRepo },
        { provide: getRepositoryToken(User), useValue: emptyRepo },
        { provide: getRepositoryToken(Notification), useValue: emptyRepo },
        { provide: getRepositoryToken(Campaign), useValue: emptyRepo },
        { provide: getRepositoryToken(Reward), useValue: emptyRepo },
        { provide: getRepositoryToken(Branch), useValue: emptyRepo },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(CatalogueOffer), useValue: offerRepo },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: claimRepo,
        },
        { provide: getRepositoryToken(PosSale), useValue: posSaleRepo },
        {
          provide: getRepositoryToken(ConversationThread),
          useValue: threadRepo,
        },
        { provide: getRepositoryToken(CatalogueOrder), useValue: orderRepo },
      ],
    }).compile();

    service = module.get(BusinessDashboardService);
  });

  describe('getDashboard', () => {
    it('publishes ordersRevenue and bookingsCount from the order table', async () => {
      const dashboard = await service.getDashboard('biz-1', 'branch-1');

      expect(dashboard.stats.ordersRevenue).toBe(482000);
      expect(dashboard.stats.bookingsCount).toBe(128);
      expect(orderRepo.sum).toHaveBeenCalledWith(
        'totalAmount',
        expect.objectContaining({ businessId: 'biz-1', branchId: 'branch-1' }),
      );
      expect(orderRepo.sum).toHaveBeenCalledWith(
        'totalAmount',
        expect.objectContaining({ status: expect.anything() }),
      );
      expect(orderRepo.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          businessId: 'biz-1',
          branchId: 'branch-1',
          bookingDate: expect.anything(),
        }),
      });
    });

    it('reports unread messages from the branch-side thread counter', async () => {
      const dashboard = await service.getDashboard('biz-1', 'branch-1');

      expect(dashboard.unreadMessages).toBe(5);
      expect(threadRepo.sum).toHaveBeenCalledWith('branchUnreadCount', {
        businessId: 'biz-1',
        branchId: 'branch-1',
      });
    });

    it('scopes the branch-wide sums to the caller business when no branch is passed', async () => {
      await service.getDashboard('biz-1');

      expect(threadRepo.sum).toHaveBeenCalledWith('branchUnreadCount', {
        businessId: 'biz-1',
      });
      expect(orderRepo.sum).toHaveBeenCalledWith(
        'totalAmount',
        expect.objectContaining({ businessId: 'biz-1' }),
      );
      expect(orderRepo.sum).toHaveBeenCalledWith(
        'totalAmount',
        expect.not.objectContaining({ branchId: expect.anything() }),
      );
    });

    it('buckets activity by weekday for the last 7 days, zero-filled', async () => {
      // Local-time constructors keep the weekday stable in any test timezone.
      const monday = new Date(2026, 9, 5, 10);
      const wednesday = new Date(2026, 9, 7, 10);
      visitRepo.find.mockResolvedValue([
        visit(monday),
        visit(monday),
        visit(wednesday),
      ]);

      const dashboard = await service.getDashboard('biz-1', 'branch-1');

      expect(dashboard.activityData.map((point) => point.hour)).toEqual([
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sun',
      ]);
      expect(dashboard.activityData.map((point) => point.visits)).toEqual([
        2, 0, 1, 0, 0, 0, 0,
      ]);
    });
  });
});
