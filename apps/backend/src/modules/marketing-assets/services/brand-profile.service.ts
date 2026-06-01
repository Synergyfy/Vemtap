import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingBrandOverride } from '../entities/marketing-brand-override.entity';
import { Business } from '../../businesses/entities/business.entity';
import { SaveBrandOverrideDto } from '../dto/brand-override.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class BrandProfileService {
  constructor(
    @InjectRepository(MarketingBrandOverride)
    private readonly overrideRepo: Repository<MarketingBrandOverride>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
  ) {}

  async getBrandProfile(user: User) {
    const businessId = user.businessId || user.ownedBusiness?.id;
    if (!businessId) {
      throw new ForbiddenException('User is not associated with any business');
    }

    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    const override = await this.overrideRepo.findOne({ where: { businessId } });

    return {
      businessId,
      name: business.name,
      logoUrl: override?.logoUrl || business.logoUrl || null,
      primaryColor: override?.primaryColor || '#2563EB',
      secondaryColor: override?.secondaryColor || '#1E293B',
      accentColor: override?.accentColor || '#F59E0B',
      tagline: override?.tagline || null,
      fontFamily: override?.fontFamily || 'Inter',
      website: override?.website || null,
      phone: override?.phone || null,
      email: override?.email || null,
      socialLinks: override?.socialLinks || null,
      isOverridden: !!override,
    };
  }

  async saveBrandOverride(user: User, dto: SaveBrandOverrideDto) {
    const businessId = user.businessId || user.ownedBusiness?.id;
    if (!businessId) {
      throw new ForbiddenException('User is not associated with any business');
    }

    let override = await this.overrideRepo.findOne({ where: { businessId } });

    if (!override) {
      override = this.overrideRepo.create({ businessId });
    }

    Object.assign(override, dto);
    await this.overrideRepo.save(override);

    return this.getBrandProfile(user);
  }

  async deleteBrandOverride(user: User) {
    const businessId = user.businessId || user.ownedBusiness?.id;
    if (!businessId) {
      throw new ForbiddenException('User is not associated with any business');
    }

    const override = await this.overrideRepo.findOne({ where: { businessId } });
    if (override) {
      await this.overrideRepo.remove(override);
    }

    return this.getBrandProfile(user);
  }
}
