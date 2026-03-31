import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { CatalogueItem } from './catalogue-item.entity';
import { Reward } from '../../loyalty/entities/reward.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum CatalogueOfferPricingType {
  SUM = 'sum',
  PERCENTAGE_DISCOUNT = 'percentage_discount',
  FIXED_DISCOUNT_PRICE = 'fixed_discount_price',
}

export enum CatalogueOfferStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('catalogue_offers')
export class CatalogueOffer extends AbstractBaseEntity {
  @ApiProperty({ example: 'Summer Deal' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Get 2 burgers and a drink for less!' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 'https://image.com/offer.jpg' })
  @Column({ nullable: true })
  mainImage: string;

  @ApiProperty({ example: ['https://image.com/offer1.jpg'] })
  @Column({ type: 'simple-array', nullable: true })
  galleryImages: string[];

  @ApiProperty({ example: 100, description: 'Stock quantity for this offer' })
  @Column({ type: 'int', nullable: true })
  quantity: number | null;

  @ApiProperty({ enum: CatalogueOfferPricingType })
  @Column({ type: 'enum', enum: CatalogueOfferPricingType, default: CatalogueOfferPricingType.SUM })
  pricingType: CatalogueOfferPricingType;

  @ApiProperty({ example: 10, nullable: true })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  discountValue: number;

  @ApiProperty({ example: 25.0, nullable: true })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  fixedPrice: number;

  @ApiProperty({ example: 22.5 })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  calculatedPrice: number;

  @ApiProperty({ example: 50, nullable: true })
  @Column({ type: 'int', nullable: true })
  loyaltyPoints: number | null;

  @ManyToOne(() => Reward, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rewardId' })
  reward: Reward;

  @Column({ type: 'uuid', nullable: true })
  rewardId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'uuid' })
  branchId: string;

  @ApiProperty({ enum: CatalogueOfferStatus })
  @Column({ type: 'enum', enum: CatalogueOfferStatus, default: CatalogueOfferStatus.ACTIVE })
  status: CatalogueOfferStatus;

  @ManyToMany(() => CatalogueItem)
  @JoinTable({
    name: 'catalogue_offer_items',
    joinColumn: { name: 'offerId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'itemId', referencedColumnName: 'id' },
  })
  items: CatalogueItem[];
}
