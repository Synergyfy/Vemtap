import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { PosOverrideAction } from './pos-enums';

/** Audit row for every supervisor PIN approval. */
@Entity('pos_override_logs')
@Index(['businessId', 'createdAt'])
export class PosOverrideLog extends AbstractBaseEntity {
  @Column({ type: 'uuid' })
  businessId: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ApiProperty({ enum: PosOverrideAction })
  @Column({ type: 'varchar', length: 24 })
  action: PosOverrideAction;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supervisorId' })
  supervisor: User;

  @ApiProperty()
  @Column({ type: 'uuid' })
  supervisorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @ApiProperty()
  @Column({ type: 'uuid' })
  requestedById: string;

  @ApiProperty({ nullable: true, description: 'Sale or ticket it unlocked' })
  @Column({ type: 'uuid', nullable: true })
  referenceId: string | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'varchar', length: 200, nullable: true })
  reason: string | null;
}
