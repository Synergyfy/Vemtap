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
import { CatalogueOffer, CatalogueOfferStatus } from '../catalogue/entities/catalogue-offer.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { LoyaltyService } from '../loyalty/loyalty.service';
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
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly loyaltyService: LoyaltyService,
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

    // 3. Process items/offers and calculate total
    let totalAmount = 0;
    const orderItems: CatalogueOrderItem[] = [];

    for (const itemDto of dto.items) {
      if (!itemDto.itemId && !itemDto.offerId) {
        throw new BadRequestException('Each order item must have either itemId or offerId');
      }

      if (itemDto.itemId) {
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
        }

        const orderItem = this.orderItemRepository.create({
          itemId: item.id,
          quantity: itemDto.quantity,
          priceAtOrder: item.price,
          loyaltyPointsAtOrder: item.loyaltyPoints,
        });
        orderItems.push(orderItem);
        totalAmount += Number(item.price) * itemDto.quantity;
      } else if (itemDto.offerId) {
        const offer = await this.offerRepository.findOne({
          where: { id: itemDto.offerId, branchId: dto.branchId },
          relations: ['items'],
        });

        if (!offer) {
          throw new BadRequestException(`Offer ${itemDto.offerId} not available in this branch`);
        }

        // Offer stock check
        if (offer.quantity !== null && offer.quantity < itemDto.quantity) {
            throw new BadRequestException(`Insufficient stock for offer ${offer.name}`);
        }

        // Check stock for ALL items in offer
        for (const offerItem of offer.items) {
            if (offerItem.stockQuantity !== null && !offerItem.allowBackOrder) {
                if (offerItem.stockQuantity < itemDto.quantity) {
                    throw new BadRequestException(`Insufficient stock for item ${offerItem.name} in offer ${offer.name}`);
                }
            }
        }

        const orderItem = this.orderItemRepository.create({
          offerId: offer.id,
          quantity: itemDto.quantity,
          priceAtOrder: offer.calculatedPrice,
          loyaltyPointsAtOrder: offer.loyaltyPoints,
        });
        orderItems.push(orderItem);
        totalAmount += Number(offer.calculatedPrice) * itemDto.quantity;
      }
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
      stockDeducted: true,
    });

    const savedOrder = await this.orderRepository.save(order);

    // 5. Deduct stock IMMEDIATELY (locking the spot)
    for (const orderItem of order.items) {
        if (orderItem.itemId) {
            const item = await this.itemRepository.findOne({ where: { id: orderItem.itemId } });
            if (item) await this.deductStock(item, orderItem.quantity);
        } else if (orderItem.offerId) {
            const offer = await this.offerRepository.findOne({ where: { id: orderItem.offerId }, relations: ['items'] });
            if (offer) {
                await this.deductOfferStock(offer, orderItem.quantity);
                for (const offerItem of offer.items) {
                    await this.deductStock(offerItem, orderItem.quantity);
                }
            }
        }
    }

    return savedOrder;
  }

  async updateStatus(
    orderId: string,
    status: CatalogueOrderStatus,
    businessId: string,
    staff: User,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, businessId },
      relations: ['items', 'items.item', 'items.offer', 'items.offer.items'],
    });
    if (!order) throw new NotFoundException('Order not found');

    // If order is cancelled/rejected and stock was deducted, return it
    if (
        (status === CatalogueOrderStatus.CANCELLED || status === CatalogueOrderStatus.REJECTED) && 
        order.stockDeducted
    ) {
        for (const orderItem of order.items) {
            if (orderItem.itemId && orderItem.item) {
                await this.restoreStock(orderItem.item, orderItem.quantity);
            } else if (orderItem.offerId && orderItem.offer) {
                await this.restoreOfferStock(orderItem.offer, orderItem.quantity);
                for (const offerItem of orderItem.offer.items) {
                    await this.restoreStock(offerItem, orderItem.quantity);
                }
            }
        }
        order.stockDeducted = false;
    }

    // Award loyalty points and rewards if moving to COMPLETED
    if (status === CatalogueOrderStatus.COMPLETED && !order.loyaltyAwarded) {
        let totalPoints = 0;
        for (const orderItem of order.items) {
          if (orderItem.loyaltyPointsAtOrder) {
            totalPoints += orderItem.loyaltyPointsAtOrder * orderItem.quantity;
          }

          if (orderItem.offerId && orderItem.offer && orderItem.offer.rewardId) {
            for (let i = 0; i < orderItem.quantity; i++) {
              await this.loyaltyService.generateRedemptionCode(staff, {
                rewardId: orderItem.offer.rewardId,
                branchId: order.branchId,
              });
            }
          }
        }

        if (totalPoints > 0) {
          await this.loyaltyService.awardPoints(
            order.customerId,
            totalPoints,
            order.businessId,
            order.branchId,
            `Points earned from order #${order.id.slice(0, 8)}`,
            staff.id,
          );
        }
        order.loyaltyAwarded = true;
    }

    order.status = status;
    return this.orderRepository.save(order);
  }

  private async deductStock(item: CatalogueItem, quantity: number) {
    if (item.stockQuantity !== null) {
      item.stockQuantity -= quantity;
      if (item.stockQuantity <= 0) {
        item.stockQuantity = 0;
        item.status = CatalogueItemStatus.OUT_OF_STOCK;
      }
      await this.itemRepository.save(item);
    }
  }

  private async restoreStock(item: CatalogueItem, quantity: number) {
    if (item.stockQuantity !== null) {
        item.stockQuantity += quantity;
        if (item.stockQuantity > 0 && item.status === CatalogueItemStatus.OUT_OF_STOCK) {
            item.status = CatalogueItemStatus.ACTIVE;
        }
        await this.itemRepository.save(item);
    }
  }

  private async deductOfferStock(offer: CatalogueOffer, quantity: number) {
    if (offer.quantity !== null) {
        offer.quantity -= quantity;
        if (offer.quantity <= 0) {
            offer.quantity = 0;
            offer.status = CatalogueOfferStatus.INACTIVE;
        }
        await this.offerRepository.save(offer);
    }
  }

  private async restoreOfferStock(offer: CatalogueOffer, quantity: number) {
    if (offer.quantity !== null) {
        offer.quantity += quantity;
        if (offer.quantity > 0 && offer.status === CatalogueOfferStatus.INACTIVE) {
            offer.status = CatalogueOfferStatus.ACTIVE;
        }
        await this.offerRepository.save(offer);
    }
  }

  async findAllOrders(businessId: string, query: CatalogueOrderQueryDto) {
    const { page = 1, limit = 10, status, branchId } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['items', 'items.item', 'items.offer', 'customer'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOneOrder(orderId: string, businessId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, businessId },
      relations: ['items', 'items.item', 'items.offer', 'customer'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
