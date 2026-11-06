import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SponsoredCampaignTransaction } from '../discovery/entities/sponsored-campaign-transaction.entity';

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Invoices for paid promotion: one per launched boost or campaign, written
 * at launch. No VAT is charged, so an invoice is the amount, how it was
 * paid and what it paid for.
 */
@Injectable()
export class AdWalletInvoicesService {
  constructor(
    @InjectRepository(SponsoredCampaignTransaction)
    private readonly invoiceRepo: Repository<SponsoredCampaignTransaction>,
  ) {}

  private view(invoice: SponsoredCampaignTransaction) {
    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      /** How it was paid: `Ad wallet`, `Card top-up` or `Saved card`. */
      paymentMethod: invoice.type,
      amount: round2(Number(invoice.amount)),
      currency: 'NGN' as const,
      status: invoice.status,
      date: (invoice.date ?? invoice.createdAt).toISOString(),
      campaign: invoice.campaign
        ? {
            id: invoice.campaign.id,
            name: invoice.campaign.name,
            kind: invoice.campaign.kind,
          }
        : null,
    };
  }

  async list(businessId: string, page = 1, limit = 20) {
    const [rows, total] = await this.invoiceRepo.findAndCount({
      where: { campaign: { businessId } },
      relations: { campaign: true },
      order: { date: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: rows.map((row) => this.view(row)),
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
    };
  }

  async get(businessId: string, id: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, campaign: { businessId } },
      relations: { campaign: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return this.view(invoice);
  }
}
