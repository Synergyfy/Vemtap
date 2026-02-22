import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { Device } from '../../devices/entities/device.entity';

@Entity('product_types')
export class ProductType extends AbstractBaseEntity {
  @ApiProperty({ example: 'NFC Card' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ example: 'Standard plastic NFC card' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ example: 'nfc-card' })
  @Column({ unique: true })
  slug: string;

  @OneToMany(() => Product, (product) => product.productType)
  products: Product[];

  @OneToMany(() => Device, (device) => device.productType)
  devices: Device[];
}
