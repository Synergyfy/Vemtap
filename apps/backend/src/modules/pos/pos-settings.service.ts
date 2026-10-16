import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { PosRegisterSession } from './entities/pos-register-session.entity';
import { RegisterSessionStatus } from './entities/pos-enums';
import { UpdatePosSettingsDto } from './dto/pos-settings.dto';
import {
  definedOnly,
  PosSettings,
  resolvePosSettings,
} from './pos-settings.types';

@Injectable()
export class PosSettingsService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(PosRegisterSession)
    private readonly registerSessionRepository: Repository<PosRegisterSession>,
  ) {}

  /** Stored settings resolved against the defaults. */
  async get(businessId: string): Promise<PosSettings> {
    return resolvePosSettings(await this.getStored(businessId));
  }

  /**
   * Merge a partial update into the stored settings. Nested `permissions` and
   * `tenderRails` merge field by field so a screen that edits one switch never
   * wipes the others.
   */
  async update(
    businessId: string,
    dto: UpdatePosSettingsDto,
  ): Promise<PosSettings> {
    const stored = await this.getStored(businessId);
    // Validated DTO instances carry every declared field, unset ones as
    // undefined; spreading those would erase saved values.
    const { permissions, tenderRails, ...flat } = definedOnly(dto);
    const next: PosSettings = { ...stored, ...flat };
    if (permissions) {
      next.permissions = { ...stored.permissions, ...definedOnly(permissions) };
    }
    if (tenderRails) {
      const { transfer, houseTab, ...rails } = definedOnly(tenderRails);
      next.tenderRails = {
        ...stored.tenderRails,
        ...rails,
        transfer: transfer
          ? { ...stored.tenderRails?.transfer, ...definedOnly(transfer) }
          : stored.tenderRails?.transfer,
        houseTab: houseTab
          ? { ...stored.tenderRails?.houseTab, ...definedOnly(houseTab) }
          : stored.tenderRails?.houseTab,
      };
    }
    await this.businessRepository.update(
      { id: businessId },
      { posSettings: next },
    );
    return resolvePosSettings(next);
  }

  /**
   * Chips for the settings hub. Counts that belong to other POS tables are
   * passed in by the caller, so this stays one business read plus one count.
   */
  async summary(
    businessId: string,
    counts: {
      tillCount: number;
      peripheralCount: number;
      staffPinCount: number;
    },
  ) {
    const [settings, activeCashiers] = await Promise.all([
      this.get(businessId),
      this.registerSessionRepository.count({
        where: { businessId, status: RegisterSessionStatus.OPEN },
      }),
    ]);
    const permissions = settings.permissions ?? {};
    return {
      taxLabel: settings.taxEnabled
        ? `${settings.taxLabel ?? 'VAT'} ${settings.taxRate ?? 0}%`
        : null,
      serviceChargeLabel: settings.serviceChargeEnabled
        ? `Service ${settings.serviceChargeRate ?? 0}%`
        : null,
      receiptWidth: settings.receiptWidth ?? 80,
      activeCashiers,
      ...counts,
      tableCount: settings.tableCount ?? 0,
      offlineBufferLimit: settings.offlineBufferLimit ?? 0,
      autoSyncIntervalSec: settings.autoSyncIntervalSec ?? 0,
      supervisorPinRequired: Boolean(
        permissions.voidRequiresPin ||
        permissions.refundRequiresPin ||
        permissions.reprintRequiresPin ||
        permissions.drawerOpenRequiresPin ||
        permissions.discountOverrideRequiresPin,
      ),
    };
  }

  private async getStored(businessId: string): Promise<PosSettings> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      select: ['id', 'posSettings'],
    });
    if (!business) throw new NotFoundException('Business not found');
    return business.posSettings ?? {};
  }
}
