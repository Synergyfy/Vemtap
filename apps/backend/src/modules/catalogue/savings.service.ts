import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CatalogueOfferClaim,
  CatalogueOfferClaimStatus,
} from './entities/catalogue-offer-claim.entity';
import {
  MySavingsEntryDto,
  MySavingsPageDto,
  MySavingsQueryDto,
  SavingsBreakdownDto,
  SavingsCategoryDto,
} from './dto/savings.dto';

interface SavingsUser {
  id: string;
  email?: string;
  phone?: string | null;
}

@Injectable()
export class SavingsService {
  constructor(
    @InjectRepository(CatalogueOfferClaim)
    private readonly claimRepository: Repository<CatalogueOfferClaim>,
  ) {}

  async getMySavings(
    user: SavingsUser,
    query: MySavingsQueryDto,
  ): Promise<MySavingsPageDto> {
    const entries = await this.getRedeemedEntries(user, query.days);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    return {
      data: entries.slice((page - 1) * limit, page * limit),
      total: entries.length,
      page,
      limit,
      totalSavedAmount: this.sumSaved(entries),
    };
  }

  async getMySavingsCategories(
    user: SavingsUser,
    days?: number,
  ): Promise<SavingsBreakdownDto> {
    const entries = await this.getRedeemedEntries(user, days);
    const totalSavedAmount = this.sumSaved(entries);

    const groups = new Map<
      string,
      {
        id: string | null;
        name: string;
        redemptions: number;
        savedAmount: number;
      }
    >();

    for (const entry of entries) {
      const key = entry.categoryName ?? 'Other';
      const group = groups.get(key) ?? {
        id: entry.categoryId ?? null,
        name: key,
        redemptions: 0,
        savedAmount: 0,
      };
      group.redemptions += 1;
      group.savedAmount += entry.savedAmount;
      groups.set(key, group);
    }

    const data: SavingsCategoryDto[] = [...groups.values()]
      .map((group) => ({
        ...group,
        sharePercent:
          totalSavedAmount > 0
            ? Math.round((group.savedAmount / totalSavedAmount) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.savedAmount - a.savedAmount);

    return {
      data,
      totalSavedAmount,
      totalRedemptions: entries.length,
    };
  }

  async exportMySavingsCsv(user: SavingsUser, days?: number): Promise<string> {
    const entries = await this.getRedeemedEntries(user, days);
    const header = [
      'Claim Code',
      'Redeemed At',
      'Merchant',
      'Offer',
      'Category',
      'Original Amount',
      'Paid Amount',
      'Saved Amount',
      'Currency',
    ];

    const csvCell = (value: string | number | null): string => {
      const text = value === null ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = entries.map((entry) =>
      [
        csvCell(entry.claimCode),
        csvCell(new Date(entry.redeemedAt).toISOString()),
        csvCell(entry.merchantName),
        csvCell(entry.offerName),
        csvCell(entry.categoryName),
        entry.originalAmount,
        entry.paidAmount,
        entry.savedAmount,
        csvCell(entry.currency),
      ].join(','),
    );

    return [header.join(','), ...rows].join('\n');
  }

  /**
   * Redeemed claims belonging to the customer, with the amounts the ledger
   * needs. Ownership mirrors `GET /me/claims`: linked `userId`, or email/phone
   * for claims created before linking. One query, relations pre-loaded.
   */
  private async getRedeemedEntries(
    user: SavingsUser,
    days?: number,
  ): Promise<MySavingsEntryDto[]> {
    const ownership = [
      'claim.userId = :userId',
      'LOWER(claim.email) = LOWER(:email)',
    ];
    const params: { userId: string; email: string; phone?: string } = {
      userId: user.id,
      email: user.email ?? '',
    };
    if (user.phone) {
      ownership.push('claim.phone = :phone');
      params.phone = user.phone;
    }

    const qb = this.claimRepository
      .createQueryBuilder('claim')
      .innerJoinAndSelect('claim.offer', 'offer')
      .leftJoinAndSelect('offer.items', 'offerItem')
      .leftJoinAndSelect('offer.branch', 'branch')
      .leftJoinAndSelect('branch.business', 'business')
      .leftJoinAndSelect('business.category', 'category')
      .where(`(${ownership.join(' OR ')})`, params)
      .andWhere('claim.status = :status', {
        status: CatalogueOfferClaimStatus.REDEEMED,
      })
      .orderBy('claim.updatedAt', 'DESC');

    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      qb.andWhere('claim.updatedAt >= :startDate', { startDate });
    }

    const claims = await qb.getMany();

    return claims.map((claim) => {
      const offer = claim.offer;
      const business = offer?.branch?.business;
      const originalAmount = (offer?.items ?? []).reduce(
        (acc, item) => acc + Number(item.price || 0),
        0,
      );
      const paidAmount = Number(offer?.calculatedPrice || 0);

      return {
        id: claim.id,
        redeemedAt: claim.updatedAt,
        merchantName: business?.name ?? '',
        merchantImageUrl: business?.logoUrl ?? null,
        offerName: offer?.name ?? '',
        claimCode: claim.claimCode,
        originalAmount,
        paidAmount,
        savedAmount: Math.max(originalAmount - paidAmount, 0),
        currency: business?.posSettings?.currency ?? 'NGN',
        categoryId: business?.category?.id ?? null,
        categoryName: business?.category?.name ?? null,
      };
    });
  }

  private sumSaved(entries: MySavingsEntryDto[]): number {
    return entries.reduce((acc, entry) => acc + entry.savedAmount, 0);
  }
}
