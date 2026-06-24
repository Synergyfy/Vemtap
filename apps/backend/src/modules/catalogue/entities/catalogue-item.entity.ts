import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { CatalogueCategory } from './catalogue-category.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum CatalogueItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  SUSPENDED = 'suspended',
  LOW_STOCK = 'low_stock',
  ARCHIVED = 'archived',
}

export enum CatalogueItemType {
  PRODUCT = 'product',
  SERVICE = 'service',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  NONE = 'none',
}

@Entity('catalogue_items')
export class CatalogueItem extends AbstractBaseEntity {
  @ApiProperty({ example: 'Cheeseburger' })
  @Column()
  name: string;

  @ApiProperty({ example: 15.99 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  @ApiProperty({ example: 'Delicious cheeseburger with bacon' })
  @Column({ type: 'text' })
  shortDescription: string;

  @ApiProperty({ example: 'Full description of the cheeseburger...' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 'https://image.com/main.jpg', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  mainImage?: string | null;

  @ApiProperty({
    example: ['https://image.com/1.jpg', 'https://image.com/2.jpg'],
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  galleryImages?: string[] | null;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => CatalogueCategory, (category) => category.items, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category: CatalogueCategory;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @ApiProperty({
    enum: CatalogueItemStatus,
    example: CatalogueItemStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: CatalogueItemStatus,
    default: CatalogueItemStatus.ACTIVE,
  })
  status: CatalogueItemStatus;

  @ApiProperty({
    enum: CatalogueItemType,
    example: CatalogueItemType.PRODUCT,
  })
  @Column({
    type: 'enum',
    enum: CatalogueItemType,
    default: CatalogueItemType.PRODUCT,
  })
  itemType: CatalogueItemType;

  @ApiProperty({ example: 'CB-001', nullable: true })
  @Column({ nullable: true, unique: true })
  sku: string;

  @ApiProperty({
    enum: DiscountType,
    example: DiscountType.NONE,
  })
  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.NONE,
  })
  discountType: DiscountType;

  @ApiProperty({ example: 10, nullable: true })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : null),
    },
  })
  discountValue: number | null;

  @ApiProperty({ example: 50, nullable: true })
  @Column({ type: 'int', nullable: true })
  stockQuantity: number;

  @ApiProperty({ example: 'VMT0001', nullable: true })
  @Column({ nullable: true })
  @Index()
  barcode: string;

  @ApiProperty({ example: 500, nullable: true })
  @Column({
    type: 'decimal', precision: 12, scale: 2, nullable: true,
    transformer: { to: (v: number) => v, from: (v: string) => (v ? parseFloat(v) : null) },
  })
  costPrice: number | null;

  @ApiProperty({ example: 10, nullable: true })
  @Column({ type: 'int', nullable: true })
  minStock: number | null;

  @ApiProperty({ example: 'House Made', nullable: true })
  @Column({ nullable: true })
  brand: string;

  @ApiProperty({ example: [{ type: 'size', value: 'large' }], nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  variants: { type: string; value: string }[];

  @ApiProperty({ example: ['burger', 'beef'], nullable: true })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ApiProperty({ example: true })
  @Column({ default: true })
  allowBackOrder: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isSuspended: boolean;

  @ApiProperty({ example: 10, nullable: true })
  @Column({ type: 'int', nullable: true })
  loyaltyPoints: number | null;

  @ApiProperty({ example: 'Policy violation', nullable: true })
  @Column({ type: 'text', nullable: true })
  suspensionNote: string | null;

  @ManyToMany(() => Branch, { cascade: true })
  @JoinTable({
    name: 'catalogue_item_branches',
    joinColumn: { name: 'itemId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'branchId', referencedColumnName: 'id' },
  })
  branches: Branch[];
}
