import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Channel } from '../enums/channel.enum';

@Entity('message_templates')
@Unique(['businessId', 'name', 'channel'])
export class MessageTemplate extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @Column({ type: 'enum', enum: Channel })
  channel: Channel;

  @Column()
  name: string;

  @Column({ type: 'text' })
  content: string;
}
