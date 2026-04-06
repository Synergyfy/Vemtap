import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, MoreThanOrEqual, FindOptionsWhere, ILike, FindOptionsOrder } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { RewardTemplate } from './entities/reward-template.entity';
import { Reward } from './entities/reward.entity';
import {
  PointTransaction,
  PointTransactionType,
} from './entities/point-transaction.entity';
import { PointCode } from './entities/point-code.entity';
import { RedemptionCode } from './entities/redemption-code.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { BranchesService } from '../branches/branches.service';
import { RewardQueryDto } from './dto/loyalty-query.dto';
import {
  CreateRewardTemplateDto,
  CreateRewardDto,
  GivePointsDto,
  GeneratePointCodeDto,
  UsePointCodeDto,
  GenerateRedemptionCodeDto,
  RedeemRewardDto,
} from './dto/loyalty.dto';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(RewardTemplate)
    private rewardTemplateRepo: Repository<RewardTemplate>,
    @InjectRepository(Reward)
    private rewardRepo: Repository<Reward>,
    @InjectRepository(PointTransaction)
    private pointTransactionRepo: Repository<PointTransaction>,
    @InjectRepository(PointCode)
    private pointCodeRepo: Repository<PointCode>,
    @InjectRepository(RedemptionCode)
    private redemptionCodeRepo: Repository<RedemptionCode>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,
    @InjectRepository(Visit)
    private visitRepo: Repository<Visit>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => BranchesService))
    private branchesService: BranchesService,
  ) {}

  // --- Point Balance ---
  async getBusinessPoints(userId: string, businessId: string): Promise<number> {
    const result = await this.pointTransactionRepo
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'sum')
      .where('transaction.customerId = :userId', { userId })
      .andWhere('transaction.businessId = :businessId', { businessId })
      .getRawOne();

    return parseInt(result?.sum || '0', 10);
  }

  async getPointLogs(userId: string, businessId: string, page = 1, limit = 10) {
    const transactions = await this.pointTransactionRepo.find({
      where: { customerId: userId, businessId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['givenBy', 'branch'],
    });

    return transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      reason: t.reason,
      createdAt: t.createdAt,
      branch: t.branch
        ? {
            id: t.branch.id,
            name: t.branch.name,
          }
        : null,
      givenBy: t.givenBy
        ? {
            id: t.givenBy.id,
            firstName: t.givenBy.firstName,
            lastName: t.givenBy.lastName,
            email: t.givenBy.email,
          }
        : null,
    }));
  }

  async getBusinessPointLogs(
    businessId: string,
    branchId?: string,
    page = 1,
    limit = 10,
  ) {
    const where: any = { businessId };
    if (branchId) where.branchId = branchId;

    return this.pointTransactionRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['customer', 'givenBy', 'branch'],
    });
  }

  // --- Point Earning ---
  async givePoints(staff: User, dto: GivePointsDto) {
    const customer = await this.userRepo.findOne({
      where: { uniqueCode: dto.customerCode, role: UserRole.CUSTOMER },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const branch = await this.branchRepo.findOne({
      where: { id: dto.branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const transaction = this.pointTransactionRepo.create({
      amount: dto.points,
      type: PointTransactionType.EARNED,
      reason: dto.reason || 'Points given by staff',
      customerId: customer.id,
      givenById: staff.id,
      businessId: branch.businessId,
      branchId: branch.id,
    });

    return this.pointTransactionRepo.save(transaction);
  }

  async awardPoints(
    customerId: string,
    points: number,
    businessId: string,
    branchId: string,
    reason: string,
    givenById?: string,
  ) {
    if (points <= 0) return;

    const transaction = this.pointTransactionRepo.create({
      amount: points,
      type: PointTransactionType.EARNED,
      reason,
      customerId,
      businessId,
      branchId,
      givenById,
    });

    return this.pointTransactionRepo.save(transaction);
  }

  async generatePointCode(staff: User, dto: GeneratePointCodeDto) {
    // Owners/Staff shouldn't be able to arbitrarily create codes for another business
    if (staff.role !== UserRole.ADMIN && staff.businessId !== dto.businessId) {
      throw new ForbiddenException('You do not have access to this business');
    }

    const code = Math.floor(100000000 + Math.random() * 900000000).toString();
    const pointCode = this.pointCodeRepo.create({
      code,
      points: dto.points,
      createdById: staff.id,
      businessId: dto.businessId,
    });
    return this.pointCodeRepo.save(pointCode);
  }

  async usePointCode(customer: User, dto: UsePointCodeDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pointCode = await queryRunner.manager.findOne(PointCode, {
        where: { code: dto.code },
        lock: { mode: 'pessimistic_write' },
      });

      if (!pointCode) {
        throw new BadRequestException('Invalid or already used code');
      }

      if (pointCode.isUsed) {
        if (pointCode.usedById === customer.id) {
          // Idempotency: user already successfully claimed it
          await queryRunner.commitTransaction();
          return { success: true, points: pointCode.points };
        }
        throw new BadRequestException('Invalid or already used code');
      }

      pointCode.isUsed = true;
      pointCode.usedById = customer.id;
      pointCode.usedAt = new Date();
      await queryRunner.manager.save(pointCode);

      const transaction = this.pointTransactionRepo.create({
        amount: pointCode.points,
        type: PointTransactionType.EARNED,
        reason: 'Points earned via code',
        customerId: customer.id,
        givenById: pointCode.createdById,
        businessId: pointCode.businessId,
        branchId: customer.branchId, // Optional: where the user is currently at
        referenceCode: pointCode.code,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return { success: true, points: pointCode.points };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // --- Rewards ---
  async createTemplate(admin: User, dto: CreateRewardTemplateDto) {
    const template = this.rewardTemplateRepo.create({
      ...dto,
      createdById: admin.id,
    });
    return this.rewardTemplateRepo.save(template);
  }

  async getTemplates() {
    return this.rewardTemplateRepo.find();
  }

  async createReward(user: User, dto: CreateRewardDto) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      dto.branchId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Not your business or branch');
    }

    const branch = await this.branchRepo.findOne({
      where: { id: dto.branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const reward = this.rewardRepo.create({
      ...dto,
      businessId: branch.businessId,
      remainingQuantity: dto.totalQuantity,
    });
    return this.rewardRepo.save(reward);
  }

  async updateReward(user: User, id: string, dto: Partial<CreateRewardDto>) {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('Reward not found');

    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      reward.branchId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this reward');
    }

    Object.assign(reward, dto);
    return this.rewardRepo.save(reward);
  }

  async deleteReward(user: User, id: string) {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('Reward not found');

    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      reward.branchId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this reward');
    }

    return this.rewardRepo.delete(id);
  }

  async getPublicRewards(query: RewardQueryDto) {
    const {
      branchId,
      branchCode,
      search,
      newest,
      oldest,
      lowestQuantity,
      highestQuantity,
      aboutToExpire,
      highestPoints,
      lowestPoints,
      page = 1,
      limit = 10,
    } = query;

    if (!branchId && !branchCode) {
      throw new BadRequestException('Branch ID or Code is required');
    }

    let resolvedBranchId = branchId;

    if (!resolvedBranchId && branchCode) {
      const branch = await this.branchRepo.findOne({
        where: { uniqueCode: branchCode },
      });
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
      resolvedBranchId = branch.id;
    }

    const where: FindOptionsWhere<Reward> = {
      branchId: resolvedBranchId,
      isActive: true,
      remainingQuantity: MoreThanOrEqual(1),
      expiryDate: MoreThanOrEqual(new Date()),
    };

    if (search) {
      where.name = ILike(`%${search}%`);
    }

    const order: FindOptionsOrder<Reward> = {};

    if (newest) order.createdAt = 'DESC';
    else if (oldest) order.createdAt = 'ASC';
    else if (highestPoints) order.pointsRequired = 'DESC';
    else if (lowestPoints) order.pointsRequired = 'ASC';
    else if (highestQuantity) order.remainingQuantity = 'DESC';
    else if (lowestQuantity) order.remainingQuantity = 'ASC';
    else if (aboutToExpire) order.expiryDate = 'ASC';
    else order.createdAt = 'DESC'; // default sorting

    const [items, total] = await this.rewardRepo.findAndCount({
      where,
      order,
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: items.map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { redemptionCount, ...rest } = item;
        return rest;
      }),
      total,
      page,
      limit,
    };
  }

  async getBranchRewards(branchId: string, page = 1, limit = 10) {
    return this.rewardRepo.find({
      where: { branchId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async findOne(id: string) {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }

  async getRewardRedemptions(
    user: User,
    rewardId: string,
    page = 1,
    limit = 10,
  ) {
    const reward = await this.rewardRepo.findOne({ where: { id: rewardId } });
    if (!reward) throw new NotFoundException('Reward not found');

    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      reward.branchId,
    );
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to this reward redemptions',
      );
    }

    const [items, total] = await this.redemptionCodeRepo.findAndCount({
      where: { rewardId, isUsed: true },
      relations: ['usedBy'],
      order: { usedAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: items.map((redemption) => ({
        id: redemption.id,
        usedAt: redemption.usedAt,
        customer: redemption.usedBy
          ? {
              id: redemption.usedBy.id,
              firstName: redemption.usedBy.firstName,
              lastName: redemption.usedBy.lastName,
              email: redemption.usedBy.email,
              phone: redemption.usedBy.phone,
            }
          : null,
      })),
      total,
      page,
      limit,
    };
  }

  // --- Redemption ---
  async generateRedemptionCode(staff: User, dto: GenerateRedemptionCodeDto) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      staff,
      dto.branchId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const reward = await this.rewardRepo.findOne({
      where: { id: dto.rewardId, branchId: dto.branchId },
    });
    if (!reward) throw new NotFoundException('Reward not found');

    if (new Date() > new Date(reward.expiryDate)) {
      throw new BadRequestException('Reward has expired');
    }

    if (reward.remainingQuantity <= 0) {
      throw new BadRequestException('Reward out of stock');
    }

    const code = Math.floor(100000000 + Math.random() * 900000000).toString();
    const redemptionCode = this.redemptionCodeRepo.create({
      code,
      rewardId: reward.id,
      createdById: staff.id,
      businessId: reward.businessId,
      branchId: reward.branchId,
    });
    return this.redemptionCodeRepo.save(redemptionCode);
  }

  async redeemReward(customer: User, dto: RedeemRewardDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const redemptionCode = await queryRunner.manager.findOne(RedemptionCode, {
        where: { code: dto.code },
        relations: ['reward'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!redemptionCode) {
        throw new BadRequestException('Invalid or already used code');
      }

      const reward = redemptionCode.reward;

      if (redemptionCode.isUsed) {
        if (redemptionCode.usedById === customer.id) {
          // Idempotency: user already successfully redeemed it
          await queryRunner.commitTransaction();
          return { success: true, reward: reward.name };
        }
        throw new BadRequestException('Invalid or already used code');
      }

      if (new Date() > new Date(reward.expiryDate)) {
        throw new BadRequestException('Reward has expired');
      }

      // Re-fetch the reward with a lock to ensure its remainingQuantity is correct under concurrency
      const lockedReward = await queryRunner.manager.findOne(Reward, {
        where: { id: reward.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedReward || lockedReward.remainingQuantity <= 0) {
        throw new BadRequestException('Reward out of stock');
      }

      // Check balance atomically by aggregating point transactions inside the transaction
      const balanceResult = await queryRunner.manager
        .createQueryBuilder(PointTransaction, 'transaction')
        .select('SUM(transaction.amount)', 'sum')
        .where('transaction.customerId = :userId', { userId: customer.id })
        .andWhere('transaction.businessId = :businessId', {
          businessId: lockedReward.businessId,
        })
        .getRawOne();
      const currentBalance = parseInt(balanceResult?.sum || '0', 10);

      if (currentBalance < lockedReward.pointsRequired) {
        throw new BadRequestException('Insufficient points');
      }

      redemptionCode.isUsed = true;
      redemptionCode.usedById = customer.id;
      redemptionCode.usedAt = new Date();
      await queryRunner.manager.save(redemptionCode);

      lockedReward.remainingQuantity -= 1;
      lockedReward.redemptionCount += 1;
      await queryRunner.manager.save(lockedReward);

      const transaction = this.pointTransactionRepo.create({
        amount: -lockedReward.pointsRequired,
        type: PointTransactionType.REDEEMED,
        reason: `Redeemed reward: ${lockedReward.name}`,
        customerId: customer.id,
        givenById: redemptionCode.createdById,
        businessId: lockedReward.businessId,
        branchId: lockedReward.branchId,
        referenceCode: redemptionCode.code,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return { success: true, reward: lockedReward.name };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // --- Analytics ---
  async getCustomerAnalytics(userId: string, days?: number) {
    // 1. Total Visits
    const totalVisitsQuery = this.visitRepo
      .createQueryBuilder('visit')
      .where('visit.customerId = :userId', { userId });

    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      totalVisitsQuery.andWhere('visit.createdAt >= :startDate', { startDate });
    }

    const totalVisits = await totalVisitsQuery.getCount();

    // 2. Current Points Balance (Total across all businesses)
    const pointsResult = await this.pointTransactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'sum')
      .where('t.customerId = :userId', { userId })
      .getRawOne();
    const currentPointsBalance = parseInt(pointsResult?.sum || '0', 10);

    // 3. Net Savings (Proxy: sum of ABS(amount) for REDEEMED transactions)
    const savingsResult = await this.pointTransactionRepo
      .createQueryBuilder('t')
      .select('SUM(ABS(t.amount))', 'sum')
      .where('t.customerId = :userId', { userId })
      .andWhere('t.type = :type', { type: PointTransactionType.REDEEMED })
      .getRawOne();
    const netSavings = parseInt(savingsResult?.sum || '0', 10);

    // 4. Visit Trends (Grouped by month)
    const visitTrendsRaw = await this.visitRepo
      .createQueryBuilder('visit')
      .select("TO_CHAR(visit.createdAt, 'Mon')", 'month')
      .addSelect('COUNT(*)', 'visits')
      .where('visit.customerId = :userId', { userId })
      .groupBy("TO_CHAR(visit.createdAt, 'Mon')")
      .orderBy('MIN(visit.createdAt)', 'ASC')
      .getRawMany();

    const visitTrends = visitTrendsRaw.map((r) => ({
      month: r.month,
      visits: parseInt(r.visits, 10),
    }));

    // 5. Points By Venue (Lifetime earned points per branch)
    const pointsByVenueRaw = await this.pointTransactionRepo
      .createQueryBuilder('t')
      .leftJoin('t.branch', 'branch')
      .select('branch.name', 'venueName')
      .addSelect('SUM(t.amount)', 'points')
      .where('t.customerId = :userId', { userId })
      .andWhere('t.type = :type', { type: PointTransactionType.EARNED })
      .groupBy('branch.name')
      .getRawMany();

    const pointsByVenue = pointsByVenueRaw.map((r) => ({
      venueName: r.venueName || 'Unknown Venue',
      points: parseInt(r.points, 10),
    }));

    // 6. Top Venues (By visit count, but return visits as 'points' to match frontend expected field)
    const topVenuesRaw = await this.visitRepo
      .createQueryBuilder('visit')
      .leftJoin('visit.branch', 'branch')
      .select('branch.name', 'venueName')
      .addSelect('COUNT(*)', 'visits')
      .where('visit.customerId = :userId', { userId })
      .groupBy('branch.name')
      .orderBy('visits', 'DESC')
      .limit(5)
      .getRawMany();

    const topVenues = topVenuesRaw.map((r) => ({
      venueName: r.venueName || 'Unknown Venue',
      points: parseInt(r.visits, 10),
    }));

    // 7. Trend Calculations (Month-over-Month)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthVisits = await this.visitRepo.count({
      where: {
        customerId: userId,
        createdAt: MoreThanOrEqual(currentMonthStart),
      },
    });
    const prevMonthVisits = await this.visitRepo.count({
      where: {
        customerId: userId,
        createdAt: Between(prevMonthStart, currentMonthStart),
      },
    });

    const currentMonthPoints = await this.pointTransactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'sum')
      .where('t.customerId = :userId', { userId })
      .andWhere('t.type = :type', { type: PointTransactionType.EARNED })
      .andWhere('t.createdAt >= :start', { start: currentMonthStart })
      .getRawOne();

    const prevMonthPoints = await this.pointTransactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'sum')
      .where('t.customerId = :userId', { userId })
      .andWhere('t.type = :type', { type: PointTransactionType.EARNED })
      .andWhere('t.createdAt >= :start', { start: prevMonthStart })
      .andWhere('t.createdAt < :end', { end: currentMonthStart })
      .getRawOne();

    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? `+${curr}` : '0';
      const diff = ((curr - prev) / prev) * 100;
      return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`;
    };

    return {
      totalVisits,
      currentPointsBalance,
      netSavings,
      visitTrends,
      pointsByVenue,
      topVenues,
      trends: {
        totalVisits: calculateTrend(currentMonthVisits, prevMonthVisits),
        rewardPoints: calculateTrend(
          parseInt(currentMonthPoints?.sum || '0', 10),
          parseInt(prevMonthPoints?.sum || '0', 10),
        ),
      },
    };
  }
}
