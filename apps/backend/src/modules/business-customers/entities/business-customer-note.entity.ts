import { Column, Entity, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

/**
 * A business's private note and tags on one of its customers. One row per
 * business and customer; staff edit it from the customer dossier.
 */
@Entity('business_customer_notes')
@Index(['businessId', 'userId'], { unique: true, where: '"deletedAt" IS NULL' })
export class BusinessCustomerNote extends AbstractBaseEntity {
  @Column({ type: 'uuid' })
  businessId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'Prefers the patio. Medium-rare.' })
  @Column({ type: 'text', default: '' })
  note: string;

  @ApiProperty({ type: [String], example: ['vip', 'wine'] })
  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags: string[];

  @ApiPropertyOptional()
  @Column({ type: 'uuid', nullable: true })
  updatedById: string | null;
}
