import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { StockCountItem } from './stock-count-item.entity';

export enum CountSessionStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('stock_count_sessions')
export class StockCountSession extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  @Index()
  businessId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'uuid' })
  @Index()
  branchId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'startedById' })
  startedBy: User;

  @Column({ type: 'uuid', nullable: true })
  startedById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'completedById' })
  completedBy: User;

  @Column({ type: 'uuid', nullable: true })
  completedById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ type: 'uuid', nullable: true })
  approvedById: string;

  @ApiProperty({ enum: CountSessionStatus, example: CountSessionStatus.DRAFT })
  @Column({
    type: 'enum',
    enum: CountSessionStatus,
    default: CountSessionStatus.DRAFT,
  })
  @Index()
  status: CountSessionStatus;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isBlind: boolean;

  @ApiProperty({ example: '2' })
  @Column({ type: 'varchar', nullable: true })
  zone: string;

  @ApiProperty({ example: 'Q4 shelf count' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @ApiProperty({ example: 'Some items had discrepancies' })
  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @OneToMany(() => StockCountItem, (item) => item.session, { cascade: true })
  items: StockCountItem[];

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  totalItems: number;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  countedItems: number;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  itemsWithVariance: number;

  @ApiProperty({ example: 0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  totalVarianceValue: number;
}
