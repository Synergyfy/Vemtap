import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike, DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PosSale } from './entities/pos-sale.entity';
import { PaymentMethod, SaleStatus } from './entities/pos-enums';
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
import { OpenRegisterDto, RegisterHistoryQueryDto } from './dto/register.dto';
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
import { LoyaltyService } from '../loyalty/loyalty.service';
import { PosRefund } from './entities/pos-refund.entity';
import { PosRefundItem } from './entities/pos-refund-item.entity';

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
    private readonly catalogueOrderService: CatalogueOrderService,
    @Inject(forwardRef(() => LoyaltyService))
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async completeSale(dto: CreatePosSaleDto, cashier: User) {
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

      const items: PosSaleItem[] = [];
      let subtotal = 0;
      let totalDiscount = 0;

      for (const itemDto of dto.items) {
        const product = await productRepo.findOne({
          where: { id: itemDto.productId, businessId: branch.businessId },
        });
        if (!product)
          throw new NotFoundException(`Product ${itemDto.productId} not found`);

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

        this.deductStock(product, itemDto.quantity);
        await productRepo.save(product);
      }

      const cartDiscount = dto.cartDiscountAmount || 0;
      const totalDiscountAmount = totalDiscount + cartDiscount;
      const tax = 0;
      const total = subtotal - totalDiscountAmount + tax;
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

      const openRegister = await registerSessionRepo.findOne({
        where: {
          cashierId: cashier.id,
          status: RegisterSessionStatus.OPEN,
          branchId: branch.id,
        },
      });

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
          const business = await businessRepo.findOne({
            where: { id: branch.businessId },
          });
          if (business?.posSettings?.loyaltyEnabled) {
            let totalPoints = 0;
            for (const item of items) {
              if (item.productId) {
                const product = await productRepo.findOne({
                  where: { id: item.productId },
                });
                if (
                  product?.enableLoyaltyPoints &&
                  product.loyaltyPointsValue
                ) {
                  totalPoints += product.loyaltyPointsValue * item.quantity;
                } else if (product?.loyaltyPoints) {
                  // Fallback to legacy loyaltyPoints field
                  totalPoints += product.loyaltyPoints * item.quantity;
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

  async batchSyncSales(
    dtos: CreatePosSaleDto[],
    cashier: User,
  ): Promise<
    {
      clientRef: string | null;
      saleId?: string;
      success: boolean;
      error?: string;
    }[]
  > {
    const results: {
      clientRef: string | null;
      saleId?: string;
      success: boolean;
      error?: string;
    }[] = [];
    for (const dto of dtos) {
      try {
        const sale = await this.completeSale(dto, cashier);
        results.push({
          clientRef: dto.clientRef || null,
          saleId: sale.id,
          success: true,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Internal server error';
        results.push({
          clientRef: dto.clientRef || null,
          success: false,
          error: errorMessage,
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
        const defaultPassword = '123456';
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
    });

    const savedOrder = await this.orderRepository.save(order);

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
    this.pushNotificationService
      .sendToBranchStaff(
        branch.id,
        'New POS Order',
        `A new POS order (#${savedOrder.id.slice(0, 8)}) has been placed by ${staffName}.`,
        { orderId: savedOrder.id, type: 'NEW_POS_ORDER' },
      )
      .catch((err) => console.error('Failed to send staff notification:', err));

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
      tax: 0,
      total: Number(order.totalAmount),
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
      amount: Number(order.totalAmount),
      paymentMethod: dto.paymentMethod,
      referenceId: savedSale.id,
      description: `POS Order Payment ${receiptNumber}`,
    });

    // Update register session
    const openRegister = await this.registerSessionRepository.findOne({
      where: {
        cashierId: staff.id,
        status: RegisterSessionStatus.OPEN,
        branchId: order.branchId,
      },
    });

    if (openRegister) {
      openRegister.totalSales =
        Number(openRegister.totalSales) + Number(order.totalAmount);
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

  async adjustStock(id: string, businessId: string, quantity: number) {
    const product = await this.productRepository.findOne({
      where: { id, businessId },
    });
    if (!product) throw new NotFoundException('Product not found');

    product.stockQuantity = quantity;
    this.autoUpdateStatus(product);
    return this.productRepository.save(product);
  }

  async findAllSales(businessId: string, query: PosSaleQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      paymentMethod,
      branchId,
      cashierId,
      dateFrom,
      dateTo,
      search,
    } = query;
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('sale.splitPayments', 'splitPayments')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.cashier', 'cashier')
      .leftJoinAndSelect('sale.branch', 'branch')
      .where('sale.businessId = :businessId', { businessId });

    if (status) qb.andWhere('sale.status = :status', { status });
    if (paymentMethod)
      qb.andWhere('sale.paymentMethod = :paymentMethod', { paymentMethod });
    if (branchId) qb.andWhere('sale.branchId = :branchId', { branchId });
    if (cashierId) qb.andWhere('sale.cashierId = :cashierId', { cashierId });

    if (dateFrom || dateTo) {
      const start = dateFrom ? new Date(dateFrom) : new Date(0);
      const end = dateTo ? new Date(dateTo) : new Date();
      end.setHours(23, 59, 59, 999);
      qb.andWhere('sale.createdAt BETWEEN :start AND :end', { start, end });
    }

    if (search) {
      qb.andWhere(
        '(sale.receiptNumber ILIKE :search OR sale.cashierName ILIKE :search OR customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor: (query as any)?.cursor || (query as any)?.nextCursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'sale',
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

  async updateSaleStatus(
    id: string,
    dto: UpdatePosSaleStatusDto,
    businessId: string,
    refundedById?: string,
  ) {
    const sale = await this.findOneSale(id, businessId);

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
              this.restoreStock(product, remainingQty);
              await this.productRepository.save(product);
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
            this.restoreStock(product, refundItemDto.quantity);
            await this.productRepository.save(product);
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

    const heldSale = this.heldSaleRepository.create({
      businessId: branch.businessId,
      branchId: branch.id,
      cashierId: cashier.id,
      customerId: dto.customerId || null,
      subtotal: dto.subtotal || items.reduce((acc, i) => acc + i.totalPrice, 0),
      discountAmount: dto.discountAmount || 0,
      tax: dto.tax || 0,
      total: dto.total || items.reduce((acc, i) => acc + i.totalPrice, 0),
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

    const session = this.registerSessionRepository.create({
      businessId: cashier.businessId,
      branchId: cashier.branchId,
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

  async closeRegister(cashier: User) {
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

    return this.registerSessionRepository.save(session);
  }

  async getRegisterStatus(cashier: User) {
    const session = await this.registerSessionRepository.findOne({
      where: { cashierId: cashier.id, status: RegisterSessionStatus.OPEN },
    });

    return { isOpen: !!session, session: session || null };
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

    return { revenue, transactionCount, averageSaleValue, paymentBreakdown };
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

    // Single aggregated query: joins pos_sales with users, groups by customer
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

    const countQb = qb.clone();
    const total = await countQb
      .select('COUNT(DISTINCT customer.id)', 'count')
      .getRawOne();

    const customers = await qb
      .orderBy('"totalSpent"', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    return {
      data: customers.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        createdAt: c.createdAt,
        totalSpent: Number(c.totalSpent) || 0,
        totalVisits: Number(c.totalVisits) || 0,
        lastVisitAt: c.lastVisitAt,
      })),
      total: Number(total?.count) || 0,
      page,
      limit,
    };
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
      recentPurchases: recentPurchases.map((sale) => ({
        id: sale.id,
        date: sale.orderedAt,
        total: Number(sale.total),
        items: sale.items?.length || 0,
        receipt: sale.receiptNumber,
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
}
