import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { FosRecord } from './entities/record.entity';
import { CreateRecordDto, ListRecordsQueryDto } from './dto/record.dto';

@Injectable()
export class FosRecordsService {
  constructor(
    @InjectRepository(FosRecord)
    private readonly recordRepo: Repository<FosRecord>,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  private toRecordDto(r: FosRecord) {
    return {
      id: r.id,
      date: r.date,
      type: r.type,
      category: r.category,
      description: r.description,
      amount: this.toNumber(r.amount),
    };
  }

  async list(query: ListRecordsQueryDto) {
    const where: Record<string, unknown> = {};

    if (query.year) {
      const year = String(query.year).padStart(4, '0');
      if (query.month) {
        const month = String(query.month).padStart(2, '0');
        where.date = Between(`${year}-${month}-01`, `${year}-${month}-31`);
      } else {
        where.date = Between(`${year}-01-01`, `${year}-12-31`);
      }
    }
    if (query.type) {
      where.type = query.type;
    }

    const page = query.page || 1;
    const perPage = query.perPage || 20;
    const [rows, total] = await this.recordRepo.findAndCount({
      where,
      order: { date: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      records: rows.map((r) => this.toRecordDto(r)),
      total,
    };
  }

  async create(dto: CreateRecordDto) {
    const record = this.recordRepo.create({
      date: dto.date,
      type: dto.type,
      category: dto.category,
      description: dto.description,
      amount: dto.amount,
    });
    const saved = await this.recordRepo.save(record);
    return this.toRecordDto(saved);
  }

  async remove(id: string) {
    const record = await this.recordRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Record with id ${id} not found`);
    }
    await this.recordRepo.remove(record);
    return { success: true };
  }
}
