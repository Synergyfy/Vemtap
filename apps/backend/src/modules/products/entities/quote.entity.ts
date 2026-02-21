import { Entity, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from './product.entity';
import { QuoteNegotiation } from './quote-negotiation.entity';
import { Order } from './order.entity';
import { OneToMany, OneToOne } from 'typeorm';

export enum QuoteStatus {
  PENDING = 'Pending',
  ADMIN_OFFERED = 'Admin_Offered',
  OWNER_OFFERED = 'Owner_Offered',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  PROCESSED = 'Processed',
}

@Entity('quotes')
export class Quote extends AbstractBaseEntity {
  @ApiProperty({ example: 100 })
  @Column()
  quantity: number;

  @ApiProperty({ example: 'Lagos, Nigeria' })
  @Column()
  location: string;

  @ApiProperty({ example: 'My Company Ltd' })
  @Column()
  businessName: string;

  @ApiProperty({ example: 'I need it asap' })
  @Column()
  notes: string;

  @ApiProperty({ enum: QuoteStatus, default: QuoteStatus.PENDING })
  @Column({
    type: 'simple-enum',
    enum: QuoteStatus,
    default: QuoteStatus.PENDING,
  })
  status: QuoteStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  user: User;

  @ApiProperty({ example: 'user-uuid' })
  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Product, (product) => product.quotes, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @ApiProperty({ example: 'product-uuid' })
  @Column()
  productId: string;

  @ApiProperty({ example: 900 })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  currentPrice: number;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isNegotiable: boolean;

  @OneToMany(() => QuoteNegotiation, (negotiation) => negotiation.quote)
  negotiations: QuoteNegotiation[];

  @OneToOne(() => Order, (order) => order.quote)
  order: Order;
}
