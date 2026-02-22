import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Channel } from '../enums/channel.enum';
import { MessageTemplate } from './message-template.entity';

export enum CampaignStatus {
    DRAFT = 'DRAFT',
    PROCESSING = 'PROCESSING',
    SENT = 'SENT',
    FAILED = 'FAILED',
}

export enum AudienceType {
    ALL = 'ALL',
    GROUP = 'GROUP',
    TAGGED = 'TAGGED',
    RECENT = 'RECENT',
}

@Entity('message_campaigns')
export class MessageCampaign extends AbstractBaseEntity {
    @ManyToOne(() => Branch, (branch) => branch.messageCampaigns, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'branchId' })
    branch: Branch;

    @Column()
    branchId: string;

    @Column()
    name: string;

    @Column({ type: 'enum', enum: Channel })
    channel: Channel;

    @Column({ type: 'enum', enum: AudienceType })
    audienceType: AudienceType;

    @Column({ type: 'int', default: 0 })
    audienceSize: number;

    @ManyToOne(() => MessageTemplate, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'templateId' })
    template: MessageTemplate;

    @Column({ nullable: true })
    templateId: string;

    @Column({ type: 'text', nullable: true })
    content: string;

    @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
    estimatedCost: number;

    @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
    actualCost: number;

    @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
    status: CampaignStatus;

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date;

    @Column({ type: 'jsonb', nullable: true })
    metrics: {
        deliveryRate?: number;
        engagementRate?: number;
        replies?: number;
    };
}
