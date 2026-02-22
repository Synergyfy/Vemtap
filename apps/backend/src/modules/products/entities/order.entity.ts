import {
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Quote } from './quote.entity';
import { Product } from './product.entity';
import { User } from '../../users/entities/user.entity';
import { Device } from '../../devices/entities/device.entity';

export enum OrderStatus {
  PENDING = 'Pending',
  READY = 'Ready',
  COMPLETED = 'Completed', // Optional mapping
}

@Entity('orders')
export class Order extends AbstractBaseEntity {
  @OneToOne(() => Quote, (quote) => quote.order, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn()
  quote: Quote;

  @ApiProperty({ example: 'quote-uuid', required: false })
  @Column({ nullable: true })
  quoteId: string;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  product: Product;

  @ApiProperty({ example: 'product-uuid' })
  @Column({ nullable: true })
  productId: string;

  @ApiProperty({ example: 100 })
  @Column({ nullable: true })
  quantity: number;

  @ApiProperty({ example: 20000 })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  unitPrice: number;

  @ApiProperty({ example: 2000000 })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalPrice: number;

  @ApiProperty({ example: 900, description: 'Price agreed from quote' })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  agreedPrice: number;

  @ApiProperty({ enum: OrderStatus, default: OrderStatus.PENDING })
  @Column({
    type: 'simple-enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @OneToMany(() => Device, (device) => device.order)
  devices: Device[];
}
