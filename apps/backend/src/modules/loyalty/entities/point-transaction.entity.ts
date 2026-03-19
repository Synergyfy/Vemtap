import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum PointTransactionType {
  EARNED = 'earned',
  REDEEMED = 'redeemed',
}

@Entity('point_transactions')
export class PointTransaction extends AbstractBaseEntity {
  @ApiProperty()
  @Column()
  amount: number;

  @ApiProperty({ enum: PointTransactionType })
  @Column({ type: 'simple-enum', enum: PointTransactionType })
  type: PointTransactionType;

  @ApiProperty()
  @Column({ nullable: true })
  reason: string;

  @ApiProperty()
  @Column({ nullable: true })
  referenceCode: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'givenById' })
  givenBy: User;

  @Column()
  givenById: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  branchId: string;
}
