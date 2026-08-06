import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogueCart } from './entities/catalogue-cart.entity';
import { CatalogueCartItem } from './entities/catalogue-cart-item.entity';
import {
  AddToCartDto,
  MergeGuestCartDto,
  CheckoutCartDto,
  GuestCartItemDto,
} from './dto/catalogue-cart.dto';
import {
  CatalogueItem,
  CatalogueItemStatus,
} from '../catalogue/entities/catalogue-item.entity';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from '../catalogue/entities/catalogue-offer.entity';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueOrderService } from '../catalogue-orders/catalogue-orders.service';
import {
  CreateCatalogueOrderDto,
  OrderItemDto,
} from '../catalogue-orders/dto/catalogue-order.dto';

@Injectable()
export class CatalogueCartService {
  constructor(
    @InjectRepository(CatalogueCart)
    private readonly cartRepository: Repository<CatalogueCart>,
    @InjectRepository(CatalogueCartItem)
    private readonly cartItemRepository: Repository<CatalogueCartItem>,
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @Inject(forwardRef(() => CatalogueOrderService))
    private readonly ordersService: CatalogueOrderService,
  ) {}

  async getOrCreateCart(
    customerId: string,
    branchId: string,
  ): Promise<CatalogueCart> {
    let cart = await this.cartRepository.findOne({
      where: { customerId, branchId },
      relations: ['items', 'items.item', 'items.offer'],
    });

    if (!cart) {
      const branch = await this.branchRepository.findOne({
        where: { id: branchId },
      });
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }

      cart = this.cartRepository.create({
        customerId,
        branchId,
        businessId: branch.businessId,
        items: [],
      });
      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }

  async getCart(customerId: string, branchId: string) {
    const cart = await this.getOrCreateCart(customerId, branchId);

    let total = 0;
    let itemCount = 0;

    const enrichedItems = cart.items.map((item) => {
      total += Number(item.snapshotPrice) * item.quantity;
      itemCount += item.quantity;
      return item;
    });

    return {
      ...cart,
      items: enrichedItems,
      total,
      itemCount,
    };
  }

  async getCartSummary(customerId: string, branchId: string) {
    const cart = await this.cartRepository.findOne({
      where: { customerId, branchId },
      relations: ['items'],
    });

    if (!cart) {
      return { itemCount: 0, total: 0 };
    }

    let total = 0;
    let itemCount = 0;
    cart.items.forEach((item) => {
      total += Number(item.snapshotPrice) * item.quantity;
      itemCount += item.quantity;
    });

    return { itemCount, total };
  }

  async addItemToCart(
    customerId: string,
    dto: AddToCartDto | (GuestCartItemDto & { branchId: string }),
  ) {
    if (!dto.itemId && !dto.offerId) {
      throw new BadRequestException(
        'Either itemId or offerId must be provided',
      );
    }

    const branchId = (dto as any).branchId;
    if (!branchId) {
      throw new BadRequestException('branchId must be provided');
    }

    const cart = await this.getOrCreateCart(customerId, branchId);

    let price = 0;
    let name = '';
    let image: string | null = null;

    if (dto.itemId) {
      const item = await this.itemRepository
        .createQueryBuilder('item')
        .innerJoin('item.branches', 'branch')
        .where('item.id = :itemId', { itemId: dto.itemId })
        .andWhere('branch.id = :branchId', { branchId })
        .getOne();

      if (!item)
        throw new NotFoundException(
          'Item not found or not available in this branch',
        );
      if (item.status !== CatalogueItemStatus.ACTIVE)
        throw new BadRequestException('Item is not active');
      price = Number(item.price);
      name = item.name;
      image = item.mainImage ?? null;
    } else if (dto.offerId) {
      const offer = await this.offerRepository.findOne({
        where: { id: dto.offerId, branchId },
      });

      if (!offer)
        throw new NotFoundException(
          'Offer not found or not available in this branch',
        );
      if (offer.status !== CatalogueOfferStatus.ACTIVE)
        throw new BadRequestException('Offer is not active');
      price = Number(offer.calculatedPrice);
      name = offer.name;
      image = offer.mainImage ?? null;
    }

    let existingItem = cart.items?.find(
      (i) =>
        (dto.itemId && i.itemId === dto.itemId) ||
        (dto.offerId && i.offerId === dto.offerId),
    );

    const qtyToAdd = dto.quantity || 1;

    if (existingItem) {
      existingItem.quantity += qtyToAdd;
      existingItem.snapshotPrice = price; // Update price to latest
      await this.cartItemRepository.save(existingItem);
    } else {
      existingItem = this.cartItemRepository.create({
        cartId: cart.id,
        itemId: dto.itemId || null,
        offerId: dto.offerId || null,
        quantity: qtyToAdd,
        snapshotPrice: price,
        snapshotName: name,
        snapshotImage: image,
      });
      await this.cartItemRepository.save(existingItem);
    }

    return this.getCart(customerId, branchId);
  }

  async updateCartItem(
    customerId: string,
    cartItemId: string,
    quantity: number,
  ) {
    const item = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart'],
    });

    if (!item) throw new NotFoundException('Cart item not found');
    if (item.cart.customerId !== customerId)
      throw new ForbiddenException('Not your cart item');

    if (quantity === 0) {
      await this.cartItemRepository.remove(item);
    } else {
      item.quantity = quantity;
      await this.cartItemRepository.save(item);
    }

    return this.getCart(customerId, item.cart.branchId);
  }

  async removeCartItem(customerId: string, cartItemId: string) {
    const item = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart'],
    });

    if (!item) throw new NotFoundException('Cart item not found');
    if (item.cart.customerId !== customerId)
      throw new ForbiddenException('Not your cart item');

    await this.cartItemRepository.remove(item);
    return { success: true };
  }

  async clearCart(customerId: string, branchId: string) {
    const cart = await this.cartRepository.findOne({
      where: { customerId, branchId },
    });
    if (cart) {
      await this.cartItemRepository.delete({ cartId: cart.id });
    }
    return { success: true };
  }

  async mergeGuestCart(customerId: string, dto: MergeGuestCartDto) {
    for (const item of dto.items) {
      try {
        await this.addItemToCart(customerId, {
          branchId: dto.branchId,
          itemId: item.itemId,
          offerId: item.offerId,
          quantity: item.quantity,
        });
      } catch (e) {
        // Skip items that are no longer available
        console.warn('Failed to merge guest cart item', e);
      }
    }
    return this.getCart(customerId, dto.branchId);
  }

  async checkoutCart(customerId: string, dto: CheckoutCartDto, user: User) {
    const cart = await this.getCart(customerId, dto.branchId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const orderItems: OrderItemDto[] = cart.items.map((item) => ({
      itemId: item.itemId || undefined,
      offerId: item.offerId || undefined,
      quantity: item.quantity,
    }));

    const createOrderDto: CreateCatalogueOrderDto = {
      firstName: user.firstName || 'Customer',
      lastName: user.lastName || '',
      phone: user.phone || '000000000',
      email: user.email,
      branchId: dto.branchId,
      items: orderItems,
      notes: dto.notes,
      tableNumber: dto.tableNumber,
      deviceId: dto.deviceId,
    };

    const order = await this.ordersService.createOrder(createOrderDto);

    await this.clearCart(customerId, dto.branchId);

    return order;
  }
}
