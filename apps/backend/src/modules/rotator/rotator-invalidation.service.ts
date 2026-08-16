import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { RotatorCacheService } from './rotator-cache.service';

@Injectable()
export class RotatorInvalidationService {
  private readonly logger = new Logger(RotatorInvalidationService.name);

  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(CatalogueOffer)
    private readonly offerRepository: Repository<CatalogueOffer>,
    private readonly cache: RotatorCacheService,
  ) {}

  /** Invalidate all rotator caches for one or more clusters. */
  async invalidateClusters(clusterIds: string[]): Promise<void> {
    const unique = [...new Set(clusterIds.filter(Boolean))];
    await Promise.all(unique.map((id) => this.cache.invalidateCluster(id)));
  }

  /** Resolve the cluster(s) a branch belongs to and invalidate them. */
  async invalidateForBranch(branchId: string): Promise<void> {
    try {
      const branch = await this.branchRepository.findOne({
        where: { id: branchId },
        select: ['id', 'clusterId'],
      });
      if (branch?.clusterId) {
        await this.cache.invalidateCluster(branch.clusterId);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate rotator cache for branch ${branchId}: ${(err as Error).message}`,
      );
    }
  }

  /** Resolve the cluster(s) an offer belongs to and invalidate them. */
  async invalidateForOffer(offerId: string): Promise<void> {
    try {
      const offer = await this.offerRepository.findOne({
        where: { id: offerId },
        select: ['branchId'],
      });
      if (!offer?.branchId) return;
      const branch = await this.branchRepository.findOne({
        where: { id: offer.branchId },
        select: ['id', 'clusterId'],
      });
      if (branch?.clusterId) {
        await this.cache.invalidateCluster(branch.clusterId);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate rotator cache for offer ${offerId}: ${(err as Error).message}`,
      );
    }
  }

  /** Invalidate the rotator caches of every cluster a business has branches in. */
  async invalidateForBusiness(businessId: string): Promise<void> {
    try {
      const branches = await this.branchRepository.find({
        where: { businessId },
        select: ['id', 'clusterId'],
      });
      const clusterIds = [
        ...new Set(
          branches.map((b) => b.clusterId).filter((id): id is string => !!id),
        ),
      ];
      await this.invalidateClusters(clusterIds);
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate rotator cache for business ${businessId}: ${(err as Error).message}`,
      );
    }
  }
}
