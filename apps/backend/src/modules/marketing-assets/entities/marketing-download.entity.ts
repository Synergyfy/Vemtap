import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { MarketingAsset } from './marketing-asset.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('marketing_downloads')
export class MarketingDownload extends AbstractBaseEntity {
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

  @ApiProperty({
    example: 'pdf',
    description: 'File format of download (pdf, png, svg)',
  })
  @Column()
  format: string;

  @ApiProperty({ example: '2026-06-01T14:00:00Z' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  downloadedAt: Date;
}
