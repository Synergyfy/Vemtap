import { randomBytes } from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Business } from '../businesses/entities/business.entity';
import { MailService } from '../mail/mail.service';
import {
  DataRequest,
  DataRequestStatus,
  DataRequestType,
} from './entities/data-request.entity';
import {
  AccountPrivacyDto,
  CreateDataRequestDto,
  DataExportFileDto,
  UpdateAccountPrivacyDto,
} from './dto/account-privacy.dto';

/** Rows per table in an export; larger histories come from the module exports. */
const EXPORT_ROW_LIMIT = 5000;
const NDPR_RESPONSE_MS = 72 * 3_600_000;

/** Business tables in the archive, each scoped by `businessId`. */
const BUSINESS_TABLES: Array<{ key: string; table: string; strip?: string[] }> =
  [
    { key: 'branches', table: 'branches' },
    { key: 'catalogueItems', table: 'catalogue_items' },
    { key: 'deals', table: 'catalogue_offers' },
    { key: 'contacts', table: 'contacts', strip: ['pushToken'] },
    {
      key: 'orders',
      table: 'catalogue_orders',
      strip: ['sessionToken', 'trackingToken'],
    },
    { key: 'posSales', table: 'pos_sales' },
    { key: 'campaigns', table: 'campaigns' },
  ];

const isBusinessManager = (role: UserRole) =>
  role === UserRole.OWNER || role === UserRole.MANAGER;

/**
 * NDPR controls on the account settings: the business's processing choices
 * (enforced by `ProcessingConsentGuard`), the caller's own marketing and
 * new-device alert choices, a data export and rectification requests.
 */
