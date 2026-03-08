import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Quote } from './quote.entity';
import { ProductType } from './product-type.entity';

export enum ProductStatus {
  PUBLISHED = 'Published',
  UNPUBLISHED = 'Unpublished',
}

@Entity('products')
export class Product extends AbstractBaseEntity {
  @ApiProperty({ example: 'NFC Card' })
  @Column()
  name: string;

  @ApiProperty({ example: 'High quality NFC card' })
  @Column()
  description: string;

  @ApiProperty({ example: 1000 })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ example: ['https://example.com/image.png'], type: [String] })
  @Column('simple-array')
  images: string[];

  @ApiProperty({
    example: ['https://example.com/video.mp4'],
    type: [String],
    required: false,
  })
  @Column('simple-array', { nullable: true })
  videos: string[];

  @ApiProperty({
    example: { weight: '20g', material: 'Plastic' },
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  technicalSpecifications: Record<string, string>;

  @ApiProperty({ example: true, required: false })
  @Column('boolean', { default: false })
  customBrandedCards: boolean;

  @ApiProperty({ example: 'Hardware' })
  @Column()
  tag: string;

  @ApiProperty({ example: 'bg-blue-500', required: false })
  @Column({ nullable: true })
  tagColor: string;

  @ApiProperty({
    example: '[{"title": "Step 1", "description": "Scan the QR code"}]',
    description: 'Instructions on how to use the product',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  howToUse: { title: string; description: string }[];

  @ApiProperty({ example: 4.5 })
  @Column('float', { default: 5 })
  rating: number;

  @ApiProperty({ example: 50 })
  @Column({ default: 1 })
  moq: number;

  @ApiProperty({
    example: '[{"min": 1, "max": 100, "price": 20000}]',
    description: 'Tiered pricing configuration',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  priceTiers: { min: number; max: number | null; price: number }[];

  @ApiProperty({
    example: 300,
    description: 'Quantity threshold above which a quote is required',
    required: false,
  })
  @Column({ nullable: true })
  requestQuoteThreshold: number;

  @ManyToOne(() => ProductType, (productType) => productType.products, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'productTypeId' })
  productType: ProductType;

  @ApiProperty({ example: 'type-uuid' })
  @Column({ nullable: true })
  productTypeId: string;

  @ApiProperty({ enum: ProductStatus, default: ProductStatus.PUBLISHED })
  @Column({
    type: 'simple-enum',
    enum: ProductStatus,
    default: ProductStatus.PUBLISHED,
  })
  status: ProductStatus;

  @OneToMany(() => Quote, (quote) => quote.product)
  quotes: Quote[];
}
