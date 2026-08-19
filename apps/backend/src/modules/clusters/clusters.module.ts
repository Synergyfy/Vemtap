import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Cluster } from './entities/cluster.entity';
import { ClusterOffer } from './entities/cluster-offer.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { ClustersService } from './clusters.service';
import {
  ClustersPublicController,
  ClustersAdminController,
} from './clusters.controller';
import { ClusterCacheService } from './cluster-cache.service';
import { ClusterAutoAssignProcessor } from './cluster-auto-assign.processor';
import { CLUSTER_AUTO_ASSIGN_QUEUE } from './cluster-auto-assign.constants';
import { RotatorModule } from '../rotator/rotator.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cluster,
      ClusterOffer,
      Branch,
      CatalogueOffer,
      CatalogueOfferClaim,
    ]),
    BullModule.registerQueue({
      name: CLUSTER_AUTO_ASSIGN_QUEUE,
    }),
    RotatorModule,
  ],
  controllers: [ClustersPublicController, ClustersAdminController],
  providers: [ClustersService, ClusterCacheService, ClusterAutoAssignProcessor],
  exports: [ClustersService],
})
export class ClustersModule {}
