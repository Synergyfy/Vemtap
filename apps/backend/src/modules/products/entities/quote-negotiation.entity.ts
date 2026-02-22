import { Entity, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Quote } from './quote.entity';
import { User } from '../../users/entities/user.entity';

export enum OfferedByRole {
  ADMIN = 'Admin',
  OWNER = 'Owner',
}

@Entity('quote_negotiations')
export class QuoteNegotiation extends AbstractBaseEntity {
  @ManyToOne(() => Quote, (quote) => quote.negotiations, {
    onDelete: 'CASCADE',
  })
  quote: Quote;

  @ApiProperty({ example: 'quote-uuid' })
  @Column()
  quoteId: string;

  @ApiProperty({ example: 900 })
  @Column('decimal', { precision: 10, scale: 2 })
  priceOffered: number;

  @ApiProperty({ example: 'Can we do 900?' })
  @Column({ nullable: true })
  message: string;

  @ApiProperty({ enum: OfferedByRole })
  @Column({ type: 'simple-enum', enum: OfferedByRole })
  offeredBy: OfferedByRole;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  user: User;

  @Column({ nullable: true })
  userId: string;
}
