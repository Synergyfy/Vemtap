import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueOffer } from '../../catalogue/entities/catalogue-offer.entity';
import { User } from '../../users/entities/user.entity';

export enum DealReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('deal_reviews')
export class DealReview extends AbstractBaseEntity {
  @Index()
  @Column()
  offerId: string;

  @ManyToOne(() => CatalogueOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offerId' })
  offer: CatalogueOffer;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  ipHash: string | null;

  @ApiProperty({ example: 'Chidi O.' })
  @Column()
  reviewerName: string;

  @ApiProperty({ example: 'Fantastic deal, redeemed easily!' })
  @Column({ type: 'text' })
  comment: string;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @ApiProperty({ enum: DealReviewStatus, example: DealReviewStatus.PENDING })
  @Column({
    type: 'simple-enum',
    enum: DealReviewStatus,
    default: DealReviewStatus.PENDING,
  })
  status: DealReviewStatus;
}
