import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { MarketingTemplate } from './marketing-template.entity';

@Entity('marketing_assets')
export class MarketingAsset extends AbstractBaseEntity {
  @ApiProperty({ example: 'Summer BBQ Table Tent' })
  @Column()
  name: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'uuid' })
  @Column()
  businessId: string;

  @ManyToOne(() => Branch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ApiProperty({ example: 'uuid', nullable: true })
  @Column({ nullable: true })
  branchId: string;

  @ManyToOne(() => MarketingTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'templateId' })
  template: MarketingTemplate;

  @ApiProperty({ example: 'uuid', nullable: true })
  @Column({ nullable: true })
  templateId: string;

  @ApiProperty({ example: 'table_tent' })
  @Column()
  type: string;

  @ApiProperty({
    description: 'Asset specific customized variables, layout overrides',
  })
  @Column({ type: 'jsonb' })
  customConfig: any;

  @ApiProperty({ example: 'https://vemtap.com/r/table-4' })
  @Column()
  qrCodeContent: string;

  @ApiProperty({ description: 'QR Code display styles custom to this asset' })
  @Column({ type: 'jsonb', nullable: true })
  qrCodeConfig: any;

  @ApiProperty({
    example: 'https://cdn.vemtap.com/assets/my-table-tent.png',
    nullable: true,
  })
  @Column({ nullable: true })
  thumbnailUrl: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;
}
