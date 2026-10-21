import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import {
  CatalogueOrder,
  CatalogueOrderStatus,
} from '../catalogue-orders/entities/catalogue-order.entity';
import { CatalogueOrderItem } from '../catalogue-orders/entities/catalogue-order-item.entity';
import { CatalogueOrderService } from '../catalogue-orders/catalogue-orders.service';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../users/entities/user.entity';
import { generateUniqueCode } from '../../common/utils/random.util';
import { StoreQrCode } from './entities/store-qr-code.entity';
import { StoreOrderingSetting } from './entities/store-ordering-setting.entity';
import {
  AssignStoreOrderDto,
  CompleteFromPosDto,
  CreateStoreQrDto,
  RecordStorePaymentDto,
  StoreOrderingSettings,
  StoreOrderQueryDto,
  StoreOrderStatus,
  UpdateStoreOrderItemDto,
  UpdateStoreOrderStatusDto,
  UpdateStoreOrderingSettingsDto,
  UpdateStoreQrDto,
} from './dto/store-ordering.dto';

/** The catalogue status each store stage keeps the order in. */
const CATALOGUE_STATUS: Record<StoreOrderStatus, CatalogueOrderStatus> = {
  new: CatalogueOrderStatus.NEW,
  accepted: CatalogueOrderStatus.PROCESSING,
  preparing: CatalogueOrderStatus.PROCESSING,
  'partially-fulfilled': CatalogueOrderStatus.PROCESSING,
  ready: CatalogueOrderStatus.READY,
  'awaiting-payment': CatalogueOrderStatus.READY,
  paid: CatalogueOrderStatus.READY,
  completed: CatalogueOrderStatus.COMPLETED,
  rejected: CatalogueOrderStatus.REJECTED,
  cancelled: CatalogueOrderStatus.CANCELLED,
};

/** Store stages reachable from each stage through `PATCH …/status`. */
const TRANSITIONS: Record<StoreOrderStatus, StoreOrderStatus[]> = {
  new: ['accepted', 'rejected', 'cancelled'],
  accepted: ['preparing', 'partially-fulfilled', 'cancelled'],
  preparing: ['ready', 'partially-fulfilled', 'cancelled'],
  'partially-fulfilled': ['ready', 'cancelled'],
  ready: ['awaiting-payment', 'completed', 'cancelled'],
  'awaiting-payment': ['cancelled'],
  paid: ['completed', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: [],
};

const PAID = ['paid-in-store', 'paid-pos'];
const CLOSED: StoreOrderStatus[] = ['completed', 'rejected', 'cancelled'];

const DEFAULT_SETTINGS: StoreOrderingSettings = {
  enabled: true,
  usePosForCompletion: false,
  paymentMethods: [
    { id: 'cash', label: 'Cash at Counter', enabled: true },
    { id: 'pos-terminal', label: 'External Card Terminal', enabled: true },
    { id: 'bank-transfer', label: 'Direct Bank Transfer', enabled: true },
    { id: 'ussd', label: 'USSD / Quick Code', enabled: false },
  ],
  activeBranches: {},
  immediatePickup: true,
  scheduledPreOrder: false,
  defaultPrepMinutes: 20,
  pickupInstructions: 'Show your order reference at the counter to collect.',
  guestOrderingAllowed: true,
  acceptOrdersOutsideHours: false,
  allowSubstitutions: true,
  autoNotifyCustomerSms: false,
  autoNotifyCustomerWhatsApp: false,
  notifiedStaff: [],
};

const ORDER_RELATIONS = [
  'items',
  'items.item',
  'items.offer',
  'customer',
  'branch',
  'attendedByUser',
];

/** Midnight in Lagos (UTC+1, no DST) as a UTC instant, for "today" totals. */
function lagosMidnight(now = new Date()): Date {
  const lagos = new Date(now.getTime() + 3_600_000);
  return new Date(
    Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate()) -
      3_600_000,
  );
}

const fullName = (user?: User | null) =>
  user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : undefined;

