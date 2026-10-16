import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import {
  CatalogueOrder,
  CatalogueOrderStatus,
} from '../catalogue-orders/entities/catalogue-order.entity';
import { CatalogueOrderService } from '../catalogue-orders/catalogue-orders.service';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../users/entities/user.entity';
import { PosSale } from './entities/pos-sale.entity';
import {
  KITCHEN_STATUSES,
  KitchenStatus,
  PosKitchenQueryDto,
  UpdateKitchenOrderStatusDto,
} from './dto/pos-kitchen.dto';

const MAX_KITCHEN_ORDERS = 200;

/** Allowed forward steps; anything open can also be cancelled. */
const NEXT_STATUS: Partial<
  Record<CatalogueOrderStatus, CatalogueOrderStatus[]>
> = {
  [CatalogueOrderStatus.NEW]: [
    CatalogueOrderStatus.PROCESSING,
    CatalogueOrderStatus.READY,
  ],
  [CatalogueOrderStatus.PROCESSING]: [CatalogueOrderStatus.READY],
  [CatalogueOrderStatus.READY]: [CatalogueOrderStatus.COMPLETED],
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

@Injectable()
export class PosKitchenService {
  constructor(
    @InjectRepository(CatalogueOrder)
    private readonly orderRepository: Repository<CatalogueOrder>,
    @InjectRepository(PosSale)
    private readonly saleRepository: Repository<PosSale>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly catalogueOrderService: CatalogueOrderService,
  ) {}

  /**
   * Today's orders for one branch, oldest open order first, with counts per
   * stage, the average new→ready time and the unpaid total. Four queries:
   * orders (with lines), stage counts, prep average, paid lookup.
   */
  async stream(user: User, query: PosKitchenQueryDto) {
    const branchId = await this.resolveBranch(user, query.branchId);
    const today = startOfToday();
    const statuses = query.status ? [query.status] : [...KITCHEN_STATUSES];

    const [orders, countRows, prepRow] = await Promise.all([
      this.orderRepository.find({
        where: {
          businessId: user.businessId,
          branchId,
          status: In(statuses),
          createdAt: MoreThanOrEqual(today),
        },
        relations: ['items', 'items.item', 'items.offer', 'customer'],
        order: { createdAt: 'ASC' },
        take: MAX_KITCHEN_ORDERS,
      }),
      this.orderRepository
        .createQueryBuilder('o')
        .select('o.status', 'status')
        .addSelect('COUNT(o.id)', 'count')
        .where('o.businessId = :businessId', { businessId: user.businessId })
        .andWhere('o.branchId = :branchId', { branchId })
        .andWhere('o.createdAt >= :today', { today })
        .andWhere('o.status IN (:...statuses)', { statuses: KITCHEN_STATUSES })
        .groupBy('o.status')
        .getRawMany<{ status: KitchenStatus; count: string }>(),
      this.orderRepository
        .createQueryBuilder('o')
        .select(
          `AVG(EXTRACT(EPOCH FROM ((o."statusTimeline"->>'ready')::timestamptz - (o."statusTimeline"->>'new')::timestamptz)) / 60)`,
          'minutes',
        )
        .where('o.businessId = :businessId', { businessId: user.businessId })
        .andWhere('o.branchId = :branchId', { branchId })
        .andWhere('o.createdAt >= :today', { today })
        .andWhere(`o."statusTimeline"->>'ready' IS NOT NULL`)
        .andWhere(`o."statusTimeline"->>'new' IS NOT NULL`)
        .getRawOne<{ minutes: string | null }>(),
    ]);

    const paidIds = orders.length
      ? new Set(
          (
            await this.saleRepository.find({
              where: { orderId: In(orders.map((order) => order.id)) },
              select: ['id', 'orderId'],
            })
          ).map((sale) => sale.orderId),
        )
      : new Set<string>();

    const counts = Object.fromEntries(
      KITCHEN_STATUSES.map((status) => [status, 0]),
    ) as Record<KitchenStatus, number>;
    for (const row of countRows) counts[row.status] = Number(row.count);

    const now = Date.now();
    const data = orders.map((order) => {
      const paid =
        paidIds.has(order.id) ||
        order.status === CatalogueOrderStatus.COMPLETED;
      return {
        id: order.id,
        reference: `#${order.id.slice(0, 8).toUpperCase()}`,
        status: order.status,
        tableNumber: order.tableNumber ?? null,
        notes: order.notes ?? null,
        guestName: order.customer?.firstName ?? null,
        guestPhone: order.customer?.phone ?? null,
        totalAmount: Number(order.totalAmount),
        paid,
        createdAt: order.createdAt,
        statusTimeline: order.statusTimeline ?? null,
        elapsedMinutes: Math.max(
          0,
          Math.floor((now - new Date(order.createdAt).getTime()) / 60000),
        ),
        lines: (order.items ?? []).map((line) => ({
          name: line.item?.name ?? line.offer?.name ?? 'Item',
          quantity: line.quantity,
          lineTotal: Number(line.priceAtOrder) * line.quantity,
        })),
      };
    });

    const minutes = prepRow?.minutes != null ? Number(prepRow.minutes) : null;
    return {
      data,
      counts,
      averagePrepMinutes: minutes != null ? Math.round(minutes) : null,
      unpaidTotal: data
        .filter(
          (order) =>
            !order.paid && order.status !== CatalogueOrderStatus.COMPLETED,
        )
        .reduce((sum, order) => sum + order.totalAmount, 0),
    };
  }

  /**
   * Move an order along the kitchen flow. Delegates to the order service so
   * stock, loyalty and customer notifications behave exactly as they do from
   * the orders hub; the live event is emitted there too.
   */
  async updateStatus(
    user: User,
    orderId: string,
    dto: UpdateKitchenOrderStatusDto,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, businessId: user.businessId },
      select: ['id', 'status'],
    });
    if (!order) throw new NotFoundException('Order not found');

    const allowed =
      dto.status === CatalogueOrderStatus.CANCELLED
        ? order.status !== CatalogueOrderStatus.COMPLETED &&
          order.status !== CatalogueOrderStatus.CANCELLED
        : (NEXT_STATUS[order.status] ?? []).includes(dto.status);
    if (!allowed) {
      throw new BadRequestException(
        `An order that is ${order.status} cannot move to ${dto.status}`,
      );
    }

    return this.catalogueOrderService.updateStatus(
      orderId,
      { status: dto.status, reason: dto.reason },
      user.businessId,
      user,
    );
  }

  private async resolveBranch(user: User, branchId?: string) {
    const id = branchId ?? user.branchId;
    if (!id) {
      throw new BadRequestException('branchId is required for this account');
    }
    const branch = await this.branchRepository.findOne({
      where: { id, businessId: user.businessId },
      select: ['id'],
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch.id;
  }
}
