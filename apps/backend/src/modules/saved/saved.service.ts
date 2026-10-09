import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedBusiness } from './entities/saved-business.entity';
import { SavedService as SavedServiceEntity } from './entities/saved-service.entity';
import { DealSave } from '../deal-engagement/entities/deal-save.entity';
import { Business } from '../businesses/entities/business.entity';
import {
  CatalogueItem,
  CatalogueItemType,
} from '../catalogue/entities/catalogue-item.entity';
import {
  SaveStatusResponseDto,
  SaveToggleResponseDto,
  SavedBusinessItemDto,
  SavedDealItemDto,
  SavedItemType,
  SavedPageDto,
  SavedQueryDto,
  SavedServiceItemDto,
} from './dto/saved.dto';

@Injectable()
export class SavedService {
  constructor(
    @InjectRepository(SavedBusiness)
    private readonly savedBusinessRepository: Repository<SavedBusiness>,
    @InjectRepository(SavedServiceEntity)
    private readonly savedServiceRepository: Repository<SavedServiceEntity>,
    @InjectRepository(DealSave)
    private readonly dealSaveRepository: Repository<DealSave>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
  ) {}

  // --- Business saves ---

  async toggleBusinessSave(
    userId: string,
    businessId: string,
  ): Promise<SaveToggleResponseDto> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      select: ['id'],
    });
    if (!business) throw new NotFoundException('Business not found');

    const existing = await this.savedBusinessRepository.findOne({
      where: { businessId, userId },
    });
    if (existing) {
      await this.savedBusinessRepository.remove(existing);
      return { saved: false };
    }

    await this.savedBusinessRepository.save(
      this.savedBusinessRepository.create({ businessId, userId }),
    );
    return { saved: true };
  }

  async getBusinessSaveStatus(
    userId: string,
    businessId: string,
  ): Promise<SaveStatusResponseDto> {
    const existing = await this.savedBusinessRepository.findOne({
      where: { businessId, userId },
      select: ['id'],
    });
    return { isSaved: Boolean(existing) };
  }

  // --- Service saves ---

  async toggleServiceSave(
    userId: string,
    itemId: string,
  ): Promise<SaveToggleResponseDto> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      select: ['id', 'itemType'],
    });
    if (!item) throw new NotFoundException('Service not found');
    if (item.itemType !== CatalogueItemType.SERVICE) {
      throw new BadRequestException('Only services can be saved here');
    }

    const existing = await this.savedServiceRepository.findOne({
      where: { itemId, userId },
    });
    if (existing) {
      await this.savedServiceRepository.remove(existing);
      return { saved: false };
    }

    await this.savedServiceRepository.save(
      this.savedServiceRepository.create({ itemId, userId }),
    );
    return { saved: true };
  }

  async getServiceSaveStatus(
    userId: string,
    itemId: string,
  ): Promise<SaveStatusResponseDto> {
    const existing = await this.savedServiceRepository.findOne({
      where: { itemId, userId },
      select: ['id'],
    });
    return { isSaved: Boolean(existing) };
  }

  // --- Lists ---

  async getSavedDeals(
    userId: string,
    page: number,
    limit: number,
  ): Promise<SavedPageDto> {
    const [saves, total] = await this.dealSaveRepository.findAndCount({
      where: { userId },
      relations: [
        'offer',
        'offer.items',
        'offer.branch',
        'offer.branch.business',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: saves.map((save) => ({
        id: save.id,
        type: SavedItemType.DEAL,
        savedAt: save.createdAt,
        item: this.toDealItem(save),
      })),
      total,
      page,
      limit,
    };
  }

  async getSavedBusinesses(
    userId: string,
    page: number,
    limit: number,
  ): Promise<SavedPageDto> {
    const [saves, total] = await this.savedBusinessRepository.findAndCount({
      where: { userId },
      relations: ['business', 'business.category', 'business.branches'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: saves.map((save) => ({
        id: save.id,
        type: SavedItemType.BUSINESS,
        savedAt: save.createdAt,
        item: this.toBusinessItem(save),
      })),
      total,
      page,
      limit,
    };
  }

  async getSavedServices(
    userId: string,
    page: number,
    limit: number,
  ): Promise<SavedPageDto> {
    const [saves, total] = await this.savedServiceRepository.findAndCount({
      where: { userId },
      relations: ['item', 'item.business', 'item.branches'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: saves.map((save) => ({
        id: save.id,
        type: SavedItemType.SERVICE,
        savedAt: save.createdAt,
        item: this.toServiceItem(save),
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Unified saved feed. The three save stores are separate tables, so the feed
   * is assembled by reading up to `page * limit` rows from each store, merging
   * by `savedAt` and slicing the requested page. Totals sum across stores.
   */
  async getUnifiedSaved(
    userId: string,
    query: SavedQueryDto,
  ): Promise<SavedPageDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const fetchPerStore = page * limit;

    const [deals, businesses, services] = await Promise.all([
      query.type && query.type !== SavedItemType.DEAL
        ? Promise.resolve<SavedPageDto>({ data: [], total: 0, page, limit })
        : this.getSavedDeals(userId, 1, fetchPerStore),
      query.type && query.type !== SavedItemType.BUSINESS
        ? Promise.resolve<SavedPageDto>({ data: [], total: 0, page, limit })
        : this.getSavedBusinesses(userId, 1, fetchPerStore),
      query.type && query.type !== SavedItemType.SERVICE
        ? Promise.resolve<SavedPageDto>({ data: [], total: 0, page, limit })
        : this.getSavedServices(userId, 1, fetchPerStore),
    ]);

    const merged = [...deals.data, ...businesses.data, ...services.data].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );

    return {
      data: merged.slice((page - 1) * limit, page * limit),
      total: deals.total + businesses.total + services.total,
      page,
      limit,
    };
  }

  // --- Mappers ---

  private toDealItem(save: DealSave): SavedDealItemDto {
    const offer = save.offer;
    const originalPrice = (offer?.items ?? []).reduce(
      (acc, item) => acc + Number(item.price || 0),
      0,
    );
    const calculatedPrice = Number(offer?.calculatedPrice || 0);
    const discountPercent =
      originalPrice > 0 && calculatedPrice < originalPrice
        ? Math.round(((originalPrice - calculatedPrice) / originalPrice) * 100)
        : 0;
    const now = new Date();

    return {
      offerId: offer?.id ?? save.offerId,
      name: offer?.name ?? '',
      mainImage: offer?.mainImage || offer?.items?.[0]?.mainImage || null,
      businessName: offer?.branch?.business?.name ?? '',
      businessLogo: offer?.branch?.business?.logoUrl ?? null,
      branchName: offer?.branch?.name ?? null,
      branchAddress:
        offer?.branch?.address ?? offer?.branch?.business?.address ?? null,
      calculatedPrice,
      originalPrice,
      discountPercent,
      endDate: offer?.endDate ?? null,
      isExpired: offer?.endDate ? now > new Date(offer.endDate) : false,
    };
  }

  private toBusinessItem(save: SavedBusiness): SavedBusinessItemDto {
    const business = save.business;
    const mainBranch =
      business?.branches?.find((branch) => branch.isMainBranch) ??
      business?.branches?.[0];

    return {
      id: business?.id ?? save.businessId,
      name: business?.name ?? '',
      logoUrl: business?.logoUrl ?? null,
      categoryName: business?.category?.name ?? null,
      address: business?.address ?? mainBranch?.address ?? null,
      city: business?.city ?? mainBranch?.city ?? null,
      isVerified: business?.isVerified ?? false,
      slug: business?.uniqueCode ?? '',
      branchCode: mainBranch?.uniqueCode ?? null,
    };
  }

  private toServiceItem(save: SavedServiceEntity): SavedServiceItemDto {
    const item = save.item;
    const branch = item?.branches?.[0];

    return {
      id: item?.id ?? save.itemId,
      name: item?.name ?? '',
      mainImage: item?.mainImage ?? null,
      price: Number(item?.price || 0),
      priceType: item?.priceType,
      priceRangeMin: item?.priceRangeMin ?? null,
      priceRangeMax: item?.priceRangeMax ?? null,
      duration: item?.duration ?? null,
      businessId: item?.businessId ?? '',
      businessName: item?.business?.name ?? '',
      branchId: branch?.id ?? null,
      branchName: branch?.name ?? null,
      isBookable: item?.isBookable ?? false,
    };
  }
}
