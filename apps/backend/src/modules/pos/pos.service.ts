import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  ILike,
  In,
  DataSource,
  EntityManager,
  SelectQueryBuilder,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PosSale } from './entities/pos-sale.entity';
import {
  PaymentMethod,
  PosOverrideAction,
  SaleStatus,
} from './entities/pos-enums';
import { PosSaleItem } from './entities/pos-sale-item.entity';
import { PosSplitPayment } from './entities/pos-split-payment.entity';
import { PosHeldSale } from './entities/pos-held-sale.entity';
import { PosHeldSaleItem } from './entities/pos-held-sale-item.entity';
import { PosRegisterSession } from './entities/pos-register-session.entity';
import { RegisterSessionStatus } from './entities/pos-enums';

import {
  CatalogueItem,
  CatalogueItemStatus,
} from '../catalogue/entities/catalogue-item.entity';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from '../catalogue/entities/catalogue-offer.entity';
import {
  CatalogueOrder,
  CatalogueOrderStatus,
} from '../catalogue-orders/entities/catalogue-order.entity';
import { CatalogueOrderItem } from '../catalogue-orders/entities/catalogue-order-item.entity';
import { CatalogueOrderService } from '../catalogue-orders/catalogue-orders.service';
import { CreatePosSaleDto } from './dto/create-pos-sale.dto';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { ProcessPosOrderPaymentDto } from './dto/process-pos-order-payment.dto';
import { PosSaleQueryDto } from './dto/pos-sale-query.dto';
import { UpdatePosSaleStatusDto } from './dto/update-pos-sale-status.dto';
import { HoldPosSaleDto } from './dto/hold-pos-sale.dto';
import {
  OpenRegisterDto,
  CloseRegisterDto,
  RegisterHistoryQueryDto,
} from './dto/register.dto';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';
import { PosCustomerQueryDto } from './dto/pos-customer-query.dto';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { User, UserRole } from '../users/entities/user.entity';
import {
  FinancialTransaction,
  FosTransactionType,
  FosPlatform,
} from '../fos-core/entities/financial-transaction.entity';
import { PushNotificationService } from '../notifications/push-notification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { PosRefund } from './entities/pos-refund.entity';
import { PosRefundItem } from './entities/pos-refund-item.entity';
import { PosCashDrop } from './entities/pos-cash-drop.entity';
import { CashDropDto } from './dto/cash-drop.dto';
import { StockMovementService } from '../inventory-counting/stock-movement.service';
import { StockMovementType } from '../inventory-counting/entities/stock-movement.entity';
import {
  computePosCharges,
  PosSettings,
  resolvePosSettings,
} from './pos-settings.types';
import { PosTillsService } from './pos-tills.service';
import { PosStaffPinsService } from './pos-staff-pins.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ORDER_EVENTS,
  OrderLifecycleEvent,
  stampStatus,
} from '../catalogue-orders/order-events';
import { PosCustomerSegment } from './dto/pos-customer-query.dto';

export interface BatchSyncResult {
  clientRef: string | null;
  status: 'synced' | 'duplicate' | 'conflict' | 'failed';
  /** Kept for clients written before `status` existed. */
  success: boolean;
  saleId?: string;
  receiptNumber?: string;
  error?: string;
}

interface PosCustomerRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: Date;
  totalSpent: string;
  totalVisits: string;
  firstVisitAt: Date | null;
  lastVisitAt: Date | null;
}

