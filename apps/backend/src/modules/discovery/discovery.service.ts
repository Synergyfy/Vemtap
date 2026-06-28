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
import { UpdateDiscoverySettingsDto } from './dto/discovery.dto';

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
      .innerJoin('catalogue_orders', 'order', 'order.id = visit.orderId')
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

    qb.orderBy('visit.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

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
    };
  }

  async submitRecommendation(branchId: string, dto: any) {
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
      .innerJoin('catalogue_orders', 'order', 'order.id = visit.orderId')
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
            .innerJoin('catalogue_orders', 'order', 'order.id = visit.orderId')
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
}
