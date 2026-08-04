import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  Between,
  MoreThanOrEqual,
  FindOptionsWhere,
  ILike,
  FindOptionsOrder,
} from 'typeorm';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { RewardTemplate } from './entities/reward-template.entity';
import { Reward } from './entities/reward.entity';
import {
  PointTransaction,
  PointTransactionType,
} from './entities/point-transaction.entity';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';
import { PointCode } from './entities/point-code.entity';
import { RedemptionCode } from './entities/redemption-code.entity';
import { LoyaltyRule } from './entities/loyalty-rule.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { BranchesService } from '../branches/branches.service';
import { RewardQueryDto } from './dto/loyalty-query.dto';
import {
  CreateRewardTemplateDto,
  UpdateRewardTemplateDto,
  CreateRewardDto,
  GivePointsDto,
  GeneratePointCodeDto,
  UsePointCodeDto,
  GenerateRedemptionCodeDto,
  RedeemRewardDto,
  RedeemRewardByIdDto,
  VerifyRedemptionDto,
  ApplyRewardTemplateDto,
} from './dto/loyalty.dto';
import { UpdateLoyaltyRuleDto } from './dto/loyalty-rule.dto';
import { VisitorPointsEarnDto } from './dto/visitor-loyalty.dto';

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
    @InjectRepository(LoyaltyRule)
    private loyaltyRuleRepo: Repository<LoyaltyRule>,
    @InjectRepository(Business)
    private businessRepo: Repository<Business>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => BranchesService))
    private branchesService: BranchesService,
  ) {}

  // --- Loyalty Rules ---
  async getRules(businessId: string, branchId?: string) {
    const where: FindOptionsWhere<LoyaltyRule> = { businessId };
    if (branchId) where.branchId = branchId;

    let rule = await this.loyaltyRuleRepo.findOne({ where });

    if (!rule) {
      rule = this.loyaltyRuleRepo.create({ businessId, branchId });
      rule = await this.loyaltyRuleRepo.save(rule);
    }

    return rule;
  }

  async upsertRules(
    businessId: string,
    dto: UpdateLoyaltyRuleDto,
    branchId?: string,
  ) {
    const where: FindOptionsWhere<LoyaltyRule> = { businessId };
    if (branchId) where.branchId = branchId;

    let rule = await this.loyaltyRuleRepo.findOne({ where });

    if (rule) {
      Object.assign(rule, dto);
    } else {
      rule = this.loyaltyRuleRepo.create({ ...dto, businessId, branchId });
    }

    return this.loyaltyRuleRepo.save(rule);
  }

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

  async getCustomerPoints(
    userId: string,
    businessId?: string,
  ): Promise<number> {
    const query = this.pointTransactionRepo
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'sum')
      .where('transaction.customerId = :userId', { userId });
    if (businessId)
      query.andWhere('transaction.businessId = :businessId', { businessId });
    const result = await query.getRawOne();
    return parseInt(result?.sum || '0', 10);
  }

  async getPointLogs(
    userId: string,
    businessId?: string,
    page = 1,
    limit = 10,
    cursor?: string,
  ) {
    const qb = this.pointTransactionRepo
      .createQueryBuilder('pt')
      .leftJoinAndSelect('pt.givenBy', 'givenBy')
      .leftJoinAndSelect('pt.branch', 'branch')
      .where('pt.customerId = :userId', { userId });

    if (businessId) {
      qb.andWhere('pt.businessId = :businessId', { businessId });
    }

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'pt',
    });

    return result.data.map((t) => ({
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
    cursor?: string,
  ): Promise<{
    data: PointTransaction[];
    total: number;
    page: number;
    limit: number;
    cursor?: string | null;
    nextCursor?: string | null;
    prevCursor?: string | null;
    hasNextPage?: boolean;
  }> {
    try {
      const validPage = Math.max(1, page);
      const validLimit = Math.min(Math.max(1, limit), 100);

      const qb = this.pointTransactionRepo
        .createQueryBuilder('pt')
        .leftJoinAndSelect('pt.customer', 'customer')
        .leftJoinAndSelect('pt.givenBy', 'givenBy')
        .leftJoinAndSelect('pt.branch', 'branch');

      if (businessId)
        qb.andWhere('pt.businessId = :businessId', { businessId });
      if (branchId && branchId !== 'all')
        qb.andWhere('pt.branchId = :branchId', { branchId });

      const result = await paginateWithCursor({
        queryBuilder: qb,
        cursor,
        page: validPage,
        limit: validLimit,
        sortField: 'createdAt',
        sortOrder: 'DESC',
        entityAlias: 'pt',
      });

      return {
        data: result.data,
        total: result.total,
        page: validPage,
        limit: validLimit,
        cursor: result.cursor,
        nextCursor: result.nextCursor,
        prevCursor: result.prevCursor,
        hasNextPage: result.hasNextPage,
      };
    } catch (error) {
      console.error('[LoyaltyService] Error in getBusinessPointLogs:', error);
      throw new BadRequestException('Failed to retrieve business point logs');
    }
  }

  // --- Point Earning ---
  async givePoints(staff: User, dto: GivePointsDto) {
    const branch = await this.branchRepo.findOne({
      where: { id: dto.branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const hasAccess = await this.branchesService.checkBranchAccess(
      staff,
      dto.branchId,
    );
    if (!hasAccess)
      throw new ForbiddenException('You do not have access to this branch');

    const customer = await this.userRepo.findOne({
      where:
        dto.customerId || dto.userId
          ? { id: dto.customerId || dto.userId, role: UserRole.CUSTOMER }
          : { uniqueCode: dto.customerCode, role: UserRole.CUSTOMER },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    let pointsToAward = dto.points;

    // If no explicit points but spendingAmount provided, calculate from rules
    if (!pointsToAward && dto.spendingAmount) {
      const rule = await this.getRules(branch.businessId, branch.id);
      if (rule && rule.isActive) {
        pointsToAward = Math.floor(
          (dto.spendingAmount / rule.spendingBaseAmount) *
            rule.spendingBasePoints,
        );
      }
    }

    if (!pointsToAward || pointsToAward <= 0) {
      throw new BadRequestException(
        'No points to award. Provide points or a valid spendingAmount with an active loyalty rule.',
      );
    }

    const transaction = this.pointTransactionRepo.create({
      amount: pointsToAward,
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

  async updateTemplate(admin: User, id: string, dto: UpdateRewardTemplateDto) {
    const template = await this.rewardTemplateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Reward template not found');

    Object.assign(template, dto);
    return this.rewardTemplateRepo.save(template);
  }

  async deleteTemplate(admin: User, id: string) {
    const template = await this.rewardTemplateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Reward template not found');

    await this.rewardTemplateRepo.remove(template);
    return { success: true, message: 'Reward template deleted successfully' };
  }

  async applyTemplate(
    user: User,
    templateId: string,
    dto: ApplyRewardTemplateDto,
  ) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      dto.branchId,
    );
    if (!hasAccess) throw new ForbiddenException('Not your business or branch');

    const [template, branch] = await Promise.all([
      this.rewardTemplateRepo.findOne({ where: { id: templateId } }),
      this.branchRepo.findOne({ where: { id: dto.branchId } }),
    ]);
    if (!template) throw new NotFoundException('Reward template not found');
    if (!branch) throw new NotFoundException('Branch not found');

    const reward = this.rewardRepo.create({
      name: template.name,
      description: template.description,
      pointsRequired: template.pointsRequired,
      category: template.category,
      coverImage: template.coverImage,
      galleryImages: template.galleryImages,
      totalQuantity: dto.totalQuantity,
      remainingQuantity: dto.totalQuantity,
      expiryDate: new Date(dto.expiryDate),
      audienceType: dto.audienceType,
      templateId: template.id,
      businessId: branch.businessId,
      branchId: branch.id,
    });

    return this.rewardRepo.save(reward);
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
      businessId,
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

    if (!branchId && !branchCode && !businessId) {
      throw new BadRequestException(
        'Branch ID or Code is required unless Business ID is provided',
      );
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
      isActive: true,
      expiryDate: MoreThanOrEqual(new Date()),
    };

    if (resolvedBranchId) where.branchId = resolvedBranchId;
    else where.businessId = businessId;

    // If quantity is not -1 (infinity), it must be at least 1
    // Using a more complex where clause for TypeORM to handle OR condition
    const finalWhere: FindOptionsWhere<Reward>[] = [
      { ...where, remainingQuantity: MoreThanOrEqual(1) },
      { ...where, totalQuantity: -1 },
    ];

    if (search) {
      finalWhere.forEach((w) => (w.name = ILike(`%${search}%`)));
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
      where: finalWhere,
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

    if (reward.totalQuantity !== -1 && reward.remainingQuantity <= 0) {
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
    return this.redeemRewardInTransaction(customer.id, { code: dto.code });
  }

  async redeemRewardById(customer: User, dto: RedeemRewardByIdDto) {
    return this.redeemRewardInTransaction(customer.id, {
      rewardId: dto.rewardId,
    });
  }

  async verifyRedemption(staff: User, dto: VerifyRedemptionDto) {
    const redemptionCode = await this.redemptionCodeRepo.findOne({
      where: { code: dto.code },
      relations: ['reward'],
    });

    if (!redemptionCode) {
      return { valid: false, code: dto.code, reason: 'NOT_FOUND' };
    }

    const hasAccess = await this.branchesService.checkBranchAccess(
      staff,
      redemptionCode.branchId,
    );
    if (!hasAccess)
      throw new ForbiddenException('You do not have access to this branch');

    const expired = new Date() > new Date(redemptionCode.reward.expiryDate);
    return {
      valid:
        !redemptionCode.isUsed && !expired && redemptionCode.reward.isActive,
      code: redemptionCode.code,
      isUsed: redemptionCode.isUsed,
      usedAt: redemptionCode.usedAt,
      reason: redemptionCode.isUsed
        ? 'ALREADY_USED'
        : expired
          ? 'EXPIRED'
          : !redemptionCode.reward.isActive
            ? 'INACTIVE_REWARD'
            : null,
      reward: {
        id: redemptionCode.reward.id,
        name: redemptionCode.reward.name,
        pointsRequired: redemptionCode.reward.pointsRequired,
      },
      branchId: redemptionCode.branchId,
      expiresAt: redemptionCode.reward.expiryDate,
    };
  }

  private async redeemRewardInTransaction(
    customerId: string,
    target: { code?: string; rewardId?: string },
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let redemptionCode = target.code
        ? await queryRunner.manager.findOne(RedemptionCode, {
            where: { code: target.code },
            relations: ['reward'],
            lock: { mode: 'pessimistic_write' },
          })
        : null;

      if (target.code && !redemptionCode) {
        throw new BadRequestException('Invalid or already used code');
      }

      const reward = redemptionCode
        ? redemptionCode.reward
        : await queryRunner.manager.findOne(Reward, {
            where: { id: target.rewardId },
            lock: { mode: 'pessimistic_write' },
          });
      if (!reward) throw new NotFoundException('Reward not found');

      if (redemptionCode?.isUsed) {
        if (redemptionCode.usedById === customerId) {
          // Idempotency: user already successfully redeemed it
          await queryRunner.commitTransaction();
          return { success: true, reward: reward.name };
        }
        throw new BadRequestException('Invalid or already used code');
      }

      if (!reward.isActive) {
        throw new BadRequestException('Reward is inactive');
      }

      if (new Date() > new Date(reward.expiryDate)) {
        throw new BadRequestException('Reward has expired');
      }

      // Re-fetch the reward with a lock to ensure its remainingQuantity is correct under concurrency
      const lockedReward = redemptionCode
        ? await queryRunner.manager.findOne(Reward, {
            where: { id: reward.id },
            lock: { mode: 'pessimistic_write' },
          })
        : reward;

      if (!lockedReward) {
        throw new BadRequestException('Reward not found');
      }

      if (
        lockedReward.totalQuantity !== -1 &&
        lockedReward.remainingQuantity <= 0
      ) {
        throw new BadRequestException('Reward out of stock');
      }

      // Check balance atomically by aggregating point transactions inside the transaction
      const balanceResult = await queryRunner.manager
        .createQueryBuilder(PointTransaction, 'transaction')
        .select('SUM(transaction.amount)', 'sum')
        .where('transaction.customerId = :userId', { userId: customerId })
        .andWhere('transaction.businessId = :businessId', {
          businessId: lockedReward.businessId,
        })
        .getRawOne();
      const currentBalance = parseInt(balanceResult?.sum || '0', 10);

      if (currentBalance < lockedReward.pointsRequired) {
        throw new BadRequestException('Insufficient points');
      }

      if (!redemptionCode) {
        redemptionCode = queryRunner.manager.create(RedemptionCode, {
          code: await this.createUniqueRedemptionCode(queryRunner.manager),
          rewardId: lockedReward.id,
          createdById: customerId,
          businessId: lockedReward.businessId,
          branchId: lockedReward.branchId,
        });
      }
      redemptionCode.isUsed = true;
      redemptionCode.usedById = customerId;
      redemptionCode.usedAt = new Date();
      await queryRunner.manager.save(redemptionCode);

      if (lockedReward.totalQuantity !== -1) {
        lockedReward.remainingQuantity -= 1;
      }
      lockedReward.redemptionCount += 1;
      await queryRunner.manager.save(lockedReward);

      const transaction = this.pointTransactionRepo.create({
        amount: -lockedReward.pointsRequired,
        type: PointTransactionType.REDEEMED,
        reason: `Redeemed reward: ${lockedReward.name}`,
        customerId,
        givenById: redemptionCode.createdById,
        businessId: lockedReward.businessId,
        branchId: lockedReward.branchId,
        referenceCode: redemptionCode.code,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return {
        success: true,
        reward: lockedReward.name,
        redemptionCode: redemptionCode.code,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async createUniqueRedemptionCode(manager: any): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = randomInt(100000000, 1000000000).toString();
      const existing = await manager.findOne(RedemptionCode, {
        where: { code },
      });
      if (!existing) return code;
    }
    throw new BadRequestException('Unable to generate a redemption code');
  }

  // --- Visitor (unauthenticated) Loyalty Flows ---

  private async resolveBranchByIdentifier(dto: {
    branchId?: string;
    branchCode?: string;
  }): Promise<Branch> {
    if (dto.branchId && dto.branchCode) {
      throw new BadRequestException(
        'Provide either branchId or branchCode, not both',
      );
    }

    if (!dto.branchId && !dto.branchCode) {
      throw new BadRequestException(
        'branchId or branchCode is required for this action',
      );
    }

    let branch: Branch | null = null;
    if (dto.branchId) {
      branch = await this.branchRepo.findOne({ where: { id: dto.branchId } });
    } else if (dto.branchCode) {
      branch = await this.branchRepo.findOne({
        where: { uniqueCode: dto.branchCode },
      });
    }

    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  private async generateUniqueCustomerCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = `CUST-${Math.floor(100000 + Math.random() * 900000)}`;
      const existing = await this.userRepo.findOne({
        where: { uniqueCode: code },
      });
      if (!existing) return code;
    }
    throw new BadRequestException('Unable to generate a customer code');
  }

  private async resolveOrCreateVisitorCustomer(dto: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ customer: User; isNewCustomer: boolean }> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException(
        'At least one of email or phone is required to identify the customer',
      );
    }

    let customer: User | null = null;
    if (dto.email) {
      customer = await this.userRepo.findOne({ where: { email: dto.email } });
    }
    if (!customer && dto.phone) {
      customer = await this.userRepo.findOne({ where: { phone: dto.phone } });
    }

    if (customer) {
      if (customer.role !== UserRole.CUSTOMER) {
        throw new BadRequestException(
          'The provided identity is linked to a non-customer account',
        );
      }
      return { customer, isNewCustomer: false };
    }

    const hashedPassword = await bcrypt.hash(
      randomInt(100000, 999999).toString(),
      10,
    );
    const created = this.userRepo.create({
      email: dto.email ? dto.email.toLowerCase() : undefined,
      phone: dto.phone,
      firstName: dto.firstName || 'Visitor',
      lastName: dto.lastName || '',
      password: hashedPassword,
      role: UserRole.CUSTOMER,
      uniqueCode: await this.generateUniqueCustomerCode(),
    });

    try {
      const saved = await this.userRepo.save(created);
      return { customer: saved, isNewCustomer: true };
    } catch (err) {
      // Concurrent identical signups can race past the lookup and collide on
      // the unique email/phone constraint — re-fetch instead of surfacing a 500.
      const existing = await this.userRepo.findOne({
        where: dto.email
          ? { email: dto.email.toLowerCase() }
          : { phone: dto.phone },
      });
      if (existing && existing.role === UserRole.CUSTOMER) {
        return { customer: existing, isNewCustomer: false };
      }
      throw err;
    }
  }

  async earnForVisitor(dto: VisitorPointsEarnDto) {
    if (!dto.isVisit) {
      throw new BadRequestException(
        'The public earn flow only supports visit-based earning',
      );
    }

    const branch = await this.resolveBranchByIdentifier(dto);

    const { customer, isNewCustomer } =
      await this.resolveOrCreateVisitorCustomer(dto);

    // Respect the branch's configured loyalty rule. Never auto-create a rule
    // from a public (unauthenticated) request.
    const rule = await this.loyaltyRuleRepo.findOne({
      where: { businessId: branch.businessId },
    });
    if (!rule || !rule.isActive) {
      throw new BadRequestException('Loyalty is not enabled for this branch');
    }

    let pointsToAward = rule.visitPoints || 0;
    const breakdown: Record<string, number> = {
      visitPoints: pointsToAward,
    };

    if (isNewCustomer && (rule.firstVisitBonus || 0) > 0) {
      pointsToAward += rule.firstVisitBonus;
      breakdown.bonusPoints = rule.firstVisitBonus;
    }

    const transaction = this.pointTransactionRepo.create({
      amount: pointsToAward,
      type: PointTransactionType.EARNED,
      reason: 'Points earned for visit',
      customerId: customer.id,
      businessId: branch.businessId,
      branchId: branch.id,
    });
    await this.pointTransactionRepo.save(transaction);

    const newBalance = await this.getBusinessPoints(
      customer.id,
      branch.businessId,
    );

    return {
      success: true,
      pointsEarned: pointsToAward,
      newBalance,
      message: `You earned ${pointsToAward} points!`,
      breakdown,
      customer: {
        id: customer.id,
        uniqueCode: customer.uniqueCode,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    };
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

    const currentMonthSavings = await this.pointTransactionRepo
      .createQueryBuilder('t')
      .select('SUM(ABS(t.amount))', 'sum')
      .where('t.customerId = :userId', { userId })
      .andWhere('t.type = :type', { type: PointTransactionType.REDEEMED })
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

    const prevMonthSavings = await this.pointTransactionRepo
      .createQueryBuilder('t')
      .select('SUM(ABS(t.amount))', 'sum')
      .where('t.customerId = :userId', { userId })
      .andWhere('t.type = :type', { type: PointTransactionType.REDEEMED })
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
        netSavings: calculateTrend(
          parseInt(currentMonthSavings?.sum || '0', 10),
          parseInt(prevMonthSavings?.sum || '0', 10),
        ),
      },
    };
  }

  async getBusinessLoyaltyStats(businessId?: string, branchId?: string) {
    try {
      const where: any = {};
      if (businessId) {
        where.businessId = businessId;
      }
      if (branchId && branchId !== 'all') {
        where.branchId = branchId;
      }

      const totalRewards = await this.rewardRepo.count({ where });
      const activeRewards = await this.rewardRepo.count({
        where: { ...where, isActive: true },
      });

      // 1. Total unique customers (from visits or point transactions)
      const ptsCustQuery = this.pointTransactionRepo.createQueryBuilder('pt');
      if (businessId)
        ptsCustQuery.andWhere('pt.businessId = :businessId', { businessId });
      if (branchId && branchId !== 'all')
        ptsCustQuery.andWhere('pt.branchId = :branchId', { branchId });
      const ptsCustRaw = await ptsCustQuery
        .select('COUNT(DISTINCT pt.customerId)', 'count')
        .getRawOne();

      const visitCustQuery = this.visitRepo.createQueryBuilder('visit');
      if (businessId)
        visitCustQuery.andWhere('visit.businessId = :businessId', {
          businessId,
        });
      if (branchId && branchId !== 'all')
        visitCustQuery.andWhere('visit.branchId = :branchId', { branchId });
      const visitCustRaw = await visitCustQuery
        .select('COUNT(DISTINCT visit.customerId)', 'count')
        .getRawOne();

      const totalCustomersCount = Math.max(
        parseInt(ptsCustRaw?.count || '0', 10),
        parseInt(visitCustRaw?.count || '0', 10),
      );

      // 2. Points Issued
      const pointQuery = this.pointTransactionRepo.createQueryBuilder('pt');
      if (businessId)
        pointQuery.andWhere('pt.businessId = :businessId', { businessId });
      if (branchId && branchId !== 'all')
        pointQuery.andWhere('pt.branchId = :branchId', { branchId });
      const pointAgg = await pointQuery
        .andWhere('pt.type = :type', { type: PointTransactionType.EARNED })
        .select('SUM(pt.amount)', 'totalPointsEarned')
        .getRawOne();
      const totalPointsEarned = parseInt(
        pointAgg?.totalPointsEarned || '0',
        10,
      );

      // 3. Rewards Redeemed
      const redemptionQuery = this.redemptionCodeRepo.createQueryBuilder('rc');
      if (businessId)
        redemptionQuery.andWhere('rc.businessId = :businessId', { businessId });
      if (branchId && branchId !== 'all')
        redemptionQuery.andWhere('rc.branchId = :branchId', { branchId });
      const totalRedemptions = await redemptionQuery
        .andWhere('rc.isUsed = true')
        .getCount();

      const periodNow = new Date();
      const currentPeriodStart = new Date(
        periodNow.getTime() - 30 * 24 * 60 * 60 * 1000,
      );
      const previousPeriodStart = new Date(
        periodNow.getTime() - 60 * 24 * 60 * 60 * 1000,
      );
      const previousPeriodEnd = currentPeriodStart;

      const periodPointTotal = async (start: Date, end?: Date) => {
        const query = this.pointTransactionRepo
          .createQueryBuilder('pt')
          .select('COALESCE(SUM(pt.amount), 0)', 'total')
          .where('pt.type = :type', { type: PointTransactionType.EARNED })
          .andWhere('pt.createdAt >= :start', { start });
        if (businessId)
          query.andWhere('pt.businessId = :businessId', { businessId });
        if (branchId && branchId !== 'all')
          query.andWhere('pt.branchId = :branchId', { branchId });
        if (end) query.andWhere('pt.createdAt < :end', { end });
        const result = await query.getRawOne();
        return Number(result?.total || 0);
      };

      const periodRedemptionCount = async (start: Date, end?: Date) => {
        const query = this.redemptionCodeRepo
          .createQueryBuilder('rc')
          .select('COUNT(rc.id)', 'count')
          .where('rc.isUsed = true')
          .andWhere('rc.usedAt >= :start', { start });
        if (businessId)
          query.andWhere('rc.businessId = :businessId', { businessId });
        if (branchId && branchId !== 'all')
          query.andWhere('rc.branchId = :branchId', { branchId });
        if (end) query.andWhere('rc.usedAt < :end', { end });
        const result = await query.getRawOne();
        return Number(result?.count || 0);
      };

      const periodCustomerCount = async (start: Date, end?: Date) => {
        const query = this.pointTransactionRepo
          .createQueryBuilder('pt')
          .select('COUNT(DISTINCT pt.customerId)', 'count')
          .where('pt.createdAt >= :start', { start });
        if (businessId)
          query.andWhere('pt.businessId = :businessId', { businessId });
        if (branchId && branchId !== 'all')
          query.andWhere('pt.branchId = :branchId', { branchId });
        if (end) query.andWhere('pt.createdAt < :end', { end });
        const result = await query.getRawOne();
        return Number(result?.count || 0);
      };

      const [
        currentPoints,
        previousPoints,
        currentRedemptions,
        previousRedemptions,
        currentCustomers,
        previousCustomers,
      ] = await Promise.all([
        periodPointTotal(currentPeriodStart),
        periodPointTotal(previousPeriodStart, previousPeriodEnd),
        periodRedemptionCount(currentPeriodStart),
        periodRedemptionCount(previousPeriodStart, previousPeriodEnd),
        periodCustomerCount(currentPeriodStart),
        periodCustomerCount(previousPeriodStart, previousPeriodEnd),
      ]);

      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current === 0 ? 0 : 100;
        return Math.round(((current - previous) / previous) * 100);
      };

      const customerBalances = await this.pointTransactionRepo
        .createQueryBuilder('pt')
        .select('pt.customerId', 'customerId')
        .addSelect('SUM(pt.amount)', 'balance')
        .where(
          businessId ? 'pt.businessId = :businessId' : '1=1',
          businessId ? { businessId } : {},
        )
        .andWhere(
          branchId && branchId !== 'all' ? 'pt.branchId = :branchId' : '1=1',
          branchId && branchId !== 'all' ? { branchId } : {},
        )
        .groupBy('pt.customerId')
        .getRawMany();
      const tierDistribution = [
        {
          label: 'Bronze (<100 pts)',
          value: customerBalances.filter((row) => Number(row.balance) < 100)
            .length,
          color: '#CD7F32',
        },
        {
          label: 'Silver (100-499 pts)',
          value: customerBalances.filter(
            (row) => Number(row.balance) >= 100 && Number(row.balance) < 500,
          ).length,
          color: '#C0C0C0',
        },
        {
          label: 'Gold (500-999 pts)',
          value: customerBalances.filter(
            (row) => Number(row.balance) >= 500 && Number(row.balance) < 1000,
          ).length,
          color: '#FFD700',
        },
        {
          label: 'Platinum (1000+ pts)',
          value: customerBalances.filter((row) => Number(row.balance) >= 1000)
            .length,
          color: '#7B68EE',
        },
      ];

      // 4. Activity Trend (Last 4 Weeks)
      const activityNow = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(activityNow.getDate() - 30);

      const trendMap = new Map<string, { earnings: number; claims: number }>([
        ['Week 1', { earnings: 0, claims: 0 }],
        ['Week 2', { earnings: 0, claims: 0 }],
        ['Week 3', { earnings: 0, claims: 0 }],
        ['Week 4', { earnings: 0, claims: 0 }],
      ]);

      const recentTxQuery = this.pointTransactionRepo
        .createQueryBuilder('pt')
        .select('pt.createdAt', 'createdAt')
        .addSelect('pt.amount', 'amount')
        .where('pt.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo });
      if (businessId)
        recentTxQuery.andWhere('pt.businessId = :businessId', { businessId });
      if (branchId && branchId !== 'all')
        recentTxQuery.andWhere('pt.branchId = :branchId', { branchId });

      const recentTx = await recentTxQuery.getRawMany();
      recentTx.forEach((tx) => {
        if (!tx.createdAt) return;
        const txDate = new Date(tx.createdAt);
        if (isNaN(txDate.getTime())) return;

        const diffDays = Math.floor(
          (activityNow.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        let weekKey = 'Week 4';
        if (diffDays >= 22) weekKey = 'Week 1';
        else if (diffDays >= 15) weekKey = 'Week 2';
        else if (diffDays >= 8) weekKey = 'Week 3';

        const entry = trendMap.get(weekKey) || { earnings: 0, claims: 0 };
        const amt = parseInt(tx.amount || '0', 10);
        if (amt > 0) entry.earnings += amt;
        else entry.claims += Math.abs(amt);
      });

      const activityTrend = Array.from(trendMap.entries()).map(
        ([name, val]) => ({
          name,
          earnings: val.earnings,
          claims: val.claims,
        }),
      );

      return {
        stats: [
          {
            label: 'Total Customers',
            value: totalCustomersCount.toLocaleString(),
            change: calculateChange(currentCustomers, previousCustomers),
            trend: 'up' as const,
          },
          {
            label: 'Points Issued',
            value: totalPointsEarned.toLocaleString(),
            change: calculateChange(currentPoints, previousPoints),
            trend: 'up' as const,
          },
          {
            label: 'Rewards Redeemed',
            value: totalRedemptions.toLocaleString(),
            change: calculateChange(currentRedemptions, previousRedemptions),
            trend: 'up' as const,
          },
          {
            label: 'Active Programs',
            value: activeRewards.toLocaleString(),
            change: 0,
            trend: 'up' as const,
          },
        ],
        tierDistribution,
        activityTrend,
        growthForecast:
          totalCustomersCount > 0
            ? `${Math.round((totalRedemptions / totalCustomersCount) * 100)}% of tracked customers have redeemed a reward.`
            : 'No customer redemption data is available yet.',
      };
    } catch (error) {
      console.error(
        '[LoyaltyService] Error in getBusinessLoyaltyStats:',
        error,
      );
      throw new BadRequestException(
        'Failed to retrieve business loyalty statistics',
      );
    }
  }
}
