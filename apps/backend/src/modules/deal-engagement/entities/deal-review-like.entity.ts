import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { DealReview } from './deal-review.entity';
import { User } from '../../users/entities/user.entity';

@Unique(['reviewId', 'userId'])
@Entity('deal_review_likes')
export class DealReviewLike extends AbstractBaseEntity {
  @Index()
  @Column()
  reviewId: string;

  @ManyToOne(() => DealReview, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewId' })
  review: DealReview;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;
}
