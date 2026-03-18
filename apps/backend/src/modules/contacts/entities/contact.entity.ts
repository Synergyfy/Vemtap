import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';

import { Channel } from '../../messaging/enums/channel.enum';

@Entity('contacts')
export class Contact extends AbstractBaseEntity {
  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
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

  @Column({ nullable: true })
  pushToken: string | null;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];
}
