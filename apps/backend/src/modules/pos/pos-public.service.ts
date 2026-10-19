import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CatalogueOrder,
  CatalogueOrderStatus,
} from '../catalogue-orders/entities/catalogue-order.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { resolvePosSettings } from './pos-settings.types';

const TRACKING_STEPS = [
  CatalogueOrderStatus.NEW,
  CatalogueOrderStatus.PROCESSING,
  CatalogueOrderStatus.READY,
  CatalogueOrderStatus.COMPLETED,
] as const;

/** No-login views for guests ordering from a table QR. */
@Injectable()
export class PosPublicService {
  constructor(
    @InjectRepository(CatalogueOrder)
    private readonly orderRepository: Repository<CatalogueOrder>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  /**
   * An order by its tracking token: status timeline, lines, total, venue and
   * the server's first name. Nothing that identifies the guest or staff
   * beyond that. One joined query plus the business settings.
   */
  async track(token: string) {
    const order = await this.orderRepository.findOne({
      where: { trackingToken: token },
      relations: [
        'items',
        'items.item',
        'items.offer',
        'branch',
        'attendedByUser',
      ],
    });
    if (!order) throw new NotFoundException('Order not found');

    const business = await this.businessRepository.findOne({
      where: { id: order.businessId },
      select: ['id', 'name', 'logoUrl', 'posSettings'],
    });
    const settings = resolvePosSettings(business?.posSettings);
    const timeline = order.statusTimeline ?? {};
    const placedAt = timeline.new ?? order.createdAt.toISOString();
    const prepMinutes = settings.defaultPrepMinutes ?? 15;
    const isClosed =
      order.status === CatalogueOrderStatus.CANCELLED ||
      order.status === CatalogueOrderStatus.REJECTED;
    const currentIndex = TRACKING_STEPS.indexOf(order.status as never);

    return {
      orderId: order.id,
      reference: `#${order.id.slice(0, 8).toUpperCase()}`,
      status: order.status,
      cancelled: isClosed,
      steps: TRACKING_STEPS.map((status, index) => ({
        status,
        at: timeline[status] ?? null,
        reached: !isClosed && currentIndex >= index,
      })),
      tableNumber: order.tableNumber ?? null,
      notes: order.notes ?? null,
      lines: (order.items ?? []).map((line) => ({
        name: line.item?.name ?? line.offer?.name ?? 'Item',
        quantity: line.quantity,
        unitPrice: Number(line.priceAtOrder),
        lineTotal: Number(line.priceAtOrder) * line.quantity,
      })),
      totalAmount: Number(order.totalAmount),
      prepMinutes,
      estimatedReadyAt: new Date(
        new Date(placedAt).getTime() + prepMinutes * 60000,
      ).toISOString(),
      server: order.attendedByUser?.firstName
        ? { firstName: order.attendedByUser.firstName }
        : null,
      venue: {
        businessName: business?.name ?? null,
        branchName: order.branch?.name ?? null,
        logo: settings.showLogo === false ? null : (business?.logoUrl ?? null),
      },
    };
  }

  /**
   * What a guest's cart needs before checkout: whether QR ordering is open
   * and how the bill will be priced. Two queries.
   */
  async orderingInfo(branchId: string) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      select: ['id', 'name', 'businessId'],
    });
    if (!branch) throw new NotFoundException('Branch not found');
    const business = await this.businessRepository.findOne({
      where: { id: branch.businessId },
      select: ['id', 'name', 'logoUrl', 'posSettings'],
    });
    const settings = resolvePosSettings(business?.posSettings);

    return {
      branchId: branch.id,
      branchName: branch.name,
      businessName: business?.name ?? null,
      logo: settings.showLogo === false ? null : (business?.logoUrl ?? null),
      currency: settings.currency ?? 'NGN',
      acceptingOrders: !!settings.selfOrderingEnabled && !settings.rushPause,
      rushPause: !!settings.rushPause,
      maxOrderValue: settings.maxQrOrderValue || null,
      tableCount: settings.tableCount ?? 0,
      prepMinutes: settings.defaultPrepMinutes ?? 15,
      pricing: {
        taxEnabled: !!settings.taxEnabled,
        taxRate: settings.taxRate ?? 0,
        taxLabel: settings.taxLabel ?? 'VAT',
        pricesIncludeTax: !!settings.pricesIncludeTax,
        serviceChargeEnabled: !!settings.serviceChargeEnabled,
        serviceChargeRate: settings.serviceChargeRate ?? 0,
      },
    };
  }
}
