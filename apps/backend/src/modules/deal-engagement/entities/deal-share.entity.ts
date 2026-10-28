import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueOffer } from '../../catalogue/entities/catalogue-offer.entity';
import { User } from '../../users/entities/user.entity';

@Entity('deal_shares')
export class DealShare extends AbstractBaseEntity {
  @Index()
  @Column()
  offerId: string;

  @ManyToOne(() => CatalogueOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offerId' })
  offer: CatalogueOffer;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipHash: string | null;
}
