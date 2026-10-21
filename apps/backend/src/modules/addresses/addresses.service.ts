import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, Repository } from 'typeorm';
import { CustomerAddress } from './entities/customer-address.entity';
import {
  AddressListDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/address.dto';

export const MAX_ADDRESSES_PER_USER = 10;

/**
 * A customer's saved addresses. Exactly one is the default whenever any
 * exist: the first one saved, or whichever the customer last picked.
 */
@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(CustomerAddress)
    private readonly addresses: Repository<CustomerAddress>,
  ) {}

  async list(userId: string): Promise<AddressListDto> {
    const data = await this.addresses.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
      take: MAX_ADDRESSES_PER_USER,
    });
    return { data, total: data.length };
  }

  private async owned(userId: string, id: string) {
    const address = await this.addresses.findOne({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  private clearDefault(
    manager: EntityManager,
    userId: string,
    keepId?: string,
  ) {
    return manager
      .getRepository(CustomerAddress)
      .update(
        keepId
          ? { userId, isDefault: true, id: Not(keepId) }
          : { userId, isDefault: true },
        { isDefault: false },
      );
  }

  async create(userId: string, dto: CreateAddressDto) {
    const count = await this.addresses.count({ where: { userId } });
    if (count >= MAX_ADDRESSES_PER_USER) {
      throw new BadRequestException(
        `You can save up to ${MAX_ADDRESSES_PER_USER} addresses`,
      );
    }
    const isDefault = count === 0 || dto.isDefault === true;
    return this.addresses.manager.transaction(async (manager) => {
      if (isDefault) await this.clearDefault(manager, userId);
      const repo = manager.getRepository(CustomerAddress);
      return repo.save(
        repo.create({
          userId,
          label: dto.label.trim(),
          line: dto.line.trim(),
          area: dto.area?.trim() || null,
          notes: dto.notes?.trim() || null,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          isDefault,
        }),
      );
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.owned(userId, id);
    if (dto.isDefault === false && address.isDefault) {
      throw new BadRequestException(
        'Choose another default address instead of unsetting this one',
      );
    }
    if (dto.label !== undefined) address.label = dto.label.trim();
    if (dto.line !== undefined) address.line = dto.line.trim();
    if (dto.area !== undefined) address.area = dto.area.trim() || null;
    if (dto.notes !== undefined) address.notes = dto.notes.trim() || null;
    if (dto.latitude !== undefined) address.latitude = dto.latitude;
    if (dto.longitude !== undefined) address.longitude = dto.longitude;

    return this.addresses.manager.transaction(async (manager) => {
      if (dto.isDefault === true && !address.isDefault) {
        await this.clearDefault(manager, userId, id);
        address.isDefault = true;
      }
      return manager.getRepository(CustomerAddress).save(address);
    });
  }

  setDefault(userId: string, id: string) {
    return this.update(userId, id, { isDefault: true });
  }

  /** Removes the address; when it was the default, the oldest remaining one takes over. */
  async remove(userId: string, id: string): Promise<void> {
    const address = await this.owned(userId, id);
    await this.addresses.manager.transaction(async (manager) => {
      const repo = manager.getRepository(CustomerAddress);
      await repo.softDelete({ id, userId });
      if (!address.isDefault) return;
      const next = await repo.findOne({
        where: { userId },
        order: { createdAt: 'ASC' },
        select: ['id'],
      });
      if (next) await repo.update(next.id, { isDefault: true });
    });
  }
}
