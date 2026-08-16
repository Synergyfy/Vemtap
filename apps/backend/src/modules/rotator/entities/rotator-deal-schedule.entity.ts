import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueOffer } from '../../catalogue/entities/catalogue-offer.entity';

@Entity('rotator_deal_schedules')
@Index('idx_rotator_schedule_offer', ['offerId'])
export class RotatorDealSchedule extends AbstractBaseEntity {
  @ApiProperty({ description: 'Catalogue offer the schedule applies to' })
  @Column({ type: 'uuid' })
  offerId: string;

  @ManyToOne(() => CatalogueOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offerId' })
  offer: CatalogueOffer;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Day of week the window applies to: 0=Sun … 6=Sat. null = every day.',
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  dayOfWeek: number | null;

  @ApiPropertyOptional({
    example: '11:00',
    description: 'Window start time (HH:mm)',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 5, nullable: true })
  startTime: string | null;

  @ApiPropertyOptional({
    example: '15:00',
    description:
      'Window end time (HH:mm). May cross midnight (e.g. 22:00 → 02:00).',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 5, nullable: true })
  endTime: string | null;

  @ApiPropertyOptional({
    description: 'Optional one-shot lower bound for this schedule',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date | null;

  @ApiPropertyOptional({
    description: 'Optional one-shot upper bound for this schedule',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;
}
