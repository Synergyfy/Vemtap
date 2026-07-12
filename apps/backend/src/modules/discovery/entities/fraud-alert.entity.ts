import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { User } from '../../users/entities/user.entity';
export enum FraudSeverity {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum FraudAlertStatus {
  FLAGGED = 'Flagged',
  INVESTIGATING = 'Investigating',
  RESOLVED = 'Resolved',
}

@Entity('fraud_alerts')
export class FraudAlert extends AbstractBaseEntity {
  @Column()
  type: string;

  @ManyToOne(() => Business, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @Column({ type: 'simple-enum', enum: FraudSeverity, default: FraudSeverity.MEDIUM })
  severity: FraudSeverity;

  @Column({ type: 'int', default: 0 })
  confidence: number;

  @Column({
    type: 'simple-enum',
    enum: FraudAlertStatus,
    default: FraudAlertStatus.FLAGGED,
  })
  status: FraudAlertStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ nullable: true })
  deviceFingerprint: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'timestamp', nullable: true })
  timestamp: Date;
}
