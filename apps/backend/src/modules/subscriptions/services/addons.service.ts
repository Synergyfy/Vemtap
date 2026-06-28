import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AddOn, AddOnType } from '../entities/addon.entity';
import {
  BusinessAddOn,
  BusinessAddOnStatus,
} from '../entities/business-addon.entity';
import { Business } from '../../businesses/entities/business.entity';
import { PaymentsService } from '../../payments/payments.service';
import {
  PaymentPurpose,
  PaymentStatus,
} from '../../payments/entities/payment.entity';
import { CreateAddonDto } from '../dto/addons/create-addon.dto';
import { UpdateAddonDto } from '../dto/addons/update-addon.dto';
import { PurchaseAddonDto } from '../dto/addons/purchase-addon.dto';
import { SettingsService } from '../../settings/settings.service';
import { BundleDiscountsService } from './bundle-discounts.service';

export interface AddOnCapability {
  name: string;
  type: AddOnType;
  targetCapability?: string;
  additionalLimit: number;
  expiresAt: Date;
  isActive: boolean;
}

export interface AddOnCapabilityMap {
  [capability: string]: number;
}

const CACHE_KEY_ADDONS_PUBLIC = 'addons:public:list';
const CACHE_KEY_ADDONS_ADMIN = 'addons:admin:list';
const CACHE_TTL = 3600000; // 1 hour

@Injectable()
export class AddonsService {
  private readonly logger = new Logger(AddonsService.name);

