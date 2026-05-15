import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ReorderBannersDto } from './dto/reorder-banners.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
  ) {}

  async findAll(): Promise<Banner[]> {
    return this.bannerRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findActive(): Promise<Banner[]> {
    return this.bannerRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Banner> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) throw new NotFoundException(`Banner with id "${id}" not found`);
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
    return this.bannerRepository.save(banner);
  }

  async update(id: string, dto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.findOne(id);
    Object.assign(banner, dto);
    return this.bannerRepository.save(banner);
  }

  async remove(id: string): Promise<void> {
    const banner = await this.findOne(id);
    await this.bannerRepository.softDelete(banner.id);
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

    return this.bannerRepository.save(updated);
  }
}
