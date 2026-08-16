import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum TaxType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('subscription_tax_configs')
export class SubscriptionTaxConfig extends AbstractBaseEntity {
  @ApiProperty({ example: 'VAT', description: 'Tax display name/label' })
  @Column({ default: 'VAT' })
  name: string;

  @ApiProperty({
    enum: TaxType,
    example: TaxType.PERCENTAGE,
    description: 'Tax calculation type: percentage or fixed amount',
  })
  @Column({
    type: 'simple-enum',
    enum: TaxType,
    default: TaxType.PERCENTAGE,
  })
  taxType: TaxType;

  @ApiProperty({
    example: 7.5,
    description:
      'Tax rate value (e.g. 7.5 for 7.5% or fixed amount e.g. 500 NGN)',
  })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  rate: number;

  @ApiProperty({
    example: true,
    description: 'Whether this tax is currently enabled and applied at checkout',
  })
  @Column({ default: false })
  isEnabled: boolean;

  @ApiProperty({
    example: true,
    description:
      'Whether this is the current active version row in the database (true for latest, false for historical rows)',
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    example: 'uuid-admin-user',
    description: 'User ID of the admin who made this configuration change',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  changedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changedById' })
  changedBy: User | null;

  @ApiProperty({
    example: 'Updated VAT rate to 7.5% in compliance with statutory policy',
    description: 'Optional note or reason explaining the tax rule update',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  changeReason: string | null;
}
