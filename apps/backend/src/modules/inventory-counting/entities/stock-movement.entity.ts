import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export enum StockMovementType {
  RECEIVE = 'receive',
  ADJUST = 'adjust',
  TRANSFER = 'transfer',
  SALE = 'sale',
  RETURN = 'return',
  COUNT_VARIANCE = 'count_variance',
}

@Entity('stock_movements')
@Index(['businessId', 'branchId', 'createdAt'])
export class StockMovement extends AbstractBaseEntity {
  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @Column({ type: 'int' })
  quantityChange: number;

  @Column({ type: 'int' })
  previousQuantity: number;

  @Column({ type: 'int' })
  newQuantity: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', nullable: true })
  referenceId: string | null;
}
