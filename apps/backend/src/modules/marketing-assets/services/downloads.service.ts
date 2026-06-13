import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingDownload } from '../entities/marketing-download.entity';
import { MarketingAsset } from '../entities/marketing-asset.entity';
import { User } from '../../users/entities/user.entity';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class DownloadsService {
  constructor(
    @InjectRepository(MarketingDownload)
    private readonly downloadRepo: Repository<MarketingDownload>,
    @InjectRepository(MarketingAsset)
    private readonly assetRepo: Repository<MarketingAsset>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async recordDownload(assetId: string, format: string, user: User): Promise<MarketingDownload> {
    const businessId = user.businessId || user.ownedBusiness?.id;
    if (!businessId) {
      throw new ForbiddenException('User is not associated with any business');
    }

    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    // Verify ownership
    const isAdmin = user.role === 'Admin';
    if (!isAdmin && asset.businessId !== businessId) {
      throw new ForbiddenException('You do not own this asset');
    }

    const download = this.downloadRepo.create({
      assetId,
      businessId,
      format: format.toLowerCase(),
    });

    const saved = await this.downloadRepo.save(download);

    await this.auditLogService.log({
      businessId,
      userId: user.id,
      action: 'download',
      entityType: 'asset',
      entityId: assetId,
      details: { format: format.toLowerCase(), downloadId: saved.id },
    });

    return saved;
  }

  async getDownloads(user: User, assetId?: string): Promise<MarketingDownload[]> {
    const isAdmin = user.role === 'Admin';
    const businessId = user.businessId || user.ownedBusiness?.id;
    if (!isAdmin && !businessId) {
      throw new ForbiddenException('User is not associated with any business');
    }

    const query = this.downloadRepo.createQueryBuilder('download')
      .leftJoinAndSelect('download.asset', 'asset');

    if (!isAdmin) {
      query.where('download.businessId = :businessId', { businessId });
    }

    if (assetId) {
      query.andWhere('download.assetId = :assetId', { assetId });
    }

    return query.orderBy('download.downloadedAt', 'DESC').getMany();
  }
}
