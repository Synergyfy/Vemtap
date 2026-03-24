import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Channel } from '../enums/channel.enum';
import { CreditTransactionType } from '../enums/credit-transaction-type.enum';

@Entity('credit_transactions')
export class CreditTransaction extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @Column()
  businessId: string;

  @ApiProperty({ example: Channel.SMS, enum: Channel })
  @Column({ type: 'enum', enum: Channel })
  channel: Channel;

  @ApiProperty({
    example: CreditTransactionType.MESSAGE_DEDUCTION,
    enum: CreditTransactionType,
  })
  @Column({ type: 'enum', enum: CreditTransactionType })
  transactionType: CreditTransactionType;

  @ApiProperty({ example: 10 })
  @Column({ type: 'int' })
  credits: number;

  @ApiProperty({ example: 'Message to +2348000000000' })
  @Column({ nullable: true })
  reference: string;
}
