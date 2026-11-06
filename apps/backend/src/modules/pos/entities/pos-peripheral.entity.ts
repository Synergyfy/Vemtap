import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { PosTill } from './pos-till.entity';
import {
  PosPeripheralConnection,
  PosPeripheralStatus,
  PosPeripheralType,
} from './pos-enums';

/**
 * A configured device (card terminal, printer, drawer, scanner, display).
 * Configuration only: the app drives the hardware and reports heartbeats.
 */
@Entity('pos_peripherals')
@Index(['businessId', 'branchId'])
export class PosPeripheral extends AbstractBaseEntity {
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

  @ManyToOne(() => PosTill, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tillId' })
  till: PosTill | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  tillId: string | null;

  @ApiProperty({ enum: PosPeripheralType })
  @Column({ type: 'varchar', length: 24 })
  type: PosPeripheralType;

  @ApiProperty({ example: 'Kitchen printer' })
  @Column({ type: 'varchar', length: 60 })
  name: string;

  @ApiProperty({ example: 'Epson TM-T20III', nullable: true })
  @Column({ type: 'varchar', length: 60, nullable: true })
  model: string | null;

  @ApiProperty({ enum: PosPeripheralConnection })
  @Column({ type: 'varchar', length: 16 })
  connection: PosPeripheralConnection;

  @ApiProperty({ example: '192.168.1.40', nullable: true })
  @Column({ type: 'varchar', length: 120, nullable: true })
  address: string | null;

  @ApiProperty({
    enum: PosPeripheralStatus,
    example: PosPeripheralStatus.DISCONNECTED,
  })
  @Column({
    type: 'varchar',
    length: 16,
    default: PosPeripheralStatus.DISCONNECTED,
  })
  status: PosPeripheralStatus;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date | null;
}
