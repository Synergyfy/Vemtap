import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueItem } from '../../catalogue/entities/catalogue-item.entity';
import { User } from '../../users/entities/user.entity';

/**
 * A customer's like on a catalogue product or service. At most one per
 * customer per item; unliking deletes the row.
 */
@Unique('UQ_catalogue_item_likes_item_user', ['itemId', 'userId'])
@Entity('catalogue_item_likes')
export class ProductLike extends AbstractBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => CatalogueItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: CatalogueItem;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
