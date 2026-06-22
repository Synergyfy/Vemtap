import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { StockCountSession } from './stock-count-session.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('stock_count_items')
export class StockCountItem extends AbstractBaseEntity {
  @ManyToOne(() => StockCountSession, (session) => session.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session: StockCountSession;

  @Column({ type: 'uuid' })
  @Index()
  sessionId: string;

  @Column({ type: 'uuid' })
  @Index()
  itemId: string;

  @ApiProperty({ example: 'Cheeseburger' })
  @Column()
  itemName: string;

  @ApiProperty({ example: 'CB-001', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  itemSku: string | null;

  @ApiProperty({ example: 'burger', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  itemCategory: string | null;

  @ApiProperty({ example: '4901234567890', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  itemBarcode: string | null;

  @ApiProperty({ example: 50 })
  @Column({ type: 'int', nullable: true })
  systemQuantity: number | null;

  @ApiProperty({ example: 48, nullable: true })
  @Column({ type: 'int', nullable: true })
  countedQuantity: number | null;

  @ApiProperty({ example: -2, nullable: true })
  @Column({ type: 'int', nullable: true })
  variance: number | null;

  @ApiProperty({ example: -6000, nullable: true })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value ? parseFloat(value) : null),
    },
  })
  varianceValue: number | null;

  @ApiProperty({ example: 1500, nullable: true })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value ? parseFloat(value) : null),
    },
  })
  unitCost: number | null;

  @ApiProperty({ example: 'Found 2 missing', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
