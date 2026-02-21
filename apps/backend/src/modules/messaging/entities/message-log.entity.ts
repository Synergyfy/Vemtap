import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Channel } from '../enums/channel.enum';
import { MessageDirection, MessageStatus } from './message.entity';

@Entity('message_logs')
export class MessageLog extends AbstractBaseEntity {
    @ManyToOne(() => Business, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'businessId' })
    business: Business;

    @Column()
    businessId: string;

    @Column({ nullable: true })
    contactId: string;

    @Column({ nullable: true })
    campaignId: string;

    @Column({ nullable: true })
    messageId: string;

    @Column({ type: 'enum', enum: Channel })
    channel: Channel;

    @Column({ type: 'enum', enum: MessageDirection })
    direction: MessageDirection;

    @Column({ type: 'enum', enum: MessageStatus })
    status: MessageStatus;

    @Column({ nullable: true })
    errorReason: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    timestamp: Date;
}
