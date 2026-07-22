import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { CatalogueOffer } from './catalogue-offer.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum CatalogueOfferClaimStatus {
  CLAIMED = 'claimed',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
}

@Entity('catalogue_offer_claims')
export class CatalogueOfferClaim extends AbstractBaseEntity {
  @ApiProperty({ example: 'uuid-of-offer' })
  @Column({ type: 'uuid' })
  offerId: string;

  @ManyToOne(() => CatalogueOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offerId' })
  offer: CatalogueOffer;

  @ApiProperty({ example: 'Chidi' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Okonkwo', required: false })
  @Column({ nullable: true })
  lastName: string;

  @ApiProperty({ example: 'chidi@example.com' })
  @Column()
  email: string;

  @ApiProperty({ example: '+2348012345678' })
  @Column()
  phone: string;

  @ApiProperty({ example: 'VEM-BR123XYZ9-A2B3' })
  @Column({ unique: true })
  @Index()
  claimCode: string;

  @ApiProperty({ enum: CatalogueOfferClaimStatus, default: CatalogueOfferClaimStatus.CLAIMED })
  @Column({
    type: 'enum',
    enum: CatalogueOfferClaimStatus,
    default: CatalogueOfferClaimStatus.CLAIMED,
  })
  status: CatalogueOfferClaimStatus;

  @ApiProperty({ example: '2026-07-07T10:00:00.000Z' })
  @Column({ type: 'timestamp' })
  expiresAt: Date;
}
