import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { MarketingAsset } from './marketing-asset.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('marketing_analytics')
export class MarketingAnalytics extends AbstractBaseEntity {
  @ManyToOne(() => MarketingAsset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: MarketingAsset;

  @ApiProperty({ example: 'uuid' })
  @Column()
  assetId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'uuid' })
  @Column()
  businessId: string;

  @ApiProperty({ example: 42 })
  @Column({ type: 'int', default: 0 })
  scansCount: number;

  @ApiProperty({ example: 120 })
  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @ApiProperty({ example: '2026-06-01' })
  @Column({ type: 'date' })
  date: Date;
}
