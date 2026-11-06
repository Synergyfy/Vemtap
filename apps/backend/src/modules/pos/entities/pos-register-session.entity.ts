import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { RegisterSessionStatus } from './pos-enums';
import { PosTill } from './pos-till.entity';

@Entity('pos_register_sessions')
@Index(['businessId', 'cashierId'])
@Index(['tillId', 'status'])
export class PosRegisterSession extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'uuid' })
  branchId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cashierId' })
  cashier: User;

  @Column({ type: 'uuid' })
  cashierId: string;

  /** The till this shift runs on. Null for sessions opened without one. */
  @ManyToOne(() => PosTill, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tillId' })
  till: PosTill | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  tillId: string | null;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  openedAt: Date;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @ApiProperty({ example: 50000 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  openingCash: number;

  @ApiProperty({ example: 0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  expectedCash: number;

  @ApiProperty({ example: 0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  totalSales: number;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  transactionCount: number;

  @ApiProperty({
    enum: RegisterSessionStatus,
    default: RegisterSessionStatus.OPEN,
  })
  @Column({
    type: 'enum',
    enum: RegisterSessionStatus,
    default: RegisterSessionStatus.OPEN,
  })
  status: RegisterSessionStatus;

  /**
   * Physical cash counted out of the drawer at close, and how far that landed
   * from `expectedCash` (counted minus expected, so negative is a shortfall).
   *
   * Both nullable: a shift closed without reading the till was never
   * reconciled, and a default of 0 would report a perfectly balanced drawer
   * that nobody counted.
   */
  @ApiProperty({ example: 342850, nullable: true })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  countedCash: number | null;

  @ApiProperty({ example: 0, nullable: true })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  variance: number | null;
}
