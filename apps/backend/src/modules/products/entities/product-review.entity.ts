import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';

export enum ProductReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('product_reviews')
export class ProductReview extends AbstractBaseEntity {
  @Index()
  @Column()
  productId: string;

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  userId: string;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  ipHash: string | null;

  @Column()
  reviewerName: string;

  @Column('int')
  rating: number;

  @Column('text')
  comment: string;

  @Column({
    type: 'simple-enum',
    enum: ProductReviewStatus,
    default: ProductReviewStatus.PENDING,
  })
  status: ProductReviewStatus;
}
