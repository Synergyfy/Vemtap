import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueOffer } from './catalogue-offer.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../businesses/entities/business.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum DealGiftStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('catalogue_deal_gifts')
@Index(['branchId', 'status'])
@Index(['offerId', 'recipientEmail'])
export class CatalogueDealGift extends AbstractBaseEntity {
  @ApiProperty({ example: 'uuid-of-offer' })
  @Column({ type: 'uuid' })
  @Index()
  offerId: string;

  @ManyToOne(() => CatalogueOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offerId' })
  offer: CatalogueOffer;

  @ApiProperty({ example: 'uuid-of-branch' })
  @Column({ type: 'uuid' })
  @Index()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ApiProperty({ example: 'uuid-of-business' })
  @Column({ type: 'uuid' })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'uuid-of-sender' })
  @Column({ type: 'uuid' })
  @Index()
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ApiProperty({ example: 'Alex Johnson' })
  @Column()
  senderName: string;

  @ApiProperty({ example: 'alex@example.com' })
  @Column()
  senderEmail: string;

  @ApiProperty({ example: '+2348012345678', required: false, nullable: true })
  @Column({ type: 'varchar', nullable: true })
  senderPhone?: string | null;

  @ApiProperty({ example: 'friend@example.com' })
  @Column()
  recipientEmail: string;

  @ApiProperty({ example: 'Sam Taylor', required: false, nullable: true })
  @Column({ type: 'varchar', nullable: true })
  recipientName?: string | null;

  @ApiProperty({ example: '+2348098765432', required: false, nullable: true })
  @Column({ type: 'varchar', nullable: true })
  recipientPhone?: string | null;

  @ApiProperty({ example: 'Hope you enjoy this lunch deal!', required: false, nullable: true })
  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @ApiProperty({
    enum: DealGiftStatus,
    default: DealGiftStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: DealGiftStatus,
    default: DealGiftStatus.PENDING,
  })
  status: DealGiftStatus;

  @ApiProperty({ example: 'uuid-v4-token' })
  @Column({ unique: true })
  @Index()
  token: string;

  @ApiProperty({ example: 'Location too far', required: false, nullable: true })
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  rejectedAt?: Date | null;
}
