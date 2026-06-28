import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingAsset } from '../entities/marketing-asset.entity';
import { MarketingAssetVersion } from '../entities/marketing-asset-version.entity';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(MarketingAsset)
    private readonly assetRepo: Repository<MarketingAsset>,
    @InjectRepository(MarketingAssetVersion)
    private readonly versionRepo: Repository<MarketingAssetVersion>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly auditLogService: AuditLogService,
  ) {}

  // Validate business category is not in the excluded list (PRD §8.0)
  private async validateBusinessCategory(user: User): Promise<void> {
    if (user.role === 'Admin') {
      return;
    }
    const businessId = user.businessId || user.ownedBusiness?.id;

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      relations: ['category'],
    });

    if (business && business.category) {
      const excludedCategories = [
        'hospital',
        'clinic',
        'dental clinic',
        'eye clinic',
        'medical laboratory',
        'pharmacy',
        'airport',
        'government',
        'ministry',
        'agency',
        'educational',
        'school',
        'university',
      ];
      const catLower = business.category.name.toLowerCase();
      const isExcluded = excludedCategories.some((ex) => {
        if (ex === 'hospital') {
          return (
            catLower.includes('hospital') && !catLower.includes('hospitality')
          );
        }
        return catLower.includes(ex);
      });
      if (isExcluded) {
        throw new ForbiddenException(
          `Your business category (${business.category.name}) has specialized operational systems and is excluded from the Marketing Assets module.`,
        );
      }
    }
  }

  async create(user: User, createDto: CreateAssetDto): Promise<MarketingAsset> {
    await this.validateBusinessCategory(user);
    const businessId = user.businessId || user.ownedBusiness?.id;
    if (!businessId) {
      throw new ForbiddenException('User is not associated with any business');
    }

    const asset = this.assetRepo.create({
      ...createDto,
      businessId,
    });
    const savedAsset = await this.assetRepo.save(asset);

    // Save initial version
    const version = this.versionRepo.create({
      assetId: savedAsset.id,
      version: 1,
      customConfig: savedAsset.customConfig,
      createdById: user.id,
    });
    await this.versionRepo.save(version);

    await this.auditLogService.log({
      businessId,
      userId: user.id,
      action: 'create',
      entityType: 'asset',
      entityId: savedAsset.id,
      details: { type: savedAsset.type, templateId: savedAsset.templateId },
    });

    return savedAsset;
  }

  async findAll(
    user: User,
    branchId?: string,
    type?: string,
  ): Promise<MarketingAsset[]> {
    const isAdmin = user.role === 'Admin';
    if (!isAdmin) {
      await this.validateBusinessCategory(user);
    }
    const businessId = user.businessId || user.ownedBusiness?.id;
    if (!isAdmin && !businessId) {
      throw new ForbiddenException('User is not associated with any business');
    }

    const query = this.assetRepo.createQueryBuilder('asset');

    if (!isAdmin) {
      query.where('asset.businessId = :businessId', { businessId });
    }

    if (branchId) {
      query.andWhere('asset.branchId = :branchId', { branchId });
    }
    if (type) {
      query.andWhere('asset.type = :type', { type });
    }

    return query.orderBy('asset.updatedAt', 'DESC').getMany();
  }

  async findOne(id: string, user: User): Promise<MarketingAsset> {
    const isAdmin = user.role === 'Admin';
    if (!isAdmin) {
      await this.validateBusinessCategory(user);
    }
    const businessId = user.businessId || user.ownedBusiness?.id;
    const asset = await this.assetRepo.findOne({
      where: { id },
      relations: ['template', 'branch'],
    });

    if (!asset) {
      throw new NotFoundException(`Marketing asset with ID ${id} not found`);
    }

    // Only allow access if user belongs to same business (or is Admin)
    if (!isAdmin && asset.businessId !== businessId) {
      throw new ForbiddenException(
        'You do not have access to this marketing asset',
      );
    }

    return asset;
  }

  async update(
    id: string,
    user: User,
    updateDto: UpdateAssetDto,
  ): Promise<MarketingAsset> {
    const asset = await this.findOne(id, user);

    const originalConfigString = JSON.stringify(asset.customConfig);
    const newConfigString = updateDto.customConfig
      ? JSON.stringify(updateDto.customConfig)
      : null;

    Object.assign(asset, updateDto);
    const savedAsset = await this.assetRepo.save(asset);

    // If config actually changed, save a new version history entry
    if (newConfigString && originalConfigString !== newConfigString) {
      const latestVersion = await this.versionRepo.findOne({
        where: { assetId: id },
        order: { version: 'DESC' },
      });

      const nextVersionNum = latestVersion ? latestVersion.version + 1 : 1;

      const newVersion = this.versionRepo.create({
        assetId: id,
        version: nextVersionNum,
        customConfig: savedAsset.customConfig,
        createdById: user.id,
      });
      await this.versionRepo.save(newVersion);
    }

    await this.auditLogService.log({
      businessId: user.businessId || user.ownedBusiness?.id || '',
      userId: user.id,
      action: 'update',
      entityType: 'asset',
      entityId: id,
      details: { changes: Object.keys(updateDto) },
    });

    return savedAsset;
  }

  async remove(id: string, user: User): Promise<void> {
    const asset = await this.findOne(id, user);
    await this.assetRepo.remove(asset);
    await this.auditLogService.log({
      businessId: user.businessId || user.ownedBusiness?.id || '',
      userId: user.id,
      action: 'delete',
      entityType: 'asset',
      entityId: id,
    });
  }

  async getVersions(id: string, user: User): Promise<MarketingAssetVersion[]> {
    // Assert access
    await this.findOne(id, user);

    return this.versionRepo.find({
      where: { assetId: id },
      order: { version: 'DESC' },
      relations: ['createdBy'],
    });
  }

  async restoreVersion(
    id: string,
    versionId: string,
    user: User,
  ): Promise<MarketingAsset> {
    const asset = await this.findOne(id, user);
    const version = await this.versionRepo.findOne({
      where: { id: versionId, assetId: id },
    });

    if (!version) {
      throw new NotFoundException(
        `Version ${versionId} not found for asset ${id}`,
      );
    }

    asset.customConfig = version.customConfig;
    const savedAsset = await this.assetRepo.save(asset);

    // Create a new version representing the restoration
    const latestVersion = await this.versionRepo.findOne({
      where: { assetId: id },
      order: { version: 'DESC' },
    });
    const nextVersionNum = latestVersion ? latestVersion.version + 1 : 1;

    const restoredVersion = this.versionRepo.create({
      assetId: id,
      version: nextVersionNum,
      customConfig: savedAsset.customConfig,
      createdById: user.id,
    });
    await this.versionRepo.save(restoredVersion);

    return savedAsset;
  }
}
