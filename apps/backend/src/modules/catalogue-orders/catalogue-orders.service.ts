import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CatalogueOrder,
  CatalogueOrderStatus,
} from './entities/catalogue-order.entity';
import { CatalogueOrderItem } from './entities/catalogue-order-item.entity';
import { CatalogueItem, CatalogueItemStatus } from '../catalogue/entities/catalogue-item.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import {
  CreateCatalogueOrderDto,
  CatalogueOrderQueryDto,
} from './dto/catalogue-order.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CatalogueOrderService {
  constructor(
    @InjectRepository(CatalogueOrder)
    private readonly orderRepository: Repository<CatalogueOrder>,
    @InjectRepository(CatalogueOrderItem)
    private readonly orderItemRepository: Repository<CatalogueOrderItem>,
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async createOrder(dto: CreateCatalogueOrderDto) {
    // 1. Resolve branch
    const branch = await this.branchRepository.findOne({
      where: { id: dto.branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    // 2. Resolve or Create customer (User)
    let customer = await this.userRepository.findOne({
      where: { phone: dto.phone },
    });

    if (!customer && dto.email) {
      customer = await this.userRepository.findOne({
        where: { email: dto.email },
      });
    }

    if (!customer) {
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      customer = this.userRepository.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        role: UserRole.CUSTOMER,
        password: hashedPassword,
        uniqueCode: `CUST-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      await this.userRepository.save(customer);
    }

    // 3. Process items and calculate total
    let totalAmount = 0;
    const orderItems: CatalogueOrderItem[] = [];

    for (const itemDto of dto.items) {
      const item = await this.itemRepository.findOne({
        where: { id: itemDto.itemId },
        relations: ['branches'],
      });

      if (!item || !item.branches.some((b) => b.id === dto.branchId)) {
        throw new BadRequestException(
          `Item ${itemDto.itemId} not available in this branch`,
        );
      }

      if (item.status === CatalogueItemStatus.SUSPENDED || item.isSuspended) {
        throw new BadRequestException(`Item ${item.name} is currently suspended`);
      }

      if (item.status === CatalogueItemStatus.OUT_OF_STOCK && !item.allowBackOrder) {
        throw new BadRequestException(`Item ${item.name} is out of stock`);
      }

      // Stock check
      if (item.stockQuantity !== null && !item.allowBackOrder) {
        if (item.stockQuantity < itemDto.quantity) {
          throw new BadRequestException(`Insufficient stock for ${item.name}`);
        }
        item.stockQuantity -= itemDto.quantity;
        if (item.stockQuantity === 0) {
          item.status = CatalogueItemStatus.OUT_OF_STOCK;
        }
        await this.itemRepository.save(item);
      }

      const orderItem = this.orderItemRepository.create({
        itemId: item.id,
        quantity: itemDto.quantity,
        priceAtOrder: item.price,
      });
      orderItems.push(orderItem);
      totalAmount += Number(item.price) * itemDto.quantity;
    }

    // 4. Create Order
    const order = this.orderRepository.create({
      businessId: branch.businessId,
      branchId: branch.id,
      customerId: customer.id,
      notes: dto.notes,
      tableNumber: dto.tableNumber,
      totalAmount,
      items: orderItems,
    });

    return this.orderRepository.save(order);
  }

  async updateStatus(
    orderId: string,
    status: CatalogueOrderStatus,
    businessId: string,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, businessId },
    });
    if (!order) throw new NotFoundException('Order not found');

    order.status = status;
    return this.orderRepository.save(order);
  }

  async findAllOrders(businessId: string, query: CatalogueOrderQueryDto) {
    const { page = 1, limit = 10, status, branchId } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['items', 'items.item', 'customer'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOneOrder(orderId: string, businessId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, businessId },
      relations: ['items', 'items.item', 'customer'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
