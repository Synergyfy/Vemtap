import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { CatalogueOffer, CatalogueOfferPricingType, CatalogueOfferStatus } from './entities/catalogue-offer.entity';
import { CatalogueItem } from './entities/catalogue-item.entity';
import { CreateCatalogueOfferDto, UpdateCatalogueOfferDto, CatalogueOfferQueryDto } from './dto/offer.dto';
import { Branch } from '../branches/entities/branch.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class CatalogueOfferService {
  constructor(
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async createOffer(dto: CreateCatalogueOfferDto, businessId: string) {
    const caps = await this.subscriptionsService.getCapabilities(businessId);
    if (!caps.capabilities.catalogueOffers.enabled) {
      throw new ForbiddenException('Catalogue feature is not enabled for your plan');
    }

    if (
      caps.capabilities.catalogueOffers.limit !== 'unlimited' &&
      typeof caps.capabilities.catalogueOffers.remaining === 'number' &&
      caps.capabilities.catalogueOffers.remaining <= 0
    ) {
      throw new ForbiddenException('You have reached the limit for catalogue offers');
    }

    const branch = await this.branchRepository.findOne({
      where: { id: dto.branchId, businessId },
    });
    if (!branch) throw new BadRequestException('Branch not found or unauthorized');

    const items = await this.itemRepository.find({
      where: { id: In(dto.itemIds), businessId },
      relations: ['branches'],
    });

    if (items.length !== dto.itemIds.length) {
      throw new BadRequestException('Some items not found');
    }

    // Verify items belong to the branch
    for (const item of items) {
      if (!item.branches.some(b => b.id === dto.branchId)) {
        throw new BadRequestException(`Item ${item.name} is not available in branch ${dto.branchId}`);
      }
    }

    const offer = this.offerRepository.create({
      ...dto,
      businessId,
      items,
    });

    offer.calculatedPrice = this.calculatePrice(offer, items);

    return this.offerRepository.save(offer);
  }

  async updateOffer(id: string, dto: UpdateCatalogueOfferDto, businessId: string) {
    const offer = await this.offerRepository.findOne({
      where: { id, businessId },
      relations: ['items', 'items.branches'],
    });
    if (!offer) throw new NotFoundException('Offer not found');

    if (dto.itemIds) {
      const items = await this.itemRepository.find({
        where: { id: In(dto.itemIds), businessId },
        relations: ['branches'],
      });
      if (items.length !== dto.itemIds.length) {
        throw new BadRequestException('Some items not found');
      }
      // Verify items belong to the branch
      for (const item of items) {
        if (!item.branches.some(b => b.id === offer.branchId)) {
          throw new BadRequestException(`Item ${item.name} is not available in this branch`);
        }
      }
      offer.items = items;
    }

    if (dto.mainImage) offer.mainImage = dto.mainImage;
    if (dto.galleryImages) offer.galleryImages = dto.galleryImages;

    Object.assign(offer, dto);
    offer.calculatedPrice = this.calculatePrice(offer, offer.items);

    return this.offerRepository.save(offer);
  }

  async deleteOffer(id: string, businessId: string) {
    const offer = await this.offerRepository.findOne({
      where: { id, businessId },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    return this.offerRepository.remove(offer);
  }

  async findAllOffersAdmin(businessId: string, branchId?: string) {
    const where: any = { businessId };
    if (branchId) where.branchId = branchId;
    return this.offerRepository.find({
      where,
      relations: ['items', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllOffersPublic(branchId: string, query: CatalogueOfferQueryDto) {
    const { page = 1, limit = 10, search, sortBy = 'newest' } = query;
    const skip = (page - 1) * limit;
  
    const qb = this.offerRepository.createQueryBuilder('offer')
      .leftJoinAndSelect('offer.items', 'item')
      .where('offer.branchId = :branchId', { branchId })
      .andWhere('offer.status = :status', { status: CatalogueOfferStatus.ACTIVE });
  
    if (search) {
      qb.andWhere('offer.name ILIKE :search', { search: `%${search}%` });
    }
  
    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        qb.orderBy('offer.calculatedPrice', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('offer.calculatedPrice', 'DESC');
        break;
      case 'newest':
      default:
        qb.orderBy('offer.createdAt', 'DESC');
        break;
    }
  
    const [data, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();
  
    return { data, total, page, limit };
  }

  async findOneOffer(id: string, branchId?: string) {
    const where: any = { id };
    if (branchId) where.branchId = branchId;
    const offer = await this.offerRepository.findOne({
      where,
      relations: ['items', 'reward'],
    });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async countOffers(branchId: string) {
    return this.offerRepository.count({
      where: {
        branchId,
        status: CatalogueOfferStatus.ACTIVE,
      },
    });
  }

  private calculatePrice(offer: CatalogueOffer, items: CatalogueItem[]) {
    const sum = items.reduce((acc, item) => acc + Number(item.price), 0);
    switch (offer.pricingType) {
      case CatalogueOfferPricingType.SUM:
        return sum;
      case CatalogueOfferPricingType.PERCENTAGE_DISCOUNT:
        const discountValue = Number(offer.discountValue || 0);
        return sum * (1 - discountValue / 100);
      case CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE:
        return Number(offer.fixedPrice || sum);
      default:
        return sum;
    }
  }
}
