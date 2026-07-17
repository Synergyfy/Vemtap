import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService } from './discovery.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { CatalogueOffer, CatalogueOfferStatus } from '../catalogue/entities/catalogue-offer.entity';
import { Partnership, PartnershipStatus } from '../partnerships/entities/partnership.entity';
import { Business, BusinessStatus } from '../businesses/entities/business.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { SponsoredCampaign, SponsoredCampaignStatus } from './entities/sponsored-campaign.entity';
import { SponsoredCampaignTransaction } from './entities/sponsored-campaign-transaction.entity';
import { DiscoveryInvoice, InvoiceStatus } from './entities/discovery-invoice.entity';
import { InvoiceLineItem } from './entities/invoice-line-item.entity';
import { FraudAlert, FraudSeverity, FraudAlertStatus } from './entities/fraud-alert.entity';
import { Report, ReportStatus } from './entities/report.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { OfferCategoryType, CategoryTypeStatus } from './entities/offer-category-type.entity';
import { AuditLog } from '../administration/entities/audit-log.entity';
import { Setting } from '../settings/entities/setting.entity';
import { NotFoundException } from '@nestjs/common';

describe('DiscoveryService', () => {
  let service: DiscoveryService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({ total: null }),
    clone: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
  };

  const mockBranchRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };

  const mockVisitRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
  };

  const mockPartnershipRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockOfferRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockBusinessRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockSubscriptionRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockPlanRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockNotificationRepo = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockUserRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockSponsoredCampaignRepo = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
  };

  const mockCampaignTransactionRepo = {
    find: jest.fn(),
  };

  const mockInvoiceRepo = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
  };

  const mockLineItemRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockFraudAlertRepo = {
    findAndCount: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockReportRepo = {
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockNotificationLogRepo = {
    findAndCount: jest.fn(),
  };

  const mockCategoryTypeRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockAuditLogRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
  };

  const mockSettingRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((dto) => dto ?? {}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        { provide: getRepositoryToken(Branch), useValue: mockBranchRepo },
        { provide: getRepositoryToken(Visit), useValue: mockVisitRepo },
        { provide: getRepositoryToken(Partnership), useValue: mockPartnershipRepo },
        { provide: getRepositoryToken(CatalogueOffer), useValue: mockOfferRepo },
        { provide: getRepositoryToken(Business), useValue: mockBusinessRepo },
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionRepo },
        { provide: getRepositoryToken(Plan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(Notification), useValue: mockNotificationRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(SponsoredCampaign), useValue: mockSponsoredCampaignRepo },
        { provide: getRepositoryToken(SponsoredCampaignTransaction), useValue: mockCampaignTransactionRepo },
        { provide: getRepositoryToken(DiscoveryInvoice), useValue: mockInvoiceRepo },
        { provide: getRepositoryToken(InvoiceLineItem), useValue: mockLineItemRepo },
        { provide: getRepositoryToken(FraudAlert), useValue: mockFraudAlertRepo },
        { provide: getRepositoryToken(Report), useValue: mockReportRepo },
        { provide: getRepositoryToken(NotificationLog), useValue: mockNotificationLogRepo },
        { provide: getRepositoryToken(OfferCategoryType), useValue: mockCategoryTypeRepo },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepo },
        { provide: getRepositoryToken(Setting), useValue: mockSettingRepo },
      ],
    }).compile();

    service = module.get<DiscoveryService>(DiscoveryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminStats', () => {
    it('should return aggregated admin stats', async () => {
      mockBusinessRepo.count.mockResolvedValue(100);
      mockOfferRepo.count.mockResolvedValue(50);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '5000' });
      mockVisitRepo.count.mockResolvedValue(200);
      mockPartnershipRepo.count.mockResolvedValue(30);
      mockNotificationRepo.count.mockResolvedValue(1000);

      const result = await service.getAdminStats();

      expect(result).toEqual({
        totalBusinesses: 100,
        activeOffers: 50,
        scheduledOffers: 50,
        expiredOffers: 50,
        totalOfferViews: 5000,
        totalOfferClicks: 200,
        referralsGenerated: 200,
        referralsCompleted: 200,
        couponsRedeemed: 200,
        attributedSales: 200,
        attributedRevenue: 5000,
        sponsoredRevenue: 0,
        activePartnerships: 30,
        notificationsSent: 1000,
        avgConversionRate: 4,
      });
    });
  });

  describe('getAdminBusinesses', () => {
    it('should return paginated businesses', async () => {
      mockBusinessRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [
          {
            id: 'b1', name: 'TestBiz', status: BusinessStatus.ACTIVE,
            createdAt: new Date('2025-01-01'),
            category: { name: 'Food' },
            branches: [{ id: 'br1', name: 'Main', city: 'Abuja', state: 'FCT', isMainBranch: true }],
          },
        ],
        1,
      ]);
      mockSubscriptionRepo.findOne.mockResolvedValue({
        plan: { name: 'Premium' },
        status: SubscriptionStatus.ACTIVE,
      });
      mockOfferRepo.count.mockResolvedValue(5);
      mockVisitRepo.count.mockResolvedValue(10);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '25000' });

      const result = await service.getAdminBusinesses({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('TestBiz');
      expect(result.data[0].plan).toBe('Premium');
      expect(result.data[0].activeOffers).toBe(5);
      expect(result.data[0].referralsSent).toBe(10);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search', async () => {
      mockBusinessRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.getAdminBusinesses({ page: 1, limit: 10, search: 'Test' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('getAdminBusinessDetail', () => {
    it('should return business detail', async () => {
      mockBusinessRepo.findOne.mockResolvedValue({
        id: 'b1', name: 'TestBiz', status: BusinessStatus.ACTIVE,
        createdAt: new Date('2025-01-01'),
        category: { name: 'Food' },
        branches: [{ id: 'br1', name: 'Main', city: 'Abuja', state: 'FCT' }],
      });
      mockOfferRepo.count.mockResolvedValue(3);
      mockVisitRepo.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5);
      mockVisitRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '250000' });

      const result = await service.getAdminBusinessDetail('b1');

      expect(result.name).toBe('TestBiz');
      expect(result.activeOffers).toBe(3);
      expect(result.referralsSent).toBe(5);
      expect(result.revenueGenerated).toBe(250000);
    });

    it('should throw NotFoundException for missing business', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);
      await expect(service.getAdminBusinessDetail('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminOffers', () => {
    it('should return paginated offers', async () => {
      mockOfferRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      const mockOffer = {
        id: 'o1', name: 'Test Offer', status: CatalogueOfferStatus.ACTIVE,
        businessId: 'b1', offerType: 'Discount',
        startDate: new Date('2025-01-01'), endDate: new Date('2025-02-01'),
        views: 100, visits: 20, revenue: 50000,
        business: { name: 'Biz' },
        branch: { name: 'Branch' },
      };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockOffer], 1]);

      const result = await service.getAdminOffers({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Offer');
    });
  });

  describe('getAdminOfferDetail', () => {
    it('should return offer detail with computed metrics', async () => {
      mockOfferRepo.findOne.mockResolvedValue({
        id: 'o1', name: 'Test Offer', status: CatalogueOfferStatus.ACTIVE,
        businessId: 'b1', offerType: 'Discount',
        startDate: new Date('2025-01-01'), endDate: new Date('2025-02-01'),
        views: 200, visits: 40, revenue: 50000,
        business: { name: 'Biz' },
      });
      mockVisitRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { name: 'Partner A', count: '15' },
      ]);

      const result = await service.getAdminOfferDetail('o1');

      expect(result.name).toBe('Test Offer');
      expect(result.ctr).toBe('36.0%');
      expect(result.views).toBe(200);
      expect(result.topReferralSources).toHaveLength(1);
    });

    it('should throw NotFoundException for missing offer', async () => {
      mockOfferRepo.findOne.mockResolvedValue(null);
      await expect(service.getAdminOfferDetail('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminReferrals', () => {
    it('should return paginated referrals', async () => {
      mockVisitRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{
          id: 'v1', visitType: 'patronage', createdAt: new Date('2025-01-01'),
          customerId: 'c1', referredByBranchId: 'b1', branchId: 'b2',
          customer: { firstName: 'John', lastName: 'Doe' },
          referredByBranch: { name: 'SourceBiz' },
          branch: { name: 'TargetBiz' },
          catalogueOffer: { name: 'Special' },
        }],
        1,
      ]);

      const result = await service.getAdminReferrals({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].customer).toBe('John Doe');
    });
  });

  describe('getAdminReferralInvestigation', () => {
    it('should return investigation with evidence', async () => {
      mockVisitRepo.findOne.mockResolvedValue({
        id: 'v1', visitType: 'patronage', createdAt: new Date('2025-01-01'),
        customerId: 'c1', referredByBranchId: 'b1', branchId: 'b2', ipAddress: '192.168.1.1',
        customer: { firstName: 'John', lastName: 'Doe' },
        referredByBranch: { name: 'SourceBiz' },
        branch: { name: 'TargetBiz' },
        catalogueOffer: { name: 'Special' },
      });

      const result = await service.getAdminReferralInvestigation('v1');

      expect(result.status).toBe('Flagged');
      expect(result.evidence).toHaveLength(4);
    });

    it('should throw NotFoundException for missing referral', async () => {
      mockVisitRepo.findOne.mockResolvedValue(null);
      await expect(service.getAdminReferralInvestigation('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminPartnerships', () => {
    it('should return paginated partnerships', async () => {
      mockPartnershipRepo.findAndCount.mockResolvedValue([
        [{
          id: 'p1', status: PartnershipStatus.ACCEPTED, createdAt: new Date('2025-01-01'),
          initiatorBranch: { name: 'InitiatorBiz', business: { name: 'BizA' } },
          recipientBranch: { name: 'RecipientBiz', business: { name: 'BizB' } },
        }],
        1,
      ]);

      const result = await service.getAdminPartnerships({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].businessA).toBe('BizA');
      expect(result.data[0].businessB).toBe('BizB');
    });
  });

  describe('getAdminSponsoredCampaigns', () => {
    it('should return paginated campaigns', async () => {
      mockSponsoredCampaignRepo.findAndCount.mockResolvedValue([
        [{
          id: 'c1', name: 'Test Campaign', status: SponsoredCampaignStatus.ACTIVE,
          budget: 100000, spent: 45000, radius: '2km', duration: '30 Days',
          impressions: 10000, clicks: 500, conversions: 25,
          business: { name: 'Biz' },
        }],
        1,
      ]);

      const result = await service.getAdminSponsoredCampaigns({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Campaign');
    });
  });

  describe('getAdminSponsoredCampaignDetail', () => {
    it('should return campaign detail with transactions', async () => {
      mockSponsoredCampaignRepo.findOne.mockResolvedValue({
        id: 'c1', name: 'Test Campaign', status: SponsoredCampaignStatus.ACTIVE,
        budget: 100000, spent: 45000, radius: '2km', duration: '30 Days',
        impressions: 10000, clicks: 500, conversions: 25,
        startDate: new Date('2025-01-01'), endDate: new Date('2025-02-01'),
        business: { name: 'Biz' },
      });
      mockCampaignTransactionRepo.find.mockResolvedValue([
        { invoiceNo: 'INV-001', date: new Date('2025-01-15'), type: 'Budget Allocation', amount: 45000, status: 'Completed' },
      ]);

      const result = await service.getAdminSponsoredCampaignDetail('c1');

      expect(result.name).toBe('Test Campaign');
      expect(result.ctr).toBe('5.0%');
      expect(result.transactions).toHaveLength(1);
    });

    it('should throw NotFoundException for missing campaign', async () => {
      mockSponsoredCampaignRepo.findOne.mockResolvedValue(null);
      await expect(service.getAdminSponsoredCampaignDetail('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminBilling', () => {
    it('should return paginated invoices', async () => {
      mockInvoiceRepo.findAndCount.mockResolvedValue([
        [{
          id: 'inv1', total: 50000, type: 'Network Subscription', method: 'Wallet',
          status: InvoiceStatus.PAID, date: new Date('2025-01-01'),
          business: { name: 'Biz' },
        }],
        1,
      ]);

      const result = await service.getAdminBilling({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].amount).toBe(50000);
    });
  });

  describe('getAdminBillingDetail', () => {
    it('should return invoice detail with line items', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({
        id: 'inv1', total: 50000, type: 'Campaign Budget Allocation', method: 'VemTap Wallet',
        status: InvoiceStatus.PAID, date: new Date('2025-01-01'), description: 'Campaign fee',
        tax: 5000, business: { name: 'Biz' },
        items: [{ description: 'Setup Fee', qty: 1, unitPrice: 45000 }],
      });

      const result = await service.getAdminBillingDetail('inv1');

      expect(result.amount).toBe(50000);
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException for missing invoice', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.getAdminBillingDetail('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminAttribution', () => {
    it('should return attribution data with paths', async () => {
      mockVisitRepo.count.mockResolvedValue(200);
      mockVisitRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { sourceId: 'b1', targetId: 'b2', count: '45' },
      ]);
      mockBranchRepo.findOne
        .mockResolvedValueOnce({ id: 'b1', name: 'BranchA', business: { name: 'BizA' } })
        .mockResolvedValueOnce({ id: 'b2', name: 'BranchB', business: { name: 'BizB' } });
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '150000' });

      const result = await service.getAdminAttribution();

      expect(result.paths).toHaveLength(1);
      expect(result.paths[0].from).toBe('BizA');
      expect(result.paths[0].flow).toBe(45);
      expect(result.metrics.attributedVisits).toBe(200);
    });
  });

  describe('getAdminCustomers', () => {
    it('should return paginated customers', async () => {
      mockUserRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{
          id: 'u1', firstName: 'John', lastName: 'Doe',
          status: 'Active', role: UserRole.CUSTOMER,
          createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-06-01'),
        }],
        1,
      ]);

      const result = await service.getAdminCustomers({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('John Doe');
    });
  });

  describe('getAdminCustomerDetail', () => {
    it('should return customer detail with timeline', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'u1', firstName: 'John', lastName: 'Doe',
        email: 'john@test.com', phone: '+2348000000000',
        status: 'Active', role: UserRole.CUSTOMER,
        createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-06-01'),
      });
      mockVisitRepo.find.mockResolvedValue([
        { visitType: 'patronage', createdAt: new Date('2025-06-01'), branch: { name: 'Biz' }, catalogueOffer: {} },
      ]);

      const result = await service.getAdminCustomerDetail('u1');

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@test.com');
      expect(result.activityTimeline).toHaveLength(1);
    });

    it('should throw NotFoundException for missing customer', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.getAdminCustomerDetail('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminLocations', () => {
    it('should return paginated locations', async () => {
      mockBranchRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockVisitRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { name: 'Abuja', businesses: '10', offers: '25', referrals: '50' },
        ])
        .mockResolvedValueOnce([
          { city: 'Abuja', revenue: '500000' },
        ]);

      const result = await service.getAdminLocations({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Abuja');
      expect(result.data[0].referrals).toBe(50);
      expect(result.data[0].revenue).toBe(500000);
    });
  });

  describe('getAdminLocationDetail', () => {
    it('should return location detail', async () => {
      mockBranchRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockVisitRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { name: 'Abuja', businesses: '10', offers: '25', referrals: '50' },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.getAdminLocationDetail('1');

      expect(result.name).toBe('Abuja');
      expect(result.density).toBe('12.4 biz/km²');
    });

    it('should throw NotFoundException for missing location', async () => {
      mockBranchRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      await expect(service.getAdminLocationDetail('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminCategories', () => {
    it('should return paginated categories', async () => {
      mockBusinessRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ total: '1' });
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { categoryId: 'cat1', businessCount: '5', offerCount: '15' },
        ])
        .mockResolvedValueOnce([{ categoryId: 'cat1', referrals: '10' }])
        .mockResolvedValueOnce([{ categoryId: 'cat1', revenue: '50000' }]);

      const result = await service.getAdminCategories({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('cat1');
      expect(result.data[0].referrals).toBe(10);
    });
  });

  describe('getAdminCategoryDetail', () => {
    it('should return category detail from db', async () => {
      mockBusinessRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ businessCount: '10', offerCount: '25' })
        .mockResolvedValueOnce({ referrals: '30', revenue: '150000' });

      const result = await service.getAdminCategoryDetail('cat1');

      expect(result.name).toBe('cat1');
      expect(result.totalBusinesses).toBe(10);
      expect(result.activeOffers).toBe(25);
      expect(result.referrals).toBe(30);
    });

    it('should throw NotFoundException for missing category', async () => {
      mockBusinessRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValue({ businessCount: '0', offerCount: '0' });

      await expect(service.getAdminCategoryDetail('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminCategoryTypes', () => {
    it('should return paginated category types', async () => {
      mockCategoryTypeRepo.findAndCount.mockResolvedValue([
        [{ id: 'ct1', name: 'Discount', description: 'Discount offers', offerCount: 10, status: CategoryTypeStatus.ACTIVE }],
        1,
      ]);

      const result = await service.getAdminCategoryTypes(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Discount');
    });
  });

  describe('createAdminCategoryType', () => {
    it('should create and return a new category type', async () => {
      const dto = { name: 'New Type', description: 'Test', status: CategoryTypeStatus.ACTIVE };
      mockCategoryTypeRepo.create.mockReturnValue(dto);
      mockCategoryTypeRepo.save.mockResolvedValue({ id: 'new-id', ...dto });

      const result = await service.createAdminCategoryType(dto as any);

      expect(result.id).toBe('new-id');
      expect(mockCategoryTypeRepo.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateAdminCategoryType', () => {
    it('should update an existing category type', async () => {
      const existing = { id: 'ct1', name: 'Old Name', description: 'Old' };
      mockCategoryTypeRepo.findOne.mockResolvedValue(existing);
      mockCategoryTypeRepo.save.mockResolvedValue({ ...existing, name: 'New Name' });

      const result = await service.updateAdminCategoryType('ct1', { name: 'New Name' } as any);

      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException for missing type', async () => {
      mockCategoryTypeRepo.findOne.mockResolvedValue(null);
      await expect(service.updateAdminCategoryType('invalid', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAdminCategoryType', () => {
    it('should soft delete a category type', async () => {
      mockCategoryTypeRepo.findOne.mockResolvedValue({ id: 'ct1' });
      mockCategoryTypeRepo.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteAdminCategoryType('ct1');

      expect(result.success).toBe(true);
      expect(mockCategoryTypeRepo.softDelete).toHaveBeenCalledWith('ct1');
    });

    it('should throw NotFoundException for missing type', async () => {
      mockCategoryTypeRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteAdminCategoryType('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminFraudAlerts', () => {
    it('should return fraud alerts with dashboard stats', async () => {
      mockFraudAlertRepo.findAndCount.mockResolvedValue([
        [{
          id: 'f1', type: 'Velocity Spiking', severity: FraudSeverity.HIGH,
          status: FraudAlertStatus.FLAGGED, confidence: 94,
          timestamp: new Date('2025-01-01'), reason: 'Suspicious',
          business: { name: 'Biz' },
          customer: { firstName: 'John', lastName: 'Doe' },
        }],
        1,
      ]);
      mockFraudAlertRepo.count.mockResolvedValue(1);
      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '5' });

      const result = await service.getAdminFraudAlerts({ page: 1, limit: 10 });

      expect(result.alerts).toHaveLength(1);
      expect(result.securityScore).toBe('98.2');
      expect(result.activeAlerts).toBe(1);
    });
  });

  describe('getAdminNotifications', () => {
    it('should return paginated notification logs', async () => {
      mockNotificationLogRepo.findAndCount.mockResolvedValue([
        [{
          id: 'n1', recipientName: 'John Doe', recipientId: 'u1',
          businessId: 'b1', channel: 'PUSH', status: 'DELIVERED',
          openStatus: 'OPENED', content: 'Hello',
          sentAt: new Date('2025-01-01'),
        }],
        1,
      ]);

      const result = await service.getAdminNotifications({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].recipient).toBe('John Doe');
    });
  });

  describe('getAdminReports', () => {
    it('should return paginated reports', async () => {
      mockReportRepo.findAndCount.mockResolvedValue([
        [{
          id: 'r1', name: 'Monthly Report', type: 'Full Summary',
          status: ReportStatus.COMPLETED, fileSize: '2.5MB',
          createdAt: new Date('2025-01-01'),
          generatedBy: { firstName: 'Admin' },
        }],
        1,
      ]);

      const result = await service.getAdminReports(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Monthly Report');
    });
  });

  describe('generateAdminReport', () => {
    it('should create a new report with PROCESSING status and generatedBy', async () => {
      const dto = { name: 'New Report', type: 'Performance', dateRange: 'Last 30 days' };
      const adminId = 'admin-1';
      mockReportRepo.create.mockReturnValue({ ...dto, status: ReportStatus.PROCESSING, generatedBy: { id: adminId } });
      mockReportRepo.save.mockResolvedValue({ id: 'new-rpt', ...dto, status: ReportStatus.PROCESSING });

      const result = await service.generateAdminReport(dto as any, adminId);

      expect(mockReportRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ generatedBy: { id: adminId } }),
      );
      expect(result.status).toBe(ReportStatus.PROCESSING);
    });
  });

  describe('getAdminAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      mockAuditLogRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{
          id: 'a1', method: 'POST', endpoint: '/admin/businesses',
          statusCode: 201, businessId: 'b1', ipAddress: '127.0.0.1',
          createdAt: new Date('2025-01-01'),
          actor: { firstName: 'Admin', lastName: 'User' },
        }],
        1,
      ]);

      const result = await service.getAdminAuditLogs({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].action).toBe('POST');
    });
  });

  describe('getAdminAuditLogDetail', () => {
    it('should return audit log detail', async () => {
      mockAuditLogRepo.findOne.mockResolvedValue({
        id: 'a1', method: 'POST', endpoint: '/admin/businesses',
        statusCode: 201, businessId: 'b1', ipAddress: '127.0.0.1',
        module: 'Discovery', userAgent: 'Chrome', payload: { status: 'Pending' },
        createdAt: new Date('2025-01-01'),
        actor: { firstName: 'Admin', lastName: 'User' },
      });

      const result = await service.getAdminAuditLogDetail('a1');

      expect(result.action).toBe('POST');
      expect(result.module).toBe('Discovery');
    });

    it('should throw NotFoundException for missing log', async () => {
      mockAuditLogRepo.findOne.mockResolvedValue(null);
      await expect(service.getAdminAuditLogDetail('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminDiscoverySettings', () => {
    it('should return defaults when no settings exist', async () => {
      mockSettingRepo.findOne.mockResolvedValue(null);

      const result = await service.getAdminDiscoverySettings();

      expect(result.enableNetwork).toBe(true);
      expect(result.maxOffersPerVisit).toBe(3);
    });

    it('should return stored settings when they exist', async () => {
      mockSettingRepo.findOne.mockResolvedValue({ someField: 'value' });

      const result = await service.getAdminDiscoverySettings();

      expect(result.enableNetwork).toBe(true);
    });
  });

  describe('updateAdminDiscoverySettings', () => {
    it('should update existing settings', async () => {
      const existing = { id: 's1' };
      mockSettingRepo.findOne.mockResolvedValue(existing);
      mockSettingRepo.save.mockResolvedValue(existing);

      const dto = { enableNetwork: false };
      const result = await service.updateAdminDiscoverySettings(dto as any);

      expect(result.success).toBe(true);
    });

    it('should create settings when none exist', async () => {
      mockSettingRepo.findOne.mockResolvedValue(null);

      const result = await service.updateAdminDiscoverySettings({ enableNetwork: true } as any);

      expect(result.success).toBe(true);
      expect(mockSettingRepo.create).toHaveBeenCalled();
      expect(mockSettingRepo.save).toHaveBeenCalled();
    });
  });

  describe('getOverview', () => {
    it('should return overview with stats', async () => {
      mockBranchRepo.findOne.mockResolvedValue({ id: 'br1', name: 'Branch' });
      mockOfferRepo.count.mockResolvedValue(3);
      mockQueryBuilder.getRawOne
        .mockReset()
        .mockResolvedValueOnce({ total: '500' })
        .mockResolvedValueOnce({ total: '0' });
      mockQueryBuilder.getCount
        .mockReset()
        .mockResolvedValue(50);
      mockVisitRepo.count
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(500);
      mockOfferRepo.findOne.mockResolvedValue({ name: 'Best Offer', visits: 100 });
      mockQueryBuilder.getRawOne.mockResolvedValue({ referredByBranchId: 'p1', count: '20' });
      mockBranchRepo.findOne.mockResolvedValue({ id: 'p1', name: 'Partner', business: { name: 'PartnerBiz' } });
      mockQueryBuilder.clone.mockReturnThis();
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getOverview('br1');

      expect(result.stats.peopleReached).toBe(500);
      expect(result.stats.customersVisited).toBe(50);
      expect(result.highlights.bestPromotion.name).toBe('Best Offer');
    });

    it('should throw NotFoundException for missing branch', async () => {
      mockBranchRepo.findOne.mockResolvedValue(null);
      await expect(service.getOverview('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getResults', () => {
    it('should return results with timeline for 7days range', async () => {
      mockBranchRepo.findOne.mockResolvedValue({ id: 'br1' });
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { name: 'MON', views: '10', visits: '3' },
      ]);
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ total: '500' })
        .mockResolvedValueOnce({ total: '0' });
      mockVisitRepo.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(25);

      const result = await service.getResults('br1', '7days');

      expect(result.stats.peopleReached).toBe(500);
      expect(result.timeline).toHaveLength(1);
    });

    it('should throw NotFoundException for missing branch', async () => {
      mockBranchRepo.findOne.mockResolvedValue(null);
      await expect(service.getResults('invalid', '7days')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSettings', () => {
    it('should return branch settings', async () => {
      mockBranchRepo.findOne.mockResolvedValue({ id: 'br1', joinDiscoveryNetwork: true });

      const result = await service.getSettings('br1');

      expect(result.id).toBe('br1');
    });

    it('should throw NotFoundException for missing branch', async () => {
      mockBranchRepo.findOne.mockResolvedValue(null);
      await expect(service.getSettings('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSettings', () => {
    it('should update branch settings', async () => {
      const branch = { id: 'br1', joinDiscoveryNetwork: false };
      mockBranchRepo.findOne.mockResolvedValue(branch);
      mockBranchRepo.save.mockResolvedValue({ ...branch, joinDiscoveryNetwork: true });

      await service.updateSettings('br1', { joinDiscoveryNetwork: true });

      expect(mockBranchRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing branch', async () => {
      mockBranchRepo.findOne.mockResolvedValue(null);
      await expect(service.updateSettings('invalid', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPartners', () => {
    it('should return partners with referral counts', async () => {
      mockPartnershipRepo.find.mockResolvedValue([
        {
          id: 'p1', initiatorBranchId: 'br1', recipientBranchId: 'br2',
          status: PartnershipStatus.ACCEPTED,
          initiatorBranch: { id: 'br1', name: 'Initiator', business: { name: 'MyBiz', categoryId: 'Retail' } },
          recipientBranch: { id: 'br2', name: 'Recipient', business: { name: 'PartnerBiz', categoryId: 'Food' } },
        },
      ]);
      mockVisitRepo.count.mockResolvedValue(5);

      const result = await service.getPartners('br1');

      expect(result).toHaveLength(1);
    });
  });

  describe('getCustomers', () => {
    it('should return paginated customers with origin', async () => {
      mockVisitRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{
          id: 'v1', visitType: 'patronage', customerId: 'c1',
          referredByBranchId: null, branchId: 'br1',
          createdAt: new Date('2025-01-01'),
          customer: { firstName: 'John', lastName: 'Doe', phone: '+234', email: 'j@t.com' },
          branch: { name: 'MyBranch' },
          referredByBranch: null,
          catalogueOffer: { name: 'Offer' },
        }],
        1,
      ]);

      const result = await service.getCustomers('br1', 'direct', 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].origin).toContain('Direct');
    });
  });

  describe('submitRecommendation', () => {
    it('should return success', async () => {
      const dto = { businessName: 'New Biz', ownerName: 'Owner', phone: '+234', email: 'o@t.com' };
      const result = await service.submitRecommendation('br1', dto);

      expect(result.success).toBe(true);
    });
  });
});
