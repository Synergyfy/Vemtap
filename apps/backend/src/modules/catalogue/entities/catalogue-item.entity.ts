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
import { CatalogueCategory } from './catalogue-category.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum CatalogueItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  SUSPENDED = 'suspended',
}

@Entity('catalogue_items')
export class CatalogueItem extends AbstractBaseEntity {
  @ApiProperty({ example: 'Cheeseburger' })
  @Column()
  name: string;

  @ApiProperty({ example: 15.99 })
  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  } })
  price: number;

  @ApiProperty({ example: 'Delicious cheeseburger with bacon' })
  @Column({ type: 'text' })
  shortDescription: string;

  @ApiProperty({ example: 'Full description of the cheeseburger...' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 'https://image.com/main.jpg' })
  @Column()
  mainImage: string;

  @ApiProperty({
    example: ['https://image.com/1.jpg', 'https://image.com/2.jpg'],
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  galleryImages: string[];

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

  @ApiProperty({ example: 'CB-001', nullable: true })
  @Column({ nullable: true })
  sku: string;

  @ApiProperty({ example: 50, nullable: true })
  @Column({ type: 'int', nullable: true })
  stockQuantity: number;

  @ApiProperty({ example: true })
  @Column({ default: true })
  allowBackOrder: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isSuspended: boolean;

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
