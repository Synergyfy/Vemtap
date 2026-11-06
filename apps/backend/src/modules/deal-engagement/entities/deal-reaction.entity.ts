import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueOffer } from '../../catalogue/entities/catalogue-offer.entity';
import { User } from '../../users/entities/user.entity';

export enum DealReactionType {
  LIKE = 'like',
  DISLIKE = 'dislike',
}

@Unique(['offerId', 'userId'])
@Entity('deal_reactions')
export class DealReaction extends AbstractBaseEntity {
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

  @ApiProperty({ enum: DealReactionType, example: DealReactionType.LIKE })
  @Column({
    type: 'simple-enum',
    enum: DealReactionType,
  })
  type: DealReactionType;
}