const VIP_MIN_VISITS = 10;
const VIP_MIN_SPEND = 100_000;
const NEW_CUSTOMER_DAYS = 30;
const LAPSED_CUSTOMER_DAYS = 60;

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(PosSale)
    private readonly saleRepository: Repository<PosSale>,
    @InjectRepository(PosSaleItem)
    private readonly saleItemRepository: Repository<PosSaleItem>,
    @InjectRepository(PosSplitPayment)
    private readonly splitPaymentRepository: Repository<PosSplitPayment>,
    @InjectRepository(PosHeldSale)
    private readonly heldSaleRepository: Repository<PosHeldSale>,
    @InjectRepository(PosHeldSaleItem)
    private readonly heldSaleItemRepository: Repository<PosHeldSaleItem>,
    @InjectRepository(PosRegisterSession)
    private readonly registerSessionRepository: Repository<PosRegisterSession>,
    @InjectRepository(PosRefund)
    private readonly refundRepository: Repository<PosRefund>,
    @InjectRepository(PosRefundItem)
    private readonly refundItemRepository: Repository<PosRefundItem>,
    @InjectRepository(PosCashDrop)
    private readonly cashDropRepository: Repository<PosCashDrop>,
    @InjectRepository(CatalogueItem)
    private readonly productRepository: Repository<CatalogueItem>,
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(CatalogueOrder)
    private readonly orderRepository: Repository<CatalogueOrder>,
    @InjectRepository(CatalogueOrderItem)
    private readonly orderItemRepository: Repository<CatalogueOrderItem>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FinancialTransaction)
    private readonly fosTransactionRepository: Repository<FinancialTransaction>,
    private readonly dataSource: DataSource,
    private readonly pushNotificationService: PushNotificationService,
    private readonly notificationsService: NotificationsService,
    private readonly catalogueOrderService: CatalogueOrderService,
    @Inject(forwardRef(() => LoyaltyService))
    private readonly loyaltyService: LoyaltyService,
    private readonly stockMovementService: StockMovementService,
    private readonly tillsService: PosTillsService,
    private readonly staffPinsService: PosStaffPinsService,
    @Optional()
    private readonly eventEmitter?: EventEmitter2,
  ) {}

  /**
   * @param options.enforceDiscountPolicy Check the cashier discount cap. On for
   *   live checkout; off for offline replays, which already happened at the
   *   till and cannot wait for a supervisor.
   */
  async completeSale(
    dto: CreatePosSaleDto,
    cashier: User,
    options: { enforceDiscountPolicy?: boolean } = {},
  ) {
    return this.dataSource.transaction(async (manager) => {
      const branchRepo = manager.getRepository(Branch);
      const saleRepo = manager.getRepository(PosSale);
      const saleItemRepo = manager.getRepository(PosSaleItem);
      const splitPaymentRepo = manager.getRepository(PosSplitPayment);
      const productRepo = manager.getRepository(CatalogueItem);
      const businessRepo = manager.getRepository(Business);
      const userRepo = manager.getRepository(User);
      const registerSessionRepo = manager.getRepository(PosRegisterSession);

      const branch = await branchRepo.findOne({
        where: { id: dto.branchId },
      });
      if (!branch) throw new NotFoundException('Branch not found');

      if (branch.businessId !== cashier.businessId) {
        throw new BadRequestException(
          'Branch does not belong to your business',
        );
      }

      if (dto.clientRef) {
        const existingSale = await saleRepo.findOne({
          where: {
            businessId: branch.businessId,
            clientRef: dto.clientRef,
          },
        });
        if (existingSale) {
          return this.findOneSale(existingSale.id, branch.businessId, manager);
        }
      }

      let customer: User | null = null;
      if (dto.customerId) {
        customer = await userRepo.findOne({
          where: { id: dto.customerId },
        });
      }

      const business = await businessRepo.findOne({
        where: { id: branch.businessId },
      });

      const items: PosSaleItem[] = [];
      const productsById = new Map<string, CatalogueItem>();
      let subtotal = 0;
      let totalDiscount = 0;

      for (const itemDto of dto.items) {
        const product = await productRepo.findOne({
          where: { id: itemDto.productId, businessId: branch.businessId },
        });
        if (!product)
          throw new NotFoundException(`Product ${itemDto.productId} not found`);
        productsById.set(product.id, product);

        if (
          product.stockQuantity !== null &&
          product.stockQuantity < itemDto.quantity
        ) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}: ${product.stockQuantity} available, ${itemDto.quantity} requested`,
          );
        }

        const itemDiscount = itemDto.discount || 0;
        const lineTotal =
          Number(product.price) * itemDto.quantity - itemDiscount;

        const saleItem = saleItemRepo.create({
          productId: itemDto.productId,
          productName: product.name,
          sku: product.sku || '',
          barcode: product.barcode || '',
          unitPrice: Number(product.price),
          costPrice: product.costPrice ? Number(product.costPrice) : 0,
          quantity: itemDto.quantity,
          discount: itemDiscount,
          totalPrice: lineTotal,
        });

        items.push(saleItem);
        subtotal += Number(product.price) * itemDto.quantity;
        totalDiscount += itemDiscount;

        const previousQuantity = product.stockQuantity ?? 0;
        this.deductStock(product, itemDto.quantity);
        await productRepo.save(product);
        await this.stockMovementService.record({
          itemId: product.id,
          businessId: branch.businessId,
          branchId: branch.id,
          userId: cashier.id,
          type: StockMovementType.SALE,
          previousQuantity,
          newQuantity: product.stockQuantity ?? previousQuantity,
          reason: 'POS sale',
        });
      }

      const cartDiscount = dto.cartDiscountAmount || 0;
      const totalDiscountAmount = totalDiscount + cartDiscount;
      const charges = computePosCharges(
        business?.posSettings,
        subtotal - totalDiscountAmount,
        {
          orderType: dto.orderType,
          waiveServiceCharge: dto.waiveServiceCharge,
        },
      );
      const { tax, serviceCharge, packagingFee, total } = charges;

      if (options.enforceDiscountPolicy && totalDiscountAmount > 0) {
        await this.assertDiscountAllowed(
          business?.posSettings,
          cashier,
          subtotal,
          totalDiscountAmount,
          dto.overrideToken,
        );
      }

      const receiptNumber = await this.generateReceiptNumber(
        branch.businessId,
        manager,
      );

      if (dto.payment.method === PaymentMethod.SPLIT) {
        if (!dto.payment.splitDetails || dto.payment.splitDetails.length < 2) {
          throw new BadRequestException(
            'Split payment requires at least 2 payment methods',
          );
        }
        const splitTotal = dto.payment.splitDetails.reduce(
          (acc, s) => acc + s.amount,
          0,
        );
        if (Math.abs(splitTotal - dto.payment.amountPaid) > 0.01) {
          throw new BadRequestException(
            'Split payment amounts must sum to the total paid',
          );
        }
      }

      const splitPayments: PosSplitPayment[] = [];
      if (
        dto.payment.method === PaymentMethod.SPLIT &&
        dto.payment.splitDetails
      ) {
        for (const sp of dto.payment.splitDetails) {
          const splitPayment = splitPaymentRepo.create({
            method: sp.method,
            amount: sp.amount,
            payer: sp.payer ?? null,
          });
          splitPayments.push(splitPayment);
        }
      }

      const cashierName =
        `${cashier.firstName} ${cashier.lastName}`.trim() || cashier.email;

      let orderedAt = new Date();
      if (dto.orderedAt) {
        const clientDate = new Date(dto.orderedAt);
        if (!isNaN(clientDate.getTime())) {
          const now = new Date();
          const tenMinutesInMs = 10 * 60 * 1000;
          if (clientDate.getTime() > now.getTime() + tenMinutesInMs) {
            orderedAt = now;
          } else {
            orderedAt = clientDate;
          }
        }
      }

      const openRegister = await registerSessionRepo.findOne({
        where: {
          cashierId: cashier.id,
          status: RegisterSessionStatus.OPEN,
          branchId: branch.id,
        },
      });

      const sale = saleRepo.create({
        businessId: branch.businessId,
        branchId: branch.id,
        cashierId: cashier.id,
        cashierName,
        customerId: customer?.id || null,
        receiptNumber,
        subtotal,
        discountAmount: totalDiscountAmount,
        tax,
        serviceCharge,
        packagingFee,
        orderType: dto.orderType ?? 'dine_in',
        registerSessionId: openRegister?.id ?? null,
        total,
        paymentMethod: dto.payment.method,
        amountPaid: dto.payment.amountPaid,
        change: dto.payment.change || 0,
        hideCustomerInfoOnReceipt: dto.hideCustomerInfoOnReceipt || false,
        notes: dto.notes || null,
        status: SaleStatus.COMPLETED,
        items,
        splitPayments,
        clientRef: dto.clientRef || null,
        orderedAt,
      } as unknown as PosSale);

      const savedSale = await saleRepo.save(sale);

      if (customer) {
        customer.lastActive = new Date();
        await userRepo.save(customer);
      }

      await this.recordFosTransaction(
        {
          businessId: branch.businessId,
          amount: total,
          paymentMethod: dto.payment.method,
          referenceId: savedSale.id,
          description: `POS Sale ${receiptNumber}`,
        },
        manager,
      );

      if (openRegister) {
        openRegister.totalSales = Number(openRegister.totalSales) + total;
        openRegister.transactionCount =
          Number(openRegister.transactionCount) + 1;
        if (dto.payment.method === PaymentMethod.CASH) {
          openRegister.expectedCash =
            Number(openRegister.expectedCash) + dto.payment.amountPaid;
        }
        await registerSessionRepo.save(openRegister);
      }

      // Auto-award loyalty points if the business has loyalty enabled and a customer is linked
      if (customer) {
        try {
          if (business?.posSettings?.loyaltyEnabled) {
            let totalPoints = 0;
            let totalSpent = 0;
            for (const item of items) {
              if (item.productId) {
                const product = productsById.get(item.productId);
                if (
                  product?.enableLoyaltyPoints &&
                  product.loyaltyPointsValue
                ) {
                  totalPoints += product.loyaltyPointsValue * item.quantity;
                } else if (product?.loyaltyPoints) {
                  // Fallback to legacy loyaltyPoints field
                  totalPoints += product.loyaltyPoints * item.quantity;
                }
                if (product?.price) {
                  totalSpent += product.price * item.quantity;
                }
              }
            }
            if (totalPoints > 0) {
              await this.loyaltyService.awardPoints(
                customer.id,
                totalPoints,
                branch.businessId,
                branch.id,
                `POS Sale ${receiptNumber}`,
                cashier.id,
              );
            } else {
              // Fall back to the business's active loyalty rule (spending-based)
              const rule = await this.loyaltyService.getRules(
                branch.businessId,
                branch.id,
              );
              if (rule?.isActive && rule.spendingBaseAmount > 0) {
                if (totalSpent > 0) {
                  const rulePoints = Math.floor(
                    (totalSpent / rule.spendingBaseAmount) *
                      rule.spendingBasePoints,
                  );
                  if (rulePoints > 0) {
                    await this.loyaltyService.awardPoints(
                      customer.id,
                      rulePoints,
                      branch.businessId,
                      branch.id,
                      `POS Sale ${receiptNumber} (spending-based)`,
                      cashier.id,
                    );
                  }
                }
              }
            }
          }
        } catch (error) {
          // Loyalty failure should not block the sale
          console.error(
            `[POS] Failed to auto-award loyalty points for sale ${receiptNumber}:`,
            error,
          );
        }
      }

      return this.findOneSale(savedSale.id, branch.businessId, manager);
    });
  }

  /**
   * Replays offline sales one by one. Each result says what happened to that
   * sale so the device can clear its queue precisely:
   * - `synced`: created now.
   * - `duplicate`: this `clientRef` was already on the server (an earlier push
   *   landed but the device never heard back); the existing sale is returned.
   * - `conflict`: the server refused it on business rules (stock, branch,
   *   split totals), so a person has to look at it.
   * - `failed`: anything else; safe to retry.
   * Already-synced refs are found with one query before the loop.
   */
  async batchSyncSales(
    dtos: CreatePosSaleDto[],
    cashier: User,
  ): Promise<BatchSyncResult[]> {
    const refs = dtos
      .map((dto) => dto.clientRef)
      .filter((ref): ref is string => !!ref);
    const existing = refs.length
      ? await this.saleRepository.find({
          where: { businessId: cashier.businessId, clientRef: In(refs) },
          select: ['id', 'clientRef', 'receiptNumber'],
        })
      : [];
    const existingByRef = new Map(
      existing.map((sale) => [sale.clientRef, sale]),
    );

    const results: BatchSyncResult[] = [];
    for (const dto of dtos) {
      const clientRef = dto.clientRef || null;
      const already = clientRef ? existingByRef.get(clientRef) : undefined;
      if (already) {
        results.push({
          clientRef,
          status: 'duplicate',
          success: true,
          saleId: already.id,
          receiptNumber: already.receiptNumber,
        });
        continue;
      }
      try {
        const sale = await this.completeSale(dto, cashier);
        results.push({
          clientRef,
          status: 'synced',
          success: true,
          saleId: sale.id,
          receiptNumber: sale.receiptNumber,
        });
      } catch (error) {
        const isRuleError =
          error instanceof BadRequestException ||
          error instanceof NotFoundException;
        results.push({
          clientRef,
          status: isRuleError ? 'conflict' : 'failed',
          success: false,
          error:
            error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
    return results;
  }

  async placeOrder(
    dto: CreatePosOrderDto,
    staff?: User,
  ): Promise<CatalogueOrder> {
    const branch = await this.branchRepository.findOne({
      where: { id: dto.branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    // Guest (no-login) ordering follows the venue's self-ordering switches.
    const business = await this.businessRepository.findOne({
      where: { id: branch.businessId },
      select: ['id', 'posSettings'],
    });
    const settings = resolvePosSettings(business?.posSettings);
    if (!staff) {
      if (!settings.selfOrderingEnabled) {
        throw new ForbiddenException('This venue is not taking QR orders');
      }
      if (settings.rushPause) {
        throw new ForbiddenException(
          'The kitchen has paused new QR orders for a moment. Please ask a member of staff.',
        );
      }
    }

    // Resolve customer
    let customer: User | null = null;

    if (staff && dto.customerId) {
      customer = await this.userRepository.findOne({
        where: { id: dto.customerId },
      });
      if (!customer) throw new NotFoundException('Customer not found');
    } else if (dto.phone) {
      if (!dto.firstName || !dto.lastName) {
        throw new BadRequestException(
          'Customer first name and last name are required when providing a phone number',
        );
      }
      customer = await this.userRepository.findOne({
        where: { phone: dto.phone },
      });
      if (!customer && dto.email) {
        customer = await this.userRepository.findOne({
          where: { email: dto.email },
        });
      }
      if (!customer) {
        const defaultPassword = randomBytes(9)
          .toString('base64url')
          .slice(0, 12);
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const dummyEmail = `guest_${dto.phone.replace(/\+/g, '')}@vemtap.dummy`;
        customer = this.userRepository.create({
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email || dummyEmail,
          role: UserRole.CUSTOMER,
          password: hashedPassword,
          uniqueCode: `CUST-${Math.floor(100000 + Math.random() * 900000)}`,
        });
        await this.userRepository.save(customer);
      }
    } else {
      throw new BadRequestException(
        'Customer information is required — provide phone (for new/guest) or customerId (for existing)',
      );
    }

    // Process items and calculate total
    let totalAmount = 0;
    const orderItems: CatalogueOrderItem[] = [];

    for (const itemDto of dto.items) {
      if (!itemDto.itemId && !itemDto.offerId) {
        throw new BadRequestException(
          'Each order item must have either itemId or offerId',
        );
      }

      if (itemDto.itemId && itemDto.offerId) {
        throw new BadRequestException(
          'Each order item must have either itemId or offerId, not both',
        );
      }

      if (itemDto.itemId) {
        const item = await this.productRepository.findOne({
          where: { id: itemDto.itemId, businessId: branch.businessId },
          relations: ['branches'],
        });

        if (!item)
          throw new NotFoundException(`Item ${itemDto.itemId} not found`);
        if (!item.branches?.some((b) => b.id === branch.id)) {
          throw new BadRequestException(
            `Item ${item.name} is not available in this branch`,
          );
        }
        if (item.status === CatalogueItemStatus.SUSPENDED || item.isSuspended) {
          throw new BadRequestException(
            `Item ${item.name} is currently suspended`,
          );
        }
        if (item.stockQuantity !== null && !item.allowBackOrder) {
          if (item.stockQuantity < itemDto.quantity) {
            throw new BadRequestException(
              `Insufficient stock for ${item.name}`,
            );
          }
        }

        const orderItem = this.orderItemRepository.create({
          itemId: item.id,
          quantity: itemDto.quantity,
          priceAtOrder: Number(item.price),
          loyaltyPointsAtOrder: item.loyaltyPoints,
        });
        orderItems.push(orderItem);
        totalAmount += Number(item.price) * itemDto.quantity;
      } else if (itemDto.offerId) {
        const offer = await this.offerRepository.findOne({
          where: { id: itemDto.offerId, branchId: branch.id },
          relations: ['items'],
        });

        if (!offer)
          throw new NotFoundException(
            `Offer ${itemDto.offerId} not found in this branch`,
          );
        if (offer.status !== CatalogueOfferStatus.ACTIVE) {
          throw new BadRequestException(`Offer ${offer.name} is not active`);
        }
        if (offer.quantity !== null && offer.quantity < itemDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for offer ${offer.name}`,
          );
        }

        for (const offerItem of offer.items) {
          if (offerItem.stockQuantity !== null && !offerItem.allowBackOrder) {
            if (offerItem.stockQuantity < itemDto.quantity) {
              throw new BadRequestException(
                `Insufficient stock for item ${offerItem.name} in offer ${offer.name}`,
              );
            }
          }
        }

        const orderItem = this.orderItemRepository.create({
          offerId: offer.id,
          quantity: itemDto.quantity,
          priceAtOrder: Number(offer.calculatedPrice),
          loyaltyPointsAtOrder: offer.loyaltyPoints,
        });
        orderItems.push(orderItem);
        totalAmount += Number(offer.calculatedPrice) * itemDto.quantity;
      }
    }

    if (orderItems.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const maxQrOrderValue = settings.maxQrOrderValue ?? 0;
    if (!staff && maxQrOrderValue > 0 && totalAmount > maxQrOrderValue) {
      throw new BadRequestException(
        `QR orders are limited to ${this.formatNaira(maxQrOrderValue)}. Please order the rest with a member of staff.`,
      );
    }

    // Create the order
    const order = this.orderRepository.create({
      businessId: branch.businessId,
      branchId: branch.id,
      customerId: customer.id,
      notes: dto.notes,
      tableNumber: dto.tableNumber,
      totalAmount,
      items: orderItems,
      stockDeducted: true,
      trackingToken: randomBytes(18).toString('base64url'),
      statusTimeline: stampStatus(null, CatalogueOrderStatus.NEW),
    });

    const savedOrder = await this.orderRepository.save(order);
    this.eventEmitter?.emit(ORDER_EVENTS.CREATED, {
      orderId: savedOrder.id,
      businessId: savedOrder.businessId,
      branchId: savedOrder.branchId,
      status: savedOrder.status ?? CatalogueOrderStatus.NEW,
      trackingToken: savedOrder.trackingToken,
      tableNumber: savedOrder.tableNumber ?? null,
      at: new Date().toISOString(),
    } satisfies OrderLifecycleEvent);

    // Deduct stock immediately
    for (const orderItem of savedOrder.items) {
      if (orderItem.itemId) {
        const item = await this.productRepository.findOne({
          where: { id: orderItem.itemId },
        });
        if (item) {
          this.deductStock(item, orderItem.quantity);
          await this.productRepository.save(item);
        }
      } else if (orderItem.offerId) {
        const offer = await this.offerRepository.findOne({
          where: { id: orderItem.offerId },
          relations: ['items'],
        });
        if (offer) {
          if (offer.quantity !== null) {
            offer.quantity -= orderItem.quantity;
            if (offer.quantity <= 0) {
              offer.quantity = 0;
              offer.status = CatalogueOfferStatus.INACTIVE;
            }
            await this.offerRepository.save(offer);
          }
          for (const offerItem of offer.items) {
            this.deductStock(offerItem, orderItem.quantity);
            await this.productRepository.save(offerItem);
          }
        }
      }
    }

    // Notify branch staff
    const staffName = staff
      ? `${staff.firstName} ${staff.lastName}`.trim()
      : `${customer.firstName} ${customer.lastName}`.trim();
    // Shared with the in-app row below, so the push tap and the bell entry for
    // the same order can never point at different places. Without a `url` the
    // push resolves to no destination and a staff tap only opens the app.
    const orderUrl = `/orders/${savedOrder.id}`;
    this.pushNotificationService
      .sendToBranchStaff(
        branch.id,
        'New POS Order',
        `A new POS order (#${savedOrder.id.slice(0, 8)}) has been placed by ${staffName}.`,
        {
          orderId: savedOrder.id,
          url: orderUrl,
          type: 'NEW_POS_ORDER',
          category: 'orderUpdates',
        },
      )
      .catch((err) => console.error('Failed to send staff notification:', err));

    // Same reason as the catalogue path: a push alone leaves nothing behind
    // if the device is offline or has no token.
    this.notificationsService
      .createForBranchStaff(
        branch.id,
        branch.businessId,
        'New POS Order',
        `A new POS order (#${savedOrder.id.slice(0, 8)}) has been placed by ${staffName}.`,
        'new_pos_order',
        orderUrl,
        null,
        'new_pos_order',
      )
      .catch((err) =>
        console.error('Failed to create staff notification row:', err),
      );

    const result = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.item', 'items.offer', 'customer', 'branch'],
    });
    return result!;
  }

  async processOrderPayment(
    orderId: string,
    dto: ProcessPosOrderPaymentDto,
    staff: User,
  ): Promise<{ sale: PosSale; order: CatalogueOrder }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, businessId: staff.businessId },
      relations: ['items', 'items.item', 'items.offer', 'customer', 'branch'],
    });
    if (!order) throw new NotFoundException('Order not found');

    if (
      order.status !== CatalogueOrderStatus.NEW &&
      order.status !== CatalogueOrderStatus.PROCESSING
    ) {
      throw new BadRequestException(
        `Cannot process payment for order with status "${order.status}". Only "new" or "processing" orders can be paid.`,
      );
    }

    // Validate payment details
    if (dto.paymentMethod === PaymentMethod.SPLIT) {
      if (!dto.splitDetails || dto.splitDetails.length < 2) {
        throw new BadRequestException(
          'Split payment requires at least 2 payment methods',
        );
      }
      const splitTotal = dto.splitDetails.reduce((acc, s) => acc + s.amount, 0);
      if (Math.abs(splitTotal - dto.amountPaid) > 0.01) {
        throw new BadRequestException(
          'Split payment amounts must sum to the total amount paid',
        );
      }
    }

    // Build PosSale from order items
    const saleItems: PosSaleItem[] = [];
    let subtotal = 0;

    for (const orderItem of order.items) {
      const itemName =
        orderItem.item?.name || orderItem.offer?.name || 'Unknown';
      const unitPrice = Number(orderItem.priceAtOrder);
      const lineTotal = unitPrice * orderItem.quantity;

      const saleItem = this.saleItemRepository.create({
        productId: orderItem.itemId || undefined,
        productName: itemName,
        sku: orderItem.item?.sku || '',
        barcode: orderItem.item?.barcode || '',
        unitPrice,
        costPrice: orderItem.item?.costPrice
          ? Number(orderItem.item.costPrice)
          : 0,
        quantity: orderItem.quantity,
        discount: 0,
        totalPrice: lineTotal,
      });
      saleItems.push(saleItem);
      subtotal += lineTotal;
    }

    const business = await this.businessRepository.findOne({
      where: { id: order.businessId },
      select: ['id', 'posSettings'],
    });
    const { tax, serviceCharge, packagingFee, total } = computePosCharges(
      business?.posSettings,
      Number(order.totalAmount),
      { orderType: dto.orderType, waiveServiceCharge: dto.waiveServiceCharge },
    );

    const openRegister = await this.registerSessionRepository.findOne({
      where: {
        cashierId: staff.id,
        status: RegisterSessionStatus.OPEN,
        branchId: order.branchId,
      },
    });

    const receiptNumber = await this.generateReceiptNumber(order.businessId);
    const cashierName =
      `${staff.firstName} ${staff.lastName}`.trim() || staff.email;

    const splitPayments: PosSplitPayment[] = [];
    if (dto.paymentMethod === PaymentMethod.SPLIT && dto.splitDetails) {
      for (const sp of dto.splitDetails) {
        splitPayments.push(
          this.splitPaymentRepository.create({
            method: sp.method,
            amount: sp.amount,
            payer: sp.payer ?? null,
          }),
        );
      }
    }

    const sale = this.saleRepository.create({
      businessId: order.businessId,
      branchId: order.branchId,
      cashierId: staff.id,
      cashierName,
      customerId: order.customerId,
      receiptNumber,
      subtotal,
      discountAmount: 0,
      tax,
      serviceCharge,
      packagingFee,
      orderType: dto.orderType ?? 'dine_in',
      registerSessionId: openRegister?.id ?? null,
      total,
      paymentMethod: dto.paymentMethod,
      amountPaid: dto.amountPaid,
      change: dto.change || 0,
      hideCustomerInfoOnReceipt: dto.hideCustomerInfoOnReceipt || false,
      notes: null,
      status: SaleStatus.COMPLETED,
      items: saleItems,
      splitPayments,
      orderId: order.id,
    } as unknown as PosSale);

    const savedSale = await this.saleRepository.save(sale);

    // Update order status to COMPLETED (awards loyalty, generates rewards, sends notifications)
    await this.catalogueOrderService.updateStatus(
      orderId,
      { status: CatalogueOrderStatus.COMPLETED },
      staff.businessId,
      staff,
    );

    // Record FOS transaction
    await this.recordFosTransaction({
      businessId: order.businessId,
      amount: total,
      paymentMethod: dto.paymentMethod,
      referenceId: savedSale.id,
      description: `POS Order Payment ${receiptNumber}`,
    });

    if (openRegister) {
      openRegister.totalSales = Number(openRegister.totalSales) + total;
      openRegister.transactionCount = Number(openRegister.transactionCount) + 1;
      if (dto.paymentMethod === PaymentMethod.CASH) {
        openRegister.expectedCash =
          Number(openRegister.expectedCash) + dto.amountPaid;
      }
      await this.registerSessionRepository.save(openRegister);
    }

    // Update customer lastActive
    if (order.customer) {
      order.customer.lastActive = new Date();
      await this.userRepository.save(order.customer);
    }

    const updatedOrder = await this.orderRepository.findOne({
      where: { id: order.id },
      relations: ['items', 'items.item', 'items.offer', 'customer', 'branch'],
    });
    return {
      sale: await this.findOneSale(savedSale.id, order.businessId),
      order: updatedOrder!,
    };
  }

  async adjustStock(
    id: string,
    businessId: string,
    quantity: number,
    options: { reason?: string; userId?: string; branchId?: string } = {},
  ) {
    const product = await this.productRepository.findOne({
      where: { id, businessId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const previousQuantity = product.stockQuantity ?? 0;
    product.stockQuantity = quantity;
    this.autoUpdateStatus(product);
    const saved = await this.productRepository.save(product);
    await this.stockMovementService.record({
      itemId: product.id,
      businessId,
      branchId: options.branchId ?? null,
      userId: options.userId,
      type: StockMovementType.ADJUST,
      previousQuantity,
      newQuantity: quantity,
      reason: options.reason?.trim() || 'Manual stock adjustment',
    });
    return saved;
  }

  /**
   * Sales page plus a `meta` block for the ledger header: counts per status
   * (ignoring the status filter, so every chip has a number), gross takings and
   * the tender mix. Two queries: the page and one grouped aggregate.
   */
  async findAllSales(businessId: string, query: PosSaleQueryDto) {
    const { page = 1, limit = 10, status } = query;
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('sale.splitPayments', 'splitPayments')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.cashier', 'cashier')
      .leftJoinAndSelect('sale.branch', 'branch')
      .where('sale.businessId = :businessId', { businessId });
    this.applySaleFilters(qb, query);
    if (status) qb.andWhere('sale.status = :status', { status });

    const metaQb = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoin('sale.customer', 'customer')
      .select('sale.status', 'status')
      .addSelect('sale.paymentMethod', 'method')
      .addSelect('COUNT(sale.id)', 'count')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'sum')
      .where('sale.businessId = :businessId', { businessId })
      .groupBy('sale.status')
      .addGroupBy('sale.paymentMethod');
    this.applySaleFilters(metaQb, query);

    const [result, metaRows] = await Promise.all([
      paginateWithCursor({
        queryBuilder: qb,
        cursor: (query as any)?.cursor || (query as any)?.nextCursor,
        page,
        limit,
        sortField: 'createdAt',
        sortOrder: 'DESC',
        entityAlias: 'sale',
      }),
      metaQb.getRawMany<{
        status: SaleStatus;
        method: PaymentMethod;
        count: string;
        sum: string;
      }>(),
    ]);

    const counts: Record<SaleStatus, number> = {
      [SaleStatus.COMPLETED]: 0,
      [SaleStatus.REFUNDED]: 0,
      [SaleStatus.PARTIAL_REFUND]: 0,
    };
    const byMethod: Record<string, number> = {};
    let grossTotal = 0;
    for (const row of metaRows) {
      counts[row.status] = (counts[row.status] ?? 0) + Number(row.count);
      if (row.status === SaleStatus.REFUNDED) continue;
      const sum = Number(row.sum);
      grossTotal += sum;
      byMethod[row.method] = (byMethod[row.method] ?? 0) + sum;
    }

    return {
      // Assigned onto the entity (not spread) so the serializer still applies
      // the User @Exclude rules to the nested customer and cashier.
      data: result.data.map((sale) =>
        Object.assign(sale, {
          itemCount: (sale.items ?? []).reduce(
            (sum, item) => sum + Number(item.quantity),
            0,
          ),
          customerName: this.displayName(sale.customer),
        }),
      ),
      meta: {
        counts,
        grossTotal: Math.round(grossTotal * 100) / 100,
        byMethod,
      },
      total: result.total,
      page: result.page,
      limit: result.limit,
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
    };
  }

  async findOneSale(id: string, businessId: string, manager?: EntityManager) {
    const saleRepo = manager
      ? manager.getRepository(PosSale)
      : this.saleRepository;
    const sale = await saleRepo.findOne({
      where: { id, businessId },
      relations: [
        'items',
        'splitPayments',
        'customer',
        'cashier',
        'branch',
        'refunds',
      ],
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  /**
   * One sale for the transaction and e-receipt screens: the sale with its
   * shift, plus the loyalty points the customer earned on it. Three queries.
   */
  async getSaleDetail(id: string, businessId: string) {
    const sale = await this.saleRepository.findOne({
      where: { id, businessId },
      relations: [
        'items',
        'splitPayments',
        'customer',
        'cashier',
        'branch',
        'refunds',
        'registerSession',
      ],
    });
    if (!sale) throw new NotFoundException('Sale not found');

    const [business, pointsEarned] = await Promise.all([
      this.businessRepository.findOne({
        where: { id: businessId },
        select: ['id', 'name', 'logoUrl', 'address', 'posSettings'],
      }),
      sale.customerId
        ? this.loyaltyService.getPointsEarnedForReason(
            sale.customerId,
            businessId,
            `POS Sale ${sale.receiptNumber}`,
          )
        : Promise.resolve(0),
    ]);
    const settings = business?.posSettings ?? {};

    return Object.assign(sale, {
      itemCount: (sale.items ?? []).reduce(
        (sum, item) => sum + Number(item.quantity),
        0,
      ),
      customerName: this.displayName(sale.customer),
      pointsEarned,
      receipt: {
        businessName: business?.name ?? null,
        logo: settings.showLogo === false ? null : (business?.logoUrl ?? null),
        header: settings.receiptHeader ?? null,
        footer: settings.receiptFooter ?? null,
        address:
          settings.receiptAddress ??
          sale.branch?.address ??
          business?.address ??
          null,
        phone: settings.receiptPhone ?? null,
        tin: settings.tin ?? null,
        taxLabel: settings.taxLabel ?? 'VAT',
        width: settings.receiptWidth ?? 80,
      },
    });
  }

  async updateSaleStatus(
    id: string,
    dto: UpdatePosSaleStatusDto,
    businessId: string,
    refundedById?: string,
    requester?: User,
  ) {
    const sale = await this.findOneSale(id, businessId);

    // The owner is the policy's author; everyone else needs a supervisor
    // approval when the business turned the refund PIN on.
    if (requester && requester.role !== UserRole.OWNER) {
      const business = await this.businessRepository.findOne({
        where: { id: businessId },
        select: ['id', 'posSettings'],
      });
      if (
        resolvePosSettings(business?.posSettings).permissions?.refundRequiresPin
      ) {
        await this.staffPinsService.assertOverride(
          dto.overrideToken,
          businessId,
          PosOverrideAction.REFUND,
          sale.id,
        );
      }
    }

    // Can only refund COMPLETED or PARTIAL_REFUND sales
    if (
      sale.status !== SaleStatus.COMPLETED &&
      sale.status !== SaleStatus.PARTIAL_REFUND
    ) {
      throw new BadRequestException(
        'Only completed or partially refunded sales can be refunded',
      );
    }

    let refundAmount = 0;
    const refundItemsToSave: PosRefundItem[] = [];

    if (dto.status === SaleStatus.REFUNDED) {
      // Full Refund: refund all remaining quantities of all items
      for (const item of sale.items) {
        const remainingQty = item.quantity - (item.refundedQuantity || 0);
        if (remainingQty > 0) {
          if (item.productId) {
            const product = await this.productRepository.findOne({
              where: { id: item.productId, businessId },
            });
            if (product) {
              const previousQuantity = product.stockQuantity ?? 0;
              this.restoreStock(product, remainingQty);
              await this.productRepository.save(product);
              await this.stockMovementService.record({
                itemId: product.id,
                businessId,
                branchId: sale.branchId,
                userId: refundedById,
                type: StockMovementType.RETURN,
                previousQuantity,
                newQuantity: product.stockQuantity ?? previousQuantity,
                reason: 'POS sale refund',
                referenceId: sale.id,
              });
            }
          }
          const itemPrice = Number(item.unitPrice);
          const itemDiscount = Number(item.discount || 0) / item.quantity;
          const effectivePrice = itemPrice - itemDiscount;
          const lineRefundAmount = effectivePrice * remainingQty;

          item.refundedQuantity = item.quantity;
          await this.saleItemRepository.save(item);

          const refundItem = this.refundItemRepository.create({
            saleItemId: item.id,
            quantity: remainingQty,
            amount: lineRefundAmount,
          });
          refundItemsToSave.push(refundItem);
          refundAmount += lineRefundAmount;
        }
      }

      // Calculate final total refund amount (remaining sale total)
      const existingRefundsSum =
        sale.refunds?.reduce((acc, r) => acc + Number(r.refundAmount), 0) || 0;
      refundAmount = Number(sale.total) - existingRefundsSum;
      if (refundAmount < 0) refundAmount = 0;

      sale.status = SaleStatus.REFUNDED;
      sale.refundReason = dto.reason || null;
      sale.refundedById = refundedById || null;
      sale.refundedAt = new Date();
      await this.saleRepository.save(sale);
    } else if (dto.status === SaleStatus.PARTIAL_REFUND) {
      if (!dto.refundItems || dto.refundItems.length === 0) {
        throw new BadRequestException(
          'Partial refund requires specifying items to refund',
        );
      }

      for (const refundItemDto of dto.refundItems) {
        const item = sale.items.find((i) => i.id === refundItemDto.saleItemId);
        if (!item) {
          throw new NotFoundException(
            `Sale item ${refundItemDto.saleItemId} not found on this sale`,
          );
        }

        const remainingQty = item.quantity - (item.refundedQuantity || 0);
        if (refundItemDto.quantity > remainingQty) {
          throw new BadRequestException(
            `Cannot refund ${refundItemDto.quantity} of ${item.productName}. Only ${remainingQty} remaining.`,
          );
        }

        if (item.productId) {
          const product = await this.productRepository.findOne({
            where: { id: item.productId, businessId },
          });
          if (product) {
            const previousQuantity = product.stockQuantity ?? 0;
            this.restoreStock(product, refundItemDto.quantity);
            await this.productRepository.save(product);
            await this.stockMovementService.record({
              itemId: product.id,
              businessId,
              branchId: sale.branchId,
              userId: refundedById,
              type: StockMovementType.RETURN,
              previousQuantity,
              newQuantity: product.stockQuantity ?? previousQuantity,
              reason: 'POS partial refund',
              referenceId: sale.id,
            });
          }
        }

        const itemPrice = Number(item.unitPrice);
        const itemDiscount = Number(item.discount || 0) / item.quantity;
        const effectivePrice = itemPrice - itemDiscount;
        const lineRefundAmount = effectivePrice * refundItemDto.quantity;

        item.refundedQuantity =
          (item.refundedQuantity || 0) + refundItemDto.quantity;
        await this.saleItemRepository.save(item);

        const refundItem = this.refundItemRepository.create({
          saleItemId: item.id,
          quantity: refundItemDto.quantity,
          amount: lineRefundAmount,
        });
        refundItemsToSave.push(refundItem);
        refundAmount += lineRefundAmount;
      }

      // Check if all items in the sale are fully refunded now
      const allFullyRefunded = sale.items.every(
        (i) => i.quantity === i.refundedQuantity,
      );
      sale.status = allFullyRefunded
        ? SaleStatus.REFUNDED
        : SaleStatus.PARTIAL_REFUND;
      sale.refundReason = dto.reason || sale.refundReason || null;
      sale.refundedById = refundedById || sale.refundedById || null;
      sale.refundedAt = new Date();
      await this.saleRepository.save(sale);
    } else {
      throw new BadRequestException('Invalid status for refund request');
    }

    // Create the PosRefund record
    const refund = this.refundRepository.create({
      saleId: sale.id,
      businessId,
      refundedById: refundedById || undefined,
      reason: dto.reason || 'Refund processed',
      type:
        dto.status === SaleStatus.REFUNDED
          ? ('full' as any)
          : ('partial' as any),
      refundAmount,
    });
    const savedRefund = await this.refundRepository.save(refund);

    for (const ri of refundItemsToSave) {
      ri.refundId = savedRefund.id;
      await this.refundItemRepository.save(ri);
    }

    // Record FOS Transaction
    await this.recordFosTransaction({
      businessId,
      amount: -refundAmount,
      paymentMethod: sale.paymentMethod,
      referenceId: sale.id,
      description: `POS Refund ${sale.receiptNumber} (${dto.status === SaleStatus.REFUNDED ? 'Full' : 'Partial'})`,
      type: FosTransactionType.POS_REFUND,
    });

    return this.findOneSale(sale.id, businessId);
  }

  async holdSale(dto: HoldPosSaleDto, cashier: User) {
    const branch = await this.branchRepository.findOne({
      where: { id: dto.branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    if (branch.businessId !== cashier.businessId) {
      throw new BadRequestException('Branch does not belong to your business');
    }

    const items = dto.items.map((item) =>
      this.heldSaleItemRepository.create({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || '',
        barcode: item.barcode || '',
        unitPrice: item.unitPrice,
        costPrice: item.costPrice || 0,
        quantity: item.quantity,
        discount: item.discount || 0,
        totalPrice: item.totalPrice,
      }),
    );

    // Charges come from the settings, not the client, so a parked ticket
    // resumes with the same totals the till would compute.
    const subtotal =
      dto.subtotal || items.reduce((acc, i) => acc + i.totalPrice, 0);
    const discountAmount = dto.discountAmount || 0;
    const business = await this.businessRepository.findOne({
      where: { id: branch.businessId },
      select: ['id', 'posSettings'],
    });
    const { tax, serviceCharge, packagingFee, total } = computePosCharges(
      business?.posSettings,
      subtotal - discountAmount,
      { orderType: dto.orderType, waiveServiceCharge: dto.waiveServiceCharge },
    );

    const heldSale = this.heldSaleRepository.create({
      businessId: branch.businessId,
      branchId: branch.id,
      cashierId: cashier.id,
      customerId: dto.customerId || null,
      subtotal,
      discountAmount,
      tax,
      serviceCharge,
      packagingFee,
      orderType: dto.orderType ?? 'dine_in',
      total,
      note: dto.note || null,
      heldAt: new Date(),
      items,
    } as unknown as PosHeldSale);

    return this.heldSaleRepository.save(heldSale);
  }

  async findAllHeldSales(businessId: string, branchId?: string) {
    const where: any = { businessId };
    if (branchId) where.branchId = branchId;

    return this.heldSaleRepository.find({
      where,
      relations: ['items', 'customer', 'cashier'],
      order: { heldAt: 'DESC' },
    });
  }

  async resumeHeldSale(id: string, businessId: string) {
    const held = await this.heldSaleRepository.findOne({
      where: { id, businessId },
      relations: ['items', 'customer'],
    });
    if (!held) throw new NotFoundException('Held sale not found');
    return held;
  }

  async deleteHeldSale(id: string, businessId: string) {
    const result = await this.heldSaleRepository.softDelete({ id, businessId });
    if (result.affected === 0)
      throw new NotFoundException('Held sale not found');
    return { message: 'Held sale deleted' };
  }

  async openRegister(dto: OpenRegisterDto, cashier: User) {
    const existingOpen = await this.registerSessionRepository.findOne({
      where: { cashierId: cashier.id, status: RegisterSessionStatus.OPEN },
    });

    if (existingOpen) {
      throw new BadRequestException('Register is already open');
    }

    const till = dto.tillId
      ? await this.tillsService.claimForSession(cashier.businessId, dto.tillId)
      : null;

    const session = this.registerSessionRepository.create({
      businessId: cashier.businessId,
      branchId: till?.branchId ?? cashier.branchId,
      tillId: till?.id ?? null,
      cashierId: cashier.id,
      openedAt: new Date(),
      openingCash: dto.openingCash,
      expectedCash: dto.openingCash,
      totalSales: 0,
      transactionCount: 0,
      status: RegisterSessionStatus.OPEN,
    });

    return this.registerSessionRepository.save(session);
  }

  async closeRegister(cashier: User, dto: CloseRegisterDto = {}) {
    const session = await this.registerSessionRepository.findOne({
      where: { cashierId: cashier.id, status: RegisterSessionStatus.OPEN },
    });

    if (!session) {
      throw new BadRequestException('No open register session found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = await this.saleRepository.find({
      where: {
        businessId: cashier.businessId,
        cashierId: cashier.id,
        status: SaleStatus.COMPLETED,
        createdAt: Between(today, tomorrow),
      },
    });

    const cashSales = todaySales.filter(
      (s) => s.paymentMethod === PaymentMethod.CASH,
    );
    const expectedCash =
      Number(session.openingCash) +
      cashSales.reduce((acc, s) => acc + Number(s.amountPaid), 0);
    const totalSales = todaySales.reduce((acc, s) => acc + Number(s.total), 0);

    session.expectedCash = expectedCash;
    session.totalSales = totalSales;
    session.transactionCount = todaySales.length;
    session.status = RegisterSessionStatus.CLOSED;
    session.closedAt = new Date();

    // Counting the drawer is a separate act from closing the shift, and the
    // two columns stay null when it did not happen. The Z-report then reports a
    // variance of "not counted" instead of a zero that reads as balanced.
    const countedCash = dto.countedCash;
    session.countedCash = countedCash ?? null;
    session.variance = countedCash != null ? countedCash - expectedCash : null;

    const saved = await this.registerSessionRepository.save(session);

    // The shift total is a fact worth telling the people who were on it and
    // the owner watching the till, and a drawer that closed out of balance is
    // the one they most need to hear about.
    this.notificationsService
      .createForBranchStaff(
        session.branchId,
        session.businessId,
        'Shift Closed',
        `Closed with ${this.formatNaira(totalSales)} in gross sales across ${todaySales.length} transaction${todaySales.length === 1 ? '' : 's'}${
          session.variance != null
            ? `, ${this.formatNaira(Math.abs(session.variance))} ${
                session.variance === 0
                  ? 'exactly on'
                  : session.variance > 0
                    ? 'over'
                    : 'under'
              } expected cash`
            : ''
        }.`,
        'info',
        '/pos/register/z-report',
        {
          stat: {
            label: 'Gross sales',
            value: this.formatNaira(totalSales),
            ...(session.variance != null
              ? {
                  trend:
                    session.variance === 0
                      ? 'balanced to the naira'
                      : `${this.formatNaira(Math.abs(session.variance))} ${session.variance > 0 ? 'over' : 'short'}`,
                }
              : {}),
          },
          footnote: `${todaySales.length} transaction${todaySales.length === 1 ? '' : 's'}`,
          cta: 'View Z-Report',
        },
        'shift_closed',
      )
      .catch((err) =>
        console.error('Failed to create shift-close notification row:', err),
      );

    return saved;
  }

  async getRegisterStatus(cashier: User) {
    const session = await this.registerSessionRepository.findOne({
      where: { cashierId: cashier.id, status: RegisterSessionStatus.OPEN },
      relations: ['till', 'branch'],
    });

    return { isOpen: !!session, session: session || null };
  }

  async cashDrop(dto: CashDropDto, cashier: User) {
    const session = await this.registerSessionRepository.findOne({
      where: {
        cashierId: cashier.id,
        branchId: cashier.branchId,
        status: RegisterSessionStatus.OPEN,
      },
    });
    if (!session)
      throw new BadRequestException('No open register session found');

    const drop = this.cashDropRepository.create({
      registerSessionId: session.id,
      businessId: session.businessId,
      branchId: session.branchId,
      droppedById: cashier.id,
      amount: dto.amount,
      reason: dto.reason.trim(),
    });
    return this.cashDropRepository.save(drop);
  }

  async getZReport(cashier: User) {
    const session = await this.registerSessionRepository.findOne({
      where: [
        { cashierId: cashier.id, status: RegisterSessionStatus.OPEN },
        { cashierId: cashier.id, status: RegisterSessionStatus.CLOSED },
      ],
      order: { openedAt: 'DESC' },
    });
    if (!session) throw new NotFoundException('Register session not found');

    const sales = await this.saleRepository.find({
      where: {
        businessId: session.businessId,
        branchId: session.branchId,
        cashierId: session.cashierId,
        status: SaleStatus.COMPLETED,
        createdAt: Between(session.openedAt, session.closedAt || new Date()),
      },
    });
    const drops = await this.cashDropRepository.find({
      where: { registerSessionId: session.id },
    });
    const cashSales = sales
      .filter((sale) => sale.paymentMethod === PaymentMethod.CASH)
      .reduce((sum, sale) => sum + Number(sale.total), 0);
    const cashDrops = drops.reduce((sum, drop) => sum + Number(drop.amount), 0);
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    return {
      registerSessionId: session.id,
      status: session.status,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      openingCash: Number(session.openingCash),
      totalSales,
      transactionCount: sales.length,
      cashSales,
      cashDrops,
      expectedCash: Number(session.openingCash) + cashSales - cashDrops,
      // Null when the drawer was never counted, so a consumer can tell
      // "balanced" from "never reconciled" without reading a 0 as truth.
      countedCash:
        session.countedCash != null ? Number(session.countedCash) : null,
      variance: session.variance != null ? Number(session.variance) : null,
      paymentBreakdown: sales.reduce<Record<string, number>>((result, sale) => {
        result[sale.paymentMethod] =
          (result[sale.paymentMethod] || 0) + Number(sale.total);
        return result;
      }, {}),
    };
  }

  async getRegisterHistory(businessId: string, query: RegisterHistoryQueryDto) {
    const { page = 1, limit = 10, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (dateFrom || dateTo) {
      const start = dateFrom ? new Date(dateFrom) : new Date(0);
      const end = dateTo ? new Date(dateTo) : new Date();
      end.setHours(23, 59, 59, 999);
      where.openedAt = Between(start, end);
    }

    const [data, total] = await this.registerSessionRepository.findAndCount({
      where,
      relations: ['cashier', 'branch'],
      order: { openedAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getDashboard(businessId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      businessId,
      status: SaleStatus.COMPLETED,
      createdAt: Between(today, tomorrow),
    };
    if (branchId) where.branchId = branchId;

    const sales = await this.saleRepository.find({
      where,
      relations: ['items'],
    });

    const revenue = sales.reduce((acc, s) => acc + Number(s.total), 0);
    const transactionCount = sales.length;
    const averageSaleValue =
      transactionCount > 0 ? revenue / transactionCount : 0;

    const paymentBreakdown: Record<string, number> = {};
    for (const s of sales) {
      const method = s.paymentMethod;
      paymentBreakdown[method] =
        (paymentBreakdown[method] || 0) + Number(s.total);
    }

    // Server-visible pending queue: sales parked with "hold" (soft-deleted
    // holds are excluded automatically). Unsynced offline sales live on the
    // device until batch-sync, so they cannot be counted here.
    const heldSalesCount = await this.heldSaleRepository.count({
      where: branchId ? { businessId, branchId } : { businessId },
    });

    return {
      revenue,
      transactionCount,
      averageSaleValue,
      paymentBreakdown,
      heldSalesCount,
    };
  }

  async getTopProducts(businessId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      sale: {
        businessId,
        status: SaleStatus.COMPLETED,
        createdAt: Between(today, tomorrow),
      },
    };
    if (branchId) where.sale.branchId = branchId;

    const items = await this.saleItemRepository.find({
      where,
      relations: ['sale'],
    });

    const productMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();
    for (const item of items) {
      const existing = productMap.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.totalPrice);
      productMap.set(item.productId, existing);
    }

    return Array.from(productMap.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }

  async findCustomers(businessId: string, query: PosCustomerQueryDto) {
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // One aggregated row per customer: pos_sales joined to users, grouped.
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .innerJoin('sale.customer', 'customer')
      .select('customer.id', 'id')
      .addSelect('customer.firstName', 'firstName')
      .addSelect('customer.lastName', 'lastName')
      .addSelect('customer.email', 'email')
      .addSelect('customer.phone', 'phone')
      .addSelect('customer.createdAt', 'createdAt')
      .addSelect('SUM(sale.total)', 'totalSpent')
      .addSelect('COUNT(sale.id)', 'totalVisits')
      .addSelect('MIN(sale.orderedAt)', 'firstVisitAt')
      .addSelect('MAX(sale.orderedAt)', 'lastVisitAt')
      .where('sale.businessId = :businessId', { businessId })
      .andWhere('sale.customerId IS NOT NULL')
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .groupBy('customer.id')
      .addGroupBy('customer.firstName')
      .addGroupBy('customer.lastName')
      .addGroupBy('customer.email')
      .addGroupBy('customer.phone')
      .addGroupBy('customer.createdAt');

    if (query.branchId) {
      qb.andWhere('sale.branchId = :branchId', { branchId: query.branchId });
    }

    if (query.search) {
      // Escape ILIKE wildcards to prevent pattern injection
      const escaped = query.search.replace(/[%_]/g, (m) => `\\${m}`);
      qb.andWhere(
        `(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)`,
        { search: `%${escaped}%` },
      );
    }

    const now = Date.now();
    const segmentParams = {
      vipVisits: VIP_MIN_VISITS,
      vipSpend: VIP_MIN_SPEND,
      newSince: new Date(now - NEW_CUSTOMER_DAYS * 86_400_000),
      lapsedBefore: new Date(now - LAPSED_CUSTOMER_DAYS * 86_400_000),
    };
    const segmentHaving: Record<PosCustomerSegment, string> = {
      [PosCustomerSegment.VIP]:
        '(COUNT(sale.id) >= :vipVisits OR SUM(sale.total) >= :vipSpend)',
      [PosCustomerSegment.NEW]: 'MIN(sale.orderedAt) >= :newSince',
      [PosCustomerSegment.LAPSED]: 'MAX(sale.orderedAt) < :lapsedBefore',
    };

    // Segment chip counts over the unsegmented list (one wrapped query).
    const base = qb.clone().setParameters(segmentParams);
    const segmentCountsQuery = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'all')
      .addSelect(
        `COUNT(*) FILTER (WHERE c."totalVisits" >= :vipVisits OR c."totalSpent" >= :vipSpend)`,
        'vip',
      )
      .addSelect(`COUNT(*) FILTER (WHERE c."firstVisitAt" >= :newSince)`, 'new')
      .addSelect(
        `COUNT(*) FILTER (WHERE c."lastVisitAt" < :lapsedBefore)`,
        'lapsed',
      )
      .from(`(${base.getQuery()})`, 'c')
      .setParameters(base.getParameters());

    if (query.segment) {
      qb.having(segmentHaving[query.segment]).setParameters(segmentParams);
    }
    const totalQuery = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from(`(${qb.getQuery()})`, 'c')
      .setParameters(qb.getParameters());

    const [segmentCounts, total, customers] = await Promise.all([
      segmentCountsQuery.getRawOne<Record<string, string>>(),
      totalQuery.getRawOne<{ count: string }>(),
      qb
        .orderBy('"totalSpent"', 'DESC')
        .offset(skip)
        .limit(limit)
        .getRawMany<PosCustomerRow>(),
    ]);

    const points = await this.loyaltyService.getBusinessPointsForCustomers(
      customers.map((c) => c.id),
      businessId,
    );

    return {
      data: customers.map((c) => {
        const totalSpent = Number(c.totalSpent) || 0;
        const totalVisits = Number(c.totalVisits) || 0;
        const pointsBalance = points.get(c.id) ?? 0;
        return {
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          createdAt: c.createdAt,
          totalSpent,
          totalVisits,
          firstVisitAt: c.firstVisitAt,
          lastVisitAt: c.lastVisitAt,
          pointsBalance,
          tier: this.loyaltyService.tierForPoints(pointsBalance),
          segments: this.customerSegments(
            totalVisits,
            totalSpent,
            c.firstVisitAt,
            c.lastVisitAt,
            now,
          ),
        };
      }),
      segmentCounts: {
        all: Number(segmentCounts?.all) || 0,
        vip: Number(segmentCounts?.vip) || 0,
        new: Number(segmentCounts?.new) || 0,
        lapsed: Number(segmentCounts?.lapsed) || 0,
      },
      total: Number(total?.count) || 0,
      page,
      limit,
    };
  }

  private customerSegments(
    visits: number,
    spent: number,
    firstVisitAt: Date | string | null,
    lastVisitAt: Date | string | null,
    now: number,
  ): PosCustomerSegment[] {
    const segments: PosCustomerSegment[] = [];
    if (visits >= VIP_MIN_VISITS || spent >= VIP_MIN_SPEND) {
      segments.push(PosCustomerSegment.VIP);
    }
    if (
      firstVisitAt &&
      new Date(firstVisitAt).getTime() >= now - NEW_CUSTOMER_DAYS * 86_400_000
    ) {
      segments.push(PosCustomerSegment.NEW);
    }
    if (
      lastVisitAt &&
      new Date(lastVisitAt).getTime() < now - LAPSED_CUSTOMER_DAYS * 86_400_000
    ) {
      segments.push(PosCustomerSegment.LAPSED);
    }
    return segments;
  }

  async findCustomerById(customerId: string, businessId: string) {
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    // Verify this customer has actually transacted with this business
    const hasTransacted = await this.saleRepository.findOne({
      where: { customerId, businessId, status: SaleStatus.COMPLETED },
      select: ['id'],
    });

    if (!hasTransacted) {
      throw new NotFoundException('Customer not found for this business');
    }

    const customer = await this.userRepository.findOne({
      where: { id: customerId },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Single query: aggregated stats for this customer at this business
    const stats = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.total)', 'totalSpent')
      .addSelect('COUNT(sale.id)', 'totalVisits')
      .addSelect('AVG(sale.total)', 'averageOrderValue')
      .addSelect('MAX(sale.orderedAt)', 'lastVisitAt')
      .where('sale.customerId = :customerId', { customerId })
      .andWhere('sale.businessId = :businessId', { businessId })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .getRawOne();

    // Last 10 purchases with items loaded via relation (2 queries total, no N+1)
    const recentPurchases = await this.saleRepository.find({
      where: { customerId, businessId, status: SaleStatus.COMPLETED },
      relations: ['items'],
      order: { orderedAt: 'DESC' },
      take: 10,
    });

    const totalSpent = Number(stats?.totalSpent) || 0;
    const totalVisits = Number(stats?.totalVisits) || 0;
    const averageOrderValue = Number(stats?.averageOrderValue) || 0;
    const pointsBalance = await this.loyaltyService.getBusinessPoints(
      customerId,
      businessId,
    );

    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      totalSpent,
      totalVisits,
      lastVisitAt: stats?.lastVisitAt || null,
      averageOrderValue,
      lifetimeValue: totalSpent,
      pointsBalance,
      tier: this.loyaltyService.tierForPoints(pointsBalance),
      recentPurchases: recentPurchases.map((sale) => ({
        id: sale.id,
        date: sale.orderedAt,
        total: Number(sale.total),
        items: sale.items?.length || 0,
        itemNames: (sale.items ?? []).map((item) => item.productName),
        paymentMethod: sale.paymentMethod,
        receipt: sale.receiptNumber,
      })),
    };
  }

  /**
   * What a customer can redeem here now: the business's active rewards, each
   * flagged with whether their balance covers it. Two queries plus the
   * transacted-with-us check.
   */
  async getCustomerRewards(
    customerId: string,
    businessId: string,
    branchId?: string,
  ) {
    const hasTransacted = await this.saleRepository.findOne({
      where: { customerId, businessId },
      select: ['id'],
    });
    if (!hasTransacted) {
      throw new NotFoundException('Customer not found for this business');
    }

    const [pointsBalance, rewards] = await Promise.all([
      this.loyaltyService.getBusinessPoints(customerId, businessId),
      this.loyaltyService.getActiveBusinessRewards(businessId, { branchId }),
    ]);

    return {
      pointsBalance,
      tier: this.loyaltyService.tierForPoints(pointsBalance),
      data: rewards.map((reward) => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        category: reward.category,
        pointsRequired: reward.pointsRequired,
        coverImage: reward.coverImage ?? null,
        expiryDate: reward.expiryDate,
        remainingQuantity: reward.remainingQuantity,
        branchId: reward.branchId,
        affordable: pointsBalance >= reward.pointsRequired,
        pointsShort: Math.max(0, reward.pointsRequired - pointsBalance),
      })),
    };
  }

  private async generateReceiptNumber(
    businessId: string,
    manager?: EntityManager,
  ): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    const saleRepo = manager
      ? manager.getRepository(PosSale)
      : this.saleRepository;
    const count = await saleRepo.count({
      where: {
        businessId,
        createdAt: Between(
          new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        ),
      },
    });

    const seq = String(count + 1).padStart(3, '0');
    return `RCT-${dateStr}-${seq}`;
  }

  private async recordFosTransaction(
    data: {
      businessId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      referenceId: string;
      description: string;
      type?: FosTransactionType;
    },
    manager?: EntityManager,
  ) {
    const fosRepo = manager
      ? manager.getRepository(FinancialTransaction)
      : this.fosTransactionRepository;
    const transaction = fosRepo.create({
      type: data.type || FosTransactionType.POS_SALE,
      platform: FosPlatform.VEMTAP,
      businessId: data.businessId,
      amount: data.amount,
      cost: 0,
      profit: data.amount,
      paymentMethod: data.paymentMethod,
      referenceId: data.referenceId,
      date: new Date().toISOString().split('T')[0],
      description: data.description,
    });

    return fosRepo.save(transaction);
  }

  private deductStock(item: CatalogueItem, quantity: number) {
    if (item.stockQuantity !== null) {
      item.stockQuantity -= quantity;
      this.autoUpdateStatus(item);
    }
  }

  private restoreStock(item: CatalogueItem, quantity: number) {
    if (item.stockQuantity !== null) {
      item.stockQuantity += quantity;
      this.autoUpdateStatus(item);
    }
  }

  private autoUpdateStatus(item: CatalogueItem) {
    if (item.stockQuantity === null) return;

    if (item.stockQuantity <= 0) {
      item.stockQuantity = 0;
      item.status = CatalogueItemStatus.OUT_OF_STOCK;
    } else if (item.minStock !== null && item.stockQuantity <= item.minStock) {
      item.status = CatalogueItemStatus.LOW_STOCK;
    } else if (
      item.status === CatalogueItemStatus.OUT_OF_STOCK ||
      item.status === CatalogueItemStatus.LOW_STOCK
    ) {
      item.status = CatalogueItemStatus.ACTIVE;
    }
  }

  /**
   * Cashier discount cap from the permission policy. Within the cap the sale
   * goes through; above it a supervisor override is required when the policy
   * allows one, otherwise the discount is refused. The owner is never capped.
   */
  private async assertDiscountAllowed(
    stored: PosSettings | null | undefined,
    cashier: User,
    subtotal: number,
    discount: number,
    overrideToken?: string,
  ) {
    if (cashier.role === UserRole.OWNER) return;
    const policy = resolvePosSettings(stored).permissions ?? {};
    const maxPercent = policy.discountMaxPercent ?? 100;
    const maxAmount = policy.discountMaxAmount ?? 0;
    const percent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
    const overCap =
      (maxPercent < 100 && percent > maxPercent + 1e-9) ||
      (maxAmount > 0 && discount > maxAmount);
    if (!overCap) return;
    if (!policy.discountOverrideRequiresPin) {
      throw new ForbiddenException(
        'This discount is above the cashier limit set for this business',
      );
    }
    await this.staffPinsService.assertOverride(
      overrideToken,
      cashier.businessId,
      PosOverrideAction.DISCOUNT,
    );
  }

  /** Filters shared by the sales page and its meta aggregate (status excluded). */
  private applySaleFilters(
    qb: SelectQueryBuilder<PosSale>,
    query: PosSaleQueryDto,
  ) {
    const {
      paymentMethod,
      branchId,
      cashierId,
      sessionId,
      dateFrom,
      dateTo,
      search,
    } = query;
    if (paymentMethod)
      qb.andWhere('sale.paymentMethod = :paymentMethod', { paymentMethod });
    if (branchId) qb.andWhere('sale.branchId = :branchId', { branchId });
    if (cashierId) qb.andWhere('sale.cashierId = :cashierId', { cashierId });
    if (sessionId)
      qb.andWhere('sale.registerSessionId = :sessionId', { sessionId });

    if (dateFrom || dateTo) {
      const start = dateFrom ? new Date(dateFrom) : new Date(0);
      const end = dateTo ? new Date(dateTo) : new Date();
      end.setHours(23, 59, 59, 999);
      qb.andWhere('sale.createdAt BETWEEN :start AND :end', { start, end });
    }

    if (search) {
      const escaped = search.replace(/[%_]/g, (m) => `\\${m}`);
      qb.andWhere(
        '(sale.receiptNumber ILIKE :search OR sale.cashierName ILIKE :search OR customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${escaped}%` },
      );
    }
  }

  private displayName(user?: Pick<User, 'firstName' | 'lastName'> | null) {
    if (!user) return null;
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null;
  }

  /** Money for a sentence or a stat block. Scoped: nothing else needs it yet. */
  private formatNaira(amount: number): string {
    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
