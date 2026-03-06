import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Device, DeviceStatus } from './entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { AdminCreateDeviceDto } from './dto/admin-create-device.dto';
import { AdminUpdateDeviceDto } from './dto/admin-update-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { UpdateAssetNamesDto } from './dto/update-asset-names.dto';
import { Order, OrderStatus } from '../products/entities/order.entity';
import { Branch } from '../branches/entities/branch.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
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

  async createAutoDevice(businessId: string): Promise<Device> {
    let code = '';
    let isUnique = false;

    // Retry loop to ensure unique code
    while (!isUnique) {
      code = this.generateRandomCode();
      const existing = await this.devicesRepository.findOneBy({ code });
      if (!existing) {
        isUnique = true;
      }
    }

    const device = this.devicesRepository.create({
      name: 'Primary Business Device',
      code,
      status: DeviceStatus.ACTIVE,
      businessId,
      type: 'Card', // Default type
    });

    return this.devicesRepository.save(device);
  }

  async findAllByBusiness(
    businessId: string,
    branchId?: string,
  ): Promise<Device[]> {
    const where: any = { businessId };
    if (branchId) {
      where.branchId = branchId;
    }
    return this.devicesRepository.find({
      where,
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

  async findByCode(code: string): Promise<Device | null> {
    return this.devicesRepository.findOneBy({ code });
  }

  async update(
    id: string,
    businessId: string,
    updateDeviceDto: UpdateDeviceDto,
  ): Promise<Device> {
    const device = await this.findOne(id, businessId);

    // If branchId is an empty string, treat it as null (to unset the branch)
    if (updateDeviceDto.branchId === '') {
      updateDeviceDto.branchId = null;
    }

    // Validate branchId if a new UUID is provided
    if (updateDeviceDto.branchId) {
      const branch = await this.branchRepository.findOneBy({
        id: updateDeviceDto.branchId,
      });
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
      if (branch.businessId !== businessId) {
        throw new BadRequestException(
          'Branch does not belong to your business',
        );
      }
    }

    Object.assign(device, updateDeviceDto);

    try {
      return await this.devicesRepository.save(device);
    } catch (error) {
      if (error.code === '22P02') {
        throw new BadRequestException('Invalid UUID format provided');
      }
      throw error;
    }
  }

  async fulfillOrder(orderId: string): Promise<Device[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'user',
        'product',
        'product.productType',
        'quote',
        'quote.product',
        'quote.product.productType',
      ],
    });

    if (!order) throw new NotFoundException('Order not found');

    const existingDevices = await this.devicesRepository.count({
      where: { orderId },
    });
    if (existingDevices > 0) {
      throw new ConflictException('Devices already generated for this order');
    }

    const businessId = order.user?.businessId;
    if (!businessId) {
      throw new ConflictException('User does not have a business assigned');
    }

    const quantity = order.quantity || order.quote?.quantity || 0;
    const productName =
      order.product?.name || order.quote?.product?.name || 'Device';
    const productType =
      order.product?.productType || order.quote?.product?.productType;

    if (quantity <= 0) {
      throw new ConflictException('Order quantity is invalid');
    }

    // Efficient bulk generation logic
    const uniqueCodes = new Set<string>();
    while (uniqueCodes.size < quantity) {
      // Generate batches
      const batchSize = quantity - uniqueCodes.size;
      const potentialCodes: string[] = [];

      // Generate a batch of random codes
      for (let i = 0; i < batchSize + 10; i++) {
        // Generate a few extras to account for collisions
        potentialCodes.push(this.generateRandomCode());
      }

      // Check existence in DB in one query
      const existingDevices = await this.devicesRepository.find({
        where: { code: In(potentialCodes) },
        select: ['code'],
      });

      const existingCodes = new Set(existingDevices.map((d) => d.code));

      // Add non-conflicting codes to our set
      for (const code of potentialCodes) {
        if (!existingCodes.has(code)) {
          uniqueCodes.add(code);
          if (uniqueCodes.size >= quantity) break;
        }
      }
    }

    const codesArray = Array.from(uniqueCodes);
    const newDevices: Partial<Device>[] = [];

    for (let i = 0; i < quantity; i++) {
      newDevices.push({
        name: `${productName} #${i + 1}`,
        code: codesArray[i],
        status: DeviceStatus.ACTIVE,
        businessId,
        orderId: order.id,
        type: productType?.name || 'Card',
        productTypeId: productType?.id,
      });
    }

    // Bulk insert is more efficient than saving individual entities
    // save() with an array handles insertion in batches
    const createdDevices = await this.devicesRepository.save(
      this.devicesRepository.create(newDevices as Device[]),
    );

    order.status = OrderStatus.READY;
    await this.orderRepository.save(order);

    return createdDevices;
  }

  async remove(id: string, businessId: string): Promise<void> {
    const device = await this.findOne(id, businessId);
    await this.devicesRepository.remove(device);
  }

  async getStats(businessId: string, branchId?: string) {
    const devices = await this.findAllByBusiness(businessId, branchId);
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
    const alerts = await this.devicesRepository
      .createQueryBuilder('d')
      .where('d.batteryLevel < :lowBattery', { lowBattery: 20 })
      .getCount();

    return {
      total,
      active,
      inventory,
      alerts,
    };
  }

  async adminCreate(dto: AdminCreateDeviceDto): Promise<Device> {
    const existing = await this.devicesRepository.findOneBy({
      code: dto.code,
    });
    if (existing) {
      throw new ConflictException('Device Serial already registered');
    }

    const device = this.devicesRepository.create({
      code: dto.code,
      name: dto.name || '',
      type: dto.type || 'Card',
      businessId: dto.businessId,
      location: dto.location,
      status: DeviceStatus.ACTIVE,
    });
    return this.devicesRepository.save(device);
  }

  async adminUpdate(
    id: string,
    updates: AdminUpdateDeviceDto,
  ): Promise<Device> {
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
