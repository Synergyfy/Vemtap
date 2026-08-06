import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cluster } from './entities/cluster.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { ClustersService } from './clusters.service';
import {
  ClustersPublicController,
  ClustersAdminController,
} from './clusters.controller';
import { ClusterCacheService } from './cluster-cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cluster,
      Branch,
      CatalogueOffer,
      CatalogueOfferClaim,
    ]),
  ],
  controllers: [ClustersPublicController, ClustersAdminController],
  providers: [ClustersService, ClusterCacheService],
  exports: [ClustersService],
})
export class ClustersModule {}
