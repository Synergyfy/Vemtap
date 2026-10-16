import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PosPeripheral } from './entities/pos-peripheral.entity';
import { PosTill } from './entities/pos-till.entity';
import { Branch } from '../branches/entities/branch.entity';
import {
  CreatePosPeripheralDto,
  PosPeripheralHeartbeatDto,
  PosPeripheralQueryDto,
  UpdatePosPeripheralDto,
} from './dto/pos-peripheral.dto';

const MAX_PERIPHERALS_LISTED = 200;

@Injectable()
export class PosPeripheralsService {
  constructor(
    @InjectRepository(PosPeripheral)
    private readonly peripheralRepository: Repository<PosPeripheral>,
    @InjectRepository(PosTill)
    private readonly tillRepository: Repository<PosTill>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  /** Bounded list; a venue has a handful of devices per till. */
  async list(businessId: string, query: PosPeripheralQueryDto) {
    const where: FindOptionsWhere<PosPeripheral> = { businessId };
    if (query.branchId) where.branchId = query.branchId;
    if (query.type) where.type = query.type;
    const data = await this.peripheralRepository.find({
      where,
      order: { type: 'ASC', name: 'ASC' },
      take: MAX_PERIPHERALS_LISTED,
    });
    return { data, total: data.length };
  }

  async create(businessId: string, dto: CreatePosPeripheralDto) {
    const branch = await this.branchRepository.findOne({
      where: { id: dto.branchId, businessId },
      select: ['id'],
    });
    if (!branch) throw new NotFoundException('Branch not found');
    if (dto.tillId) await this.assertTill(businessId, dto.tillId);

    return this.peripheralRepository.save(
      this.peripheralRepository.create({
        businessId,
        branchId: dto.branchId,
        tillId: dto.tillId ?? null,
        type: dto.type,
        name: dto.name.trim(),
        model: dto.model ?? null,
        connection: dto.connection,
        address: dto.address ?? null,
      }),
    );
  }

  async update(businessId: string, id: string, dto: UpdatePosPeripheralDto) {
    const peripheral = await this.findOwned(businessId, id);
    if (dto.tillId) await this.assertTill(businessId, dto.tillId);
    Object.assign(peripheral, {
      ...(dto.tillId !== undefined ? { tillId: dto.tillId } : {}),
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.model !== undefined ? { model: dto.model } : {}),
      ...(dto.connection !== undefined ? { connection: dto.connection } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
    });
    return this.peripheralRepository.save(peripheral);
  }

  async remove(businessId: string, id: string) {
    const peripheral = await this.findOwned(businessId, id);
    await this.peripheralRepository.softDelete({ id: peripheral.id });
    return { message: 'Device removed' };
  }

  /** The app reports what it sees when it talks to the device. */
  async heartbeat(
    businessId: string,
    id: string,
    dto: PosPeripheralHeartbeatDto,
  ) {
    const peripheral = await this.findOwned(businessId, id);
    peripheral.status = dto.status;
    peripheral.lastSeenAt = new Date();
    return this.peripheralRepository.save(peripheral);
  }

  count(businessId: string) {
    return this.peripheralRepository.count({ where: { businessId } });
  }

  private async findOwned(businessId: string, id: string) {
    const peripheral = await this.peripheralRepository.findOne({
      where: { id, businessId },
    });
    if (!peripheral) throw new NotFoundException('Device not found');
    return peripheral;
  }

  private async assertTill(businessId: string, tillId: string) {
    const till = await this.tillRepository.findOne({
      where: { id: tillId, businessId },
      select: ['id'],
    });
    if (!till) throw new NotFoundException('Till not found');
  }
}
