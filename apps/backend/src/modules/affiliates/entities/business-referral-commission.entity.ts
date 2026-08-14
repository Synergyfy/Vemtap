import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('business_referral_commissions')
export class BusinessReferralCommission extends AbstractBaseEntity {
  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'referringBusinessId' })
  referringBusiness: Business;

  @ApiProperty({ example: 'uuid-string' })
  @Column({ type: 'uuid' })
  referringBusinessId: string;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'referredBusinessId' })
  referredBusiness: Business;

  @ApiProperty({ example: 'uuid-string' })
  @Column({ type: 'uuid' })
  referredBusinessId: string;

  @ApiProperty({ example: 5000 })
  @Column('decimal', { precision: 20, scale: 2 })
  amount: number;

  @ApiProperty({ example: 30 })
  @Column('decimal', { precision: 10, scale: 2 })
  rate: number;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isFirstPayment: boolean;

  @ApiProperty({ example: 'T123456789', description: 'Linked payment reference' })
  @Column({ type: 'varchar', nullable: true })
  paymentReference: string;
}
