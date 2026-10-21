import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export const STORE_QR_TYPES = [
  'store',
  'section',
  'product',
  'custom',
] as const;
export type StoreQrType = (typeof STORE_QR_TYPES)[number];

/**
 * A printed store-ordering QR (whole store, a section/table, one product, or a
 * custom placement). Orders placed from it carry `catalogue_orders.storeQrId`.
 */
@Entity('store_qr_codes')
export class StoreQrCode extends AbstractBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  businessId: string;

  @ApiProperty({ example: 'b3f1c2d4-5e6f-4a1b-9c8d-7e6f5a4b3c2d' })
  @Column({ type: 'uuid' })
  branchId: string;

  @ApiProperty({ example: 'SQ7KX2P9' })
  @Index({ unique: true })
  @Column({ length: 20 })
  code: string;

  @ApiProperty({ example: 'Table 04 — Indoor' })
  @Column({ length: 120 })
  name: string;

  @ApiProperty({ enum: STORE_QR_TYPES, example: 'section' })
  @Column({ type: 'varchar', length: 20 })
  type: StoreQrType;

  @ApiProperty({ example: 'Indoor Dining Hall', nullable: true })
  @Column({ type: 'varchar', length: 160, nullable: true })
  targetLabel: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Product id for a product QR',
  })
  @Column({ type: 'uuid', nullable: true })
  targetId: string | null;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ example: 42 })
  @Column({ type: 'int', default: 0 })
  scansCount: number;
}
