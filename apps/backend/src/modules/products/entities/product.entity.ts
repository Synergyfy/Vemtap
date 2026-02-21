import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Quote } from './quote.entity';

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

  @ApiProperty({ example: 'https://example.com/image.png' })
  @Column()
  image: string;

  @ApiProperty({ example: 'Hardware' })
  @Column()
  tag: string;

  @ApiProperty({ example: 'bg-blue-500', required: false })
  @Column({ nullable: true })
  tagColor: string;

  @ApiProperty({ example: 4.5 })
  @Column('float', { default: 5 })
  rating: number;

  @ApiProperty({ example: 50 })
  @Column({ default: 1 })
  moq: number;

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