@Injectable()
export class AccountPrivacyService {
  private readonly logger = new Logger(AccountPrivacyService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(DataRequest)
    private readonly requests: Repository<DataRequest>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private reference() {
    return `DR-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  async get(user: User): Promise<AccountPrivacyDto> {
    const [me, business] = await Promise.all([
      this.users.findOne({
        where: { id: user.id },
        select: ['id', 'notificationPreferences', 'securityPreferences'],
      }),
      user.businessId
        ? this.businesses.findOne({
            where: { id: user.businessId },
            select: ['id', 'privacySettings'],
          })
        : null,
    ]);
    if (!me) throw new NotFoundException('User not found');
    return {
      restrictProcessing:
        business?.privacySettings?.restrictProcessing === true,
      analytics: business?.privacySettings?.analytics !== false,
      marketing: me.notificationPreferences?.marketing !== false,
      deviceAlerts: me.securityPreferences?.deviceAlerts === true,
      canManageBusiness:
        Boolean(user.businessId) && isBusinessManager(user.role),
    };
  }

  /**
   * Personal fields (`marketing`, `deviceAlerts`) for anyone; business-wide
   * fields only for the business's owner or a manager (others are ignored).
   */
  async update(
    user: User,
    dto: UpdateAccountPrivacyDto,
  ): Promise<AccountPrivacyDto> {
    if (dto.marketing !== undefined || dto.deviceAlerts !== undefined) {
      const me = await this.users.findOne({
        where: { id: user.id },
        select: ['id', 'notificationPreferences', 'securityPreferences'],
      });
      if (!me) throw new NotFoundException('User not found');
      await this.users.update(user.id, {
        ...(dto.marketing !== undefined
          ? {
              notificationPreferences: {
                ...(me.notificationPreferences ?? {}),
                marketing: dto.marketing,
              },
            }
          : {}),
        ...(dto.deviceAlerts !== undefined
          ? {
              securityPreferences: {
                ...(me.securityPreferences ?? {}),
                deviceAlerts: dto.deviceAlerts,
              },
            }
          : {}),
      });
    }
    const businessChange =
      dto.restrictProcessing !== undefined || dto.analytics !== undefined;
    if (businessChange && user.businessId && isBusinessManager(user.role)) {
      const business = await this.businesses.findOne({
        where: { id: user.businessId },
        select: ['id', 'privacySettings'],
      });
      if (business) {
        await this.businesses.update(business.id, {
          privacySettings: {
            ...(business.privacySettings ?? {}),
            ...(dto.restrictProcessing !== undefined
              ? { restrictProcessing: dto.restrictProcessing }
              : {}),
            ...(dto.analytics !== undefined
              ? { analytics: dto.analytics }
              : {}),
          },
        });
      }
    }
    return this.get(user);
  }

  /**
   * The business's data as one JSON archive (account, business, team and the
   * business tables, each capped), returned base64-encoded and logged as a
   * completed data request. A fixed, bounded set of queries.
   */
  async export(user: User): Promise<DataExportFileDto> {
    const businessId = user.businessId;
    if (!businessId) throw new NotFoundException('No business on this account');
    const q = <T>(sql: string, params: unknown[]) =>
      this.users.manager.query<T[]>(sql, params);
    const userColumns = `"id", "firstName", "lastName", "email", "phone", "role", "status", "jobTitle", "branchId", "createdAt"`;
    const [account, business, team, ...tables] = await Promise.all([
      q<Record<string, unknown>>(
        `SELECT ${userColumns} FROM "users" WHERE "id" = $1`,
        [user.id],
      ),
      q<Record<string, unknown>>(`SELECT * FROM "businesses" WHERE "id" = $1`, [
        businessId,
      ]),
      q<Record<string, unknown>>(
        `SELECT ${userColumns} FROM "users" WHERE "businessId" = $1 AND "deletedAt" IS NULL LIMIT ${EXPORT_ROW_LIMIT}`,
        [businessId],
      ),
      ...BUSINESS_TABLES.map(({ table }) =>
        q<Record<string, unknown>>(
          `SELECT * FROM "${table}" WHERE "businessId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT ${EXPORT_ROW_LIMIT}`,
          [businessId],
        ),
      ),
    ]);
    const archive: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      exportedBy: account[0] ?? null,
      business: business[0] ?? null,
      team,
      rowLimitPerTable: EXPORT_ROW_LIMIT,
    };
    BUSINESS_TABLES.forEach(({ key, strip }, index) => {
      archive[key] = tables[index].map((row) => {
        const clean = { ...row };
        for (const column of strip ?? []) delete clean[column];
        return clean;
      });
    });

    const now = new Date();
    const request = await this.requests.save(
      this.requests.create({
        userId: user.id,
        businessId,
        type: DataRequestType.EXPORT,
        status: DataRequestStatus.COMPLETED,
        reference: this.reference(),
        details: null,
        dueAt: new Date(now.getTime() + NDPR_RESPONSE_MS),
        completedAt: now,
      }),
    );
    return {
      fileName: `vemtap-data-export-${now.toISOString().slice(0, 10)}.json`,
      mimeType: 'application/json',
      content: Buffer.from(JSON.stringify(archive, null, 2)).toString('base64'),
      reference: request.reference,
    };
  }

  /**
   * Logs a rectification request for the DPO (72-hour deadline) and emails it
   * to `DPO_EMAIL` when that is configured.
   */
  async requestRectification(user: User, dto: CreateDataRequestDto) {
    const now = new Date();
    const request = await this.requests.save(
      this.requests.create({
        userId: user.id,
        businessId: user.businessId ?? null,
        type: DataRequestType.RECTIFICATION,
        status: DataRequestStatus.OPEN,
        reference: this.reference(),
        details: dto.details.trim(),
        dueAt: new Date(now.getTime() + NDPR_RESPONSE_MS),
        completedAt: null,
      }),
    );
    const dpo = this.config.get<string>('DPO_EMAIL');
    if (dpo) {
      void this.mail.sendGenericEmail(
        dpo,
        `NDPR rectification request ${request.reference}`,
        `User ${user.id} (business ${user.businessId ?? 'none'}) asked for a correction.\n\n${request.details}\n\nRespond by ${request.dueAt.toISOString()}.`,
      );
    } else {
      this.logger.warn(
        `DPO_EMAIL is not set; rectification ${request.reference} is logged only`,
      );
    }
    return this.view(request);
  }

  private view(request: DataRequest) {
    return {
      id: request.id,
      reference: request.reference,
      type: request.type,
      status: request.status,
      details: request.details,
      createdAt: request.createdAt,
      dueAt: request.dueAt,
      completedAt: request.completedAt,
    };
  }

  async listRequests(user: User) {
    const rows = await this.requests.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return { data: rows.map((row) => this.view(row)), total: rows.length };
  }

  /** Whether the business allows a kind of optional processing of its data. */
  async allows(
    businessId: string | null | undefined,
    purpose: 'ai' | 'analytics',
  ) {
    if (!businessId) return true;
    const business = await this.businesses.findOne({
      where: { id: businessId },
      select: ['id', 'privacySettings'],
    });
    const settings = business?.privacySettings;
    if (settings?.restrictProcessing) return false;
    return purpose === 'analytics' ? settings?.analytics !== false : true;
  }
}
