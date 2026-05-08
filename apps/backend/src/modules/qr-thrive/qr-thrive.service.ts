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

  /**
   * Helper to resolve the correct QR-Thrive mapping for a user.
   * Handles Admin/Agent impersonation by resolving the target business owner.
   */
  private async getMapping(
    user: User,
    branchId?: string,
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
        const ownerId = await this.branchesService.getBusinessOwnerId(businessId);
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
      throw new HttpException(
        'User not synced with QR-Thrive. Please sync first.',
        HttpStatus.BAD_REQUEST,
      );
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

      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/users`, payload, {
          headers: this.headers,
        }),
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
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes`,
          dto,
          { headers: this.headers },
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
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}/scans`,
          { headers: this.headers },
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
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}/responses`,
          { headers: this.headers },
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
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/leads`,
          { headers: this.headers },
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

      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/specialized-leads${queryString}`,
          { headers: this.headers },
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
        this.logger.error(`Failed to merge local lead statuses: ${dbError.message}`);
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
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/magic-link`,
          {},
          { headers: this.headers },
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
    const mapping = await this.getMapping(user);
    if (!mapping) {
      this.logger.warn(
        `User ${user.id} not synced with QR-Thrive. Skipping subscription sync.`,
      );
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/subscription`,
          { planId: qrThrivePlanId, status: 'active' },
          { headers: this.headers },
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
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes`,
          { headers: this.headers },
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
      this.logger.error(`Failed to fetch public QR codes for branch ${branchId}: ${error.message}`);
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
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}`,
          { headers: this.headers },
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

    const mapping = await this.getMapping(user, branchId);

    try {
      const { data } = await firstValueFrom(
        this.httpService.patch(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}`,
          dto,
          { headers: this.headers },
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

    const mapping = await this.getMapping(user, branchId);

    this.logger.log(
      `Deleting QR code ${qrCodeId} for user ${mapping.qrThriveUserId}`,
    );

    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}`,
          { headers: this.headers },
        ),
      );
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
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}/duplicate`,
          {},
          { headers: this.headers },
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

      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/stats${queryString}`,
          { headers: this.headers },
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
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/folders`,
          { headers: this.headers },
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
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/folders`,
          dto,
          { headers: this.headers },
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
      await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/folders/${folderId}`,
          { headers: this.headers },
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
      const { data } = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/users/${mapping.qrThriveUserId}/folders/${folderId}`,
          dto,
          { headers: this.headers },
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

  /**
   * Fetches public details of a QR code from QR-Thrive.
   */
  async getPublicQRCode(shortId: string) {
    try {
      const publicUrl = this.baseUrl.replace('/integration', '/qr-codes');
      const { data } = await firstValueFrom(
        this.httpService.get(`${publicUrl}/public/${shortId}`),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch public QR code');
    }
  }

  /**
   * Records a scan in QR-Thrive and returns the destination URL.
   */
  async recordPublicScan(shortId: string, ip: string, userAgent: string) {
    try {
      const publicUrl = this.baseUrl.replace('/integration', '/qr-codes');
      const { headers } = await firstValueFrom(
        this.httpService.get(`${publicUrl}/scan/${shortId}`, {
          headers: {
            'x-forwarded-for': ip,
            'user-agent': userAgent,
          },
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
        }),
      );

      // The QR-Thrive scan endpoint always redirects (302)
      return headers.location || '/';
    } catch (error) {
      this.logger.error(
        `Failed to record scan for ${shortId}: ${error.message}`,
      );
      // Fallback: try to get the QR data to determine destination if scan recording fails
      try {
        const qrCode = await this.getPublicQRCode(shortId);
        const data = qrCode.data as any;
        if (qrCode.type === 'url' && data.url) {
          return data.url.startsWith('http') ? data.url : `https://${data.url}`;
        }
        if (qrCode.type === 'whatsapp' && data.phoneNumber) {
          const message = data.message
            ? `?text=${encodeURIComponent(data.message)}`
            : '';
          return `https://wa.me/${data.phoneNumber}${message}`;
        }
      } catch (e) {
        this.logger.error(`Fallback failed for ${shortId}: ${e.message}`);
      }
      throw new HttpException('QR Code not found', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Submits a form response to QR-Thrive via VemTap.
   */
  async submitPublicForm(shortId: string, answers: Record<string, any>) {
    try {
      const publicUrl = this.baseUrl.replace('/integration', '/public/forms');
      const { data } = await firstValueFrom(
        this.httpService.post(`${publicUrl}/${shortId}/submit`, { answers }),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to submit form to QR-Thrive');
    }
  }

  /**
   * Fetches public form structure from QR-Thrive.
   */
  async getPublicForm(shortId: string) {
    try {
      const publicUrl = this.baseUrl.replace('/integration', '/public/forms');
      const { data } = await firstValueFrom(
        this.httpService.get(`${publicUrl}/${shortId}`),
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch public form structure');
    }
  }
}

