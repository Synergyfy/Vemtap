import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('business_credit_wallets')
export class BusinessCreditWallet extends AbstractBaseEntity {
  @OneToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @Column()
  businessId: string;

  @ApiProperty({ example: 1000 })
  @Column({ type: 'int', default: 0 })
  smsCredits: number;

  @ApiProperty({ example: 3000 })
  @Column({ type: 'int', default: 0 })
  emailCredits: number;

  @ApiProperty({ example: 500 })
  @Column({ type: 'int', default: 0 })
  whatsappCredits: number;
}
