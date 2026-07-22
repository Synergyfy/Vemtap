import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('ai_credit_usage')
@Index(['businessId', 'periodStart'], { unique: true })
export class AiCreditUsage extends AbstractBaseEntity {
  @Column()
  businessId: string;

  @Column({ type: 'int', default: 0 })
  used: number;

  @Column({ type: 'timestamp' })
  periodStart: Date; // Start of billing cycle (first of month at 00:00:00 UTC)

  @Column({ type: 'timestamp' })
  periodEnd: Date; // End of billing cycle (last moment of month at UTC)
}
