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
import { User } from '../../users/entities/user.entity';
import { Device } from '../../devices/entities/device.entity';

export enum OrderStatus {
  PENDING = 'Pending',
  READY = 'Ready',
  COMPLETED = 'Completed', // Optional mapping
}

@Entity('orders')
export class Order extends AbstractBaseEntity {
  @OneToOne(() => Quote, (quote) => quote.order, { onDelete: 'RESTRICT' })
  @JoinColumn()
  quote: Quote;

  @ApiProperty({ example: 'quote-uuid' })
  @Column()
  quoteId: string;

  @ApiProperty({ example: 900 })
  @Column('decimal', { precision: 10, scale: 2 })
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
