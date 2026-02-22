import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Message } from '../../messaging/entities/message.entity';
import { ConversationThread } from '../../messaging/entities/conversation-thread.entity';

import { Channel } from '../../messaging/enums/channel.enum';

@Entity('contacts')
export class Contact extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({
    type: 'simple-array',
    default: [Channel.SMS, Channel.WHATSAPP, Channel.EMAIL],
  })
  optInChannels: Channel[];

  @Column({ default: false })
  optOut: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @OneToMany(() => Message, (message) => message.contact)
  messages: Message[];

  @OneToMany(() => ConversationThread, (thread) => thread.contact)
  threads: ConversationThread[];
}
