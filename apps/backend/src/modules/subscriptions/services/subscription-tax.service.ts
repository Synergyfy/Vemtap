import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  SubscriptionTaxConfig,
  TaxType,
} from '../entities/subscription-tax-config.entity';
import { UpdateSubscriptionTaxDto } from '../dto/tax/update-subscription-tax.dto';
import { ToggleSubscriptionTaxDto } from '../dto/tax/toggle-subscription-tax.dto';

export interface TaxCalculationResult {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRule: {
    id?: string;
    name: string;
    taxType: TaxType;
    rate: number;
    isEnabled: boolean;
  };
}

@Injectable()
export class SubscriptionTaxService {
  private readonly logger = new Logger(SubscriptionTaxService.name);

  constructor(
    @InjectRepository(SubscriptionTaxConfig)
    private readonly taxConfigRepository: Repository<SubscriptionTaxConfig>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get the currently active tax configuration.
   * If none exists in DB, returns a safe default.
   */
  async getActiveConfig(): Promise<SubscriptionTaxConfig> {
    const config = await this.taxConfigRepository.findOne({
      where: { isActive: true },
      relations: ['changedBy'],
      order: { createdAt: 'DESC' },
    });

    if (config) {
      return config;
    }

    // Default fallback if table is empty
    return this.taxConfigRepository.create({
      name: 'VAT',
      taxType: TaxType.PERCENTAGE,
      rate: 7.5,
      isEnabled: false,
      isActive: true,
      changedById: null,
      changeReason: 'Default initial configuration',
    });
  }

  /**
   * Update the tax configuration.
   * Inactivates previous active rows and inserts a new active row to preserve complete history.
   */
  async updateTaxConfig(
    adminUserId: string,
    dto: UpdateSubscriptionTaxDto,
  ): Promise<SubscriptionTaxConfig> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Mark existing active rows as inactive
      await manager.update(
        SubscriptionTaxConfig,
        { isActive: true },
        { isActive: false },
      );

      // 2. Insert new version row
      const newConfig = manager.create(SubscriptionTaxConfig, {
        name: dto.name?.trim() || 'VAT',
        taxType: dto.taxType,
        rate: dto.rate,
        isEnabled: dto.isEnabled,
        isActive: true,
        changedById: adminUserId,
        changeReason: dto.changeReason || 'Admin updated tax configuration',
      });

      const saved = await manager.save(SubscriptionTaxConfig, newConfig);
      this.logger.log(
        `Admin ${adminUserId} updated subscription tax config to ${dto.taxType} ${dto.rate}% (enabled: ${dto.isEnabled}) - New Row ID: ${saved.id}`,
      );

      return saved;
    });
  }

  /**
   * Toggle enabled/disabled state of subscription tax.
   * Inserts a new row to preserve historical record of state transitions.
   */
  async toggleTax(
    adminUserId: string,
    dto: ToggleSubscriptionTaxDto,
  ): Promise<SubscriptionTaxConfig> {
    const current = await this.getActiveConfig();

    return this.updateTaxConfig(adminUserId, {
      name: current.name,
      taxType: current.taxType,
      rate: Number(current.rate),
      isEnabled: dto.isEnabled,
      changeReason:
        dto.changeReason ||
        `Tax ${dto.isEnabled ? 'enabled' : 'disabled'} by admin`,
    });
  }

  /**
   * Get complete audit history of all tax configurations.
   */
  async getHistory(): Promise<SubscriptionTaxConfig[]> {
    return this.taxConfigRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['changedBy'],
      select: {
        id: true,
        name: true,
        taxType: true,
        rate: true,
        isEnabled: true,
        isActive: true,
        changedById: true,
        changeReason: true,
        createdAt: true,
        updatedAt: true,
        changedBy: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    });
  }

  /**
   * Calculate subtotal, tax amount, and final total based on an active or given tax rule.
   */
  calculateTax(
    subtotal: number,
    config?: SubscriptionTaxConfig,
  ): TaxCalculationResult {
    const validSubtotal = Math.max(0, Number(subtotal) || 0);

    if (!config || !config.isEnabled || validSubtotal === 0) {
      return {
        subtotal: validSubtotal,
        taxAmount: 0,
        total: validSubtotal,
        taxRule: {
          id: config?.id,
          name: config?.name || 'VAT',
          taxType: config?.taxType || TaxType.PERCENTAGE,
          rate: Number(config?.rate || 0),
          isEnabled: false,
        },
      };
    }

    let taxAmount = 0;
    const rate = Number(config.rate) || 0;

    if (config.taxType === TaxType.PERCENTAGE) {
      taxAmount = (validSubtotal * rate) / 100;
    } else if (config.taxType === TaxType.FIXED) {
      taxAmount = rate;
    }

    // Round to 2 decimal places
    taxAmount = Number(taxAmount.toFixed(2));
    const total = Number((validSubtotal + taxAmount).toFixed(2));

    return {
      subtotal: validSubtotal,
      taxAmount,
      total,
      taxRule: {
        id: config.id,
        name: config.name,
        taxType: config.taxType,
        rate,
        isEnabled: config.isEnabled,
      },
    };
  }
}
