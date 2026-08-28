import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
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
  @Column({
    type: 'enum',
    enum: CatalogueOfferPricingType,
    default: CatalogueOfferPricingType.SUM,
  })
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
  @Column({
    type: 'enum',
    enum: CatalogueOfferStatus,
    default: CatalogueOfferStatus.ACTIVE,
  })
  status: CatalogueOfferStatus;

  @ApiProperty({
    example: '2026-06-01T00:00:00.000Z',
    description: 'Promotion start date',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date | null;

  @ApiProperty({
    example: '2026-06-30T23:59:59.000Z',
    description: 'Promotion end date',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @ApiProperty({
    example: 'discount',
    description: 'Type of promotion offer',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  offerType: string | null;

  @ApiProperty({
    example: 'everyone_nearby',
    description: 'Target audience for promotion',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  audience: string | null;

  @ApiProperty({
    example: [
      'Valid during business hours',
      'Cannot be combined with other offers',
    ],
    description: 'Custom terms and conditions for the offer',
    nullable: true,
  })
  @Column({ type: 'simple-json', nullable: true })
  terms: string[] | null;

  @ApiProperty({
    example: 'VEM',
    description: 'Custom prefix for generated claim codes',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true, length: 20 })
  claimCodePrefix: string | null;

  @ApiProperty({
    example: 1,
    description:
      'Maximum number of times a single customer can claim this offer',
    nullable: true,
  })
  @Column({ type: 'int', nullable: true, default: 1 })
  maxClaimsPerCustomer: number | null;

  @ApiProperty({
    example: 'all',
    description: 'Target audience: all, new_customers, or returning_customers',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true, default: 'all' })
  audienceTarget: string | null;

  @ApiProperty({
    example: 'same_area',
    description:
      'Delivery scope: same_area, city_wide, state_wide, nation_wide, custom_distance',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  deliveryScope: string | null;

  @ApiProperty({
    example: 10,
    description: 'Delivery radius in specified unit (1–50)',
    nullable: true,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v: number | null) => v,
      from: (v: string | null) => (v != null ? parseFloat(v) : null),
    },
  })
  deliveryRadius: number | null;

  @ApiProperty({
    example: 'km',
    description: 'Delivery radius unit (km or mi)',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  deliveryUnit: string | null;

  @ApiProperty({
    example: 'Lagos State',
    description: 'Delivery region auto-filled from branch location',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  deliveryRegion: string | null;

  @ApiProperty({
    example: 50.0,
    description: 'Minimum order amount for free delivery offers',
    nullable: true,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v: number | null) => v,
      from: (v: string | null) => (v != null ? parseFloat(v) : null),
    },
  })
  minOrderAmount: number | null;

  @ApiProperty({
    example: 'Detailed description with terms and item information',
    description: 'Extended detailed description for offer details',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  longDescription: string | null;

  @ApiProperty({
    example: 120,
    description: 'Number of times this offer was viewed',
  })
  @Column({ type: 'int', default: 0 })
  views: number;

  @ApiProperty({
    example: 45,
    description: 'Number of times this offer was redeemed/visited',
  })
  @Column({ type: 'int', default: 0 })
  visits: number;

  @ApiProperty({
    example: 12500.5,
    description: 'Revenue generated from this offer',
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  revenue: number;

  @ApiProperty({
    example: 12,
    description: 'Number of likes on this deal',
  })
  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @ApiProperty({
    example: 2,
    description: 'Number of dislikes on this deal',
  })
  @Column({ type: 'int', default: 0 })
  dislikesCount: number;

  @ApiProperty({
    example: 37,
    description: 'Number of approved reviews on this deal',
  })
  @Column({ type: 'int', default: 0 })
  reviewsCount: number;

  @ManyToMany(() => CatalogueItem)
  @JoinTable({
    name: 'catalogue_offer_items',
    joinColumn: { name: 'offerId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'itemId', referencedColumnName: 'id' },
  })
  items: CatalogueItem[];
}
