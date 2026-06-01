import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { MarketingAsset } from './marketing-asset.entity';
import { User } from '../../users/entities/user.entity';

@Entity('marketing_asset_versions')
export class MarketingAssetVersion extends AbstractBaseEntity {
  @ManyToOne(() => MarketingAsset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: MarketingAsset;

  @ApiProperty({ example: 'uuid' })
  @Column()
  assetId: string;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  version: number;

  @ApiProperty({ description: 'The customConfig state at this version' })
  @Column({ type: 'jsonb' })
  customConfig: any;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ApiProperty({ example: 'uuid', nullable: true })
  @Column({ nullable: true })
  createdById: string;
}