/**
 * Store ordering: scan, pick and pay at the counter. A store order is a
 * catalogue order with a `source`; this service adds the store stages, line
 * adjustments, staff assignment and counter payments on top, and moves the
 * catalogue status through `CatalogueOrderService.updateStatus` so stock,
 * loyalty and customer notifications behave exactly as for any order.
 */
@Injectable()
export class StoreOrderingService {
  constructor(
    @InjectRepository(CatalogueOrder)
    private readonly orders: Repository<CatalogueOrder>,
    @InjectRepository(CatalogueOrderItem)
    private readonly orderItems: Repository<CatalogueOrderItem>,
    @InjectRepository(StoreQrCode)
    private readonly qrCodes: Repository<StoreQrCode>,
    @InjectRepository(StoreOrderingSetting)
    private readonly settingsRepo: Repository<StoreOrderingSetting>,
    @InjectRepository(Branch)
    private readonly branches: Repository<Branch>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly catalogueOrders: CatalogueOrderService,
    private readonly config: ConfigService,
  ) {}

  // ---------------------------------------------------------------- orders

  private stageOf(order: CatalogueOrder): StoreOrderStatus {
    if (order.storeStatus) return order.storeStatus as StoreOrderStatus;
    switch (order.status) {
      case CatalogueOrderStatus.PROCESSING:
        return 'preparing';
      case CatalogueOrderStatus.READY:
        return 'ready';
      case CatalogueOrderStatus.COMPLETED:
        return 'completed';
      case CatalogueOrderStatus.REJECTED:
        return 'rejected';
      case CatalogueOrderStatus.CANCELLED:
      case CatalogueOrderStatus.REFUNDED:
        return 'cancelled';
      default:
        return 'new';
    }
  }

  private lineTotal(line: CatalogueOrderItem): number {
    const unit = Math.max(
      0,
      Number(line.priceAtOrder) + (line.substitution?.priceDiff ?? 0),
    );
    return unit * line.quantity;
  }

