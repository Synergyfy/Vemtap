import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueOffer } from '../../catalogue/entities/catalogue-offer.entity';
import { User } from '../../users/entities/user.entity';

@Unique(['offerId', 'userId'])
@Entity('deal_saves')
export class DealSave extends AbstractBaseEntity {
  @Index()
  @Column()
  offerId: string;

  @ManyToOne(() => CatalogueOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offerId' })
  offer: CatalogueOffer;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;
}
