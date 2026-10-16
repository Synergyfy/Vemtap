import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { PosTillStatus } from './pos-enums';

/**
 * A physical register at a branch. Cashier sessions open on a till, which is
 * what lets the switcher show who is on which register and what it has taken.
 */
@Entity('pos_tills')
@Index(['businessId', 'branchId'])
@Index(['businessId', 'code'], { unique: true, where: '"deletedAt" IS NULL' })
export class PosTill extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ApiProperty()
  @Column({ type: 'uuid' })
  branchId: string;

  @ApiProperty({ example: 'Front Counter' })
  @Column({ type: 'varchar', length: 60 })
  name: string;

  @ApiProperty({ example: 'TILL-01', description: 'Unique per business' })
  @Column({ type: 'varchar', length: 24 })
  code: string;

  @ApiProperty({ enum: PosTillStatus, example: PosTillStatus.IDLE })
  @Column({ type: 'varchar', length: 16, default: PosTillStatus.IDLE })
  status: PosTillStatus;

  @ApiProperty({ example: 'iPad Air · 192.168.1.20', nullable: true })
  @Column({ type: 'varchar', length: 120, nullable: true })
  deviceLabel: string | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date | null;
}