  /** The order as the store-ordering screens read it. */
  private view(order: CatalogueOrder) {
    // Lines in the order they were added, so the list is stable between reads.
    const lines = [...(order.items ?? [])].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
        a.id.localeCompare(b.id),
    );
    const items = lines.map((line) => {
      const unitPrice = Math.max(
        0,
        Number(line.priceAtOrder) + (line.substitution?.priceDiff ?? 0),
      );
      const original = line.item?.name ?? line.offer?.name ?? 'Item';
      return {
        id: line.id,
        productId: line.itemId ?? line.offerId,
        name: line.substitution?.replacementName ?? original,
        qty: line.quantity,
        unitPrice,
        totalPrice: unitPrice * line.quantity,
        image: line.item?.mainImage ?? line.offer?.mainImage ?? null,
        type: line.offerId ? 'deal' : (line.item?.itemType ?? 'product'),
        available: line.available,
        removed: line.removed,
        substituted: line.substitution ?? undefined,
      };
    });
    const estimatedTotal = (order.items ?? []).reduce(
      (sum, line) => sum + Number(line.priceAtOrder) * line.quantity,
      0,
    );
    const confirmedTotal = Number(order.totalAmount);
    return {
      id: order.id,
      orderRef: `VT-SO-${order.id.slice(0, 8).toUpperCase()}`,
      customerName: fullName(order.customer) || 'Guest',
      customerPhone: order.customer?.phone ?? '',
      customerEmail: order.customer?.email ?? undefined,
      createdAt: order.createdAt,
      branchId: order.branchId,
      branchName: order.branch?.name ?? '',
      origin: order.source,
      sourceRef: order.storeQrId ?? undefined,
      placementDetails: order.tableNumber ?? undefined,
      items,
      estimatedTotal,
      confirmedTotal,
      isTotalConfirmed: confirmedTotal !== estimatedTotal,
      status: this.stageOf(order),
      assignedStaff: fullName(order.attendedByUser),
      assignedStaffId: order.attendedById ?? undefined,
      customerNotes: order.notes ?? undefined,
      statusHistory: (order.storeHistory ?? []).map((entry) => ({
        status: entry.status,
        timestamp: entry.at,
        note: entry.note,
        staffName: entry.staffName,
      })),
      payment: {
        status: order.paymentStatus,
        ...(order.payment
          ? {
              method: order.payment.method,
              amountDue: order.payment.amountDue,
              amountReceived: order.payment.amountReceived,
              change: order.payment.change,
              balance: order.payment.balance,
              reference: order.payment.reference,
              recordedBy: order.payment.recordedByName,
              recordedAt: order.payment.recordedAt,
              posTransactionId: order.payment.posSaleId,
              notes: order.payment.notes,
            }
          : {}),
      },
    };
  }

  async list(businessId: string, query: StoreOrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    if (query.branchId) await this.ownBranch(query.branchId, businessId);
    const [rows, total] = await this.orders.findAndCount({
      where: {
        businessId,
        source: query.source ?? Not(IsNull()),
        ...(query.branchId ? { branchId: query.branchId } : {}),
        ...(query.status ? { storeStatus: query.status } : {}),
      },
      relations: ORDER_RELATIONS,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: rows.map((row) => this.view(row)), total, page, limit };
  }

  private async load(businessId: string, id: string) {
    const order = await this.orders.findOne({
      where: { id, businessId, source: Not(IsNull()) },
      relations: ORDER_RELATIONS,
    });
    if (!order) throw new NotFoundException('Store order not found');
    return order;
  }

  async get(businessId: string, id: string) {
    return this.view(await this.load(businessId, id));
  }

  /**
   * Moves the order to a store stage: the catalogue status follows through
   * `CatalogueOrderService.updateStatus` (stock, loyalty, notifications), then
   * the stage and a history entry are saved.
   */
  private async moveTo(
    order: CatalogueOrder,
    stage: StoreOrderStatus,
    staff: User,
    note: string,
    extra: Partial<
      Pick<CatalogueOrder, 'totalAmount' | 'payment' | 'paymentStatus'>
    > = {},
  ) {
    const target = CATALOGUE_STATUS[stage];
    if (
      order.stockDeducted &&
      (target === CatalogueOrderStatus.CANCELLED ||
        target === CatalogueOrderStatus.REJECTED)
    ) {
      // The catalogue gives back the stock of every line on cancel/reject;
      // dropped lines already had theirs back, so take it once more first.
      for (const line of order.items ?? []) {
        if (line.itemId && (!line.available || line.removed)) {
          await this.adjustStock(line.itemId, -line.quantity);
        }
      }
    }
    if (target !== order.status) {
      await this.catalogueOrders.updateStatus(
        order.id,
        { status: target },
        order.businessId,
        staff,
      );
    }
    const history = [
      {
        status: stage,
        at: new Date().toISOString(),
        note,
        staffName: fullName(staff),
      },
      ...(order.storeHistory ?? []),
    ];
    await this.orders.update(order.id, {
      storeStatus: stage,
      storeHistory: history,
      ...extra,
    });
    return this.get(order.businessId, order.id);
  }

  async updateStatus(
    businessId: string,
    staff: User,
    id: string,
    dto: UpdateStoreOrderStatusDto,
  ) {
    const order = await this.load(businessId, id);
    const current = this.stageOf(order);
    if (dto.status === current) return this.view(order);
    if (dto.status === 'paid') {
      throw new BadRequestException('Record the payment to mark an order paid');
    }
    if (!TRANSITIONS[current].includes(dto.status)) {
      throw new ConflictException(
        `Cannot move an order from "${current}" to "${dto.status}"`,
      );
    }
    if (dto.status === 'completed' && !PAID.includes(order.paymentStatus)) {
      throw new BadRequestException(
        'Record the payment before completing the order',
      );
    }
    return this.moveTo(
      order,
      dto.status,
      staff,
      dto.note || `Status updated to ${dto.status}`,
    );
  }

  async updateItem(
    businessId: string,
    staff: User,
    id: string,
    itemId: string,
    dto: UpdateStoreOrderItemDto,
  ) {
    const order = await this.load(businessId, id);
    const stage = this.stageOf(order);
    if (CLOSED.includes(stage) || PAID.includes(order.paymentStatus)) {
      throw new ConflictException('This order can no longer be changed');
    }
    const line = order.items.find((candidate) => candidate.id === itemId);
    if (!line) throw new NotFoundException('Order line not found');
    if (dto.substitution) {
      const settings = await this.settings(businessId);
      if (!settings.allowSubstitutions) {
        throw new BadRequestException('Substitutions are switched off');
      }
      line.substitution = {
        originalName:
          line.substitution?.originalName ??
          line.item?.name ??
          line.offer?.name ??
          'Item',
        replacementName: dto.substitution.replacementName.trim(),
        priceDiff: dto.substitution.priceDiff,
      };
    }
    const wasKept = line.available && !line.removed;
    if (dto.available !== undefined) line.available = dto.available;
    if (dto.removed !== undefined) line.removed = dto.removed;
    const kept = line.available && !line.removed;
    await this.orderItems.update(line.id, {
      available: line.available,
      removed: line.removed,
      substitution: line.substitution,
    });
    // A dropped product line is not sold: give its stock back (and take it
    // again if the line is restored). Deal lines keep the catalogue's handling.
    if (order.stockDeducted && line.itemId && wasKept !== kept) {
      await this.adjustStock(
        line.itemId,
        kept ? -line.quantity : line.quantity,
      );
    }

    const totalAmount = order.items
      .filter((candidate) => candidate.available && !candidate.removed)
      .reduce((sum, candidate) => sum + this.lineTotal(candidate), 0);
    const removedSomething = order.items.some(
      (candidate) => candidate.removed || !candidate.available,
    );
    const nextStage: StoreOrderStatus =
      removedSomething && (stage === 'accepted' || stage === 'preparing')
        ? 'partially-fulfilled'
        : stage;
    const note = dto.substitution
      ? `Swapped ${line.substitution?.originalName} for ${line.substitution?.replacementName}`
      : dto.removed
        ? 'Removed an item'
        : dto.available === false
          ? 'Marked an item unavailable'
          : 'Updated an item';
    return this.moveTo(order, nextStage, staff, note, { totalAmount });
  }

  /**
   * Moves a tracked product's stock by `delta` in one statement, keeping its
   * status in line the way order stock deduction does (out of stock at 0, low
   * stock at or under minStock, active again above it). Untracked items
   * (null stock) are left alone.
   */
  private async adjustStock(itemId: string, delta: number) {
    await this.orders.manager.query(
      `UPDATE "catalogue_items" SET
         "stockQuantity" = GREATEST(0, "stockQuantity" + $2),
         "status" = CASE
           WHEN "status" NOT IN ('active', 'low_stock', 'out_of_stock') THEN "status"::text
           WHEN GREATEST(0, "stockQuantity" + $2) = 0 THEN 'out_of_stock'
           WHEN "minStock" IS NOT NULL AND GREATEST(0, "stockQuantity" + $2) <= "minStock" THEN 'low_stock'
           ELSE 'active' END::"catalogue_items_status_enum"
       WHERE "id" = $1 AND "stockQuantity" IS NOT NULL`,
      [itemId, delta],
    );
  }

  async assign(businessId: string, id: string, dto: AssignStoreOrderDto) {
    const order = await this.load(businessId, id);
    const member = await this.users.findOne({
      where: { id: dto.staffUserId, businessId },
      select: ['id'],
    });
    if (!member) {
      throw new NotFoundException('Team member not found in this business');
    }
    await this.orders.update(order.id, { attendedById: member.id });
    return this.get(businessId, id);
  }

  private paymentRecord(
    staff: User,
    method: string,
    due: number,
    received: number,
    reference?: string,
    notes?: string,
    posSaleId?: string,
  ) {
    return {
      method,
      amountDue: due,
      amountReceived: received,
      change: method === 'cash' ? Math.max(0, received - due) : 0,
      balance: Math.max(0, due - received),
      reference: reference || `REC-${Date.now().toString(36).toUpperCase()}`,
      ...(notes ? { notes } : {}),
      ...(posSaleId ? { posSaleId } : {}),
      recordedById: staff.id,
      recordedByName: fullName(staff) || 'Staff',
      recordedAt: new Date().toISOString(),
    };
  }

  async recordPayment(
    businessId: string,
    staff: User,
    id: string,
    dto: RecordStorePaymentDto,
  ) {
    let order = await this.load(businessId, id);
    const stage = this.stageOf(order);
    if (CLOSED.includes(stage)) {
      throw new ConflictException('This order is closed');
    }
    if (PAID.includes(order.paymentStatus)) {
      throw new ConflictException('This order is already paid');
    }
    // A part-payment already taken counts towards the total: this payment
    // covers the balance by default, and the record holds the running sum.
    const due = Number(order.totalAmount);
    const alreadyPaid =
      order.paymentStatus === 'partially-paid'
        ? Number(order.payment?.amountReceived ?? 0)
        : 0;
    const thisPayment = dto.amountReceived ?? Math.max(0, due - alreadyPaid);
    const received = alreadyPaid + thisPayment;
    const full = received >= due;
    const payment = this.paymentRecord(
      staff,
      dto.method,
      due,
      received,
      dto.reference,
      dto.notes,
    );
    const nextStage: StoreOrderStatus = !full
      ? 'awaiting-payment'
      : dto.markCompleted
        ? 'completed'
        : 'paid';
    if (
      nextStage === 'completed' &&
      !['ready', 'awaiting-payment', 'paid'].includes(stage)
    ) {
      // Completing straight from an earlier stage still passes through ready,
      // so the catalogue status follows the normal fulfilment path.
      await this.moveTo(order, 'ready', staff, 'Order ready');
      order = await this.load(businessId, id);
    }
    return this.moveTo(
      order,
      nextStage,
      staff,
      `Payment of ₦${thisPayment.toLocaleString('en-NG')} recorded via ${dto.method}${dto.notes ? ` (${dto.notes})` : ''}`,
      {
        payment,
        paymentStatus: full ? 'paid-in-store' : 'partially-paid',
      },
    );
  }

  async collect(businessId: string, staff: User, id: string) {
    const order = await this.load(businessId, id);
    if (!PAID.includes(order.paymentStatus)) {
      throw new BadRequestException(
        'Record the payment before completing the order',
      );
    }
    if (this.stageOf(order) === 'completed') return this.view(order);
    return this.moveTo(
      order,
      'completed',
      staff,
      'Customer collected the order',
    );
  }

  async completeFromPos(
    businessId: string,
    staff: User,
    id: string,
    dto: CompleteFromPosDto,
  ) {
    let order = await this.load(businessId, id);
    if (CLOSED.includes(this.stageOf(order))) {
      throw new ConflictException('This order is closed');
    }
    const [sale] = await this.orders.manager.query<{ id: string }[]>(
      `SELECT "id" FROM "pos_sales" WHERE "id" = $1 AND "businessId" = $2 AND "deletedAt" IS NULL`,
      [dto.posSaleId, businessId],
    );
    if (!sale) throw new NotFoundException('POS sale not found');
    const due = Number(order.totalAmount);
    if (!['ready', 'awaiting-payment', 'paid'].includes(this.stageOf(order))) {
      await this.moveTo(order, 'ready', staff, 'Order ready');
      order = await this.load(businessId, id);
    }
    return this.moveTo(
      order,
      'completed',
      staff,
      `Paid on VEMTAP POS (${dto.tender})`,
      {
        payment: this.paymentRecord(
          staff,
          'pos-integrated',
          due,
          due,
          `POS-${dto.posSaleId.slice(0, 8).toUpperCase()}`,
          dto.notes,
          dto.posSaleId,
        ),
        paymentStatus: 'paid-pos',
      },
    );
  }

  /** Dashboard numbers in one aggregate query. */
  async summary(businessId: string, branchId?: string) {
    if (branchId) await this.ownBranch(branchId, businessId);
    const params: unknown[] = [businessId, lagosMidnight()];
    if (branchId) params.push(branchId);
    const [row] = await this.orders.manager.query<Record<string, string>[]>(
      `SELECT
         COUNT(*) FILTER (WHERE "storeStatus" = 'new' OR ("storeStatus" IS NULL AND "status" = 'new'))::int AS "newOrders",
         COUNT(*) FILTER (WHERE "storeStatus" IN ('accepted','preparing','partially-fulfilled'))::int AS "preparing",
         COUNT(*) FILTER (WHERE "storeStatus" = 'ready')::int AS "readyForPickup",
         COUNT(*) FILTER (WHERE "storeStatus" IN ('ready','awaiting-payment','paid'))::int AS "awaitingCollection",
         COUNT(*) FILTER (WHERE "storeStatus" = 'completed' AND "updatedAt" >= $2)::int AS "completedToday",
         COALESCE(SUM("totalAmount") FILTER (
           WHERE "paymentStatus" IN ('paid-in-store','paid-pos') AND "updatedAt" >= $2
         ), 0)::float AS "totalRevenueToday"
       FROM "catalogue_orders"
       WHERE "businessId" = $1 AND "source" IS NOT NULL AND "deletedAt" IS NULL
         ${branchId ? 'AND "branchId" = $3' : ''}`,
      params,
    );
    return {
      newOrders: Number(row?.newOrders ?? 0),
      preparing: Number(row?.preparing ?? 0),
      readyForPickup: Number(row?.readyForPickup ?? 0),
      awaitingCollection: Number(row?.awaitingCollection ?? 0),
      completedToday: Number(row?.completedToday ?? 0),
      totalRevenueToday: Number(row?.totalRevenueToday ?? 0),
    };
  }

  // -------------------------------------------------------------- QR codes

  private destinationUrl(code: string) {
    const app = (
      this.config.get<string>('VEMTAP_APP_URL') ?? 'https://vemtap.com'
    ).replace(/\/+$/, '');
    return `${app}/order/${encodeURIComponent(code)}`;
  }

  private async ownBranch(branchId: string, businessId: string) {
    const branch = await this.branches.findOne({
      where: { id: branchId, businessId },
      select: ['id', 'name'],
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  /** QR codes with order and revenue counts, from one grouped query. */
  async listQrCodes(businessId: string) {
    const rows = await this.qrCodes.manager.query<
      (StoreQrCode & {
        branchName: string;
        ordersCount: number;
        revenueGenerated: number;
      })[]
    >(
      `SELECT q.*, b."name" AS "branchName",
         COUNT(o."id")::int AS "ordersCount",
         COALESCE(SUM(o."totalAmount") FILTER (WHERE o."paymentStatus" IN ('paid-in-store','paid-pos')), 0)::float AS "revenueGenerated"
       FROM "store_qr_codes" q
       JOIN "branches" b ON b."id" = q."branchId"
       LEFT JOIN "catalogue_orders" o ON o."storeQrId" = q."id" AND o."deletedAt" IS NULL
       WHERE q."businessId" = $1 AND q."deletedAt" IS NULL
       GROUP BY q."id", b."name"
       ORDER BY q."createdAt" DESC
       LIMIT 200`,
      [businessId],
    );
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      branchId: row.branchId,
      branchName: row.branchName,
      destinationUrl: this.destinationUrl(row.code),
      targetLabel: row.targetLabel ?? row.name,
      targetId: row.targetId,
      active: row.isActive,
      createdAt: row.createdAt,
      scansCount: row.scansCount,
      ordersCount: Number(row.ordersCount),
      revenueGenerated: Number(row.revenueGenerated),
    }));
  }

  async createQrCode(businessId: string, dto: CreateStoreQrDto) {
    const branch = await this.ownBranch(dto.branchId, businessId);
    const saved = await this.qrCodes.save(
      this.qrCodes.create({
        businessId,
        branchId: branch.id,
        code: `SQ${generateUniqueCode(8)}`,
        name: dto.name.trim(),
        type: dto.type,
        targetLabel: dto.targetLabel?.trim() || null,
        targetId: dto.targetId ?? null,
      }),
    );
    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      type: saved.type,
      branchId: saved.branchId,
      branchName: branch.name,
      destinationUrl: this.destinationUrl(saved.code),
      targetLabel: saved.targetLabel ?? saved.name,
      targetId: saved.targetId,
      active: saved.isActive,
      createdAt: saved.createdAt,
      scansCount: 0,
      ordersCount: 0,
      revenueGenerated: 0,
    };
  }

  async updateQrCode(businessId: string, id: string, dto: UpdateStoreQrDto) {
    const qr = await this.qrCodes.findOne({ where: { id, businessId } });
    if (!qr) throw new NotFoundException('QR code not found');
    if (dto.name !== undefined) qr.name = dto.name.trim();
    if (dto.targetLabel !== undefined)
      qr.targetLabel = dto.targetLabel.trim() || null;
    if (dto.isActive !== undefined) qr.isActive = dto.isActive;
    await this.qrCodes.save(qr);
    const [row] = (await this.listQrCodes(businessId)).filter(
      (candidate) => candidate.id === id,
    );
    return row;
  }

  /**
   * What a customer's phone needs after scanning: the branch, the QR's target
   * and whether ordering is open. Counts the scan. Paused or unknown → 404.
   */
  async scan(code: string) {
    const qr = await this.qrCodes.findOne({ where: { code, isActive: true } });
    if (!qr) throw new NotFoundException('QR code not found');
    await this.qrCodes.increment({ id: qr.id }, 'scansCount', 1);
    const [branch, settings] = await Promise.all([
      this.branches.findOne({
        where: { id: qr.branchId },
        relations: ['business'],
      }),
      this.settings(qr.businessId),
    ]);
    if (!branch) throw new NotFoundException('QR code not found');
    return {
      code: qr.code,
      name: qr.name,
      type: qr.type,
      targetLabel: qr.targetLabel,
      targetId: qr.targetId,
      branch: { id: branch.id, name: branch.name },
      business: {
        id: branch.businessId,
        name: branch.business?.name ?? '',
        uniqueCode: branch.business?.uniqueCode ?? null,
      },
      ordering: {
        open: settings.enabled && settings.activeBranches[branch.id] !== false,
        guestOrderingAllowed: settings.guestOrderingAllowed,
        pickupInstructions: settings.pickupInstructions,
        defaultPrepMinutes: settings.defaultPrepMinutes,
        paymentMethods: settings.paymentMethods.filter(
          (method) => method.enabled,
        ),
      },
    };
  }

  // -------------------------------------------------------------- settings

  async settings(businessId: string): Promise<StoreOrderingSettings> {
    const row = await this.settingsRepo.findOne({ where: { businessId } });
    return { ...DEFAULT_SETTINGS, ...(row?.settings ?? {}) };
  }

  async updateSettings(
    businessId: string,
    dto: UpdateStoreOrderingSettingsDto,
  ): Promise<StoreOrderingSettings> {
    const current = await this.settings(businessId);
    let activeBranches = current.activeBranches;
    if (dto.activeBranches) {
      // Keep only the caller's own branches, with boolean values.
      const ids = Object.keys(dto.activeBranches);
      const owned = ids.length
        ? await this.branches.find({
            where: {
              id: In(ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id))),
              businessId,
            },
            select: ['id'],
          })
        : [];
      activeBranches = { ...current.activeBranches };
      for (const branch of owned) {
        activeBranches[branch.id] = dto.activeBranches[branch.id] === true;
      }
    }
    // The validated DTO has every optional key (unset ones undefined); only
    // the fields actually sent may replace stored values.
    const sent = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as Partial<StoreOrderingSettings>;
    const next: StoreOrderingSettings = {
      ...current,
      ...sent,
      activeBranches,
      paymentMethods: dto.paymentMethods ?? current.paymentMethods,
      notifiedStaff: dto.notifiedStaff ?? current.notifiedStaff,
    };
    await this.settingsRepo.upsert({ businessId, settings: next }, [
      'businessId',
    ]);
    return next;
  }
}
