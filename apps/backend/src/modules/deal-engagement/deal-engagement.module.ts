import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { DealEngagementService } from './deal-engagement.service';
import { DealEngagementController } from './deal-engagement.controller';
import { DealReviewAdminController } from './deal-engagement-admin.controller';
import { DealReview } from './entities/deal-review.entity';
import { DealReviewLike } from './entities/deal-review-like.entity';
import { DealReaction } from './entities/deal-reaction.entity';
import { DealSave } from './entities/deal-save.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CatalogueOffer,
      DealReview,
      DealReviewLike,
      DealReaction,
      DealSave,
    ]),
  ],
  controllers: [DealEngagementController, DealReviewAdminController],
  providers: [DealEngagementService],
})
export class DealEngagementModule {}
