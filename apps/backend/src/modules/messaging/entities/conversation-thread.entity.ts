import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Channel } from '../enums/channel.enum';
import { Contact } from '../../contacts/entities/contact.entity';

export enum ThreadStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    RESOLVED = 'RESOLVED',
}

@Entity('conversation_threads')
@Unique(['businessId', 'contactId', 'channel'])
export class ConversationThread extends AbstractBaseEntity {
    @ManyToOne(() => Business, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'businessId' })
    business: Business;

    @Column()
    businessId: string;

    @ManyToOne(() => Contact, (contact) => contact.threads, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'contactId' })
    contact: Contact;

    @Column()
    contactId: string;

    @Column({ type: 'enum', enum: Channel })
    channel: Channel;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastActivityAt: Date;

    @Column({ type: 'enum', enum: ThreadStatus, default: ThreadStatus.OPEN })
    status: ThreadStatus;

    @Column({ type: 'jsonb', nullable: true })
    notes: any;
}
