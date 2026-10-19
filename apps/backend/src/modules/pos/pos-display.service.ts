import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PosTill } from './entities/pos-till.entity';
import { PosSale } from './entities/pos-sale.entity';
import { Business } from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { computePosCharges, resolvePosSettings } from './pos-settings.types';
import {
  PosDisplayTipRatingDto,
  PutPosDisplayTicketDto,
} from './dto/pos-display.dto';
import { POS_SOCKET_EVENTS, PosGateway } from './pos.gateway';

/** A ticket left on a display for a whole service is stale by the next day. */
const TICKET_TTL_MS = 12 * 60 * 60 * 1000;
const TIP_PERCENTS = [5, 10, 15];

export interface PosDisplayTicket {
  reference: string | null;
  tableNumber: string | null;
  customerName: string | null;
  orderType: 'dine_in' | 'takeaway';
  lines: {
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  tax: number;
  serviceCharge: number;
  packagingFee: number;
  total: number;
  updatedAt: string;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * The customer-facing display mirrors the ticket on one till. The till pushes
 * its ticket here (priced with the business settings, so the display never
 * shows a total the till would not charge); it is cached per till and
 * broadcast to the till's socket room.
 */
@Injectable()
export class PosDisplayService {
  constructor(
    @InjectRepository(PosTill)
    private readonly tillRepository: Repository<PosTill>,
    @InjectRepository(PosSale)
    private readonly saleRepository: Repository<PosSale>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly gateway: PosGateway,
  ) {}

  /** Everything a display needs on first paint. Four reads (one cached). */
  async get(businessId: string, tillId: string) {
    const till = await this.findTill(businessId, tillId);
    const [business, branch, ticket] = await Promise.all([
      this.businessRepository.findOne({
        where: { id: businessId },
        select: ['id', 'name', 'logoUrl', 'posSettings'],
      }),
      this.branchRepository.findOne({
        where: { id: till.branchId },
        select: ['id', 'name'],
      }),
      this.cache.get<PosDisplayTicket>(this.key(till.id)),
    ]);
    const settings = resolvePosSettings(business?.posSettings);
    const rails = settings.tenderRails ?? {};
    const transfer = rails.transfer?.enabled ? rails.transfer : null;

    return {
      till: { id: till.id, name: till.name, code: till.code },
      venue: {
        name: business?.name ?? null,
        logo: settings.showLogo === false ? null : (business?.logoUrl ?? null),
        branchName: branch?.name ?? null,
      },
      taxLabel: settings.taxLabel ?? 'VAT',
      paymentMethods: {
        cash: rails.cash !== false,
        card: rails.card !== false,
        transfer: !!transfer,
        oneTap: !!rails.oneTap,
      },
      transfer: transfer
        ? {
            bankName: transfer.bankName ?? null,
            accountNumber: transfer.accountNumber ?? null,
            accountName: transfer.accountName ?? null,
          }
        : null,
      ticket: ticket ?? null,
      tipOptions: ticket ? this.tipOptions(ticket.total) : [],
    };
  }

  async putTicket(
    businessId: string,
    tillId: string,
    dto: PutPosDisplayTicketDto,
  ) {
    const till = await this.findTill(businessId, tillId);
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      select: ['id', 'posSettings'],
    });

    const lines = dto.lines.map((line) => ({
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: round2(line.unitPrice * line.quantity),
    }));
    const subtotal = round2(
      lines.reduce((sum, line) => sum + line.lineTotal, 0),
    );
    const discountAmount = Math.min(subtotal, dto.discountAmount ?? 0);
    const charges = computePosCharges(
      business?.posSettings,
      subtotal - discountAmount,
      {
        orderType: dto.orderType,
        waiveServiceCharge: dto.waiveServiceCharge,
      },
    );

    const ticket: PosDisplayTicket = {
      reference: dto.reference ?? null,
      tableNumber: dto.tableNumber ?? null,
      customerName: dto.customerName ?? null,
      orderType: dto.orderType ?? 'dine_in',
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal,
      discountAmount,
      tax: charges.tax,
      serviceCharge: charges.serviceCharge,
      packagingFee: charges.packagingFee,
      total: charges.total,
      updatedAt: new Date().toISOString(),
    };
    await this.cache.set(this.key(till.id), ticket, TICKET_TTL_MS);
    this.gateway.emitToTill(till.id, POS_SOCKET_EVENTS.TICKET_UPDATED, {
      ticket,
      tipOptions: this.tipOptions(ticket.total),
    });
    return ticket;
  }

  async clearTicket(businessId: string, tillId: string, saleId?: string) {
    const till = await this.findTill(businessId, tillId);
    await this.cache.del(this.key(till.id));
    this.gateway.emitToTill(
      till.id,
      saleId
        ? POS_SOCKET_EVENTS.PAYMENT_COMPLETED
        : POS_SOCKET_EVENTS.TICKET_CLEARED,
      { saleId: saleId ?? null },
    );
    return { cleared: true };
  }

  /** Records the tip and rating the customer chose, on the sale when given. */
  async tipRating(
    businessId: string,
    tillId: string,
    dto: PosDisplayTipRatingDto,
  ) {
    const till = await this.findTill(businessId, tillId);
    if (dto.saleId) {
      const result = await this.saleRepository.update(
        { id: dto.saleId, businessId },
        { tipAmount: dto.tipAmount, rating: dto.rating ?? null },
      );
      if (!result.affected) throw new NotFoundException('Sale not found');
    }
    const payload = {
      saleId: dto.saleId ?? null,
      tipAmount: dto.tipAmount,
      rating: dto.rating ?? null,
    };
    this.gateway.emitToTill(till.id, POS_SOCKET_EVENTS.DISPLAY_TIP, payload);
    return payload;
  }

  private tipOptions(total: number) {
    return TIP_PERCENTS.map((percent) => ({
      percent,
      amount: Math.round((total * percent) / 100),
    }));
  }

  private key(tillId: string) {
    return `pos:display:${tillId}`;
  }

  private async findTill(businessId: string, tillId: string) {
    const till = await this.tillRepository.findOne({
      where: { id: tillId, businessId },
      select: ['id', 'name', 'code', 'branchId'],
    });
    if (!till) throw new NotFoundException('Till not found');
    return till;
  }
}
