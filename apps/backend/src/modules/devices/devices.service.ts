import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus } from './entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { UpdateAssetNamesDto } from './dto/update-asset-names.dto';
import { Order, OrderStatus } from '../products/entities/order.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(
    businessId: string,
    createDeviceDto: CreateDeviceDto,
  ): Promise<Device> {
    const existing = await this.devicesRepository.findOneBy({
      code: createDeviceDto.code,
    });
    if (existing) {
      throw new ConflictException('Device code already registered');
    }

    const device = this.devicesRepository.create({
      ...createDeviceDto,
      businessId,
    });
    return this.devicesRepository.save(device);
  }

  async findAllByBusiness(businessId: string): Promise<Device[]> {
    return this.devicesRepository.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, businessId: string): Promise<Device> {
    const device = await this.devicesRepository.findOneBy({ id, businessId });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return device;
  }

  async update(
    id: string,
    businessId: string,
    updateDeviceDto: UpdateDeviceDto,
  ): Promise<Device> {
    const device = await this.findOne(id, businessId);
    Object.assign(device, updateDeviceDto);
    return this.devicesRepository.save(device);
  }

  async remove(id: string, businessId: string): Promise<void> {
    const device = await this.findOne(id, businessId);
    await this.devicesRepository.remove(device);
  }

  async getStats(businessId: string) {
    const devices = await this.findAllByBusiness(businessId);
    return {
      totalDevices: devices.length,
      activeNow: devices.filter((d) => d.status === DeviceStatus.ACTIVE).length,
      totalScans: devices.reduce((acc, d) => acc + d.totalScans, 0),
      offline: devices.filter((d) => d.status === DeviceStatus.INACTIVE).length,
    };
  }

  generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 9; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async generateDevicesForReadyOrders(
    userId: string,
    businessId: string,
  ): Promise<Device[]> {
    const readyOrders = await this.orderRepository.find({
      where: { userId, status: OrderStatus.READY },
      relations: ['quote', 'devices'],
    });

    const newDevices: Device[] = [];

    for (const order of readyOrders) {
      if (!order.quote) continue;

      const totalAllowed = order.quote.quantity;
      const currentGenerated = order.devices?.length || 0;
      let remaining = totalAllowed - currentGenerated;

      while (remaining > 0) {
        let code = '';
        let isUnique = false;

        while (!isUnique) {
          code = this.generateRandomCode();
          const existing = await this.devicesRepository.findOneBy({ code });
          if (!existing) isUnique = true;
        }

        const device = this.devicesRepository.create({
          name: '',
          code,
          status: DeviceStatus.ACTIVE,
          businessId,
          orderId: order.id,
          order,
        });

        newDevices.push(device);
        remaining--;
      }
    }

    if (newDevices.length > 0) {
      await this.devicesRepository.save(newDevices);
    }

    return newDevices;
  }

  async updateAssetNames(
    businessId: string,
    dto: UpdateAssetNamesDto,
  ): Promise<Device[]> {
    const updatedDevices: Device[] = [];

    for (const asset of dto.assets) {
      const device = await this.devicesRepository.findOneBy({
        id: asset.id,
        businessId,
      });

      if (device) {
        device.name = asset.name;
        await this.devicesRepository.save(device);
        updatedDevices.push(device);
      }
    }

    return updatedDevices;
  }

  // --- Admin Methods ---

  async findAllAdmin(query: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.devicesRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.business', 'business');

    if (query.status) {
      if (query.status === 'active') {
        qb.andWhere('device.businessId IS NOT NULL');
      } else if (query.status === 'inactive') {
        qb.andWhere('device.businessId IS NULL');
      }
    }

    if (query.search) {
      qb.andWhere(
        '(device.code ILIKE :search OR device.id ILIKE :search OR business.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('device.createdAt', 'DESC');

    const [devices, total] = await qb.getManyAndCount();

    return {
      data: devices,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async getAdminStats() {
    const total = await this.devicesRepository.count();
    const active = await this.devicesRepository
      .createQueryBuilder('d')
      .where('d.businessId IS NOT NULL')
      .getCount();
    const inventory = await this.devicesRepository
      .createQueryBuilder('d')
      .where('d.businessId IS NULL')
      .getCount();

    return {
      total,
      active,
      inventory,
      alerts: 0, // Mocking alerts for now
    };
  }

  async adminCreate(deviceData: any): Promise<Device> {
    const existing = await this.devicesRepository.findOneBy({
      code: deviceData.id,
    });
    if (existing) {
      throw new ConflictException('Device Serial already registered');
    }

    const device = this.devicesRepository.create({
      code: deviceData.id,
      name: deviceData.name || '',
      type: deviceData.type,
      // In a real app, assignedTo would map to a business ID.
      // If it's literally the string 'Unassigned' or blank, we leave businessId null
      status: DeviceStatus.ACTIVE,
    });
    return this.devicesRepository.save(device);
  }

  async adminUpdate(id: string, updates: Partial<Device>): Promise<Device> {
    const device = await this.devicesRepository.findOneBy({ id });
    if (!device) throw new NotFoundException('Device not found');
    Object.assign(device, updates);
    return this.devicesRepository.save(device);
  }

  async adminDelete(id: string): Promise<void> {
    const device = await this.devicesRepository.findOneBy({ id });
    if (!device) throw new NotFoundException('Device not found');
    await this.devicesRepository.remove(device);
  }
}