  constructor(
    @InjectRepository(AddOn)
    private readonly addonRepository: Repository<AddOn>,
    @InjectRepository(BusinessAddOn)
    private readonly businessAddonRepository: Repository<BusinessAddOn>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly paymentsService: PaymentsService,
    private readonly settingsService: SettingsService,
    private readonly bundleDiscountsService: BundleDiscountsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async invalidateCache() {
    await this.cacheManager.del(CACHE_KEY_ADDONS_PUBLIC);
    await this.cacheManager.del(CACHE_KEY_ADDONS_ADMIN);
  }

  async create(createAddonDto: CreateAddonDto): Promise<AddOn> {
    if (createAddonDto.price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    const addon = new AddOn();
    addon.name = createAddonDto.name;
    addon.description = createAddonDto.description ?? '';
    addon.type = createAddonDto.type;
    addon.price = createAddonDto.price;
    addon.durationDays = createAddonDto.durationDays ?? 30;
    addon.currency = createAddonDto.currency ?? 'NGN';
    addon.isActive = createAddonDto.isActive ?? true;
    addon.targetCapability = createAddonDto.targetCapability ?? '';
    addon.additionalLimit = createAddonDto.additionalLimit ?? null;
    addon.serviceDetails = (createAddonDto.serviceDetails as any) ?? null;
    addon.isOneTime = createAddonDto.isOneTime ?? false;
    addon.isRecurring = createAddonDto.isRecurring ?? false;
    addon.imageUrl = createAddonDto.imageUrl ?? '';

    const saved = await this.addonRepository.save(addon);
    await this.invalidateCache();
    return saved;
  }

  async findAll(onlyActive: boolean = false): Promise<AddOn[]> {
    if (onlyActive) {
      const cached = await this.cacheManager.get<AddOn[]>(
        CACHE_KEY_ADDONS_PUBLIC,
      );
      if (cached) return cached;
    }

    const where = onlyActive ? { isActive: true } : {};
    const addons = await this.addonRepository.find({
      where,
      order: { price: 'ASC' },
    });

    if (onlyActive) {
      await this.cacheManager.set(CACHE_KEY_ADDONS_PUBLIC, addons, CACHE_TTL);
    }

    return addons;
  }

  async findAllDiscounts() {
    return this.bundleDiscountsService.getActiveDiscounts();
  }

  async findOne(id: string): Promise<AddOn> {
    const addon = await this.addonRepository.findOne({ where: { id } });
    if (!addon) {
      throw new NotFoundException(`Add-on with ID ${id} not found`);
    }
    return addon;
  }

  async update(id: string, updateAddonDto: UpdateAddonDto): Promise<AddOn> {
    if (updateAddonDto.price !== undefined && updateAddonDto.price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    const addon = await this.findOne(id);
    Object.assign(addon, updateAddonDto);
    const saved = await this.addonRepository.save(addon);
    await this.invalidateCache();
    return saved;
  }

  async remove(id: string): Promise<void> {
    const addon = await this.findOne(id);
    addon.isActive = false;
    await this.addonRepository.save(addon);
    await this.invalidateCache();
  }

  async findAllAdmin(): Promise<AddOn[]> {
    const cached = await this.cacheManager.get<AddOn[]>(CACHE_KEY_ADDONS_ADMIN);
    if (cached) return cached;

    const addons = await this.addonRepository.find({
      order: { createdAt: 'DESC' },
    });

    await this.cacheManager.set(CACHE_KEY_ADDONS_ADMIN, addons, CACHE_TTL);
    return addons;
  }

  async getAdminStats(): Promise<{
    totalAddons: number;
    activeAddons: number;
    resourceAddons: number;
    serviceAddons: number;
    totalPurchases: number;
    activePurchases: number;
  }> {
    const allAddons = await this.addonRepository.find();
    const allPurchases = await this.businessAddonRepository.find({
      where: { status: In([BusinessAddOnStatus.ACTIVE]) },
    });

    return {
      totalAddons: allAddons.length,
      activeAddons: allAddons.filter((a) => a.isActive).length,
      resourceAddons: allAddons.filter((a) => a.type === AddOnType.RESOURCE)
        .length,
      serviceAddons: allAddons.filter((a) => a.type === AddOnType.SERVICE)
        .length,
      totalPurchases: await this.businessAddonRepository.count(),
      activePurchases: allPurchases.length,
    };
  }

  async purchaseAddons(
    dto: PurchaseAddonDto,
    businessId: string,
    userId: string,
  ): Promise<BusinessAddOn[]> {
    const { addonIds, quantities, paymentReference, quantity = 1 } = dto;

    if (!addonIds || addonIds.length === 0) {
      throw new BadRequestException('At least one add-on ID is required');
    }

    const addons = await this.addonRepository.findBy({
      id: In(addonIds),
      isActive: true,
    });

    if (addons.length !== addonIds.length) {
      throw new NotFoundException('One or more add-ons not found or inactive');
    }

    if (paymentReference) {
      const paymentData =
        await this.paymentsService.verifyTransaction(paymentReference);
      if (!paymentData) {
        throw new BadRequestException('Payment verification failed');
      }
    }

    const totalQuantity = addons.reduce(
      (sum, _, i) => sum + (quantities?.[i] ?? quantity),
      0,
    );
    const activeDiscounts =
      await this.bundleDiscountsService.getActiveDiscounts();
    let discountPercent = 0;

    if (activeDiscounts.length > 0) {
      const applicableTier = activeDiscounts
        .filter(
          (tier) =>
            totalQuantity >= tier.minQuantity &&
            (!tier.maxQuantity || totalQuantity <= tier.maxQuantity),
        )
        .sort((a, b) => b.discountPercent - a.discountPercent)[0];

      if (applicableTier) {
        discountPercent = applicableTier.discountPercent;
      }
    }

    const results: BusinessAddOn[] = [];
    for (let i = 0; i < addons.length; i++) {
      const addon = addons[i];
      const qty = quantities?.[i] ?? quantity;

      const basePrice = Number(addon.price) * qty;
      const discountAmount = (basePrice * discountPercent) / 100;
      const finalPrice = basePrice - discountAmount;

      const purchasedAt = new Date();
      let expiresAt: Date;
      if (addon.isOneTime) {
        expiresAt = new Date('2099-12-31');
      } else {
        expiresAt = new Date(purchasedAt);
        expiresAt.setDate(expiresAt.getDate() + (addon.durationDays || 30));
      }

      const businessAddon = this.businessAddonRepository.create({
        addonId: addon.id,
        businessId,
        status: BusinessAddOnStatus.ACTIVE,
        purchasedAt,
        expiresAt,
        quantity: qty,
        totalPaid: finalPrice,
        paymentReference,
        metadata: {
          addonType: addon.type,
          targetCapability: addon.targetCapability,
          additionalLimit: addon.additionalLimit,
          appliedDiscountPercent: discountPercent,
        },
      });

      const saved = await this.businessAddonRepository.save(businessAddon);
      results.push(saved);
    }

    if (paymentReference) {
      const totalAmount = results.reduce(
        (sum, b) => sum + Number(b.totalPaid),
        0,
      );
      await this.paymentsService.recordPayment({
        reference: paymentReference,
        amount: totalAmount,
        purpose: PaymentPurpose.ADDON,
        status: PaymentStatus.SUCCESS,
        metadata: {
          addonIds,
          businessAddonIds: results.map((r) => r.id),
          quantities: quantities || [quantity],
        },
        businessId,
        userId,
      });
    }

    return results;
  }

  async purchasePlanWithAddons(
    addons: AddOn[],
    addonQuantities: number[] | undefined,
    businessId: string,
    userId: string,
    paymentReference: string,
    paymentData: any,
  ): Promise<BusinessAddOn[]> {
    const results: BusinessAddOn[] = [];

    for (let i = 0; i < addons.length; i++) {
      const addon = addons[i];
      const qty = addonQuantities?.[i] ?? 1;
      const purchasedAt = new Date();
      let expiresAt: Date;
      if (addon.isOneTime) {
        expiresAt = new Date('2099-12-31');
      } else {
        expiresAt = new Date(purchasedAt);
        expiresAt.setDate(expiresAt.getDate() + (addon.durationDays || 30));
      }

      const businessAddon = this.businessAddonRepository.create({
        addonId: addon.id,
        businessId,
        status: BusinessAddOnStatus.ACTIVE,
        purchasedAt,
        expiresAt,
        quantity: qty,
        totalPaid: addon.price * qty,
        paymentReference,
        paystackAuthorizationCode:
          paymentData?.authorization?.authorization_code || null,
        metadata: {
          addonType: addon.type,
          bundledWithPlan: true,
          targetCapability: addon.targetCapability,
          additionalLimit: addon.additionalLimit,
        },
      });

      const saved = await this.businessAddonRepository.save(businessAddon);
      results.push(saved);
    }

    return results;
  }

  async getBusinessAddons(businessId: string): Promise<BusinessAddOn[]> {
    return this.businessAddonRepository.find({
      where: { businessId },
      relations: ['addon'],
      order: { purchasedAt: 'DESC' },
    });
  }

  async getActiveBusinessAddons(businessId: string): Promise<BusinessAddOn[]> {
    const now = new Date();
    return this.businessAddonRepository.find({
      where: {
        businessId,
        status: BusinessAddOnStatus.ACTIVE,
        expiresAt: MoreThanOrEqual(now),
      },
      relations: ['addon'],
      order: { purchasedAt: 'DESC' },
    });
  }

  async getAddonCapabilities(businessId: string): Promise<AddOnCapabilityMap> {
    const activeAddons = await this.getActiveBusinessAddons(businessId);

    const map: AddOnCapabilityMap = {};
    for (const ba of activeAddons) {
      const targetCapability =
        ba.metadata?.targetCapability ?? ba.addon.targetCapability;
      const additionalLimit =
        ba.metadata?.additionalLimit ?? ba.addon.additionalLimit ?? 0;

      if (targetCapability) {
        if (ba.addon.type === AddOnType.RESOURCE) {
          const addonLimit = additionalLimit * ba.quantity;
          map[targetCapability] = (map[targetCapability] || 0) + addonLimit;
        } else if (ba.addon.type === AddOnType.SERVICE) {
          // Service add-ons act as boolean toggles (if you have it, you have it)
          map[targetCapability] = (map[targetCapability] || 0) + 1;
        }
      }
    }
    return map;
  }

  async getServiceAddons(businessId: string): Promise<BusinessAddOn[]> {
    const active = await this.getActiveBusinessAddons(businessId);
    return active.filter((ba) => ba.addon.type === AddOnType.SERVICE);
  }

  async cancelAddon(
    businessAddonId: string,
    businessId: string,
  ): Promise<BusinessAddOn> {
    const ba = await this.businessAddonRepository.findOne({
      where: { id: businessAddonId, businessId },
      relations: ['addon'],
    });

    if (!ba) {
      throw new NotFoundException('Purchased add-on not found');
    }

    if (!ba.addon.isRecurring) {
      throw new BadRequestException(
        'Only recurring service add-ons can be canceled',
      );
    }

    ba.status = BusinessAddOnStatus.CANCELED;
    return this.businessAddonRepository.save(ba);
  }

  async validateAddons(addonIds: string[]): Promise<AddOn[]> {
    const addons = await this.addonRepository.findBy({
      id: In(addonIds),
      isActive: true,
    });

    if (addons.length !== addonIds.length) {
      throw new BadRequestException(
        'One or more add-ons not found or inactive',
      );
    }

    return addons;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processAddonsExpirationsAndRenewals() {
    this.logger.log('Processing add-on expirations and renewals...');

    const now = new Date();
    const expired = await this.businessAddonRepository.find({
      where: {
        status: BusinessAddOnStatus.ACTIVE,
        expiresAt: LessThanOrEqual(now),
      },
      relations: ['addon', 'business', 'business.owner'],
    });

    this.logger.log(`Found ${expired.length} expired add-ons to process.`);

    for (const ba of expired) {
      if (!ba.addon.isRecurring) {
        ba.status = BusinessAddOnStatus.EXPIRED;
        await this.businessAddonRepository.save(ba);
        continue;
      }

      if (!ba.paystackAuthorizationCode) {
        this.logger.warn(
          `Recurring Add-on ${ba.id} has no auth code. Expiring...`,
        );
        ba.status = BusinessAddOnStatus.EXPIRED;
        await this.businessAddonRepository.save(ba);
        continue;
      }

      const amount = Number(ba.addon.price) * ba.quantity;
      if (amount <= 0) {
        ba.expiresAt = new Date(now);
        ba.expiresAt.setDate(
          ba.expiresAt.getDate() + (ba.addon.durationDays || 30),
        );
        await this.businessAddonRepository.save(ba);
        continue;
      }

      const ownerEmail =
        ba.business?.officialEmail ||
        ba.business?.owner?.email ||
        'billing@latap.com';
      const charge: any = await this.paymentsService.chargeAuthorization(
        amount,
        ownerEmail,
        ba.paystackAuthorizationCode,
      );

      if (charge && charge.status === 'success') {
        this.logger.log(`Successfully renewed add-on ${ba.id}.`);
        await this.paymentsService.recordPayment({
          reference: charge.reference,
          amount: amount,
          purpose: PaymentPurpose.ADDON,
          status: PaymentStatus.SUCCESS,
          metadata: { businessAddonId: ba.id, renewal: true },
          businessId: ba.businessId,
          userId: ba.business?.ownerId,
        });

        ba.expiresAt = new Date(now);
        ba.expiresAt.setDate(
          ba.expiresAt.getDate() + (ba.addon.durationDays || 30),
        );
        await this.businessAddonRepository.save(ba);
      } else {
        this.logger.error(`Failed to renew add-on ${ba.id}. Expiring.`);
        ba.status = BusinessAddOnStatus.EXPIRED;
        await this.businessAddonRepository.save(ba);
      }
    }
  }
}
