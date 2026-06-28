import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingMockup } from '../entities/marketing-mockup.entity';
import { CreateMockupDto } from '../dto/create-mockup.dto';

@Injectable()
export class MockupsService {
  constructor(
    @InjectRepository(MarketingMockup)
    private readonly mockupRepo: Repository<MarketingMockup>,
  ) {}

  async create(createDto: CreateMockupDto): Promise<MarketingMockup> {
    const mockup = this.mockupRepo.create(createDto);
    return this.mockupRepo.save(mockup);
  }

  async findAll(type?: string, activeOnly = true): Promise<MarketingMockup[]> {
    const query = this.mockupRepo.createQueryBuilder('mockup');

    if (activeOnly) {
      query.andWhere('mockup.isActive = :isActive', { isActive: true });
    }
    if (type) {
      query.andWhere('mockup.type = :type', { type });
    }

    return query.orderBy('mockup.name', 'ASC').getMany();
  }

  async findOne(id: string): Promise<MarketingMockup> {
    const mockup = await this.mockupRepo.findOne({ where: { id } });
    if (!mockup) {
      throw new NotFoundException(`Mockup with ID ${id} not found`);
    }
    return mockup;
  }

  async update(
    id: string,
    updateDto: Partial<CreateMockupDto>,
  ): Promise<MarketingMockup> {
    const mockup = await this.findOne(id);
    Object.assign(mockup, updateDto);
    return this.mockupRepo.save(mockup);
  }

  async remove(id: string): Promise<void> {
    const mockup = await this.findOne(id);
    await this.mockupRepo.remove(mockup);
  }
}
