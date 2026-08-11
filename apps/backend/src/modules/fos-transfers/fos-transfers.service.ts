import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FosTransfer } from './entities/transfer.entity';
import { CreateTransferDto, ListTransfersQueryDto } from './dto/transfer.dto';

@Injectable()
export class FosTransfersService {
  constructor(
    @InjectRepository(FosTransfer)
    private readonly transferRepo: Repository<FosTransfer>,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  private toTransferDto(t: FosTransfer) {
    return {
      id: t.id,
      date: t.date,
      type: t.type,
      category: t.category,
      description: t.description,
      amount: this.toNumber(t.amount),
      reference: t.reference,
    };
  }

  async list(query: ListTransfersQueryDto) {
    const page = query.page || 1;
    const perPage = query.perPage || 20;
    const [rows, total] = await this.transferRepo.findAndCount({
      order: { date: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      transfers: rows.map((t) => this.toTransferDto(t)),
      total,
    };
  }

  async create(dto: CreateTransferDto) {
    const transfer = this.transferRepo.create({
      date: dto.date,
      type: 'Transfer',
      category: dto.category ?? undefined,
      description: dto.description,
      amount: dto.amount,
      reference: dto.reference ?? undefined,
    });
    const saved = await this.transferRepo.save(transfer);
    return this.toTransferDto(saved);
  }

  async remove(id: string) {
    const transfer = await this.transferRepo.findOne({ where: { id } });
    if (!transfer) {
      throw new NotFoundException(`Transfer with id ${id} not found`);
    }
    await this.transferRepo.remove(transfer);
    return { success: true };
  }
}
