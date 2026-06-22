import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Not, IsNull } from 'typeorm';
import {
  CatalogueOrder,
  CatalogueOrderStatus,
} from './entities/catalogue-order.entity';
import { CatalogueOrderItem } from './entities/catalogue-order-item.entity';
import {
  CatalogueItem,
  CatalogueItemStatus,
} from '../catalogue/entities/catalogue-item.entity';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from '../catalogue/entities/catalogue-offer.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { Device } from '../devices/entities/device.entity';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import {
  CreateCatalogueOrderDto,
  CatalogueOrderQueryDto,
  BulkCheckoutDto,
} from './dto/catalogue-order.dto';
import * as bcrypt from 'bcrypt';
import { VisitorsService } from '../visitors/visitors.service';
import { MailService } from '../mail/mail.service';
import { CatalogueService } from '../catalogue/catalogue.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';

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
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly loyaltyService: LoyaltyService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly visitorsService: VisitorsService,
    private readonly mailService: MailService,
    private readonly catalogueService: CatalogueService,
    @InjectQueue('order-notifications')
    private readonly orderNotificationQueue: Queue,
  ) {}

  async bulkCheckout(dto: BulkCheckoutDto, user?: User) {
    const results: CatalogueOrder[] = [];
    const customerInfo = {
      firstName: user?.firstName || dto.firstName,
      lastName: user?.lastName || dto.lastName,
      phone: user?.phone || dto.phone,
      email: user?.email || dto.email,
    };

    if (!customerInfo.firstName || !customerInfo.phone) {
      throw new BadRequestException(
        'Customer information (name and phone) is required',
      );
    }

    // Process each branch order
    for (const orderDto of dto.orders) {
      const order = await this.createOrder(
        {
          ...customerInfo,
          branchId: orderDto.branchId,
          items: orderDto.items,
          notes: orderDto.notes,
          tableNumber: orderDto.tableNumber,
          deviceId: dto.deviceId,
        } as CreateCatalogueOrderDto,
        user,
      );
      results.push(order);
    }

    return {
      success: true,
      message: `${results.length} orders placed successfully`,
      orders: results,
    };
  }

  async createOrder(dto: CreateCatalogueOrderDto, existingUser?: User) {
    // 1. Resolve branch
    const branch = await this.branchRepository.findOne({
      where: { id: dto.branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    // 2. Resolve or Create customer (User)
    let customer: User | null = existingUser || null;

    if (!customer) {
      customer = await this.userRepository.findOne({
        where: { phone: dto.phone },
      });

      if (!customer && dto.email) {
        customer = await this.userRepository.findOne({
          where: { email: dto.email },
        });
      }
    }

    if (!customer) {
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // Use provided email or generate a dummy one
      const dummyEmail = `guest_${dto.phone.replace(/\+/g, '')}@vemtap.dummy`;
      const finalEmail = dto.email || dummyEmail;
      const isDummy = !dto.email;

      customer = this.userRepository.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: finalEmail,
        role: UserRole.CUSTOMER,
        password: hashedPassword,
        uniqueCode: `CUST-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      await this.userRepository.save(customer);

      // Send welcome email ONLY if it's not a dummy email
      if (!isDummy) {
        this.mailService
          .sendWelcomeEmail(
            customer.email,
            `${customer.firstName} ${customer.lastName}`,
            defaultPassword,
          )
          .catch((err) => console.error('Failed to send welcome email:', err));
      }
    }

    // 2.1 Record Visit for Manual Order
    const effectiveSessionToken = dto.sessionToken || uuidv4();
    await this.visitorsService.recordDirectVisit({
      user: customer,
      branchId: branch.id,
      businessId: branch.businessId,
      deviceId: dto.deviceId,
      sessionToken: effectiveSessionToken,
    });

    // 3. Process items/offers and calculate total
    let totalAmount = 0;
    const orderItems: CatalogueOrderItem[] = [];

    for (const itemDto of dto.items) {
      if (!itemDto.itemId && !itemDto.offerId && !itemDto.newItem) {
        throw new BadRequestException(
          'Each order item must have either itemId, offerId or newItem',
        );
      }

      if (itemDto.newItem) {
        // Create the new item on the fly
        const newItem = await this.catalogueService.createItem(
          {
            name: itemDto.newItem.name,
            price: itemDto.newItem.price,
            categoryId: itemDto.newItem.categoryId,
            branchId: dto.branchId,
            shortDescription: 'Quick added item from manual order',
            description:
              'This item was created automatically during manual order entry.',
            mainImage:
              'https://res.cloudinary.com/dqr68m9p6/image/upload/v1711545600/vemtap/placeholder-item.png', // Default placeholder
          },
          branch.businessId,
        );

        const orderItem = this.orderItemRepository.create({
          itemId: newItem.id,
          quantity: itemDto.quantity,
          priceAtOrder: newItem.price,
          loyaltyPointsAtOrder: newItem.loyaltyPoints,
        });
        orderItems.push(orderItem);
        totalAmount += Number(newItem.price) * itemDto.quantity;
      } else if (itemDto.itemId) {
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
          throw new BadRequestException(
            `Item ${item.name} is currently suspended`,
          );
        }

        if (
          item.status === CatalogueItemStatus.OUT_OF_STOCK &&
          !item.allowBackOrder
        ) {
          throw new BadRequestException(`Item ${item.name} is out of stock`);
        }

        // Stock check
        if (item.stockQuantity !== null && !item.allowBackOrder) {
          if (item.stockQuantity < itemDto.quantity) {
            throw new BadRequestException(
              `Insufficient stock for ${item.name}`,
            );
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
          throw new BadRequestException(
            `Offer ${itemDto.offerId} not available in this branch`,
          );
        }

        // Offer stock check
        if (offer.quantity !== null && offer.quantity < itemDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for offer ${offer.name}`,
          );
        }

        // Check stock for ALL items in offer
        for (const offerItem of offer.items) {
          if (offerItem.stockQuantity !== null && !offerItem.allowBackOrder) {
            if (offerItem.stockQuantity < itemDto.quantity) {
              throw new BadRequestException(
                `Insufficient stock for item ${offerItem.name} in offer ${offer.name}`,
              );
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
      deviceId: dto.deviceId,
      sessionToken: effectiveSessionToken,
      bookingDate: dto.bookingDate,
      bookingTime: dto.bookingTime,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Trigger notification to branch staff
    this.pushNotificationService
      .sendToBranchStaff(
        branch.id,
        'New Order Received',
        `A new order (#${savedOrder.id.slice(0, 8)}) has been placed by ${dto.firstName} ${dto.lastName}.`,
        { orderId: savedOrder.id, type: 'NEW_ORDER' },
      )
      .catch((err) => console.error('Failed to send staff notification:', err));

    // 5. Deduct stock IMMEDIATELY (locking the spot)
    for (const orderItem of order.items) {
      if (orderItem.itemId) {
        const item = await this.itemRepository.findOne({
          where: { id: orderItem.itemId },
        });
        if (item) await this.deductStock(item, orderItem.quantity);
      } else if (orderItem.offerId) {
        const offer = await this.offerRepository.findOne({
          where: { id: orderItem.offerId },
          relations: ['items'],
        });
        if (offer) {
          await this.deductOfferStock(offer, orderItem.quantity);
          for (const offerItem of offer.items) {
            await this.deductStock(offerItem, orderItem.quantity);
          }
        }
      }
    }

    // Queue "Order Placed" email
    this.orderNotificationQueue
      .add('send-order-email', {
        orderId: savedOrder.id,
        status: 'placed',
      })
      .catch((err) =>
        console.error('Failed to queue order placed email:', err),
      );

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
      (status === CatalogueOrderStatus.CANCELLED ||
        status === CatalogueOrderStatus.REJECTED) &&
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

      // --- UPGRADE PORTAL VISIT TO PATRONAGE ---
      await this.visitorsService.upgradeVisitToPatronage({
        sessionToken: order.sessionToken,
        orderId: order.id,
        customerId: order.customerId,
        branchId: order.branchId,
        businessId: order.businessId,
        deviceId: order.deviceId,
      });

      order.loyaltyAwarded = true;
    }

    order.status = status;
    const updatedOrder = await this.orderRepository.save(order);

    // Trigger notification to customer on status change
    let title = '';
    let body = '';

    if (status === CatalogueOrderStatus.PROCESSING) {
      title = 'Order Processing';
      body = `Your order (#${order.id.slice(0, 8)}) is now being prepared.`;
    } else if (status === CatalogueOrderStatus.COMPLETED) {
      title = 'Order Completed';
      body = `Your order (#${order.id.slice(0, 8)}) has been completed. Thank you!`;
    } else if (status === CatalogueOrderStatus.CANCELLED) {
      title = 'Order Cancelled';
      body = `Your order (#${order.id.slice(0, 8)}) has been cancelled.`;
    } else if (status === CatalogueOrderStatus.REJECTED) {
      title = 'Order Rejected';
      body = `Your order (#${order.id.slice(0, 8)}) has been rejected.`;
    }

    if (title && body) {
      this.pushNotificationService
        .sendNotification(
          order.customerId,
          title,
          body,
          { orderId: order.id, status, type: 'ORDER_STATUS_UPDATE' },
          true,
        )
        .catch((err) =>
          console.error('Failed to send customer notification:', err),
        );
    }

    // Queue order status email
    if (status === CatalogueOrderStatus.PROCESSING) {
      this.orderNotificationQueue
        .add('send-order-email', {
          orderId: order.id,
          status: 'processing',
        })
        .catch((err) =>
          console.error('Failed to queue order processing email:', err),
        );
    } else if (status === CatalogueOrderStatus.COMPLETED) {
      this.orderNotificationQueue
        .add('send-order-email', {
          orderId: order.id,
          status: 'completed',
        })
        .catch((err) =>
          console.error('Failed to queue order completed email:', err),
        );
    } else if (status === CatalogueOrderStatus.CANCELLED) {
      this.orderNotificationQueue
        .add('send-order-email', {
          orderId: order.id,
          status: 'cancelled',
        })
        .catch((err) =>
          console.error('Failed to queue order cancelled email:', err),
        );
    } else if (status === CatalogueOrderStatus.REJECTED) {
      this.orderNotificationQueue
        .add('send-order-email', {
          orderId: order.id,
          status: 'rejected',
        })
        .catch((err) =>
          console.error('Failed to queue order rejected email:', err),
        );
    }

    return updatedOrder;
  }

  private async deductStock(item: CatalogueItem, quantity: number) {
    if (item.stockQuantity !== null) {
      item.stockQuantity -= quantity;
      if (item.stockQuantity <= 0) {
        item.stockQuantity = 0;
        item.status = CatalogueItemStatus.OUT_OF_STOCK;
      } else if (
        item.minStock !== null &&
        item.stockQuantity <= item.minStock
      ) {
        item.status = CatalogueItemStatus.LOW_STOCK;
      }
      await this.itemRepository.save(item);
    }
  }

  private async restoreStock(item: CatalogueItem, quantity: number) {
    if (item.stockQuantity !== null) {
      item.stockQuantity += quantity;
      if (item.stockQuantity <= 0) {
        item.status = CatalogueItemStatus.OUT_OF_STOCK;
      } else if (
        item.minStock !== null &&
        item.stockQuantity <= item.minStock
      ) {
        item.status = CatalogueItemStatus.LOW_STOCK;
      } else if (
        item.stockQuantity > 0 &&
        (item.status === CatalogueItemStatus.OUT_OF_STOCK ||
          item.status === CatalogueItemStatus.LOW_STOCK)
      ) {
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
      if (
        offer.quantity > 0 &&
        offer.status === CatalogueOfferStatus.INACTIVE
      ) {
        offer.status = CatalogueOfferStatus.ACTIVE;
      }
      await this.offerRepository.save(offer);
    }
  }

  async findAllOrders(businessId: string, query: CatalogueOrderQueryDto) {
    const { page = 1, limit = 10, status, branchId, type } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;

    if (type === 'booking') {
      where.bookingDate = Not(IsNull());
    } else if (type === 'order') {
      where.bookingDate = IsNull();
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['items', 'items.item', 'items.offer', 'customer', 'branch'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findAllByCustomer(customerId: string) {
    return this.orderRepository.find({
      where: { customerId },
      relations: [
        'items',
        'items.item',
        'items.offer',
        'branch',
        'branch.business',
      ],
      order: { createdAt: 'DESC' },
    });
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
