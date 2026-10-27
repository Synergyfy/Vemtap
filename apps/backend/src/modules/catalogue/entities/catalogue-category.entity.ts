import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { CatalogueItem } from './catalogue-item.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('catalogue_categories')
export class CatalogueCategory extends AbstractBaseEntity {
  @ApiProperty({ example: 'Food' })
  @Column()
  name: string;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ example: 'product', enum: ['product', 'service'] })
  @Column({ type: 'varchar', length: 20, default: 'product' })
  kind: 'product' | 'service';

  @ApiProperty({ example: 'Flame-grilled mains', nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'restaurant', nullable: true })
  @Column({ type: 'varchar', length: 60, nullable: true })
  icon: string | null;

  @ApiProperty({
    example: 'https://cdn.example.com/grills.jpg',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 1000, nullable: true })
  imageUrl: string | null;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @OneToMany(() => CatalogueItem, (item: CatalogueItem) => item.category)
  items: CatalogueItem[];
}
