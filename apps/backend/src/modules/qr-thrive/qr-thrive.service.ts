import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { QrThriveUserMapping } from './entities/qr-thrive-user-mapping.entity';
import { QrThriveEncryptionService } from './qr-thrive-encryption.service';
import { SubscriptionTokenService } from './subscription-token.service';

import {
  ExternalLeadStatusEntity,
  ExternalLeadStatus,
} from './entities/external-lead-status.entity';
import { User, UserRole } from '../users/entities/user.entity';
import {
  CreateQRCodeDto,
  UpdateQRCodeDto,
  CreateFolderDto,
  UpdateFolderDto,
  SpecializedLeadsQueryDto,
} from './dto/qr-thrive.dto';
import { BranchesService } from '../branches/branches.service';
import { Branch } from '../branches/entities/branch.entity';

@Injectable()
export class QrThriveService implements OnModuleInit {
  private readonly logger = new Logger(QrThriveService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => BranchesService))
    private readonly branchesService: BranchesService,
    @InjectRepository(QrThriveUserMapping)
    private readonly userMappingRepo: Repository<QrThriveUserMapping>,

    @InjectRepository(ExternalLeadStatusEntity)
    private readonly leadStatusRepo: Repository<ExternalLeadStatusEntity>,

    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    private readonly encryptionService: QrThriveEncryptionService,
    private readonly subscriptionTokenService: SubscriptionTokenService,
  ) {
    this.apiKey = this.configService.get<string>('QR_THRIVE_API_KEY')!;
    this.baseUrl = this.configService.get<string>(
      'QR_THRIVE_BASE_URL',
      'https://api.qrthrive.com/api/v1/integration',
    );
  }

  onModuleInit() {
    if (!this.apiKey) {
      this.logger.warn(
        'QR_THRIVE_API_KEY is not configured. QR-Thrive integration will fail at runtime.',
      );
    }
  }

  private handleExternalError(error: any, defaultMessage: string): never {
    const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const externalMessage = error.response?.data?.message;
    const errorCode = error.code || error.response?.data?.code;

    // Log the full error internally with context
    this.logger.error(
      `${defaultMessage}: ${error.message}${errorCode ? ` (${errorCode})` : ''}`,
      error.stack,
    );

    // If it's a connection error (Axios ECONNABORTED, ECONNREFUSED, etc.)
    if (!error.response && error.request) {
      this.logger.error(
        `Connection failed for ${defaultMessage}. Is the QR-Thrive service running at ${this.baseUrl}?`,
      );
    }

    // Sanitize message for the client
    const clientMessage =
      status < 500 && externalMessage
        ? `QR-Thrive Error: ${externalMessage}`
        : defaultMessage;

    throw new HttpException(clientMessage, status);
  }

  private get headers() {
    return {
      'X-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private async getHeadersWithSubscription(
    user?: User,
  ): Promise<Record<string, string>> {
    const baseHeaders = this.headers;

    if (!user?.businessId) {
      return baseHeaders;
    }

    try {
      const token = await this.subscriptionTokenService.generateToken(
        user,
        user.businessId,
      );
      return {
        ...baseHeaders,
        'X-VemTap-Subscription-Token': token,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to generate subscription token: ${error.message}`,
      );
      return baseHeaders;
    }
  }

  async generateSubscriptionToken(
    user: User,
    businessId: string,
  ): Promise<string> {
    try {
      return await this.subscriptionTokenService.generateToken(
        user,
        businessId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate subscription token: ${error.message}`,
      );
      return '';
    }
  }

  private async makeRequestWithRetry<T>(
    requestFn: (headers: Record<string, string>) => Promise<T>,
    user?: User,
    maxRetries: number = 1,
  ): Promise<T> {
    let headers = await this.getHeadersWithSubscription(user);

    try {
      return await requestFn(headers);
    } catch (error) {
      if (error.response?.status === 401 && maxRetries > 0) {
        this.logger.warn('Received 401, refreshing token and retrying...');
        headers = await this.getHeadersWithSubscription(user);
        return await requestFn(headers);
      }
      throw error;
    }
  }

  /**
   * Helper to resolve the correct QR-Thrive mapping for a user.
   * Handles Admin/Agent impersonation by resolving the target business owner.
   */
  private async getMapping(
    user: User,
    branchId?: string,
    throwIfNotFound: boolean = true,
  ): Promise<QrThriveUserMapping> {
    let targetUserId = user.id;

    // If Admin/Agent and impersonating, resolve the target owner's mapping
    if (user.role === UserRole.ADMIN || user.role === UserRole.AGENT) {
      let businessId = user.businessId;

      // If we have a branchId but no businessId, resolve businessId from branch
      if (!businessId && branchId) {
        try {
          businessId = await this.branchesService.getBusinessId(branchId);
        } catch (e) {
          this.logger.error(
            `Failed to resolve businessId for branch ${branchId}: ${e.message}`,
          );
        }
      }

      if (businessId) {
        const ownerId =
          await this.branchesService.getBusinessOwnerId(businessId);
        if (ownerId) {
          targetUserId = ownerId;
          this.logger.debug(
            `Impersonation context: Using mapping for owner ${ownerId} (Business: ${businessId})`,
          );
        }
      }
    }

    const mapping = await this.userMappingRepo.findOne({
      where: { userId: targetUserId },
    });

    if (!mapping) {
      if (throwIfNotFound) {
        throw new HttpException(
          'User not synced with QR-Thrive. Please sync first.',
          HttpStatus.BAD_REQUEST,
        );
      }
      return null as any; // Caller handles null
    }

    return mapping;
  }

  /**
   * Ensures a user exists in QR-Thrive and stores the mapping.
   */
  async syncUser(user: User): Promise<QrThriveUserMapping | null> {
    if (user.role === UserRole.CUSTOMER || user.role === UserRole.ADMIN) {
      this.logger.warn(
        `Skipping QR-Thrive sync for restricted role (${user.role}): ${user.id}`,
      );
      return null;
    }
    const existingMapping = await this.userMappingRepo.findOne({
      where: { userId: user.id },
    });

    try {
      const payload = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/users`, payload, { headers }),
      );

      this.logger.log(
        `Received QR-Thrive User ID: ${data.id} for user ${user.id}`,
      );

      if (existingMapping) {
        existingMapping.qrThriveUserId = data.id;
        return await this.userMappingRepo.save(existingMapping);
      }

      const newMapping = this.userMappingRepo.create({
        userId: user.id,
        qrThriveUserId: data.id,
      });

      return await this.userMappingRepo.save(newMapping);
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQL Unique Constraint Violation
        return (await this.userMappingRepo.findOne({
          where: { userId: user.id },
        }))!;
      }
      return this.handleExternalError(
        error,
        'Failed to sync user with QR-Thrive',
      );
    }
  }

  /**
   * Creates a QR code in QR-Thrive.
   */
  async createQRCode(user: User, branchId: string, dto: CreateQRCodeDto) {
    // 1. Verify branch ownership (IDOR Protection)
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes`,
          dto,
          { headers },
        ),
      );

      return data;
    } catch (error) {
      return this.handleExternalError(
        error,
        'Failed to create QR code in QR-Thrive',
      );
    }
  }

  private getMainQrName(branchName: string): string {
    return `${branchName} Main Link`;
  }

  private getMainQrUrl(branch: Branch): string {
    const appUrl = this.configService.get<string>(
      'VEMTAP_APP_URL',
      'https://vemtap.com',
    );
    return `${appUrl}/b/${branch.uniqueCode}`;
  }

  /**
   * Creates a main business link QR code in QR-Thrive for a branch.
   * Stores the reference on the branch entity.
   * Returns null silently if user is not provisioned in QR-Thrive.
   */
  async createMainQRCode(user: User, branch: Branch) {
    let mapping: QrThriveUserMapping;
    try {
      mapping = await this.getMapping(user, branch.id, false);
    } catch {
      return null;
    }

    if (!mapping || !mapping.qrThriveUserId) {
      return null;
    }

    const name = this.getMainQrName(branch.name);
    const url = this.getMainQrUrl(branch);

    const dto = {
      name,
      type: 'url',
      isDynamic: true,
      data: { url },
      logo: branch.logoUrl || undefined,
      design: {
        dots: { type: 'square', color: '#000000' },
        cornersSquare: { type: 'square', color: '#000000' },
        cornersDot: { type: 'square', color: '#000000' },
        background: { color: '#ffffff' },
      },
      frame: { type: 'none' },
    };

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes`,
          dto,
          { headers },
        ),
      );

      await this.branchRepo.update(branch.id, {
        mainQrCodeId: data.id,
        mainQrShortUrl: data.shortUrl,
      });

      this.logger.log(
        `Created main QR code for branch ${branch.id}: ${data.id}`,
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to create main QR code for branch ${branch.id}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Updates the destination URL of the main QR code (e.g., when username changes).
   */
  async updateMainQRCodeUrl(
    user: User,
    branchId: string,
    qrCodeId: string,
    username: string,
  ) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const mapping = await this.getMapping(user, branchId);
    const appUrl = this.configService.get<string>(
      'VEMTAP_APP_URL',
      'https://vemtap.com',
    );
    const newUrl = `${appUrl}/${username}`;

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.patch(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}`,
          { data: { url: newUrl } },
          { headers },
        ),
      );

      this.logger.log(`Updated main QR code ${qrCodeId} URL to ${newUrl}`);
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to update main QR code ${qrCodeId} URL: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Fetches the branch's main QR code from QR-Thrive.
   * Does NOT auto-create — returns { qrCode: null } if none exists.
   * Returns { qrCode: null } if user is not provisioned.
   */
  async getMainQRCode(user: User, branchId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    let mapping: QrThriveUserMapping;
    try {
      mapping = await this.getMapping(user, branchId, false);
    } catch {
      return { qrCode: null };
    }

    if (!mapping || !mapping.qrThriveUserId) {
      return { qrCode: null };
    }

    const branch = await this.branchRepo.findOne({
      where: { id: branchId },
    });
    if (!branch) {
      throw new HttpException('Branch not found', HttpStatus.NOT_FOUND);
    }

    if (branch.mainQrCodeId) {
      try {
        const headers = await this.getHeadersWithSubscription(user);
        const { data } = await firstValueFrom(
          this.httpService.get(
            `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${branch.mainQrCodeId}`,
            { headers },
          ),
        );

        return {
          qrCode: { ...data, scans: data._count?.scans || data.scans || 0 },
        };
      } catch (error) {
        const status = error.response?.status;
        if (status === 404) {
          this.logger.warn(
            `Main QR code ${branch.mainQrCodeId} not found in QR-Thrive, clearing reference...`,
          );
          await this.branchRepo.update(branch.id, {
            mainQrCodeId: null,
            mainQrShortUrl: null,
          });
        } else {
          throw error;
        }
      }
    }

    return { qrCode: null };
  }

  /**
   * Recreates the main QR code for a branch (used when user edits it away).
   */
  async recreateMainQRCode(user: User, branchId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const branch = await this.branchesService.findById(branchId);
    if (!branch) {
      throw new HttpException('Branch not found', HttpStatus.NOT_FOUND);
    }

    const qrCode = await this.createMainQRCode(user, branch);
    return qrCode;
  }

  /**
   * Sets an existing QR code as the branch's main QR code.
   * Updates its content to the UBL URL but preserves its design.
   */
  async setAsMainQRCode(user: User, branchId: string, qrCodeId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const branch = await this.branchesService.findById(branchId);
    if (!branch) {
      throw new HttpException('Branch not found', HttpStatus.NOT_FOUND);
    }

    const mapping = await this.getMapping(user, branchId);
    const ublUrl = this.getMainQrUrl(branch);

    try {
      const headers = await this.getHeadersWithSubscription(user);

      // Fetch existing QR to preserve its design, frame, and logo
      const { data: existing } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}`,
          { headers },
        ),
      );

      // Update content to UBL URL, keep visual design
      const { data: updated } = await firstValueFrom(
        this.httpService.patch(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}`,
          {
            type: 'url',
            isDynamic: true,
            data: { url: ublUrl },
            design: existing.design,
            frame: existing.frame,
            logo: existing.logo,
          },
          { headers },
        ),
      );

      // Set this QR as the branch's main QR
      await this.branchRepo.update(branchId, {
        mainQrCodeId: qrCodeId,
        mainQrShortUrl: updated.shortUrl,
      });

      this.logger.log(
        `Set QR code ${qrCodeId} as main QR for branch ${branchId}`,
      );
      return updated;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to set QR code as main');
    }
  }

  /**
   * Updates the main QR code and detaches it from being the branch's main QR.
   * The QR code becomes a regular QR code in the user's library.
   */
  async updateMainQRCode(
    user: User,
    branchId: string,
    qrCodeId: string,
    dto: UpdateQRCodeDto,
  ) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.patch(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}`,
          dto,
          { headers },
        ),
      );

      // Only clear the main QR reference if this QR is actually the branch's main
      const branch = await this.branchRepo.findOne({ where: { id: branchId } });
      if (branch?.mainQrCodeId === qrCodeId) {
        await this.branchRepo.update(branchId, {
          mainQrCodeId: null,
          mainQrShortUrl: null,
        });
        this.logger.log(
          `Detached main QR code ${qrCodeId} from branch ${branchId}`,
        );
      }

      this.logger.log(
        `Updated main QR code ${qrCodeId} for branch ${branchId}`,
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to update main QR code');
    }
  }

  /**
   * Fetches scan history for a QR code.
   */
  async getScans(user: User, branchId: string, qrCodeId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}/scans`,
          { headers },
        ),
      );
      const scans = Array.isArray(data) ? data : [];
      return scans.map((scan: any) => ({
        ...scan,
        ip: undefined,
        userAgent: undefined,
      }));
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch scans');
    }
  }

  /**
   * Fetches form responses for a QR code.
   */
  async getResponses(user: User, branchId: string, qrCodeId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}/responses`,
          { headers },
        ),
      );
      const responses = Array.isArray(data) ? data : [];
      return responses.map((resp: any) => ({
        ...resp,
        ip: undefined,
        userAgent: undefined,
      }));
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch responses');
    }
  }

  /**
   * Fetches all leads (form submissions) for a user across all their QR codes.
   */
  async getLeads(user: User, branchId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/leads`,
          { headers },
        ),
      );
      const leads = Array.isArray(data) ? data : [];
      return leads.map((lead: any) => ({
        ...lead,
        ip: undefined,
        userAgent: undefined,
      }));
    } catch (error) {
      return this.handleExternalError(
        error,
        'Failed to fetch leads from QR-Thrive',
      );
    }
  }

  /**
   * Fetches specialized leads (booking, menu, form) with pagination and filters.
   */
  async getSpecializedLeads(
    user: User,
    branchId: string,
    query: SpecializedLeadsQueryDto,
  ) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    try {
      const params = new URLSearchParams();
      if (query.types) params.append('types', query.types);
      if (query.qrCodeId) params.append('qrCodeId', query.qrCodeId);
      if (query.search) params.append('search', query.search);
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/specialized-leads${queryString}`,
          { headers },
        ),
      );

      // Backwards Compatibility: Merge local status from VemTap
      try {
        const leads = Array.isArray(data.items) ? data.items : [];
        if (leads.length > 0) {
          const leadIds = leads.map((l: any) => l.id);
          const localStatuses = await this.leadStatusRepo.find({
            where: {
              externalLeadId: In(leadIds),
              branchId,
            },
          });

          const statusMap = new Map(
            localStatuses.map((s) => [s.externalLeadId, s]),
          );

          data.items = leads.map((lead: any) => {
            const local = statusMap.get(lead.id);
            const status = local ? local.status : ExternalLeadStatus.NEW;
            return {
              ...lead,
              ip: undefined,
              userAgent: undefined,
              status,
              localStatus: status,
              localNotes: local ? local.notes : null,
            };
          });
        }
      } catch (dbError) {
        this.logger.error(
          `Failed to merge local lead statuses: ${dbError.message}`,
        );
        // If DB fails, we still return the leads with default NEW status
        // so the user doesn't see a 500 error.
        const leads = Array.isArray(data.items) ? data.items : [];
        data.items = leads.map((lead: any) => ({
          ...lead,
          ip: undefined,
          userAgent: undefined,
          status: ExternalLeadStatus.NEW,
          localStatus: ExternalLeadStatus.NEW,
          localNotes: null,
        }));
      }

      return data;
    } catch (error) {
      return this.handleExternalError(
        error,
        'Failed to fetch specialized leads from QR-Thrive',
      );
    }
  }

  /**
   * Generates a Magic Link for SSO.
   */
  async getMagicLink(user: User) {
    const mapping = await this.getMapping(user);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/magic-link`,
          {},
          { headers },
        ),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to generate magic link');
    }
  }

  /**
   * Fetches available plans from QR-Thrive.
   */
  async getPlans() {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/plans`, {
          headers: this.headers,
        }),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch QR-Thrive plans');
    }
  }

  /**
   * Syncs a user's subscription with QR-Thrive.
   */
  async syncSubscription(user: User, qrThrivePlanId: string) {
    let mapping = await this.getMapping(user, undefined, false);
    if (!mapping) {
      console.log(
        `[QrThriveService] User ${user.id} not synced with QR-Thrive. Attempting auto-sync...`,
      );
      try {
        await this.syncUser(user);
        mapping = await this.getMapping(user);
        console.log(
          `[QrThriveService] Auto-sync result for ${user.id}: ${mapping ? 'Success' : 'Still no mapping'}`,
        );
      } catch (error) {
        console.error(
          `[QrThriveService] Failed to auto-sync user ${user.id} to QR-Thrive: ${error.message}`,
        );
        return;
      }
    }

    if (!mapping) {
      this.logger.warn(
        `User ${user.id} still has no mapping after auto-sync attempt. Skipping subscription sync.`,
      );
      return;
    }

    try {
      const managedSubscriptionToken =
        this.encryptionService.signSubscriptionAssertion({
          planId: qrThrivePlanId,
          status: 'active',
        });

      const headers = await this.getHeadersWithSubscription(user);
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/subscription`,
          {
            planId: qrThrivePlanId,
            status: 'active',
            managedSubscriptionToken,
          },
          { headers },
        ),
      );
      this.logger.log(
        `Successfully synced subscription for user ${user.id} with QR-Thrive plan ${qrThrivePlanId}`,
      );
    } catch (error) {
      return this.handleExternalError(
        error,
        'Failed to sync subscription with QR-Thrive',
      );
    }
  }

  /**
   * Fetches all QR codes for a user.
   */
  async getQRCodes(user: User, branchId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes`,
          { headers },
        ),
      );

      // Transform response to match frontend expectations
      const qrCodes = Array.isArray(data) ? data : [];
      return qrCodes.map((qr: any) => ({
        ...qr,
        shortUrl: qr.shortUrl || `/s/${qr.shortId}`,
        isDynamic: qr.isDynamic ?? true,
        scans: qr._count?.scans || qr.scans || 0,
      }));
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch QR codes');
    }
  }

  /**
   * Publicly fetches metadata for specific QR codes of a branch.
   * Used for UBL rendering.
   */
  async getPublicQRCodesForBranch(branchId: string, qrCodeIds: string[]) {
    if (!qrCodeIds || qrCodeIds.length === 0) return [];

    try {
      const businessId = await this.branchesService.getBusinessId(branchId);
      const ownerId = await this.branchesService.getBusinessOwnerId(businessId);

      if (!ownerId) {
        this.logger.warn(`Could not resolve owner for branch ${branchId}`);
        return [];
      }

      const mapping = await this.userMappingRepo.findOne({
        where: { userId: ownerId },
      });

      if (!mapping) {
        this.logger.warn(`No QR-Thrive mapping found for owner ${ownerId}`);
        return [];
      }

      // Fetch all QR codes for this user and filter by IDs
      // This is simpler than making multiple individual requests
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes`,
          { headers: this.headers },
        ),
      );

      const allCodes = Array.isArray(data) ? data : [];
      return allCodes
        .filter((qr: any) => qrCodeIds.includes(qr.id))
        .map((qr: any) => ({
          id: qr.id,
          name: qr.name,
          type: qr.type,
          shortId: qr.shortId,
          shortUrl: qr.shortUrl || `/s/${qr.shortId}`,
          data: qr.data,
          design: qr.design,
          frame: qr.frame,
          logo: qr.logo,
        }));
    } catch (error) {
      this.logger.error(
        `Failed to fetch public QR codes for branch ${branchId}: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Fetches a single QR code details.
   */
  async getQRCode(user: User, branchId: string, qrCodeId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}`,
          { headers },
        ),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch QR code details');
    }
  }

  /**
   * Updates an existing QR code.
   */
  async updateQRCode(
    user: User,
    branchId: string,
    qrCodeId: string,
    dto: UpdateQRCodeDto,
  ) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const branch = await this.branchesService.findById(branchId);
    if (branch && branch.mainQrCodeId === qrCodeId) {
      throw new HttpException(
        'The main business link QR code cannot be modified or deleted.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.patch(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}`,
          dto,
          { headers },
        ),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to update QR code');
    }
  }

  /**
   * Deletes a QR code.
   */
  async deleteQRCode(user: User, branchId: string, qrCodeId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const branch = await this.branchesService.findById(branchId);
    if (branch && branch.mainQrCodeId === qrCodeId) {
      throw new HttpException(
        'The main business link QR code cannot be modified or deleted.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    this.logger.log(
      `Deleting QR code ${qrCodeId} for user ${mapping.qrThriveUserId}`,
    );

    try {
      const headers = await this.getHeadersWithSubscription(user);
      await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}`,
          { headers },
        ),
      );

      // If the deleted QR was the branch's main QR, clear the reference
      await this.branchRepo
        .createQueryBuilder()
        .update(Branch)
        .set({ mainQrCodeId: null as any, mainQrShortUrl: null as any })
        .where('id = :branchId AND mainQrCodeId = :qrCodeId', {
          branchId,
          qrCodeId,
        })
        .execute();

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete QR code: ${error.message}`,
        error.stack,
      );
      return this.handleExternalError(error, 'Failed to delete QR code');
    }
  }

  /**
   * Duplicates an existing QR code.
   */
  async duplicateQRCode(user: User, branchId: string, qrCodeId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}/duplicate`,
          {},
          { headers },
        ),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to duplicate QR code');
    }
  }

  /**
   * Updates the local status of an external lead in VemTap.
   */
  async updateLeadStatus(
    user: User,
    branchId: string,
    leadId: string,
    status: ExternalLeadStatus,
    notes?: string,
  ) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    let leadStatus = await this.leadStatusRepo.findOne({
      where: { externalLeadId: leadId, branchId },
    });

    if (leadStatus) {
      leadStatus.status = status;
      if (notes !== undefined) leadStatus.notes = notes;
    } else {
      leadStatus = this.leadStatusRepo.create({
        externalLeadId: leadId,
        status,
        notes,
        businessId: user.businessId,
        branchId,
      });
    }

    return await this.leadStatusRepo.save(leadStatus);
  }

  async getStats(
    user: User,
    branchId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new HttpException(
        'You do not have access to this branch',
        HttpStatus.FORBIDDEN,
      );
    }

    const mapping = await this.getMapping(user, branchId);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const queryString = params.toString() ? `?${params.toString()}` : '';

      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/stats${queryString}`,
          { headers },
        ),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch statistics');
    }
  }

  /**
   * Folder Management
   */
  async getFolders(user: User, branchId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/folders`,
          { headers },
        ),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch folders');
    }
  }

  async createFolder(user: User, branchId: string, dto: CreateFolderDto) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/folders`,
          dto,
          { headers },
        ),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to create folder');
    }
  }

  async deleteFolder(user: User, branchId: string, folderId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/folders/${folderId}`,
          { headers },
        ),
      );
      return { success: true };
    } catch (error) {
      return this.handleExternalError(error, 'Failed to delete folder');
    }
  }

  async updateFolder(
    user: User,
    branchId: string,
    folderId: string,
    dto: UpdateFolderDto,
  ) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    const mapping = await this.getMapping(user, branchId);

    try {
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/folders/${folderId}`,
          dto,
          { headers },
        ),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to update folder');
    }
  }

  /**
   * Retrieves an existing user mapping by VemTap user ID.
   */
  async getMappingByUserId(
    userId: string,
  ): Promise<QrThriveUserMapping | null> {
    return await this.userMappingRepo.findOne({ where: { userId } });
  }

  /**
   * Resets a user mapping by deleting it from the database.
   * This allows the user to re-provision their account if the mapping was corrupted.
   */
  async resetMapping(user: User): Promise<void> {
    const mapping = await this.getMapping(user);
    if (mapping) {
      const userId = mapping.userId;
      await this.userMappingRepo.remove(mapping);
      this.logger.log(
        `Successfully reset QR-Thrive mapping for user ${userId}`,
      );
    }
  }

  private async resolveRealShortId(shortId: string): Promise<string> {
    if (!shortId) return shortId;

    try {
      // Handle both raw branch uniqueCode (e.g. J7JTS7RZO) and optional legacy QRBR prefix (e.g. QRBRJ7JTS7RZO)
      let uniqueCode = shortId;
      if (shortId.startsWith('QRBR')) {
        uniqueCode = shortId.substring(4);
      }

      const branch = await this.branchRepo.findOne({
        where: { uniqueCode },
      });

      if (branch) {
        // Case 1: We already have mainQrShortUrl cached in the database
        if (branch.mainQrShortUrl) {
          const parts = branch.mainQrShortUrl.split('/');
          const extractedId = parts[parts.length - 1];
          if (extractedId) {
            this.logger.log(
              `Resolved branch uniqueCode ${shortId} to cached main QR shortId ${extractedId}`,
            );
            return extractedId;
          }
        }

        // Case 2: mainQrShortUrl is null but we have mainQrCodeId -> Self-heal by fetching from QR-Thrive integration API
        if (branch.mainQrCodeId) {
          try {
            const businessId = await this.branchesService.getBusinessId(
              branch.id,
            );
            const ownerId =
              await this.branchesService.getBusinessOwnerId(businessId);
            if (ownerId) {
              const mapping = await this.userMappingRepo.findOne({
                where: { userId: ownerId },
              });
              if (mapping && mapping.qrThriveUserId) {
                const headers = await this.getHeadersWithSubscription();
                const { data } = await firstValueFrom(
                  this.httpService.get(
                    `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${branch.mainQrCodeId}`,
                    { headers },
                  ),
                );

                if (data && data.shortId) {
                  // Self-heal/Cache in database for future scans
                  await this.branchRepo.update(branch.id, {
                    mainQrShortUrl:
                      data.shortUrl || `https://qrthrive.com/${data.shortId}`,
                  });
                  this.logger.log(
                    `Self-healed mainQrShortUrl for branch ${branch.id} to ${data.shortUrl}`,
                  );
                  return data.shortId;
                }
              }
            }
          } catch (apiError) {
            this.logger.error(
              `Failed to fetch main QR details from QR-Thrive for self-healing: ${apiError.message}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to resolve branch code ${shortId}: ${error.message}`,
      );
    }

    return shortId;
  }

  /**
   * Fetches public details of a QR code from QR-Thrive.
   */
  async getPublicQRCode(shortId: string, user?: User) {
    const realShortId = await this.resolveRealShortId(shortId);
    try {
      const publicUrl = this.baseUrl.replace('/integration', '/qr-codes');
      const headers = await this.getHeadersWithSubscription(user);
      const { data } = await firstValueFrom(
        this.httpService.get(`${publicUrl}/public/${realShortId}`, { headers }),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch public QR code');
    }
  }

  /**
   * Records a scan in QR-Thrive and returns the destination URL.
   */
  async recordPublicScan(
    shortId: string,
    ip: string,
    userAgent: string,
    user?: User,
  ) {
    const realShortId = await this.resolveRealShortId(shortId);
    try {
      const publicUrl = this.baseUrl.replace('/integration', '/qr-codes');
      const headers = await this.getHeadersWithSubscription(user);
      const { headers: responseHeaders } = await firstValueFrom(
        this.httpService.get(`${publicUrl}/scan/${realShortId}`, {
          headers: {
            ...headers,
            'x-forwarded-for': ip,
            'user-agent': userAgent,
          },
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
        }),
      );

      // The QR-Thrive scan endpoint always redirects (302)
      return responseHeaders.location || '/';
    } catch (error) {
      this.logger.error(
        `Failed to record scan for ${realShortId}: ${error.message}`,
      );
      // Fallback: try to get the QR data to determine destination if scan recording fails
      try {
        const qrCode = await this.getPublicQRCode(realShortId);
        const data = qrCode.data;
        if (qrCode.type === 'url' && data.url) {
          return data.url.startsWith('http') ? data.url : `https://${data.url}`;
        }
        if (qrCode.type === 'whatsapp' && data.phoneNumber) {
          const message = data.message
            ? `?text=${encodeURIComponent(data.message)}`
            : '';
          return `https://wa.me/${data.phoneNumber}${message}`;
        }
        if (qrCode.type === 'pdf' && data.pdf?.url) {
          return data.pdf.url;
        }
        if (qrCode.type === 'image' && data.image?.url) {
          return data.image.url;
        }
        if (qrCode.type === 'video' && data.video?.url) {
          return data.video.url;
        }
        if (qrCode.type === 'mp3' && data.mp3?.url) {
          return data.mp3.url;
        }

        // Fallback to any generic url, or shortUrl of the QR code
        if (data.url) {
          return data.url.startsWith('http') ? data.url : `https://${data.url}`;
        }
        if (qrCode.shortUrl) {
          return qrCode.shortUrl;
        }
      } catch (e) {
        this.logger.error(`Fallback failed for ${realShortId}: ${e.message}`);
      }
      throw new HttpException('QR Code not found', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Submits a form response to QR-Thrive via VemTap.
   */
  async submitPublicForm(shortId: string, answers: Record<string, any>) {
    const realShortId = await this.resolveRealShortId(shortId);
    try {
      const publicUrl = this.baseUrl.replace('/integration', '/public/forms');
      const { data } = await firstValueFrom(
        this.httpService.post(`${publicUrl}/${realShortId}/submit`, {
          answers,
        }),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(
        error,
        'Failed to submit form to QR-Thrive',
      );
    }
  }

  /**
   * Fetches public form structure from QR-Thrive.
   */
  async getPublicForm(shortId: string) {
    const realShortId = await this.resolveRealShortId(shortId);
    try {
      const publicUrl = this.baseUrl.replace('/integration', '/public/forms');
      const { data } = await firstValueFrom(
        this.httpService.get(`${publicUrl}/${realShortId}`),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(
        error,
        'Failed to fetch public form structure',
      );
    }
  }
}
