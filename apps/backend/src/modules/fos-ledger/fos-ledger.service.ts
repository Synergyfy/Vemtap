import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FinancialTransaction,
  FosTransactionType,
} from '../fos-core/entities/financial-transaction.entity';
import { Expense } from '../fos-core/entities/expense.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { Business } from '../businesses/entities/business.entity';
import {
  FosInvoice,
  FosInvoiceStatus,
  FosLedgerSource,
} from './entities/invoice.entity';
import { FosBill, FosBillStatus } from './entities/bill.entity';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreateBillDto,
  UpdateBillDto,
} from './dto/ledger.dto';

@Injectable()
export class FosLedgerService {
  constructor(
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepo: Repository<FinancialTransaction>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(FosInvoice)
    private readonly invoiceRepo: Repository<FosInvoice>,
    @InjectRepository(FosBill)
    private readonly billRepo: Repository<FosBill>,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  private toDateString(value: string | Date): string {
    if (!value) return '';
    return new Date(value).toISOString().split('T')[0];
  }

  // ==================== Invoices (Receivables) ====================

  private async getSystemInvoices(): Promise<
    {
      id: string;
      customer: string;
      amount: number;
      dueDate: string;
      status: FosInvoiceStatus;
      source: FosLedgerSource;
    }[]
  > {
    const subscriptions = await this.subscriptionRepo.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['plan', 'business'],
    });

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return subscriptions
      .map((sub) => {
        const mrr = this.toNumber(sub.plan?.monthlyPrice ?? 0);
        if (mrr <= 0) return null;
        const dueDate = this.toDateString(sub.endDate);
        const status =
          dueDate && dueDate < todayStr
            ? FosInvoiceStatus.OVERDUE
            : FosInvoiceStatus.PENDING;
        return {
          id: `sub_${sub.id}`,
          customer: sub.business?.name || 'Business',
          amount: mrr,
          dueDate,
          status,
          source: FosLedgerSource.SYSTEM,
        };
      })
      .filter(Boolean) as {
      id: string;
      customer: string;
      amount: number;
      dueDate: string;
      status: FosInvoiceStatus;
      source: FosLedgerSource;
    }[];
  }

  async getReceivables() {
    const [systemInvoices, manualInvoices] = await Promise.all([
      this.getSystemInvoices(),
      this.invoiceRepo.find({ order: { dueDate: 'ASC' } }),
    ]);

    const manualMapped = manualInvoices.map((inv) => ({
      id: inv.id,
      customer: inv.customer,
      amount: this.toNumber(inv.amount),
      dueDate: inv.dueDate,
      status: inv.status,
      source: inv.source,
    }));

    const invoices = [...manualMapped, ...systemInvoices];

    const openInvoices = invoices.filter(
      (inv) =>
        inv.status === FosInvoiceStatus.PENDING ||
        inv.status === FosInvoiceStatus.OVERDUE,
    );
    const totalOutstanding = openInvoices.reduce(
      (sum, inv) => sum + inv.amount,
      0,
    );
    const totalOverdue = invoices
      .filter((inv) => inv.status === FosInvoiceStatus.OVERDUE)
      .reduce((sum, inv) => sum + inv.amount, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const monthPrefix = todayStr.substring(0, 7);

    const collectedManual = manualInvoices
      .filter(
        (inv) =>
          inv.status === FosInvoiceStatus.PAID &&
          inv.collectedAt?.substring(0, 7) === monthPrefix,
      )
      .reduce((sum, inv) => sum + this.toNumber(inv.amount), 0);

    const monthTransactions = await this.transactionRepo.find({
      where: [{ type: FosTransactionType.SUBSCRIPTION }],
    });
    const collectedSystem = monthTransactions
      .filter((t) => t.date.substring(0, 7) === monthPrefix)
      .reduce((sum, t) => sum + this.toNumber(t.amount), 0);

    const collectedThisMonth = collectedManual + collectedSystem;

    return {
      invoices: invoices.map((inv) => ({
        id: inv.id,
        customer: inv.customer,
        amount: inv.amount,
        dueDate: inv.dueDate,
        status: inv.status,
      })),
      totalOutstanding,
      totalOverdue,
      collectedThisMonth,
    };
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const todayStr = new Date().toISOString().split('T')[0];
    const invoice = this.invoiceRepo.create({
      customer: dto.customer,
      amount: dto.amount,
      dueDate: dto.dueDate,
      status: dto.status ?? FosInvoiceStatus.PENDING,
      source: FosLedgerSource.MANUAL,
      collectedAt: dto.collectedAt ?? undefined,
    });

    if (
      invoice.status === FosInvoiceStatus.PENDING &&
      invoice.dueDate < todayStr
    ) {
      invoice.status = FosInvoiceStatus.OVERDUE;
    }

    const saved = await this.invoiceRepo.save(invoice);
    return {
      id: saved.id,
      customer: saved.customer,
      amount: this.toNumber(saved.amount),
      dueDate: saved.dueDate,
      status: saved.status,
    };
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    if (dto.customer !== undefined) invoice.customer = dto.customer;
    if (dto.amount !== undefined) invoice.amount = dto.amount;
    if (dto.dueDate !== undefined) invoice.dueDate = dto.dueDate;
    if (dto.status !== undefined) invoice.status = dto.status;
    if (dto.collectedAt !== undefined) {
      invoice.collectedAt = dto.collectedAt;
      if (dto.status === FosInvoiceStatus.PAID && !dto.collectedAt) {
        invoice.collectedAt = new Date().toISOString().split('T')[0];
      }
    }

    const saved = await this.invoiceRepo.save(invoice);
    return {
      id: saved.id,
      customer: saved.customer,
      amount: this.toNumber(saved.amount),
      dueDate: saved.dueDate,
      status: saved.status,
    };
  }

  async removeInvoice(id: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }
    await this.invoiceRepo.remove(invoice);
    return { success: true };
  }

  // ==================== Bills (Payables) ====================

  private categoryLabel(category: string): string {
    const c = category.toLowerCase();
    if (c.includes('sms') || c.includes('gateway') || c.includes('termii'))
      return 'Gateway';
    if (c.includes('server') || c.includes('host') || c.includes('cloud'))
      return 'Infrastructure';
    if (c.includes('salary') || c.includes('payroll') || c.includes('staff'))
      return 'Payroll';
    if (c.includes('rent') || c.includes('office')) return 'Office';
    if (c.includes('software') || c.includes('saas')) return 'Software';
    if (c.includes('utilities') || c.includes('electric')) return 'Utilities';
    return 'Operating';
  }

  private async getSystemBills(): Promise<
    {
      id: string;
      description: string;
      amount: number;
      dueDate: string;
      status: FosBillStatus;
      category: string;
      source: FosLedgerSource;
    }[]
  > {
    const expenses = await this.expenseRepo.find();
    const todayStr = new Date().toISOString().split('T')[0];

    return expenses
      .filter((e) => e.date)
      .map((e) => {
        const dueDate = this.toDateString(e.date);
        const status =
          dueDate < todayStr ? FosBillStatus.OVERDUE : FosBillStatus.PENDING;
        return {
          id: `exp_${e.id}`,
          description: e.category,
          amount: this.toNumber(e.amount),
          dueDate,
          status,
          category: this.categoryLabel(e.category),
          source: FosLedgerSource.SYSTEM,
        };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  async getPayables() {
    const [systemBills, manualBills] = await Promise.all([
      this.getSystemBills(),
      this.billRepo.find({ order: { dueDate: 'ASC' } }),
    ]);

    const manualMapped = manualBills.map((b) => ({
      id: b.id,
      description: b.description,
      amount: this.toNumber(b.amount),
      dueDate: b.dueDate,
      status: b.status,
      category: b.category || 'Operating',
      source: b.source,
    }));

    const bills = [...manualMapped, ...systemBills];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dateTo = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };
    const weekEnd = dateTo(7);
    const monthEnd = dateTo(30);

    const openBills = bills.filter(
      (b) =>
        b.status === FosBillStatus.PENDING ||
        b.status === FosBillStatus.OVERDUE,
    );

    const monthlySalary = bills
      .filter((b) => b.category === 'Payroll')
      .reduce((sum, b) => sum + b.amount, 0);
    const totalBills = bills.reduce((sum, b) => sum + b.amount, 0);
    const totalPayables = openBills.reduce((sum, b) => sum + b.amount, 0);
    const dueThisWeek = openBills
      .filter((b) => b.dueDate >= todayStr && b.dueDate <= weekEnd)
      .reduce((sum, b) => sum + b.amount, 0);
    const dueThisMonth = openBills
      .filter((b) => b.dueDate >= todayStr && b.dueDate <= monthEnd)
      .reduce((sum, b) => sum + b.amount, 0);
    const overdue = bills
      .filter((b) => b.status === FosBillStatus.OVERDUE)
      .reduce((sum, b) => sum + b.amount, 0);

    const payrollPaid = bills
      .filter(
        (b) => b.category === 'Payroll' && b.status === FosBillStatus.PAID,
      )
      .reduce((sum, b) => sum + b.amount, 0);

    const toPublicBill = (b: {
      id: string;
      description: string;
      amount: number;
      dueDate: string;
      status: FosBillStatus;
      category: string;
    }) => ({
      id: b.id,
      description: b.description,
      amount: b.amount,
      dueDate: b.dueDate,
      status: b.status,
      category: b.category,
    });

    const paymentSchedule = bills
      .filter((b) => b.category === 'Payroll')
      .map((b) => toPublicBill(b));

    return {
      monthlySalary,
      payrollPaid,
      totalBills,
      totalPayables,
      dueThisWeek,
      dueThisMonth,
      overdue,
      bills: bills.map((b) => toPublicBill(b)),
      paymentSchedule,
    };
  }

  async createBill(dto: CreateBillDto) {
    const todayStr = new Date().toISOString().split('T')[0];
    const bill = this.billRepo.create({
      description: dto.description,
      amount: dto.amount,
      dueDate: dto.dueDate,
      status: dto.status ?? FosBillStatus.PENDING,
      category: dto.category ?? undefined,
      source: FosLedgerSource.MANUAL,
      paidAt: undefined,
    });

    if (bill.status === FosBillStatus.PENDING && bill.dueDate < todayStr) {
      bill.status = FosBillStatus.OVERDUE;
    }

    const saved = await this.billRepo.save(bill);
    return {
      id: saved.id,
      description: saved.description,
      amount: this.toNumber(saved.amount),
      dueDate: saved.dueDate,
      status: saved.status,
      category: saved.category,
    };
  }

  async updateBill(id: string, dto: UpdateBillDto) {
    const bill = await this.billRepo.findOne({ where: { id } });
    if (!bill) {
      throw new NotFoundException(`Bill with id ${id} not found`);
    }

    if (dto.description !== undefined) bill.description = dto.description;
    if (dto.amount !== undefined) bill.amount = dto.amount;
    if (dto.dueDate !== undefined) bill.dueDate = dto.dueDate;
    if (dto.category !== undefined) bill.category = dto.category;
    if (dto.status !== undefined) {
      bill.status = dto.status;
      if (dto.status === FosBillStatus.PAID && !bill.paidAt) {
        bill.paidAt = new Date().toISOString().split('T')[0];
      }
    }

    const saved = await this.billRepo.save(bill);
    return {
      id: saved.id,
      description: saved.description,
      amount: this.toNumber(saved.amount),
      dueDate: saved.dueDate,
      status: saved.status,
      category: saved.category,
    };
  }

  async removeBill(id: string) {
    const bill = await this.billRepo.findOne({ where: { id } });
    if (!bill) {
      throw new NotFoundException(`Bill with id ${id} not found`);
    }
    await this.billRepo.remove(bill);
    return { success: true };
  }
}
