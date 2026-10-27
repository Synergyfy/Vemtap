import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ReorderBannersDto } from './dto/reorder-banners.dto';
import { deleteCacheKeys } from '../../common/utils/delete-cache-keys';

const CACHE_KEY_ACTIVE = 'banners:active';
const CACHE_KEY_ALL = 'banners:all';

@Injectable()
export class BannersService {
  private readonly logger = new Logger(BannersService.name);

  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async findAll(placement?: 'business' | 'customer'): Promise<Banner[]> {
    const cacheKey = placement
      ? `${CACHE_KEY_ALL}:${placement}`
      : CACHE_KEY_ALL;
    const cached = await this.cacheManager.get<Banner[]>(cacheKey);
    if (cached) return cached;
    const banners = await this.bannerRepository.find({
      where: placement ? { placement } : {},
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    await this.cacheManager.set(cacheKey, banners);
    return banners;
  }

  async findActive(placement?: 'business' | 'customer'): Promise<Banner[]> {
    const cacheKey = placement
      ? `${CACHE_KEY_ACTIVE}:${placement}`
      : CACHE_KEY_ACTIVE;
    const cached = await this.cacheManager.get<Banner[]>(cacheKey);
    if (cached) return cached;
    const banners = await this.bannerRepository.find({
      where: placement ? { isActive: true, placement } : { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    await this.cacheManager.set(cacheKey, banners);
    return banners;
  }

  async findOne(id: string): Promise<Banner> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner)
      throw new NotFoundException(`Banner with id "${id}" not found`);
    return banner;
  }

  async create(dto: CreateBannerDto): Promise<Banner> {
    const maxOrder = await this.bannerRepository
      .createQueryBuilder('b')
      .select('COALESCE(MAX(b.sortOrder), -1)', 'max')
      .getRawOne();

    const banner = this.bannerRepository.create({
      ...dto,
      sortOrder: dto.sortOrder ?? (maxOrder?.max ?? -1) + 1,
    });
    const saved = await this.bannerRepository.save(banner);
    await this.clearCache();
    return saved;
  }

  async update(id: string, dto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.findOne(id);
    Object.assign(banner, dto);
    const saved = await this.bannerRepository.save(banner);
    await this.clearCache();
    return saved;
  }

  async remove(id: string): Promise<void> {
    const banner = await this.findOne(id);
    await this.bannerRepository.softDelete(banner.id);
    await this.clearCache();
  }

  async reorder(dto: ReorderBannersDto): Promise<Banner[]> {
    const banners = await this.bannerRepository.findByIds(dto.orderedIds);
    const bannerMap = new Map(banners.map((b) => [b.id, b]));

    const updated = dto.orderedIds
      .map((id, index) => {
        const banner = bannerMap.get(id);
        if (!banner) return null;
        banner.sortOrder = index;
        return banner;
      })
      .filter(Boolean) as Banner[];

    const saved = await this.bannerRepository.save(updated);
    await this.clearCache();
    return saved;
  }

  private async clearCache() {
    try {
      await deleteCacheKeys(this.cacheManager, ['*banners:*']);
    } catch (error) {
      this.logger.error(
        `Failed to clear banner cache: ${(error as Error).message}`,
      );
    }
  }
}
