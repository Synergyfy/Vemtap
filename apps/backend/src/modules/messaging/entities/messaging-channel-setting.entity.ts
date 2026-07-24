import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Exclude } from 'class-transformer';

export enum SmsRoutingMode {
  AFRICA_OPTIMIZED = 'africa_optimized',
  GLOBAL_FASTEST = 'global_fastest',
  COST_OPTIMIZED = 'cost_optimized',
}

export enum EmailDomainStatus {
  UNVERIFIED = 'unverified',
  VERIFYING = 'verifying',
  VERIFIED = 'verified',
}

@Entity('messaging_channel_settings')
@Index(['businessId'])
@Index(['branchId'])
export class MessagingChannelSetting extends AbstractBaseEntity {
  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'uuid', nullable: true })
  branchId?: string | null;

  @Column({ type: 'varchar', default: 'VemTap' })
  smsSenderId: string;

  @Column({
    type: 'enum',
    enum: SmsRoutingMode,
    default: SmsRoutingMode.AFRICA_OPTIMIZED,
  })
  smsRouting: SmsRoutingMode;

  @Column({ type: 'varchar', nullable: true })
  whatsappPhoneNumberId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  whatsappWabaAccountId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Exclude({ toPlainOnly: true })
  whatsappSystemUserToken?: string | null;

  @Column({ type: 'boolean', default: true })
  whatsappRequireDoubleOptIn: boolean;

  @Column({ type: 'boolean', default: true })
  whatsappEnableStopAutoReply: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailFromName?: string | null;

  @Column({ type: 'varchar', nullable: true })
  emailFromEmail?: string | null;

  @Column({ type: 'varchar', nullable: true })
  emailCustomDomain?: string | null;

  @Column({
    type: 'enum',
    enum: EmailDomainStatus,
    default: EmailDomainStatus.UNVERIFIED,
  })
  emailDomainStatus: EmailDomainStatus;

  @Column({ type: 'jsonb', nullable: true })
  emailDnsRecords?: any[] | null;
}
