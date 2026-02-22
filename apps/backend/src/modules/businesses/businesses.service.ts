import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business, BusinessStatus } from './entities/business.entity';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private businessesRepository: Repository<Business>,
  ) { }

  async create(businessData: Partial<Business>): Promise<Business> {
    if (businessData.ownerId) {
      const existing = await this.findByOwner(businessData.ownerId);
      if (existing) {
        throw new ConflictException('Owner already has a business');
      }
    }
    const business = this.businessesRepository.create(businessData);
    return this.businessesRepository.save(business);
  }

  async findByOwner(ownerId: string): Promise<Business | null> {
    return this.businessesRepository.findOne({ where: { ownerId } });
  }

  async findById(id: string): Promise<Business> {
    const business = await this.businessesRepository.findOneBy({ id });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    const business = await this.findById(id);
    Object.assign(business, updateBusinessDto);
    return this.businessesRepository.save(business);
  }

  // --- Admin Methods ---

  async findAllAdmin(query: { search?: string, status?: BusinessStatus, page?: number, limit?: number }) {
    const qb = this.businessesRepository.createQueryBuilder('business')
      .leftJoinAndSelect('business.owner', 'owner')
      .leftJoinAndSelect('business.devices', 'devices');

    if (query.status) {
      qb.andWhere('business.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('(business.name ILIKE :search OR owner.email ILIKE :search OR owner.firstName ILIKE :search)', { search: `%${query.search}%` });
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('business.createdAt', 'DESC');

    const [businesses, total] = await qb.getManyAndCount();

    // Stats
    const activeCount = await this.businessesRepository.count({ where: { status: BusinessStatus.ACTIVE } });
    const pendingCount = await this.businessesRepository.count({ where: { status: BusinessStatus.PENDING } });
    const suspendedCount = await this.businessesRepository.count({ where: { status: BusinessStatus.SUSPENDED } });

    return {
      data: businesses,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
      stats: {
        total: activeCount + pendingCount + suspendedCount,
        active: activeCount,
        pending: pendingCount,
        suspended: suspendedCount
      }
    };
  }

  async adminCreate(businessData: Partial<Business>): Promise<Business> {
    const business = this.businessesRepository.create(businessData);
    business.status = BusinessStatus.ACTIVE; // Admins create active businesses instantly
    return this.businessesRepository.save(business);
  }

  async adminDelete(id: string): Promise<void> {
    const business = await this.findById(id);
    await this.businessesRepository.remove(business);
  }

  async approve(id: string): Promise<Business> {
    const business = await this.findById(id);
    business.status = BusinessStatus.ACTIVE;
    return this.businessesRepository.save(business);
  }

  async reject(id: string): Promise<void> {
    const business = await this.findById(id);
    // Hard delete or set status to something else if you don't wanna delete. Here we hard delete from queue.
    await this.businessesRepository.remove(business);
  }

  async suspend(id: string, reason: string): Promise<Business> {
    const business = await this.findById(id);
    business.status = BusinessStatus.SUSPENDED;
    business.suspensionReason = reason;
    business.suspendedAt = new Date();
    return this.businessesRepository.save(business);
  }

  async reactivate(id: string): Promise<Business> {
    const business = await this.findById(id);
    business.status = BusinessStatus.ACTIVE;
    business.suspensionReason = null as any;
    business.suspendedAt = null as any;
    return this.businessesRepository.save(business);
  }
}
