import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import {
  StockCountSession,
  CountSessionStatus,
} from './entities/stock-count-session.entity';
import { StockCountItem } from './entities/stock-count-item.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { Branch } from '../branches/entities/branch.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateCountSessionDto } from './dto/create-count-session.dto';
import { AddCountItemsDto, UpdateCountItemDto } from './dto/add-count-item.dto';
import { CompleteCountDto } from './dto/complete-count.dto';
import {
  ApproveVarianceDto,
  RejectVarianceDto,
} from './dto/approve-variance.dto';
import { CountSessionQueryDto } from './dto/count-session-query.dto';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';

@Injectable()
export class InventoryCountingService {
  constructor(
    @InjectRepository(StockCountSession)
    private readonly sessionRepository: Repository<StockCountSession>,
    @InjectRepository(StockCountItem)
    private readonly itemRepository: Repository<StockCountItem>,
    @InjectRepository(CatalogueItem)
    private readonly catalogueItemRepository: Repository<CatalogueItem>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async createSession(dto: CreateCountSessionDto, user: User) {
    const branch = await this.branchRepository.findOne({
      where: { id: dto.branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const session = this.sessionRepository.create({
      businessId: branch.businessId,
      branchId: dto.branchId,
      startedById: user.id,
      isBlind: dto.isBlind ?? true,
      zone: dto.zone,
      notes: dto.notes,
      status: CountSessionStatus.DRAFT,
    });

    const saved = await this.sessionRepository.save(session);

    if (dto.itemIds && dto.itemIds.length > 0) {
      const items = await this.catalogueItemRepository.find({
        where: { id: In(dto.itemIds), businessId: branch.businessId },
        relations: ['category'],
      });
      await this.populateItems(saved, items);
    }

    return this.sessionRepository.findOne({
      where: { id: saved.id },
      relations: ['branch', 'startedBy'],
    });
  }

  private async populateItems(
    session: StockCountSession,
    items: CatalogueItem[],
  ) {
    const countItems = items.map((item) => {
      const countItem = new StockCountItem();
      countItem.sessionId = session.id;
      countItem.itemId = item.id;
      countItem.itemName = item.name;
      countItem.itemSku = item.sku ?? null;
      countItem.itemCategory = item.category?.name ?? null;
      countItem.itemBarcode = item.barcode ?? null;
      countItem.systemQuantity = item.stockQuantity ?? 0;
      countItem.unitCost = item.costPrice ?? null;
      return countItem;
    });

    await this.itemRepository.save(countItems);

    session.totalItems = countItems.length;
    await this.sessionRepository.save(session);
  }

  async listSessions(businessId: string, query: CountSessionQueryDto) {
    const { page = 1, limit = 10, status, branchId } = query;
    const qb = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.branch', 'branch')
      .leftJoinAndSelect('session.startedBy', 'startedBy')
      .leftJoinAndSelect('session.completedBy', 'completedBy')
      .leftJoinAndSelect('session.approvedBy', 'approvedBy')
      .where('session.businessId = :businessId', { businessId });

    if (status) qb.andWhere('session.status = :status', { status });
    if (branchId) qb.andWhere('session.branchId = :branchId', { branchId });

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor: (query as any)?.cursor || (query as any)?.nextCursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'session',
    });

    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
    };
  }

  async getSession(sessionId: string, businessId: string, user: User) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, businessId },
      relations: ['branch', 'startedBy', 'completedBy', 'approvedBy', 'items'],
    });

    if (!session) throw new NotFoundException('Count session not found');

    const isManager =
      user.role === UserRole.OWNER || user.role === UserRole.MANAGER;
    const isBlindActive =
      session.isBlind &&
      (session.status === CountSessionStatus.DRAFT ||
        session.status === CountSessionStatus.IN_PROGRESS);

    if (isBlindActive && !isManager) {
      session.items = session.items.map((item) => {
        const safeItem = { ...item };
        delete (safeItem as any).systemQuantity;
        return safeItem;
      });
    }

    return session;
  }

  async startSession(sessionId: string, businessId: string, user: User) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, businessId },
      relations: ['items'],
    });

    if (!session) throw new NotFoundException('Count session not found');
    if (session.status !== CountSessionStatus.DRAFT) {
      throw new BadRequestException('Session is not in draft status');
    }

    if (session.items.length === 0) {
      const items = await this.catalogueItemRepository.find({
        where: {
          businessId,
          branches: { id: session.branchId },
        },
        relations: ['category'],
      });
      await this.populateItems(session, items);
    }

    session.status = CountSessionStatus.IN_PROGRESS;
    session.startedAt = new Date();

    return this.sessionRepository.save(session);
  }

  async addItems(sessionId: string, businessId: string, dto: AddCountItemsDto) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, businessId },
    });

    if (!session) throw new NotFoundException('Count session not found');
    if (
      session.status !== CountSessionStatus.DRAFT &&
      session.status !== CountSessionStatus.IN_PROGRESS
    ) {
      throw new BadRequestException('Session is not active');
    }

    const existingItems = await this.itemRepository.find({
      where: { sessionId },
    });
    const existingItemIds = new Set(existingItems.map((i) => i.itemId));

    const newItems = dto.items.filter((i) => !existingItemIds.has(i.itemId));
    const updateItems = dto.items.filter((i) => existingItemIds.has(i.itemId));

    if (newItems.length > 0) {
      const countItems = newItems.map((item) => {
        const ci = new StockCountItem();
        ci.sessionId = sessionId;
        ci.itemId = item.itemId;
        ci.itemName = item.itemName;
        ci.itemSku = item.itemSku ?? null;
        ci.itemCategory = item.itemCategory ?? null;
        ci.itemBarcode = item.itemBarcode ?? null;
        ci.systemQuantity = item.systemQuantity;
        ci.countedQuantity = item.countedQuantity ?? null;
        ci.unitCost = item.unitCost ?? null;
        ci.notes = item.notes ?? null;
        return ci;
      });
      await this.itemRepository.save(countItems);
    }

    for (const item of updateItems) {
      await this.itemRepository.update(
        { sessionId, itemId: item.itemId },
        {
          countedQuantity: item.countedQuantity,
          notes: item.notes,
        },
      );
    }

    const allItems = await this.itemRepository.find({
      where: { sessionId },
    });

    session.totalItems = allItems.length;
    session.countedItems = allItems.filter(
      (i) => i.countedQuantity != null,
    ).length;
    await this.sessionRepository.save(session);

    return allItems;
  }

  async updateItem(
    sessionId: string,
    itemId: string,
    businessId: string,
    dto: UpdateCountItemDto,
  ) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, businessId },
    });

    if (!session) throw new NotFoundException('Count session not found');
    if (
      session.status !== CountSessionStatus.DRAFT &&
      session.status !== CountSessionStatus.IN_PROGRESS
    ) {
      throw new BadRequestException('Session is not active');
    }

    const item = await this.itemRepository.findOne({
      where: { sessionId, itemId },
    });

    if (!item) throw new NotFoundException('Count item not found');

    item.countedQuantity = dto.countedQuantity;
    if (dto.notes !== undefined) item.notes = dto.notes;

    const saved = await this.itemRepository.save(item);

    const counted = await this.itemRepository.count({
      where: { sessionId, countedQuantity: Not(IsNull()) },
    });
    session.countedItems = counted;
    await this.sessionRepository.save(session);

    return saved;
  }

  async completeSession(
    sessionId: string,
    businessId: string,
    user: User,
    dto: CompleteCountDto,
  ) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, businessId },
      relations: ['items'],
    });

    if (!session) throw new NotFoundException('Count session not found');
    if (session.status !== CountSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session must be in progress to complete');
    }

    let itemsWithVariance = 0;
    let totalVarianceValue = 0;

    for (const item of session.items) {
      if (item.countedQuantity == null) {
        item.countedQuantity = 0;
      }

      item.variance = (item.countedQuantity ?? 0) - (item.systemQuantity ?? 0);
      item.varianceValue = (item.variance ?? 0) * (item.unitCost || 0);

      if (item.variance !== 0) {
        itemsWithVariance++;
        totalVarianceValue += item.varianceValue ?? 0;
      }
    }

    await this.itemRepository.save(session.items);

    session.status = CountSessionStatus.COMPLETED;
    session.completedAt = new Date();
    session.completedById = user.id;
    session.itemsWithVariance = itemsWithVariance;
    session.totalVarianceValue = totalVarianceValue;

    return this.sessionRepository.save(session);
  }

  async approveSession(
    sessionId: string,
    businessId: string,
    user: User,
    dto: ApproveVarianceDto,
  ) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, businessId },
      relations: ['items'],
    });

    if (!session) throw new NotFoundException('Count session not found');
    if (session.status !== CountSessionStatus.COMPLETED) {
      throw new BadRequestException(
        'Session must be completed before approval',
      );
    }

    const isManager =
      user.role === UserRole.OWNER || user.role === UserRole.MANAGER;
    if (!isManager) {
      throw new ForbiddenException(
        'Only owners and managers can approve count variances',
      );
    }

    const varianceItemIds = session.items
      .filter((i) => (i.variance ?? 0) !== 0)
      .map((i) => i.itemId);

    if (varianceItemIds.length > 0) {
      const catalogueItems = await this.catalogueItemRepository.find({
        where: { id: In(varianceItemIds), businessId },
      });

      const itemMap = new Map(catalogueItems.map((ci) => [ci.id, ci]));

      for (const countItem of session.items) {
        if ((countItem.variance ?? 0) === 0) continue;

        const catalogueItem = itemMap.get(countItem.itemId);
        if (catalogueItem) {
          catalogueItem.stockQuantity = Math.max(
            0,
            countItem.countedQuantity ?? 0,
          );
        }
      }

      await this.catalogueItemRepository.save(catalogueItems);
    }

    session.status = CountSessionStatus.APPROVED;
    session.approvedById = user.id;

    return this.sessionRepository.save(session);
  }

  async rejectSession(
    sessionId: string,
    businessId: string,
    user: User,
    dto: RejectVarianceDto,
  ) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, businessId },
    });

    if (!session) throw new NotFoundException('Count session not found');
    if (session.status !== CountSessionStatus.COMPLETED) {
      throw new BadRequestException(
        'Session must be completed before rejection',
      );
    }

    session.status = CountSessionStatus.REJECTED;
    session.rejectionReason = dto.reason;

    return this.sessionRepository.save(session);
  }

  async getReconciliationReport(sessionId: string, businessId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, businessId },
      relations: ['branch', 'startedBy', 'completedBy', 'approvedBy', 'items'],
    });

    if (!session) throw new NotFoundException('Count session not found');

    const itemsWithVariance = session.items.filter(
      (item) => item.variance !== null && item.variance !== 0,
    );
    const overCount = itemsWithVariance.filter(
      (item) => (item.variance ?? 0) > 0,
    );
    const underCount = itemsWithVariance.filter(
      (item) => (item.variance ?? 0) < 0,
    );

    return {
      session,
      summary: {
        totalItems: session.totalItems,
        countedItems: session.countedItems,
        itemsWithVariance: session.itemsWithVariance,
        totalVarianceValue: session.totalVarianceValue,
        overCountItems: overCount.length,
        underCountItems: underCount.length,
        overCountValue: overCount.reduce(
          (sum, item) => sum + (item.varianceValue || 0),
          0,
        ),
        underCountValue: underCount.reduce(
          (sum, item) => sum + (item.varianceValue || 0),
          0,
        ),
      },
      itemsWithVariance,
      overCount,
      underCount,
    };
  }
}
