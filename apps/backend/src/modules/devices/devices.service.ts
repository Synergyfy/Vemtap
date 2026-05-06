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
import { AdminDeviceQueryDto } from './dto/admin-device-query.dto';
import { Order, OrderStatus } from '../products/entities/order.entity';
import { Branch } from '../branches/entities/branch.entity';
import { BranchesService } from '../branches/branches.service';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    private readonly branchesService: BranchesService,
  ) {}

  async checkBranchAccess(user: any, branchId: string): Promise<boolean> {
    return this.branchesService.checkBranchAccess(user, branchId);
  }

  async create(
    branchId: string,
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
      branchId,
    });
    return this.devicesRepository.save(device);
  }

  async createAutoDevice(branchId: string): Promise<Device> {
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
      name: 'Primary Branch Device',
      code,
      status: DeviceStatus.ACTIVE,
      branchId,
      type: 'Card', // Default type
    });

    return this.devicesRepository.save(device);
  }

  async findAllByBranch(branchId: string): Promise<Device[]> {
    return this.devicesRepository.find({
      where: { branchId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByContext(
    branchId?: string,
    businessId?: string,
  ): Promise<Device[]> {
    if (branchId) {
      return this.findAllByBranch(branchId);
    }
    if (businessId) {
      return this.devicesRepository.find({
        where: { branch: { businessId } },
        relations: ['branch'],
        order: { createdAt: 'DESC' },
      });
    }
    return [];
  }

  async findOne(id: string, branchId: string): Promise<Device> {
    const device = await this.devicesRepository.findOneBy({ id, branchId });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return device;
  }

  async findByCode(code: string): Promise<Device | null> {
    return this.devicesRepository.findOneBy({ code });
  }

  async findByCodeWithRelations(code: string): Promise<Device | null> {
    return this.devicesRepository.findOne({
      where: { code },
      relations: ['branch', 'branch.business'],
    });
  }

  async update(
    id: string,
    branchId: string,
    updateDeviceDto: UpdateDeviceDto,
  ): Promise<Device> {
    const device = await this.findOne(id, branchId);

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
        'user.branch',
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

    const branchId = order.user?.branchId;
    if (!branchId) {
      throw new ConflictException('User does not have a branch assigned');
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
        branchId,
        orderId: order.id,
        type: productType?.name || 'Card',
        productTypeId: productType?.id,
      });
    }

    const createdDevices = await this.devicesRepository.save(
      this.devicesRepository.create(newDevices as Device[]),
    );

    order.status = OrderStatus.READY;
    await this.orderRepository.save(order);

    return createdDevices;
  }

  async remove(id: string, branchId: string): Promise<void> {
    const device = await this.findOne(id, branchId);
    await this.devicesRepository.remove(device);
  }

  async getStats(branchId?: string, businessId?: string) {
    const devices = await this.findAllByContext(branchId, businessId);
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
    branchId: string,
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
          branchId,
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
    branchId: string,
    dto: UpdateAssetNamesDto,
  ): Promise<Device[]> {
    const updatedDevices: Device[] = [];

    for (const asset of dto.assets) {
      const device = await this.devicesRepository.findOneBy({
        id: asset.id,
        branchId,
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

  async findAllAdmin(query: AdminDeviceQueryDto) {
    const qb = this.devicesRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.branch', 'branch')
      .leftJoinAndSelect('branch.business', 'business');

    if (query.status) {
      if (query.status === 'active') {
        qb.andWhere('device.branchId IS NOT NULL');
      } else if (query.status === 'inactive') {
        qb.andWhere('device.branchId IS NULL');
      }
    }

    if (query.branchId) {
      qb.andWhere('device.branchId = :branchId', { branchId: query.branchId });
    }

    if (query.businessId) {
      qb.andWhere('branch.businessId = :businessId', {
        businessId: query.businessId,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(device.code ILIKE :search OR device.id ILIKE :search OR branch.name ILIKE :search OR business.name ILIKE :search)',
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
      .where('d.branchId IS NOT NULL')
      .getCount();
    const inventory = await this.devicesRepository
      .createQueryBuilder('d')
      .where('d.branchId IS NULL')
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
      branchId: dto.branchId,
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

  async findFirstByBranchId(branchId: string): Promise<Device | null> {
    return this.devicesRepository.findOne({
      where: { branchId, status: DeviceStatus.ACTIVE },
      order: { createdAt: 'ASC' },
    });
  }
}
