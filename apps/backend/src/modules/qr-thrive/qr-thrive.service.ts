import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { QrThriveUserMapping } from './entities/qr-thrive-user-mapping.entity';
import { QrThriveCodeMapping } from './entities/qr-thrive-code-mapping.entity';
import { User } from '../users/entities/user.entity';
import { CreateQRCodeDto } from './dto/qr-thrive.dto';
import { BranchesService } from '../branches/branches.service';

@Injectable()
export class QrThriveService implements OnModuleInit {
  private readonly logger = new Logger(QrThriveService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly branchesService: BranchesService,
    @InjectRepository(QrThriveUserMapping)
    private readonly userMappingRepo: Repository<QrThriveUserMapping>,
    @InjectRepository(QrThriveCodeMapping)
    private readonly codeMappingRepo: Repository<QrThriveCodeMapping>,
  ) {
    this.apiKey = this.configService.get<string>('QR_THRIVE_API_KEY')!;
    this.baseUrl = this.configService.get<string>('QR_THRIVE_BASE_URL', 'https://api.qrthrive.com/v1');
  }

  onModuleInit() {
    if (!this.apiKey) {
      this.logger.warn('QR_THRIVE_API_KEY is not configured. QR-Thrive integration will fail at runtime.');
    }
  }

  private handleExternalError(error: any, defaultMessage: string): never {
    const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const externalMessage = error.response?.data?.message;

    // Log the full error internally
    this.logger.error(`${defaultMessage}: ${error.message}`, error.stack);

    // Sanitize message for the client
    const clientMessage = (status < 500 && externalMessage) 
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
   * Ensures a user exists in QR-Thrive and stores the mapping.
   */
  async syncUser(user: User): Promise<QrThriveUserMapping> {
    const existingMapping = await this.userMappingRepo.findOne({ where: { userId: user.id } });
    
    try {
      const payload = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/integration/users`, payload, { headers: this.headers })
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
      if (error.code === '23505') { // PostgreSQL Unique Constraint Violation
        return (await this.userMappingRepo.findOne({ where: { userId: user.id } }))!;
      }
      return this.handleExternalError(error, 'Failed to sync user with QR-Thrive');
    }
  }

  /**
   * Creates a QR code in QR-Thrive.
   */
  async createQRCode(user: User, branchId: string, dto: CreateQRCodeDto) {
    // 1. Verify branch ownership (IDOR Protection)
    const hasAccess = await this.branchesService.checkBranchAccess(user, branchId);
    if (!hasAccess) {
      throw new HttpException('You do not have access to this branch', HttpStatus.FORBIDDEN);
    }

    const mapping = await this.userMappingRepo.findOne({ where: { userId: user.id } });
    if (!mapping) {
      throw new HttpException('User not synced with QR-Thrive. Please sync first.', HttpStatus.BAD_REQUEST);
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/integration/users/${mapping.qrThriveUserId}/qr-codes`,
          dto,
          { headers: this.headers }
        )
      );

      const codeMapping = this.codeMappingRepo.create({
        qrThriveCodeId: data.id,
        shortId: data.shortId,
        name: data.name,
        type: data.type,
        config: {
          design: data.design,
          frame: data.frame,
          data: data.data,
        },
        branchId,
        qrThriveUserId: mapping.qrThriveUserId,
      });

      return await this.codeMappingRepo.save(codeMapping);
    } catch (error) {
      return this.handleExternalError(error, 'Failed to create QR code in QR-Thrive');
    }
  }

  /**
   * Fetches scan history for a QR code.
   */
  async getScans(user: User, branchId: string, qrCodeId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(user, branchId);
    if (!hasAccess) {
      throw new HttpException('You do not have access to this branch', HttpStatus.FORBIDDEN);
    }

    const mapping = await this.userMappingRepo.findOne({ where: { userId: user.id } });
    if (!mapping) throw new HttpException('User not synced', HttpStatus.BAD_REQUEST);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/integration/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}/scans`,
          { headers: this.headers }
        )
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch scans');
    }
  }

  /**
   * Fetches form responses for a QR code.
   */
  async getResponses(user: User, branchId: string, qrCodeId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(user, branchId);
    if (!hasAccess) {
      throw new HttpException('You do not have access to this branch', HttpStatus.FORBIDDEN);
    }

    const mapping = await this.userMappingRepo.findOne({ where: { userId: user.id } });
    if (!mapping) throw new HttpException('User not synced', HttpStatus.BAD_REQUEST);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/integration/users/${mapping.qrThriveUserId}/qr-codes/${qrCodeId}/responses`,
          { headers: this.headers }
        )
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to fetch responses');
    }
  }

  /**
   * Generates a Magic Link for SSO.
   */
  async getMagicLink(userId: string) {
    const mapping = await this.userMappingRepo.findOne({ where: { userId } });
    if (!mapping) throw new HttpException('User not synced', HttpStatus.BAD_REQUEST);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/integration/users/${mapping.qrThriveUserId}/magic-link`,
          {},
          { headers: this.headers }
        )
      );
      return data;
    } catch (error) {
      return this.handleExternalError(error, 'Failed to generate magic link');
    }
  }

  /**
   * Internal helper to find mapping by branch
   */
  async findCodesByBranch(branchId: string) {
    return await this.codeMappingRepo.find({ where: { branchId } });
  }
}
