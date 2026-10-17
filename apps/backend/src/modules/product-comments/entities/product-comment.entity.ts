import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueItem } from '../../catalogue/entities/catalogue-item.entity';
import { User } from '../../users/entities/user.entity';

/**
 * A customer's public comment on a catalogue product, with an optional star
 * rating and the business's optional public reply. Comments publish
 * immediately; the business can reply or remove them. One live comment per
 * customer per item (a partial unique index ignores soft-deleted rows).
 */
@Entity('catalogue_item_comments')
export class ProductComment extends AbstractBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => CatalogueItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: CatalogueItem;

  /** Denormalised from the item so business queries skip the join. */
  @Index()
  @Column({ type: 'uuid' })
  businessId: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @ApiProperty({ example: 'Ada O.' })
  @Column({ type: 'varchar', length: 80 })
  authorName: string;

  @ApiProperty({ example: 'Arrived warm and well packed.' })
  @Column({ type: 'text' })
  comment: string;

  @ApiProperty({ example: 5, nullable: true })
  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  merchantReply: string | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  repliedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  repliedById: string | null;
}
