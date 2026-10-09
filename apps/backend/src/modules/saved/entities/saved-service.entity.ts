import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueItem } from '../../catalogue/entities/catalogue-item.entity';
import { User } from '../../users/entities/user.entity';

@Unique(['itemId', 'userId'])
@Entity('saved_services')
export class SavedService extends AbstractBaseEntity {
  @ApiProperty({
    example: 'uuid-of-catalogue-item',
    description: 'Catalogue item of type `service`',
  })
  @Column({ type: 'uuid' })
  @Index()
  itemId: string;

  @ManyToOne(() => CatalogueItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: CatalogueItem;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ example: 'uuid-of-user' })
  @Column({ type: 'uuid' })
  @Index()
  userId: string;
}
