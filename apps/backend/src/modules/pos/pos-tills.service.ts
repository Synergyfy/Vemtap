import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PosTill } from './entities/pos-till.entity';
import { PosRegisterSession } from './entities/pos-register-session.entity';
import { PosSale } from './entities/pos-sale.entity';
import {
  PosTillStatus,
  RegisterSessionStatus,
  SaleStatus,
} from './entities/pos-enums';
import { Branch } from '../branches/entities/branch.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { CreatePosTillDto, UpdatePosTillDto } from './dto/pos-till.dto';

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

@Injectable()
export class PosTillsService {
  constructor(
    @InjectRepository(PosTill)
    private readonly tillRepository: Repository<PosTill>,
    @InjectRepository(PosRegisterSession)
    private readonly sessionRepository: Repository<PosRegisterSession>,
    @InjectRepository(PosSale)
    private readonly saleRepository: Repository<PosSale>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  /**
   * Tills with who is on them and what each has taken today. Three queries:
   * tills, their open sessions, and one grouped sales total per till.
   */
  async list(businessId: string, branchId?: string) {
    const tills = await this.tillRepository.find({
      where: branchId ? { businessId, branchId } : { businessId },
      order: { name: 'ASC' },
    });
    const ids = tills.map((till) => till.id);

    const [openSessions, salesRows, limit] = await Promise.all([
      ids.length
        ? this.sessionRepository.find({
            where: { tillId: In(ids), status: RegisterSessionStatus.OPEN },
            relations: ['cashier'],
          })
        : Promise.resolve([] as PosRegisterSession[]),
      ids.length
        ? this.saleRepository
            .createQueryBuilder('sale')
            .innerJoin('sale.registerSession', 'session')
            .select('session.tillId', 'tillId')
            .addSelect('COALESCE(SUM(sale.total), 0)', 'sum')
            .addSelect('COUNT(sale.id)', 'count')
            .where('session.tillId IN (:...ids)', { ids })
            .andWhere('sale.status != :refunded', {
              refunded: SaleStatus.REFUNDED,
            })
            .andWhere('sale.createdAt >= :today', { today: startOfToday() })
            .groupBy('session.tillId')
            .getRawMany<{ tillId: string; sum: string; count: string }>()
        : Promise.resolve([]),
      this.getTerminalLimit(businessId),
    ]);

    const sessionByTill = new Map(openSessions.map((s) => [s.tillId, s]));
    const salesByTill = new Map(salesRows.map((row) => [row.tillId, row]));

    return {
      data: tills.map((till) => {
        const session = sessionByTill.get(till.id);
        const sales = salesByTill.get(till.id);
        return {
          id: till.id,
          branchId: till.branchId,
          name: till.name,
          code: till.code,
          status:
            session && till.status !== PosTillStatus.DISABLED
              ? PosTillStatus.ACTIVE
              : till.status === PosTillStatus.ACTIVE
                ? PosTillStatus.IDLE
                : till.status,
          deviceLabel: till.deviceLabel,
          lastSeenAt: till.lastSeenAt,
          occupant: session
            ? {
                sessionId: session.id,
                cashierId: session.cashierId,
                cashierName: session.cashier
                  ? `${session.cashier.firstName ?? ''} ${session.cashier.lastName ?? ''}`.trim() ||
                    null
                  : null,
                openedAt: session.openedAt,
              }
            : null,
          todaySales: Number(sales?.sum ?? 0),
          todayTransactions: Number(sales?.count ?? 0),
        };
      }),
      limit,
    };
  }

  async create(businessId: string, dto: CreatePosTillDto) {
    await this.assertBranch(businessId, dto.branchId);

    const [count, limit] = await Promise.all([
      this.tillRepository.count({ where: { businessId } }),
      this.getTerminalLimit(businessId),
    ]);
    if (limit !== null && count >= limit) {
      throw new ForbiddenException(
        `Your plan allows ${limit} POS terminal${limit === 1 ? '' : 's'}. Upgrade to add more.`,
      );
    }

    const code = dto.code ?? `TILL-${String(count + 1).padStart(2, '0')}`;
    const clash = await this.tillRepository.findOne({
      where: { businessId, code },
      select: ['id'],
    });
    if (clash) throw new ConflictException(`Till code ${code} is taken`);

    return this.tillRepository.save(
      this.tillRepository.create({
        businessId,
        branchId: dto.branchId,
        name: dto.name.trim(),
        code,
        deviceLabel: dto.deviceLabel ?? null,
        status: PosTillStatus.IDLE,
      }),
    );
  }

  async update(businessId: string, id: string, dto: UpdatePosTillDto) {
    const till = await this.findOwned(businessId, id);
    if (dto.status === PosTillStatus.ACTIVE) {
      throw new BadRequestException(
        'A till becomes active when a session opens on it',
      );
    }
    if (dto.name !== undefined) till.name = dto.name.trim();
    if (dto.deviceLabel !== undefined) till.deviceLabel = dto.deviceLabel;
    if (dto.status !== undefined) till.status = dto.status;
    return this.tillRepository.save(till);
  }

  async remove(businessId: string, id: string) {
    const till = await this.findOwned(businessId, id);
    const open = await this.sessionRepository.count({
      where: { tillId: till.id, status: RegisterSessionStatus.OPEN },
    });
    if (open) {
      throw new ConflictException(
        'Close the open session before removing this till',
      );
    }
    await this.tillRepository.softDelete({ id: till.id });
    return { message: 'Till removed' };
  }

  /** Owned, enabled till with no open session, for opening a register on it. */
  async claimForSession(businessId: string, tillId: string) {
    const till = await this.findOwned(businessId, tillId);
    if (till.status === PosTillStatus.DISABLED) {
      throw new BadRequestException('This till is disabled');
    }
    const open = await this.sessionRepository.count({
      where: { tillId, status: RegisterSessionStatus.OPEN },
    });
    if (open)
      throw new ConflictException('This till already has an open session');
    till.lastSeenAt = new Date();
    await this.tillRepository.save(till);
    return till;
  }

  count(businessId: string) {
    return this.tillRepository.count({ where: { businessId } });
  }

  /**
   * Per-branch takings and register activity for the branch switcher. Four
   * queries regardless of branch count.
   */
  async branchSummary(businessId: string, currentBranchId?: string) {
    const branches = await this.branchRepository.find({
      where: { businessId },
      select: ['id', 'name', 'address'],
      order: { name: 'ASC' },
    });
    const [salesRows, tillRows, sessionRows] = await Promise.all([
      this.saleRepository
        .createQueryBuilder('sale')
        .select('sale.branchId', 'branchId')
        .addSelect('COALESCE(SUM(sale.total), 0)', 'sum')
        .addSelect('COUNT(sale.id)', 'count')
        .where('sale.businessId = :businessId', { businessId })
        .andWhere('sale.status != :refunded', { refunded: SaleStatus.REFUNDED })
        .andWhere('sale.createdAt >= :today', { today: startOfToday() })
        .groupBy('sale.branchId')
        .getRawMany<{ branchId: string; sum: string; count: string }>(),
      this.tillRepository
        .createQueryBuilder('till')
        .select('till.branchId', 'branchId')
        .addSelect('COUNT(till.id)', 'count')
        .where('till.businessId = :businessId', { businessId })
        .groupBy('till.branchId')
        .getRawMany<{ branchId: string; count: string }>(),
      this.sessionRepository
        .createQueryBuilder('session')
        .select('session.branchId', 'branchId')
        .addSelect('COUNT(session.id)', 'count')
        .where('session.businessId = :businessId', { businessId })
        .andWhere('session.status = :open', {
          open: RegisterSessionStatus.OPEN,
        })
        .groupBy('session.branchId')
        .getRawMany<{ branchId: string; count: string }>(),
    ]);
    const sales = new Map(salesRows.map((row) => [row.branchId, row]));
    const tills = new Map(
      tillRows.map((row) => [row.branchId, Number(row.count)]),
    );
    const sessions = new Map(
      sessionRows.map((row) => [row.branchId, Number(row.count)]),
    );

    return branches.map((branch) => ({
      branchId: branch.id,
      name: branch.name,
      address: branch.address ?? null,
      todaySales: Number(sales.get(branch.id)?.sum ?? 0),
      todayTransactions: Number(sales.get(branch.id)?.count ?? 0),
      tillCount: tills.get(branch.id) ?? 0,
      openSessions: sessions.get(branch.id) ?? 0,
      current: branch.id === currentBranchId,
    }));
  }

  /**
   * The plan's POS terminal cap, or null when uncapped. Only an active or
   * trial plan with a non-negative `posTerminalLimit` caps tills; -1 and an
   * unset limit mean unlimited, so businesses without the field configured
   * are not locked out.
   */
  private async getTerminalLimit(businessId: string): Promise<number | null> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        businessId,
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
      },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
    const limit = subscription?.plan?.posTerminalLimit;
    return limit == null || limit < 0 ? null : limit;
  }

  private async findOwned(businessId: string, id: string) {
    const till = await this.tillRepository.findOne({
      where: { id, businessId },
    });
    if (!till) throw new NotFoundException('Till not found');
    return till;
  }

  private async assertBranch(businessId: string, branchId: string) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId, businessId },
      select: ['id'],
    });
    if (!branch) throw new NotFoundException('Branch not found');
  }
}
