import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';

export enum SurveyTriggerType {
  INSTANT = 'INSTANT',
  DELAYED = 'DELAYED',
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'rating' | 'choice' | 'text';
  options?: string[];
}

export interface TargetAudience {
  new: boolean;
  returning: boolean;
}

@Entity('surveys')
export class Survey extends AbstractBaseEntity {
  @Column({ type: 'jsonb', default: [] })
  questions: SurveyQuestion[];

  @Column({
    type: 'simple-enum',
    enum: SurveyTriggerType,
    default: SurveyTriggerType.INSTANT,
  })
  triggerType: SurveyTriggerType;

  @Column({ nullable: true })
  triggerDelay: number; // in minutes

  @Column({ type: 'jsonb', default: { new: true, returning: true } })
  targetAudience: TargetAudience;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;
}
