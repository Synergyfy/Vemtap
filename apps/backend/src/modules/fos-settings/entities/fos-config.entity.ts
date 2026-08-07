import { Entity, Column, Index, Unique } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

export enum FosCategoryType {
  INCOME = 'Income',
  EXPENSE = 'Expense',
}

@Entity('fos_settings_categories')
export class FosSettingsCategory extends AbstractBaseEntity {
  @Column()
  @Index()
  name: string;

  @Column({ type: 'enum', enum: FosCategoryType })
  type: FosCategoryType;

  @Column({ nullable: true })
  description: string;
}

export enum NormalBalance {
  DEBIT = 'Debit',
  CREDIT = 'Credit',
}

@Entity('fos_accounts')
export class FosAccount extends AbstractBaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ type: 'enum', enum: NormalBalance })
  normalBalance: NormalBalance;
}

export enum FosPeriodStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
}

@Entity('fos_periods')
export class FosFiscalPeriod extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({
    type: 'enum',
    enum: FosPeriodStatus,
    default: FosPeriodStatus.OPEN,
  })
  status: FosPeriodStatus;
}

@Entity('fos_currencies')
export class FosCurrency extends AbstractBaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  symbol: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 1,
    transformer: numericTransformer,
  })
  rate: number;

  @Column({ default: false })
  isDefault: boolean;
}

@Entity('fos_permissions')
@Unique(['role'])
export class FosPermission extends AbstractBaseEntity {
  @Column()
  @Index()
  role: string;

  @Column({ type: 'jsonb' })
  permissions: Record<string, boolean>;
}

export enum FosApprovalRuleStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('fos_approval_rules')
export class FosApprovalRule extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column()
  trigger: string;

  @Column()
  approver: string;

  @Column()
  threshold: string;

  @Column({
    type: 'enum',
    enum: FosApprovalRuleStatus,
    default: FosApprovalRuleStatus.ACTIVE,
  })
  status: FosApprovalRuleStatus;
}

export enum FosNotificationChannel {
  EMAIL = 'Email',
  IN_APP = 'In-App',
}

@Entity('fos_notification_rules')
export class FosNotificationRule extends AbstractBaseEntity {
  @Column()
  event: string;

  @Column({ type: 'enum', enum: FosNotificationChannel })
  channel: FosNotificationChannel;

  @Column({ default: true })
  enabled: boolean;
}

@Entity('fos_audit_logs')
export class FosAuditLog extends AbstractBaseEntity {
  @Column()
  @Index()
  timestamp: Date;

  @Column()
  user: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  details: string;
}
