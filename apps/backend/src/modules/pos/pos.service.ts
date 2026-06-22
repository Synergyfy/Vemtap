import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike } from 'typeorm';
import { PosSale } from './entities/pos-sale.entity';
import { PaymentMethod, SaleStatus } from './entities/pos-enums';
import { PosSaleItem } from './entities/pos-sale-item.entity';
import { PosSplitPayment } from './entities/pos-split-payment.entity';
import { PosHeldSale } from './entities/pos-held-sale.entity';
import { PosHeldSaleItem } from './entities/pos-held-sale-item.entity';
import { PosRegisterSession } from './entities/pos-register-session.entity';
import { RegisterSessionStatus } from './entities/pos-enums';
import { CatalogueItem, CatalogueItemStatus } from '../catalogue/entities/catalogue-item.entity';
import { CreatePosSaleDto } from './dto/create-pos-sale.dto';
import { PosSaleQueryDto } from './dto/pos-sale-query.dto';
import { UpdatePosSaleStatusDto } from './dto/update-pos-sale-status.dto';
import { HoldPosSaleDto } from './dto/hold-pos-sale.dto';
import { OpenRegisterDto, RegisterHistoryQueryDto } from './dto/register.dto';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../users/entities/user.entity';
import {
  FinancialTransaction, FosTransactionType, FosPlatform,
} from '../fos-core/entities/financial-transaction.entity';

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
    @InjectRepository(CatalogueItem)
    private readonly productRepository: Repository<CatalogueItem>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FinancialTransaction)
    private readonly fosTransactionRepository: Repository<FinancialTransaction>,
  ) {}

  async completeSale(dto: CreatePosSaleDto, cashier: User) {
    const branch = await this.branchRepository.findOne({ where: { id: dto.branchId } });
    if (!branch) throw new NotFoundException('Branch not found');

    let customer: User | null = null;
    if (dto.customerId) {
      customer = await this.userRepository.findOne({ where: { id: dto.customerId } });
    }

    const items: PosSaleItem[] = [];
    let subtotal = 0;
    let totalDiscount = 0;

    for (const itemDto of dto.items) {
      const product = await this.productRepository.findOne({
        where: { id: itemDto.productId, businessId: branch.businessId },
      });
      if (!product) throw new NotFoundException(`Product ${itemDto.productId} not found`);

      if (product.stockQuantity !== null && product.stockQuantity < itemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}: ${product.stockQuantity} available, ${itemDto.quantity} requested`,
        );
      }

      const itemDiscount = itemDto.discount || 0;
      const lineTotal = (Number(product.price) * itemDto.quantity) - itemDiscount;

      const saleItem = this.saleItemRepository.create({
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
      await this.productRepository.save(product);
    }

    const cartDiscount = dto.cartDiscountAmount || 0;
    const totalDiscountAmount = totalDiscount + cartDiscount;
    const tax = 0;
    const total = subtotal - totalDiscountAmount + tax;
    const receiptNumber = await this.generateReceiptNumber(branch.businessId);

    if (dto.payment.method === PaymentMethod.SPLIT) {
      if (!dto.payment.splitDetails || dto.payment.splitDetails.length < 2) {
        throw new BadRequestException('Split payment requires at least 2 payment methods');
      }
      const splitTotal = dto.payment.splitDetails.reduce((acc, s) => acc + s.amount, 0);
      if (Math.abs(splitTotal - dto.payment.amountPaid) > 0.01) {
        throw new BadRequestException('Split payment amounts must sum to the total paid');
      }
    }

    const splitPayments: PosSplitPayment[] = [];
    if (dto.payment.method === PaymentMethod.SPLIT && dto.payment.splitDetails) {
      for (const sp of dto.payment.splitDetails) {
        const splitPayment = this.splitPaymentRepository.create({
          method: sp.method,
          amount: sp.amount,
        });
        splitPayments.push(splitPayment);
      }
    }

    const cashierName = `${cashier.firstName} ${cashier.lastName}`.trim() || cashier.email;

    const sale = this.saleRepository.create({
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
    } as unknown as PosSale);

    const savedSale = await this.saleRepository.save(sale);

    if (customer) {
      customer.lastActive = new Date();
      await this.userRepository.save(customer);
    }

    await this.recordFosTransaction({
      businessId: branch.businessId,
      amount: total,
      paymentMethod: dto.payment.method,
      referenceId: savedSale.id,
      description: `POS Sale ${receiptNumber}`,
    });

    const openRegister = await this.registerSessionRepository.findOne({
      where: {
        cashierId: cashier.id,
        status: RegisterSessionStatus.OPEN,
        branchId: branch.id,
      },
    });

    if (openRegister) {
      openRegister.totalSales = Number(openRegister.totalSales) + total;
      openRegister.transactionCount = Number(openRegister.transactionCount) + 1;
      if (dto.payment.method === PaymentMethod.CASH) {
        openRegister.expectedCash = Number(openRegister.expectedCash) + dto.payment.amountPaid;
      }
      await this.registerSessionRepository.save(openRegister);
    }

    return this.findOneSale(savedSale.id, branch.businessId);
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
      page = 1, limit = 10, status, paymentMethod, branchId,
      cashierId, dateFrom, dateTo, search,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (branchId) where.branchId = branchId;
    if (cashierId) where.cashierId = cashierId;

    if (dateFrom || dateTo) {
      const start = dateFrom ? new Date(dateFrom) : new Date(0);
      const end = dateTo ? new Date(dateTo) : new Date();
      end.setHours(23, 59, 59, 999);
      where.createdAt = Between(start, end);
    }

    if (search) {
      const [data, total] = await this.saleRepository.findAndCount({
        where: [
          { ...where, receiptNumber: ILike(`%${search}%`) },
          { ...where, cashierName: ILike(`%${search}%`) },
          { ...where, customer: { firstName: ILike(`%${search}%`) } },
          { ...where, customer: { lastName: ILike(`%${search}%`) } },
          { ...where, customer: { phone: ILike(`%${search}%`) } },
        ],
        relations: ['items', 'splitPayments', 'customer', 'cashier', 'branch'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      return { data, total, page, limit };
    }

    const [data, total] = await this.saleRepository.findAndCount({
      where,
      relations: ['items', 'splitPayments', 'customer', 'cashier', 'branch'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOneSale(id: string, businessId: string) {
    const sale = await this.saleRepository.findOne({
      where: { id, businessId },
      relations: ['items', 'splitPayments', 'customer', 'cashier', 'branch'],
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async updateSaleStatus(id: string, dto: UpdatePosSaleStatusDto, businessId: string) {
    const sale = await this.findOneSale(id, businessId);

    if (sale.status !== SaleStatus.COMPLETED) {
      throw new BadRequestException('Only completed sales can be refunded');
    }

    sale.status = dto.status;
    const updated = await this.saleRepository.save(sale);

    for (const item of sale.items) {
      if (item.productId) {
        const product = await this.productRepository.findOne({
          where: { id: item.productId, businessId },
        });
        if (product) {
          this.restoreStock(product, item.quantity);
          await this.productRepository.save(product);
        }
      }
    }

    await this.recordFosTransaction({
      businessId,
      amount: -Number(sale.total),
      paymentMethod: sale.paymentMethod,
      referenceId: sale.id,
      description: `POS Refund ${sale.receiptNumber}`,
      type: FosTransactionType.POS_REFUND,
    });

    return updated;
  }

  async holdSale(dto: HoldPosSaleDto, cashier: User) {
    const branch = await this.branchRepository.findOne({ where: { id: dto.branchId } });
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
    if (result.affected === 0) throw new NotFoundException('Held sale not found');
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

    const cashSales = todaySales.filter(s => s.paymentMethod === PaymentMethod.CASH);
    const expectedCash = Number(session.openingCash) + cashSales.reduce((acc, s) => acc + Number(s.amountPaid), 0);
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

    const sales = await this.saleRepository.find({ where, relations: ['items'] });

    const revenue = sales.reduce((acc, s) => acc + Number(s.total), 0);
    const transactionCount = sales.length;
    const averageSaleValue = transactionCount > 0 ? revenue / transactionCount : 0;

    const paymentBreakdown: Record<string, number> = {};
    for (const s of sales) {
      const method = s.paymentMethod;
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(s.total);
    }

    return { revenue, transactionCount, averageSaleValue, paymentBreakdown };
  }

  async getTopProducts(businessId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      sale: { businessId, status: SaleStatus.COMPLETED, createdAt: Between(today, tomorrow) },
    };
    if (branchId) where.sale.branchId = branchId;

    const items = await this.saleItemRepository.find({ where, relations: ['sale'] });

    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
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

  private async generateReceiptNumber(businessId: string): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    const count = await this.saleRepository.count({
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

  private async recordFosTransaction(data: {
    businessId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceId: string;
    description: string;
    type?: FosTransactionType;
  }) {
    const transaction = this.fosTransactionRepository.create({
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

    return this.fosTransactionRepository.save(transaction);
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
