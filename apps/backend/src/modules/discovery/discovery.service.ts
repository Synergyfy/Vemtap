import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Not, IsNull, In } from 'typeorm';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from '../catalogue/entities/catalogue-offer.entity';
import {
  Partnership,
  PartnershipStatus,
} from '../partnerships/entities/partnership.entity';
import {
  Business,
  BusinessStatus,
} from '../businesses/entities/business.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { User, UserRole } from '../users/entities/user.entity';
import {
  SponsoredCampaign,
  SponsoredCampaignStatus,
} from './entities/sponsored-campaign.entity';
import { SponsoredCampaignTransaction } from './entities/sponsored-campaign-transaction.entity';
import {
  DiscoveryInvoice,
  InvoiceStatus,
} from './entities/discovery-invoice.entity';
import { InvoiceLineItem } from './entities/invoice-line-item.entity';
import {
  FraudAlert,
  FraudSeverity,
  FraudAlertStatus,
} from './entities/fraud-alert.entity';
import { Report, ReportStatus } from './entities/report.entity';
import {
  NotificationLog,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationOpenStatus,
} from './entities/notification-log.entity';
import {
  OfferCategoryType,
  CategoryTypeStatus,
} from './entities/offer-category-type.entity';
import { AuditLog } from '../administration/entities/audit-log.entity';
import { Setting } from '../settings/entities/setting.entity';
import { CatalogueOrder } from '../catalogue-orders/entities/catalogue-order.entity';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';
import {
  UpdateDiscoverySettingsDto,
  RecommendBusinessDto,
} from './dto/discovery.dto';
import {
  AdminOfferQueryDto,
  AdminReferralQueryDto,
  AdminPartnershipQueryDto,
  AdminSponsoredQueryDto,
  AdminBillingQueryDto,
  AdminCustomerQueryDto,
  AdminLocationQueryDto,
  AdminCategoryQueryDto,
  AdminFraudQueryDto,
  AdminNotificationQueryDto,
  AdminAuditLogQueryDto,
} from './dto/discovery-admin-query.dto';
import {
  CreateCategoryTypeDto,
  UpdateCategoryTypeDto,
  GenerateReportDto,
  UpdateDiscoveryAdminSettingsDto,
} from './dto/discovery-admin-category-types.dto';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(Partnership)
    private readonly partnershipRepository: Repository<Partnership>,
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SponsoredCampaign)
    private readonly sponsoredCampaignRepository: Repository<SponsoredCampaign>,
    @InjectRepository(SponsoredCampaignTransaction)
    private readonly campaignTransactionRepository: Repository<SponsoredCampaignTransaction>,
    @InjectRepository(DiscoveryInvoice)
    private readonly invoiceRepository: Repository<DiscoveryInvoice>,
    @InjectRepository(InvoiceLineItem)
    private readonly lineItemRepository: Repository<InvoiceLineItem>,
    @InjectRepository(FraudAlert)
    private readonly fraudAlertRepository: Repository<FraudAlert>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
    @InjectRepository(OfferCategoryType)
    private readonly categoryTypeRepository: Repository<OfferCategoryType>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async getOverview(branchId: string) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    // 1. People Reached (views sum of all offers belonging to this branch)
    const viewsResult = await this.offerRepository
      .createQueryBuilder('offer')
      .select('SUM(offer.views)', 'total')
      .where('offer.branchId = :branchId', { branchId })
      .getRawOne();
    const totalViews = parseInt(viewsResult?.total || '0', 10);

    // 2. Customers Visited (patronage visits referred by a partner)
    const visitsCount = await this.visitRepository
      .createQueryBuilder('visit')
      .where('visit.branchId = :branchId', { branchId })
      .andWhere('visit.visitType = :visitType', { visitType: 'patronage' })
      .andWhere('visit.referredByBranchId IS NOT NULL')
      .getCount();

    // 3. Offers Redeemed (patronage visits with catalogueOfferId)
    const redeemedCount = await this.visitRepository
      .createQueryBuilder('visit')
      .where('visit.branchId = :branchId', { branchId })
      .andWhere('visit.visitType = :visitType', { visitType: 'patronage' })
      .andWhere('visit.catalogueOfferId IS NOT NULL')
      .getCount();

    // 4. Revenue Generated
    const revenueResult = await this.visitRepository
      .createQueryBuilder('visit')
      .innerJoin('catalogue_orders', 'order', 'order.id = visit.orderId')
      .select('SUM(order.totalAmount)', 'total')
      .where('visit.branchId = :branchId', { branchId })
      .andWhere('visit.visitType = :visitType', { visitType: 'patronage' })
      .andWhere('visit.referredByBranchId IS NOT NULL')
      .getRawOne();
    const totalRevenue = parseFloat(revenueResult?.total || '0');

    // 5. Best Promotion
    const bestOffer = await this.offerRepository.findOne({
      where: { branchId },
      order: { visits: 'DESC' },
    });

    // 6. Top Partner
    const topPartnerResult = await this.visitRepository
      .createQueryBuilder('visit')
      .select('visit.referredByBranchId', 'referredByBranchId')
      .addSelect('COUNT(visit.id)', 'count')
      .where('visit.branchId = :branchId', { branchId })
      .andWhere('visit.referredByBranchId IS NOT NULL')
      .groupBy('visit.referredByBranchId')
      .orderBy('count', 'DESC')
      .limit(1)
      .getRawOne();

    let topPartnerName = 'None';
    let topPartnerVisits = 0;
    if (topPartnerResult) {
      const topPartnerBranch = await this.branchRepository.findOne({
        where: { id: topPartnerResult.referredByBranchId },
        relations: ['business'],
      });
      if (topPartnerBranch) {
        topPartnerName =
          topPartnerBranch.business?.name || topPartnerBranch.name;
        topPartnerVisits = parseInt(topPartnerResult.count || '0', 10);
      }
    }

    // 7. Recent Customer Visits
    const recentVisits = await this.visitRepository
      .createQueryBuilder('visit')
      .leftJoinAndSelect('visit.customer', 'customer')
      .leftJoinAndSelect('visit.catalogueOffer', 'offer')
      .where('visit.branchId = :branchId', { branchId })
      .andWhere('visit.referredByBranchId IS NOT NULL')
      .orderBy('visit.createdAt', 'DESC')
      .limit(4)
      .getMany();

    return {
      stats: {
        peopleReached: totalViews,
        customersVisited: visitsCount,
        offersRedeemed: redeemedCount,
        revenueGenerated: totalRevenue,
      },
      highlights: {
        bestPromotion: bestOffer
          ? { name: bestOffer.name, visits: bestOffer.visits }
          : { name: 'None', visits: 0 },
        topPartner: {
          name: topPartnerName,
          visits: topPartnerVisits,
        },
      },
      recentVisits: recentVisits.map((v) => ({
        name: v.customer
          ? `${v.customer.firstName} ${v.customer.lastName}`
          : 'Guest User',
        time: v.createdAt,
        promo: v.catalogueOffer?.name || 'None',
      })),
    };
  }

  async getResults(branchId: string, range: '7days' | 'month' | 'year') {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    const startDate = new Date();
    let querySelect = '';
    let groupBy = '';
    let orderBy = '';

    if (range === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      querySelect = "TO_CHAR(visit.createdAt, 'Mon YYYY')";
      groupBy =
        "TO_CHAR(visit.createdAt, 'Mon YYYY'), DATE_TRUNC('month', visit.createdAt)";
      orderBy = "DATE_TRUNC('month', visit.createdAt)";
    } else if (range === 'month') {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      querySelect = "TO_CHAR(visit.createdAt, 'DD Mon')";
      groupBy =
        "TO_CHAR(visit.createdAt, 'DD Mon'), DATE_TRUNC('day', visit.createdAt)";
      orderBy = "DATE_TRUNC('day', visit.createdAt)";
    } else {
      // 7days
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      querySelect = "TO_CHAR(visit.createdAt, 'DY')";
      groupBy =
        "TO_CHAR(visit.createdAt, 'DY'), DATE_TRUNC('day', visit.createdAt)";
      orderBy = "DATE_TRUNC('day', visit.createdAt)";
    }

    // Chart timeline
    const timeline = await this.visitRepository
      .createQueryBuilder('visit')
      .select(querySelect, 'name')
      .addSelect(
        "COUNT(CASE WHEN visit.visitType = 'portal' THEN 1 END)",
        'views',
      )
      .addSelect(
        "COUNT(CASE WHEN visit.visitType = 'patronage' THEN 1 END)",
        'visits',
      )
      .where('visit.branchId = :branchId', { branchId })
      .andWhere('visit.createdAt >= :startDate', { startDate })
      .groupBy(groupBy)
      .orderBy(orderBy, 'ASC')
      .getRawMany();

    // Aggregates for KPIs
    const viewsResult = await this.offerRepository
      .createQueryBuilder('offer')
      .select('SUM(offer.views)', 'total')
      .where('offer.branchId = :branchId', { branchId })
      .getRawOne();
    const totalViews = parseInt(viewsResult?.total || '0', 10);

    const visitsCount = await this.visitRepository
      .createQueryBuilder('visit')
      .where('visit.branchId = :branchId', { branchId })
      .andWhere('visit.visitType = :visitType', { visitType: 'patronage' })
      .andWhere('visit.referredByBranchId IS NOT NULL')
      .getCount();

    const redeemedCount = await this.visitRepository
      .createQueryBuilder('visit')
      .where('visit.branchId = :branchId', { branchId })
      .andWhere('visit.visitType = :visitType', { visitType: 'patronage' })
      .andWhere('visit.catalogueOfferId IS NOT NULL')
      .getCount();

    const revenueResult = await this.visitRepository
      .createQueryBuilder('visit')
      .innerJoin(CatalogueOrder, 'order', 'order.id = visit.orderId')
      .select('SUM(order.totalAmount)', 'total')
      .where('visit.branchId = :branchId', { branchId })
      .andWhere('visit.visitType = :visitType', { visitType: 'patronage' })
      .andWhere('visit.referredByBranchId IS NOT NULL')
      .getRawOne();
    const totalRevenue = parseFloat(revenueResult?.total || '0');

    // Clicks/Interest estimation (e.g. portal visits that clicked an offer or checked-in)
    const clicksCount = await this.visitRepository
      .createQueryBuilder('visit')
      .where('visit.branchId = :branchId', { branchId })
      .andWhere('visit.catalogueOfferId IS NOT NULL')
      .getCount();

    return {
      stats: {
        peopleReached: totalViews,
        interested: clicksCount,
        visits: visitsCount,
        redeemed: redeemedCount,
        revenue: totalRevenue,
      },
      timeline: timeline.map((row) => ({
        name: row.name,
        views: parseInt(row.views || '0', 10),
        visits: parseInt(row.visits || '0', 10),
      })),
    };
  }

  async getSettings(branchId: string) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      select: [
        'id',
        'joinDiscoveryNetwork',
        'receivePartnerRequests',
        'allowPromotions',
        'pushNotifications',
        'smsAlerts',
        'emailSummary',
      ],
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }
    return branch;
  }

  async updateSettings(branchId: string, dto: UpdateDiscoverySettingsDto) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    // Explicitly whitelist allowed fields to prevent overwriting protected entity properties
    if (dto.joinDiscoveryNetwork !== undefined)
      branch.joinDiscoveryNetwork = dto.joinDiscoveryNetwork;
    if (dto.receivePartnerRequests !== undefined)
      branch.receivePartnerRequests = dto.receivePartnerRequests;
    if (dto.allowPromotions !== undefined)
      branch.allowPromotions = dto.allowPromotions;
    if (dto.pushNotifications !== undefined)
      branch.pushNotifications = dto.pushNotifications;
    if (dto.smsAlerts !== undefined) branch.smsAlerts = dto.smsAlerts;
    if (dto.emailSummary !== undefined) branch.emailSummary = dto.emailSummary;

    return this.branchRepository.save(branch);
  }

  async getPartners(branchId: string) {
    const partnerships = await this.partnershipRepository.find({
      where: [
        { initiatorBranchId: branchId, status: PartnershipStatus.ACCEPTED },
        { recipientBranchId: branchId, status: PartnershipStatus.ACCEPTED },
      ],
      relations: [
        'initiatorBranch',
        'initiatorBranch.business',
        'recipientBranch',
        'recipientBranch.business',
      ],
    });

    const partners = await Promise.all(
      partnerships.map(async (p) => {
        const isInitiator = p.initiatorBranchId === branchId;
        const partnerBranch = isInitiator
          ? p.recipientBranch
          : p.initiatorBranch;

        // Sent: referrals referred by this branch to partner
        const sentCount = await this.visitRepository.count({
          where: {
            branchId: partnerBranch.id,
            referredByBranchId: branchId,
            visitType: 'patronage',
          },
        });

        // Received: referrals referred by partner to this branch
        const receivedCount = await this.visitRepository.count({
          where: {
            branchId,
            referredByBranchId: partnerBranch.id,
            visitType: 'patronage',
          },
        });

        return {
          id: p.id,
          partnerBranchId: partnerBranch.id,
          name: partnerBranch.name,
          businessName: partnerBranch.business?.name || partnerBranch.name,
          type: partnerBranch.business?.categoryId || 'Retail',
          sent: sentCount,
          received: receivedCount,
        };
      }),
    );

    return partners;
  }

  async getCustomers(
    branchId: string,
    filter: 'all' | 'from_partners' | 'sent_to_partners' | 'direct',
    page: number,
    limit: number,
    cursor?: string,
  ) {
    const skip = (page - 1) * limit;

    const qb = this.visitRepository
      .createQueryBuilder('visit')
      .leftJoinAndSelect('visit.customer', 'customer')
      .leftJoinAndSelect('visit.referredByBranch', 'referredByBranch')
      .leftJoinAndSelect('visit.catalogueOffer', 'offer')
      .leftJoinAndSelect('visit.branch', 'branch');

    if (filter === 'from_partners') {
      qb.where('visit.branchId = :branchId', { branchId })
        .andWhere('visit.referredByBranchId IS NOT NULL')
        .andWhere('visit.referredByBranchId != :branchId', { branchId });
    } else if (filter === 'sent_to_partners') {
      qb.where('visit.referredByBranchId = :branchId', { branchId }).andWhere(
        'visit.branchId != :branchId',
      );
    } else if (filter === 'direct') {
      qb.where('visit.branchId = :branchId', { branchId }).andWhere(
        'visit.referredByBranchId IS NULL',
      );
    } else {
      qb.where(
        '(visit.branchId = :branchId OR visit.referredByBranchId = :branchId)',
        { branchId },
      );
    }

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'visit',
    });

    const data = result.data;
    const total = result.total;

    return {
      data: data.map((v) => {
        const isReferredByUs =
          v.referredByBranchId === branchId && v.branchId !== branchId;
        return {
          id: v.id,
          name: v.customer
            ? `${v.customer.firstName} ${v.customer.lastName}`
            : 'Guest User',
          phone: v.customer?.phone || '',
          email: v.customer?.email || '',
          origin: isReferredByUs
            ? `Sent To: ${v.branch?.name || 'Partner'}`
            : v.referredByBranchId
              ? `From Partner: ${v.referredByBranch?.name || 'Partner'}`
              : 'Direct Customer',
          date: v.createdAt,
          promo: v.catalogueOffer?.name || 'None',
          status: v.visitType === 'patronage' ? 'Purchased' : 'Visited',
        };
      }),
      total,
      page,
      limit,
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
    };
  }

  async submitRecommendation(branchId: string, dto: RecommendBusinessDto) {
    console.log(
      `[Discovery Recommendation] Branch ${branchId} recommended business:`,
      dto,
    );
    return {
      success: true,
      message: 'Recommendation submitted successfully',
      data: dto,
    };
  }

  async getAdminStats() {
    const now = new Date();

    const totalBusinesses = await this.businessRepository.count({
      where: { status: BusinessStatus.ACTIVE },
    });

    const activeOffers = await this.offerRepository.count({
      where: { status: CatalogueOfferStatus.ACTIVE },
    });

    const scheduledOffers = await this.offerRepository.count({
      where: {
        status: CatalogueOfferStatus.ACTIVE,
        startDate: MoreThan(now),
      },
    });

    const expiredOffers = await this.offerRepository.count({
      where: {
        endDate: LessThan(now),
      },
    });

    const viewsResult = await this.offerRepository
      .createQueryBuilder('offer')
      .select('SUM(offer.views)', 'total')
      .getRawOne();
    const totalOfferViews = parseInt(viewsResult?.total || '0', 10);

    const totalOfferClicks = await this.visitRepository.count({
      where: {
        catalogueOfferId: Not(IsNull()),
      },
    });

    const referralsGenerated = await this.visitRepository.count({
      where: {
        referredByBranchId: Not(IsNull()),
      },
    });

    const referralsCompleted = await this.visitRepository.count({
      where: {
        referredByBranchId: Not(IsNull()),
        visitType: 'patronage',
      },
    });

    const couponsRedeemed = await this.visitRepository.count({
      where: {
        catalogueOfferId: Not(IsNull()),
        visitType: 'patronage',
      },
    });

    const attributedSales = await this.visitRepository.count({
      where: {
        referredByBranchId: Not(IsNull()),
        visitType: 'patronage',
        orderId: Not(IsNull()),
      },
    });

    const revenueResult = await this.visitRepository
      .createQueryBuilder('visit')
      .innerJoin(CatalogueOrder, 'order', 'order.id = visit.orderId')
      .select('SUM(order.totalAmount)', 'total')
      .where('visit.referredByBranchId IS NOT NULL')
      .andWhere("visit.visitType = 'patronage'")
      .getRawOne();
    const attributedRevenue = parseFloat(revenueResult?.total || '0');

    const activePartnerships = await this.partnershipRepository.count({
      where: {
        status: PartnershipStatus.ACCEPTED,
      },
    });

    const notificationsSent = await this.notificationRepository.count();

    const avgConversionRate =
      totalOfferViews > 0
        ? parseFloat(((referralsCompleted / totalOfferViews) * 100).toFixed(2))
        : 0;

    return {
      totalBusinesses,
      activeOffers,
      scheduledOffers,
      expiredOffers,
      totalOfferViews,
      totalOfferClicks,
      referralsGenerated,
      referralsCompleted,
      couponsRedeemed,
      attributedSales,
      attributedRevenue,
      sponsoredRevenue: 0,
      activePartnerships,
      notificationsSent,
      avgConversionRate,
    };
  }

  async getAdminBusinesses(query: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const search = query.search || '';

    const qb = this.businessRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.category', 'category')
      .leftJoinAndSelect('business.branches', 'branches')
      .orderBy('business.createdAt', 'DESC');

    if (search) {
      qb.andWhere('business.name ILIKE :search', { search: `%${search}%` });
    }

    const [businesses, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = await Promise.all(
      businesses.map(async (business) => {
        // 1. Get active plan
        const sub = await this.subscriptionRepository.findOne({
          where: {
            businessId: business.id,
            status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
          },
          relations: ['plan'],
          order: { createdAt: 'DESC' },
        });
        const plan = sub?.plan?.name || 'Free';

        // 2. Main branch location
        const mainBranch =
          business.branches?.find((b) => b.isMainBranch) ||
          business.branches?.[0];
        const location = mainBranch
          ? mainBranch.city || mainBranch.state || 'N/A'
          : 'N/A';

        // 3. Active offers count
        const branchIds = business.branches?.map((b) => b.id) || [];
        let activeOffers = 0;
        if (branchIds.length > 0) {
          activeOffers = await this.offerRepository.count({
            where: {
              branchId: In(branchIds),
              status: CatalogueOfferStatus.ACTIVE,
            },
          });
        }

        // 4. Referrals Sent (visits referred by this business's branches to other branches)
        let referralsSent = 0;
        if (branchIds.length > 0) {
          referralsSent = await this.visitRepository.count({
            where: {
              referredByBranchId: In(branchIds),
            },
          });
        }

        // 5. Referrals Received (visits referred to this business's branches by others)
        let referralsReceived = 0;
        if (branchIds.length > 0) {
          referralsReceived = await this.visitRepository.count({
            where: {
              branchId: In(branchIds),
              referredByBranchId: Not(IsNull()),
            },
          });
        }

        // 6. Revenue Generated (revenue generated from referrals received)
        let revenueGenerated = 0;
        if (branchIds.length > 0) {
          const revenueResult = await this.visitRepository
            .createQueryBuilder('visit')
            .innerJoin(CatalogueOrder, 'order', 'order.id = visit.orderId')
            .select('SUM(order.totalAmount)', 'total')
            .where('visit.branchId IN (:...branchIds)', { branchIds })
            .andWhere('visit.referredByBranchId IS NOT NULL')
            .andWhere("visit.visitType = 'patronage'")
            .getRawOne();
          revenueGenerated = parseFloat(revenueResult?.total || '0');
        }

        return {
          id: business.id,
          name: business.name,
          category: business.category?.name || 'N/A',
          plan,
          location,
          status: business.status,
          activeOffers,
          referralsSent,
          referralsReceived,
          revenueGenerated,
          dateJoined: business.createdAt,
        };
      }),
    );

    return {
      data,
      meta: {
        total,
      },
    };
  }

  async getAdminBusinessDetail(id: string) {
    const business = await this.businessRepository.findOne({
      where: { id },
      relations: ['category', 'branches'],
    });
    if (!business)
      throw new NotFoundException(`Business with ID ${id} not found`);

    const branchIds = business.branches?.map((b) => b.id) || [];
    const offersCount =
      branchIds.length > 0
        ? await this.offerRepository.count({
            where: { branchId: In(branchIds) },
          })
        : 0;
    const referralsSent =
      branchIds.length > 0
        ? await this.visitRepository.count({
            where: { referredByBranchId: In(branchIds) },
          })
        : 0;
    const referralsReceived =
      branchIds.length > 0
        ? await this.visitRepository.count({
            where: {
              branchId: In(branchIds),
              referredByBranchId: Not(IsNull()),
            },
          })
        : 0;

    let revenueGenerated = 0;
    if (branchIds.length > 0) {
      const revenueResult = await this.visitRepository
        .createQueryBuilder('visit')
        .innerJoin(CatalogueOrder, 'order', 'order.id = visit.orderId')
        .select('SUM(order.totalAmount)', 'total')
        .where('visit.branchId IN (:...branchIds)', { branchIds })
        .andWhere('visit.referredByBranchId IS NOT NULL')
        .andWhere("visit.visitType = 'patronage'")
        .getRawOne();
      revenueGenerated = parseFloat(revenueResult?.total || '0');
    }

    return {
      id: business.id,
      name: business.name,
      category: business.category?.name || 'N/A',
      status: business.status,
      location: business.branches?.[0]?.city || 'N/A',
      activeOffers: offersCount,
      referralsSent,
      referralsReceived,
      revenueGenerated,
      dateJoined: business.createdAt,
      branches:
        business.branches?.map((b) => ({
          id: b.id,
          name: b.name,
          city: b.city,
          state: b.state,
        })) || [],
    };
  }

  async getAdminOffers(query: AdminOfferQueryDto) {
    const { page = 1, limit = 10, search, status, category } = query;
    const qb = this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.business', 'business')
      .leftJoinAndSelect('offer.branch', 'branch')
      .orderBy('offer.createdAt', 'DESC');

    if (search) {
      qb.andWhere('(offer.name ILIKE :search OR business.name ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    if (status) {
      qb.andWhere('offer.status = :status', { status });
    }

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor: (query as any)?.cursor || (query as any)?.nextCursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'offer',
    });

    const offers = result.data;
    const total = result.total;

    return {
      data: offers.map((o) => ({
        id: o.id,
        name: o.name,
        business: o.business?.name || 'Unknown',
        businessId: o.businessId,
        category: o.offerType || 'N/A',
        status: o.status,
        startDate: o.startDate?.toISOString()?.split('T')[0] || '',
        endDate: o.endDate?.toISOString()?.split('T')[0] || '',
        views: o.views,
        clicks: o.views > 0 ? Math.round(o.views * 0.36) : 0,
        visits: o.visits,
        revenue: o.revenue,
      })),
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
      meta: { total, page, limit },
    };
  }

  async getAdminOfferDetail(id: string) {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ['business', 'branch'],
    });
    if (!offer) throw new NotFoundException(`Offer with ID ${id} not found`);

    const views = offer.views;
    const clicks = views > 0 ? Math.round(views * 0.36) : 0;
    const visits = offer.visits;
    const ctr = views > 0 ? `${((clicks / views) * 100).toFixed(1)}%` : '0%';
    const conversion =
      clicks > 0 ? `${((visits / clicks) * 100).toFixed(1)}%` : '0%';

    const topReferralRows = await this.visitRepository
      .createQueryBuilder('visit')
      .select('referrer.name', 'name')
      .addSelect('COUNT(DISTINCT visit.id)', 'count')
      .leftJoin('visit.referredByBranch', 'referrer')
      .where('visit.catalogueOfferId = :id', { id })
      .andWhere('visit.referredByBranchId IS NOT NULL')
      .groupBy('referrer.name')
      .orderBy('"count"', 'DESC')
      .limit(5)
      .getRawMany();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentReferrals = await this.visitRepository
      .createQueryBuilder('visit')
      .select('referrer.name', 'name')
      .addSelect(
        'SUM(CASE WHEN visit.createdAt >= :sevenDaysAgo THEN 1 ELSE 0 END)',
        'recentCount',
      )
      .addSelect(
        'SUM(CASE WHEN visit.createdAt >= :fourteenDaysAgo AND visit.createdAt < :sevenDaysAgo THEN 1 ELSE 0 END)',
        'priorCount',
      )
      .leftJoin('visit.referredByBranch', 'referrer')
      .where('visit.catalogueOfferId = :id', { id })
      .andWhere('visit.referredByBranchId IS NOT NULL')
      .groupBy('referrer.name')
      .setParameters({ id, sevenDaysAgo, fourteenDaysAgo })
      .getRawMany();

    const referralStatsMap = new Map<
      string,
      { recentCount: number; priorCount: number }
    >();
    for (const row of recentReferrals) {
      const name = row.name || 'Direct';
      referralStatsMap.set(name, {
        recentCount: parseInt(row.recentCount || '0', 10),
        priorCount: parseInt(row.priorCount || '0', 10),
      });
    }

    const radius = offer.deliveryRadius
      ? `${offer.deliveryRadius}${offer.deliveryUnit || 'km'}`
      : offer.deliveryScope
        ? offer.deliveryScope
        : '500m';

    const minSpend =
      offer.minOrderAmount != null
        ? Number(offer.minOrderAmount)
        : Number(offer.calculatedPrice || offer.fixedPrice || 0);

    return {
      id: offer.id,
      name: offer.name,
      business: offer.business?.name || 'Unknown',
      businessId: offer.businessId,
      category: offer.offerType || 'N/A',
      status: offer.status,
      startDate: offer.startDate?.toISOString()?.split('T')[0] || '',
      endDate: offer.endDate?.toISOString()?.split('T')[0] || '',
      views,
      clicks,
      visits,
      revenue: offer.revenue,
      radius,
      minSpend,
      ctr,
      conversion,
      topReferralSources: topReferralRows.map((r) => {
        const name = r.name || 'Direct';
        const count = parseInt(r.count || '0', 10);
        const stats = referralStatsMap.get(name);
        let growth = '+0%';
        if (stats && stats.priorCount > 0) {
          const diff =
            ((stats.recentCount - stats.priorCount) / stats.priorCount) * 100;
          growth = diff >= 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`;
        } else if (stats && stats.recentCount > 0) {
          growth = '+100%';
        }
        return {
          name,
          count,
          growth,
        };
      }),
    };
  }

  async getAdminReferrals(query: AdminReferralQueryDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.visitRepository
      .createQueryBuilder('visit')
      .leftJoinAndSelect('visit.customer', 'customer')
      .leftJoinAndSelect('visit.referredByBranch', 'referredByBranch')
      .leftJoinAndSelect('visit.branch', 'branch')
      .leftJoinAndSelect('visit.catalogueOffer', 'offer')
      .where('visit.referredByBranchId IS NOT NULL')
      .orderBy('visit.createdAt', 'DESC');

    if (search) {
      qb.andWhere(
        '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR referredByBranch.name ILIKE :search OR branch.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor: (query as any)?.cursor || (query as any)?.nextCursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'visit',
    });

    const visits = result.data;
    const total = result.total;

    return {
      data: visits.map((v) => ({
        id: v.id?.substring(0, 10) || v.id,
        customer: v.customer
          ? `${v.customer.firstName} ${v.customer.lastName}`
          : 'Guest',
        source: v.referredByBranch?.name || 'Unknown',
        target: v.branch?.name || 'Unknown',
        offer: v.catalogueOffer?.name || 'Direct Visit',
        status: v.visitType === 'patronage' ? 'Purchased' : 'Visited',
        revenue: 0,
        date:
          v.createdAt?.toISOString()?.replace('T', ' ')?.substring(0, 16) || '',
      })),
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
      meta: { total, page, limit },
    };
  }

  async getAdminReferralInvestigation(id: string) {
    const referral = await this.visitRepository.findOne({
      where: { id },
      relations: ['customer', 'referredByBranch', 'branch', 'catalogueOffer'],
    });
    if (!referral)
      throw new NotFoundException(`Referral with ID ${id} not found`);

    const customerName = referral.customer
      ? `${referral.customer.firstName} ${referral.customer.lastName}`
      : 'Unknown Customer';

    return {
      id: referral.id?.substring(0, 10) || id,
      status: 'Flagged',
      confidence: '94%',
      reason: 'Velocity Spiking & Device ID Conflict',
      customer: {
        name: customerName,
        id: referral.customerId?.substring(0, 10) || 'N/A',
        history: '2 prior flags',
      },
      referral: {
        id: referral.id?.substring(0, 10) || id,
        source: referral.referredByBranch?.name || 'Unknown',
        target: referral.branch?.name || 'Unknown',
        timestamp:
          referral.createdAt
            ?.toISOString()
            ?.replace('T', ' ')
            ?.substring(0, 19) || '',
        offer: referral.catalogueOffer?.name || 'Direct Visit',
      },
      evidence: [
        {
          label: 'Device fingerprint',
          val: 'DV-9921-X',
          conflict: true,
          note: 'Matches source business owner device',
        },
        {
          label: 'IP Address',
          val: referral.ipAddress || '192.168.1.45',
          conflict: false,
          note: 'Local Abuja residential',
        },
        {
          label: 'Time to Redeem',
          val: '12 seconds',
          conflict: true,
          note: 'Humanly impossible travel time between locations',
        },
        {
          label: 'Wallet Signature',
          val: '0x71C...88F',
          conflict: false,
          note: 'Verified user wallet',
        },
      ],
    };
  }

  async getAdminPartnerships(query: AdminPartnershipQueryDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [partnerships, total] = await this.partnershipRepository.findAndCount(
      {
        where,
        relations: [
          'initiatorBranch',
          'initiatorBranch.business',
          'recipientBranch',
          'recipientBranch.business',
        ],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      },
    );

    return {
      data: await Promise.all(
        partnerships.map(async (p) => {
          return {
            id: p.id?.substring(0, 8) || p.id,
            businessA:
              p.initiatorBranch?.business?.name ||
              p.initiatorBranch?.name ||
              'Unknown',
            businessB:
              p.recipientBranch?.business?.name ||
              p.recipientBranch?.name ||
              'Unknown',
            status: p.status,
            customersShared: 0,
            revenueGenerated: 0,
            dateCreated: p.createdAt?.toISOString()?.split('T')[0] || '',
          };
        }),
      ),
      meta: { total, page, limit },
    };
  }

  async getAdminSponsoredCampaigns(query: AdminSponsoredQueryDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [campaigns, total] =
      await this.sponsoredCampaignRepository.findAndCount({
        where,
        relations: ['business'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

    return {
      data: campaigns.map((c) => ({
        id: c.id,
        business: c.business?.name || 'Unknown',
        name: c.name,
        radius: c.radius || '1km',
        budget: c.budget,
        spent: c.spent,
        duration: c.duration || '30 Days',
        status: c.status,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
      })),
      meta: { total, page, limit },
    };
  }

  async getAdminSponsoredCampaignDetail(id: string) {
    const campaign = await this.sponsoredCampaignRepository.findOne({
      where: { id },
      relations: ['business'],
    });
    if (!campaign)
      throw new NotFoundException(`Campaign with ID ${id} not found`);

    const ctr =
      campaign.impressions > 0
        ? `${((campaign.clicks / campaign.impressions) * 100).toFixed(1)}%`
        : '0%';
    const cpc =
      campaign.clicks > 0
        ? `₦${(campaign.spent / campaign.clicks).toFixed(2)}`
        : '₦0';

    const transactions = await this.campaignTransactionRepository.find({
      where: { campaignId: id },
      order: { date: 'DESC' },
    });

    return {
      id: campaign.id,
      business: campaign.business?.name || 'Unknown',
      name: campaign.name,
      radius: campaign.radius || '1km',
      budget: campaign.budget,
      spent: campaign.spent,
      duration: campaign.duration || '30 Days',
      status: campaign.status,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      startDate: campaign.startDate?.toISOString()?.split('T')[0] || '',
      endDate: campaign.endDate?.toISOString()?.split('T')[0] || '',
      ctr,
      cpc,
      transactions: transactions.map((t) => ({
        invoiceNo: t.invoiceNo || `INV-C-${t.id.substring(0, 4)}`,
        date: t.date?.toISOString()?.split('T')[0] || '',
        type: t.type || 'Budget Allocation',
        amount: t.amount,
        status: t.status,
      })),
      auditLog: [
        {
          action: 'Campaign Approved',
          admin: 'Admin',
          time: campaign.createdAt?.toISOString() || '',
          detail: 'Initial activation',
        },
      ],
    };
  }

  async getAdminBilling(query: AdminBillingQueryDto) {
    const { page = 1, limit = 10, status, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [invoices, total] = await this.invoiceRepository.findAndCount({
      where,
      relations: ['business'],
      order: { date: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: invoices.map((inv) => ({
        id: inv.id,
        business: inv.business?.name || 'Unknown',
        amount: inv.total,
        type: inv.type || 'Network Subscription',
        method: inv.method || 'Wallet',
        status: inv.status,
        date:
          inv.date?.toISOString()?.replace('T', ' ')?.substring(0, 16) || '',
      })),
      meta: { total, page, limit },
    };
  }

  async getAdminBillingDetail(id: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['business', 'items'],
    });
    if (!invoice)
      throw new NotFoundException(`Invoice with ID ${id} not found`);

    return {
      id: invoice.id,
      business: invoice.business?.name || 'Unknown',
      amount: invoice.total,
      type: invoice.type || 'Campaign Budget Allocation',
      method: invoice.method || 'VemTap Wallet',
      status: invoice.status,
      date:
        invoice.date?.toISOString()?.replace('T', ' ')?.substring(0, 16) || '',
      description: invoice.description || '',
      items: (invoice.items || []).map((item) => ({
        desc: item.description,
        qty: item.qty,
        price: item.unitPrice,
      })),
      tax: invoice.tax,
      total: invoice.total,
    };
  }

  async getAdminAttribution() {
    const totalReferralVisits = await this.visitRepository.count({
      where: { referredByBranchId: Not(IsNull()) },
    });

    const purchasedVisits = await this.visitRepository.count({
      where: {
        referredByBranchId: Not(IsNull()),
        visitType: 'patronage',
        orderId: Not(IsNull()),
      },
    });

    const topPaths = await this.visitRepository
      .createQueryBuilder('visit')
      .select('COUNT(visit.id)', 'count')
      .addSelect('visit.referredByBranchId', 'sourceId')
      .addSelect('visit.branchId', 'targetId')
      .where('visit.referredByBranchId IS NOT NULL')
      .groupBy('visit.referredByBranchId')
      .addGroupBy('visit.branchId')
      .orderBy('count', 'DESC')
      .limit(3)
      .getRawMany();

    const paths = await Promise.all(
      topPaths.map(async (row) => {
        const source = await this.branchRepository.findOne({
          where: { id: row.sourceId },
          relations: ['business'],
        });
        const target = await this.branchRepository.findOne({
          where: { id: row.targetId },
          relations: ['business'],
        });
        return {
          from: source?.business?.name || source?.name || 'Unknown',
          to: target?.business?.name || target?.name || 'Unknown',
          flow: parseInt(row.count, 10),
          conversion: '12%',
          revenue: `₦${(parseInt(row.count, 10) * 1500).toLocaleString()}`,
        };
      }),
    );

    const revenueResult = await this.visitRepository
      .createQueryBuilder('visit')
      .innerJoin(CatalogueOrder, 'order', 'order.id = visit.orderId')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
      .where('visit.referredByBranchId IS NOT NULL')
      .andWhere("visit.visitType = 'patronage'")
      .getRawOne();
    const attributedRevenue = parseFloat(revenueResult?.total || '0');

    return {
      paths:
        paths.length > 0
          ? paths
          : [
              {
                from: 'Fashion Hub',
                to: 'The Grill House',
                flow: 45,
                conversion: '12%',
                revenue: '₦650k',
              },
              {
                from: 'Supermarket Plus',
                to: 'Sharp Cuts Barbershop',
                flow: 38,
                conversion: '8%',
                revenue: '₦120k',
              },
              {
                from: 'The Grill House',
                to: 'Juice Paradise',
                flow: 32,
                conversion: '15%',
                revenue: '₦85k',
              },
            ],
      window: 24,
      metrics: {
        attributedVisits: totalReferralVisits,
        attributedPurchases: purchasedVisits,
        attributedRevenue: `₦${attributedRevenue.toLocaleString()}`,
        avgAttributionTime: '18m',
      },
    };
  }

  async getAdminCustomers(query: AdminCustomerQueryDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CUSTOMER });

    if (search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (status) {
      qb.andWhere('user.status = :status', { status });
    }

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor: (query as any)?.cursor || (query as any)?.nextCursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'user',
    });

    const users = result.data;
    const total = result.total;

    return {
      data: users.map((u) => ({
        id: u.id?.substring(0, 10) || u.id,
        name: `${u.firstName} ${u.lastName}`,
        location: 'Abuja, Nigeria',
        status: u.status || 'Active',
        totalReferrals: 0,
        redeemedOffers: 0,
        lastActive:
          u.updatedAt?.toISOString()?.replace('T', ' ')?.substring(0, 16) || '',
        preferences: [],
      })),
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
      meta: { total, page, limit },
    };
  }

  async getAdminCustomerDetail(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Customer with ID ${id} not found`);

    const recentVisits = await this.visitRepository.find({
      where: { customerId: id },
      relations: ['branch', 'catalogueOffer'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      id: user.id?.substring(0, 10) || id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone || '+234 800 000 0000',
      location: 'Abuja, Nigeria',
      optInDate: user.createdAt?.toISOString()?.split('T')[0] || '',
      status: user.status || 'Active',
      totalReferrals: 0,
      redeemedOffers: 0,
      lastActive:
        user.updatedAt?.toISOString()?.replace('T', ' ')?.substring(0, 16) ||
        '',
      preferences: [],
      stats: {
        totalVisits: recentVisits.length,
        offersReceived: 0,
        offersRedeemed: 0,
        totalReferrals: 0,
        totalSpend: 0,
      },
      activityTimeline: recentVisits.map((v) => ({
        action: v.visitType === 'patronage' ? 'Purchased at' : 'Visited',
        via: v.branch?.name || 'Unknown',
        time:
          v.createdAt?.toISOString()?.replace('T', ' ')?.substring(0, 16) || '',
        val: null,
      })),
    };
  }

  async getAdminLocations(query: AdminLocationQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.branchRepository
      .createQueryBuilder('branch')
      .select('branch.city', 'name')
      .addSelect('COUNT(DISTINCT branch.businessId)', 'businesses')
      .addSelect('COUNT(DISTINCT offer.id)', 'offers')
      .addSelect(
        'COUNT(DISTINCT visit.id) FILTER (WHERE visit.referredByBranchId IS NOT NULL)',
        'referrals',
      )
      .leftJoin('branch.visits', 'visit')
      .leftJoin(CatalogueOffer, 'offer', 'offer.branchId = branch.id')
      .where('branch.city IS NOT NULL')
      .andWhere("branch.city != ''")
      .groupBy('branch.city')
      .orderBy('"referrals"', 'DESC');

    if (search) {
      qb.andWhere('branch.city ILIKE :search', { search: `%${search}%` });
    }

    const total = await qb.getCount();
    const paged = await qb.skip(skip).take(limit).getRawMany();

    const revenueByCity: Record<string, number> = {};
    const cities = paged.map((r) => r.name).filter(Boolean);
    if (cities.length > 0) {
      const revenueRows = await this.visitRepository
        .createQueryBuilder('visit')
        .select('branch.city', 'city')
        .addSelect('COALESCE(SUM("order"."totalAmount"), 0)', 'revenue')
        .innerJoin('visit.branch', 'branch')
        .innerJoin(CatalogueOrder, 'order', 'order.id = visit.orderId')
        .where('branch.city IN (:...cities)', { cities })
        .andWhere('visit.referredByBranchId IS NOT NULL')
        .andWhere("visit.visitType = 'patronage'")
        .groupBy('branch.city')
        .getRawMany();
      for (const row of revenueRows) {
        revenueByCity[row.city] = parseFloat(row.revenue || '0');
      }
    }

    return {
      data: paged.map((r, i) => ({
        id: String(i + 1),
        name: r.name,
        businesses: parseInt(r.businesses || '0', 10),
        offers: parseInt(r.offers || '0', 10),
        referrals: parseInt(r.referrals || '0', 10),
        revenue: revenueByCity[r.name] || 0,
        growth: '0%',
      })),
      meta: { total, page, limit },
    };
  }

  async getAdminLocationDetail(id: string) {
    const locations = await this.getAdminLocations({ page: 1, limit: 100 });
    const location = locations.data.find((l) => l.id === id);
    if (!location)
      throw new NotFoundException(`Location with ID ${id} not found`);

    return {
      ...location,
      city: location.name,
      density: '12.4 biz/km²',
      conversionRate: '14.2%',
    };
  }

  async getAdminCategories(query: AdminCategoryQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.businessRepository
      .createQueryBuilder('business')
      .select("COALESCE(business.categoryId, 'uncategorized')", 'categoryId')
      .addSelect('COUNT(DISTINCT business.id)', 'businessCount')
      .addSelect('COUNT(DISTINCT offer.id)', 'offerCount')
      .leftJoin(CatalogueOffer, 'offer', 'offer.businessId = business.id')
      .groupBy('business.categoryId')
      .orderBy('"offerCount"', 'DESC');

    if (search) {
      qb.andWhere('business.categoryId ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const totalResult = await qb
      .clone()
      .select('COUNT(DISTINCT business.categoryId)', 'total')
      .getRawOne();
    const total = parseInt(totalResult?.total || '0', 10);
    const categories = await qb.skip(skip).take(limit).getRawMany();

    const categoryIds = categories
      .map((c) => c.categoryId)
      .filter((id) => id !== 'uncategorized');

    const referralsByCategory: Record<string, number> = {};
    const revenueByCategory: Record<string, number> = {};
    if (categoryIds.length > 0) {
      const refRows = await this.visitRepository
        .createQueryBuilder('visit')
        .select('business.categoryId', 'categoryId')
        .addSelect('COUNT(DISTINCT visit.id)', 'referrals')
        .innerJoin('visit.branch', 'branch')
        .innerJoin('branch.business', 'business')
        .where('business.categoryId IN (:...categoryIds)', { categoryIds })
        .andWhere('visit.referredByBranchId IS NOT NULL')
        .groupBy('business.categoryId')
        .getRawMany();
      for (const row of refRows) {
        referralsByCategory[row.categoryId] = parseInt(
          row.referrals || '0',
          10,
        );
      }

      const revRows = await this.visitRepository
        .createQueryBuilder('visit')
        .select('business.categoryId', 'categoryId')
        .addSelect('COALESCE(SUM("order"."totalAmount"), 0)', 'revenue')
        .innerJoin('visit.branch', 'branch')
        .innerJoin('branch.business', 'business')
        .innerJoin(CatalogueOrder, 'order', 'order.id = visit.orderId')
        .where('business.categoryId IN (:...categoryIds)', { categoryIds })
        .andWhere('visit.referredByBranchId IS NOT NULL')
        .andWhere("visit.visitType = 'patronage'")
        .groupBy('business.categoryId')
        .getRawMany();
      for (const row of revRows) {
        revenueByCategory[row.categoryId] = parseFloat(row.revenue || '0');
      }
    }

    return {
      data: categories.map((c) => ({
        id: c.categoryId === 'uncategorized' ? '0' : c.categoryId,
        name: c.categoryId === 'uncategorized' ? 'Other' : c.categoryId,
        referrals: referralsByCategory[c.categoryId] || 0,
        conversion:
          referralsByCategory[c.categoryId] &&
          parseInt(c.businessCount || '0', 10) > 0
            ? `${((referralsByCategory[c.categoryId] / parseInt(c.businessCount || '1', 10)) * 100).toFixed(1)}%`
            : '0%',
        revenue: revenueByCategory[c.categoryId] || 0,
        topOffer: 'Featured Promotion',
      })),
      meta: { total, page, limit },
    };
  }

  async getAdminCategoryDetail(id: string) {
    const result = await this.businessRepository
      .createQueryBuilder('business')
      .select('COUNT(DISTINCT business.id)', 'businessCount')
      .addSelect('COUNT(DISTINCT offer.id)', 'offerCount')
      .leftJoin(CatalogueOffer, 'offer', 'offer.businessId = business.id')
      .where('business.categoryId = :id', { id })
      .getRawOne();

    if (!result || parseInt(result.businessCount || '0', 10) === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const businessCount = parseInt(result.businessCount || '0', 10);
    const offerCount = parseInt(result.offerCount || '0', 10);

    let categoryReferrals = 0;
    let categoryRevenue = 0;
    const refResult = await this.visitRepository
      .createQueryBuilder('visit')
      .select('COUNT(DISTINCT visit.id)', 'referrals')
      .addSelect('COALESCE(SUM("order"."totalAmount"), 0)', 'revenue')
      .innerJoin('visit.branch', 'branch')
      .innerJoin('branch.business', 'business')
      .leftJoin(CatalogueOrder, 'order', 'order.id = visit.orderId')
      .where('business.categoryId = :id', { id })
      .andWhere('visit.referredByBranchId IS NOT NULL')
      .getRawOne();
    categoryReferrals = parseInt(refResult?.referrals || '0', 10);
    categoryRevenue = parseFloat(refResult?.revenue || '0');

    return {
      id,
      name: id,
      referrals: categoryReferrals,
      conversion:
        businessCount > 0
          ? `${((categoryReferrals / businessCount) * 100).toFixed(1)}%`
          : '0%',
      revenue: categoryRevenue,
      topOffer: 'Featured Promotion',
      totalBusinesses: businessCount,
      activeOffers: offerCount,
      avgTicketSize:
        categoryReferrals > 0
          ? `₦${(categoryRevenue / categoryReferrals).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
          : '₦0',
      penetration:
        businessCount > 0
          ? `${((offerCount / businessCount) * 100).toFixed(1)}%`
          : '0%',
    };
  }

  async getAdminCategoryTypes(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [types, total] = await this.categoryTypeRepository.findAndCount({
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data: types.map((t) => ({
        id: t.id,
        name: t.name,
        desc: t.description || '',
        count: t.offerCount,
        status: t.status,
      })),
      meta: { total, page, limit },
    };
  }

  async createAdminCategoryType(dto: CreateCategoryTypeDto) {
    const type = this.categoryTypeRepository.create(dto);
    return this.categoryTypeRepository.save(type);
  }

  async updateAdminCategoryType(id: string, dto: UpdateCategoryTypeDto) {
    const type = await this.categoryTypeRepository.findOne({ where: { id } });
    if (!type)
      throw new NotFoundException(`Category type with ID ${id} not found`);
    Object.assign(type, dto);
    return this.categoryTypeRepository.save(type);
  }

  async deleteAdminCategoryType(id: string) {
    const type = await this.categoryTypeRepository.findOne({ where: { id } });
    if (!type)
      throw new NotFoundException(`Category type with ID ${id} not found`);
    await this.categoryTypeRepository.softDelete(id);
    return { success: true };
  }

  async getAdminFraudAlerts(query: AdminFraudQueryDto) {
    const { page = 1, limit = 10, status, severity } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [alerts, total] = await this.fraudAlertRepository.findAndCount({
      where,
      relations: ['business', 'customer'],
      order: { timestamp: 'DESC' },
      skip,
      take: limit,
    });

    const activeAlerts = await this.fraudAlertRepository.count({
      where: { status: FraudAlertStatus.FLAGGED },
    });

    const fraudPreventedResult = await this.fraudAlertRepository
      .createQueryBuilder('alert')
      .select('COUNT(alert.id)', 'count')
      .where('alert.status = :status', { status: FraudAlertStatus.RESOLVED })
      .getRawOne();

    return {
      securityScore: alerts.length > 0 ? '98.2' : '100',
      activeAlerts,
      fraudPrevented: `₦${(parseInt(fraudPreventedResult?.count || '0', 10) * 15000).toLocaleString()}`,
      suspiciousUsers: activeAlerts,
      alerts: alerts.map((a) => ({
        id: a.id?.substring(0, 8) || a.id,
        type: a.type,
        business: a.business?.name || 'Unknown',
        customer: a.customer
          ? `${a.customer.firstName} ${a.customer.lastName}`
          : 'Unknown',
        severity: a.severity,
        confidence: `${a.confidence}%`,
        status: a.status,
        date:
          a.timestamp?.toISOString()?.replace('T', ' ')?.substring(0, 16) || '',
        reason: a.reason || 'Suspicious activity detected',
      })),
    };
  }

  async getAdminNotifications(query: AdminNotificationQueryDto) {
    const { page = 1, limit = 10, channel } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (channel) where.channel = channel;

    const [logs, total] = await this.notificationLogRepository.findAndCount({
      where,
      order: { sentAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: logs.map((l) => ({
        id: l.id,
        recipient: l.recipientName || l.recipientId || 'Unknown',
        business: l.businessId || 'System',
        channel: l.channel,
        status: l.status,
        openStatus: l.openStatus,
        date:
          l.sentAt?.toISOString()?.replace('T', ' ')?.substring(0, 16) || '',
        content: l.content || '',
      })),
      meta: { total, page, limit },
    };
  }

  async getAdminReports(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reports, total] = await this.reportRepository.findAndCount({
      relations: ['generatedBy'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: reports.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type || 'Full Summary',
        date: r.createdAt?.toISOString()?.split('T')[0] || '',
        status: r.status,
        size: r.fileSize || '—',
      })),
      meta: { total, page, limit },
    };
  }

  async generateAdminReport(dto: GenerateReportDto, adminId: string) {
    const report = this.reportRepository.create({
      name: dto.name,
      type: dto.type,
      dateRange: dto.dateRange,
      status: ReportStatus.PROCESSING,
      generatedBy: { id: adminId } as User,
    });
    const saved = await this.reportRepository.save(report);
    return saved;
  }

  async getAdminAuditLogs(query: AdminAuditLogQueryDto) {
    const { page = 1, limit = 10, search, date } = query;
    const skip = (page - 1) * limit;

    const qb = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.actor', 'actor')
      .orderBy('log.createdAt', 'DESC');

    if (search) {
      qb.andWhere(
        '(actor.firstName ILIKE :search OR actor.lastName ILIKE :search OR log.endpoint ILIKE :search OR log.module ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (date) {
      const dateStart = new Date(date);
      const dateEnd = new Date(date);
      dateEnd.setDate(dateEnd.getDate() + 1);
      qb.andWhere('log.createdAt BETWEEN :start AND :end', {
        start: dateStart,
        end: dateEnd,
      });
    }

    const [logs, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: logs.map((l) => ({
        id: l.id?.substring(0, 8) || l.id,
        admin: l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : 'System',
        action: l.method,
        target: l.endpoint,
        business: l.businessId || 'N/A',
        status: l.statusCode && l.statusCode < 400 ? 'Success' : 'Warning',
        date:
          l.createdAt?.toISOString()?.replace('T', ' ')?.substring(0, 16) || '',
        ip: l.ipAddress || 'Internal',
      })),
      meta: { total, page, limit },
    };
  }

  async getAdminAuditLogDetail(id: string) {
    const log = await this.auditLogRepository.findOne({
      where: { id },
      relations: ['actor'],
    });
    if (!log) throw new NotFoundException(`Audit log with ID ${id} not found`);

    return {
      id: log.id?.substring(0, 8) || id,
      admin: log.actor
        ? `${log.actor.firstName} ${log.actor.lastName}`
        : 'System',
      action: log.method,
      target: log.endpoint,
      business: log.businessId || 'N/A',
      status: log.statusCode && log.statusCode < 400 ? 'Success' : 'Warning',
      date:
        log.createdAt?.toISOString()?.replace('T', ' ')?.substring(0, 16) || '',
      ip: log.ipAddress || 'Internal',
      module: log.module || 'N/A',
      device: log.userAgent || 'Unknown',
      changes: {
        before: log.payload || { status: 'N/A' },
        after: { status: 'Updated' },
      },
    };
  }

  async getAdminDiscoverySettings() {
    const defaults = {
      enableNetwork: true,
      enableSponsored: true,
      enablePartnerships: true,
      maxOffersPerVisit: 3,
      maxOffersPerDay: 5,
      defaultRadius: 500,
      maxRadius: 2000,
      attributionWindow: 24,
      pushEnabled: true,
      smsEnabled: false,
      emailEnabled: true,
      approvalRequired: true,
    };

    const settings = await this.settingRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });
    if (!settings) {
      return defaults;
    }

    return {
      enableNetwork: settings.discoveryEnableNetwork ?? defaults.enableNetwork,
      enableSponsored:
        settings.discoveryEnableSponsored ?? defaults.enableSponsored,
      enablePartnerships:
        settings.discoveryEnablePartnerships ?? defaults.enablePartnerships,
      maxOffersPerVisit:
        settings.discoveryMaxOffersPerVisit ?? defaults.maxOffersPerVisit,
      maxOffersPerDay:
        settings.discoveryMaxOffersPerDay ?? defaults.maxOffersPerDay,
      defaultRadius: settings.discoveryDefaultRadius ?? defaults.defaultRadius,
      maxRadius: settings.discoveryMaxRadius ?? defaults.maxRadius,
      attributionWindow:
        settings.discoveryAttributionWindow ?? defaults.attributionWindow,
      pushEnabled: settings.discoveryPushEnabled ?? defaults.pushEnabled,
      smsEnabled: settings.discoverySmsEnabled ?? defaults.smsEnabled,
      emailEnabled: settings.discoveryEmailEnabled ?? defaults.emailEnabled,
      approvalRequired:
        settings.discoveryApprovalRequired ?? defaults.approvalRequired,
    };
  }

  async updateAdminDiscoverySettings(dto: UpdateDiscoveryAdminSettingsDto) {
    let settings = await this.settingRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });
    if (!settings) {
      settings = this.settingRepository.create();
    }
    if (dto.enableNetwork !== undefined)
      settings.discoveryEnableNetwork = dto.enableNetwork;
    if (dto.enableSponsored !== undefined)
      settings.discoveryEnableSponsored = dto.enableSponsored;
    if (dto.enablePartnerships !== undefined)
      settings.discoveryEnablePartnerships = dto.enablePartnerships;
    if (dto.maxOffersPerVisit !== undefined)
      settings.discoveryMaxOffersPerVisit = dto.maxOffersPerVisit;
    if (dto.maxOffersPerDay !== undefined)
      settings.discoveryMaxOffersPerDay = dto.maxOffersPerDay;
    if (dto.defaultRadius !== undefined)
      settings.discoveryDefaultRadius = dto.defaultRadius;
    if (dto.maxRadius !== undefined)
      settings.discoveryMaxRadius = dto.maxRadius;
    if (dto.attributionWindow !== undefined)
      settings.discoveryAttributionWindow = dto.attributionWindow;
    if (dto.pushEnabled !== undefined)
      settings.discoveryPushEnabled = dto.pushEnabled;
    if (dto.smsEnabled !== undefined)
      settings.discoverySmsEnabled = dto.smsEnabled;
    if (dto.emailEnabled !== undefined)
      settings.discoveryEmailEnabled = dto.emailEnabled;
    if (dto.approvalRequired !== undefined)
      settings.discoveryApprovalRequired = dto.approvalRequired;
    await this.settingRepository.save(settings);
    return { success: true, ...dto };
  }

  async getPartnershipRewardTiers() {
    const settings = await this.settingRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });
    return (
      settings?.partnershipRewardTiers || { tiers: [], defaultMultiplier: 1.0 }
    );
  }

  async updatePartnershipRewardTiers(payload: any) {
    let settings = await this.settingRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });
    if (!settings) {
      settings = this.settingRepository.create();
    }
    settings.partnershipRewardTiers = payload;
    await this.settingRepository.save(settings);
    return { success: true, tiers: settings.partnershipRewardTiers };
  }
}
