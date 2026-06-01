import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('marketing_audit_logs')
export class MarketingAuditLog extends AbstractBaseEntity {
  @ApiProperty({ example: 'uuid' })
  @Column()
  businessId: string;

  @ApiProperty({ example: 'uuid' })
  @Column()
  userId: string;

  @ApiProperty({ example: 'ASSET_CREATED', description: 'Action performed' })
  @Column()
  action: string;

  @ApiProperty({ example: 'MarketingAsset', description: 'Type of entity affected' })
  @Column()
  entityType: string;

  @ApiProperty({ example: 'uuid' })
  @Column()
  entityId: string;

  @ApiProperty({ description: 'Additional context as JSON', nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  details?: any;

  @ApiProperty({ example: '192.168.1.1', nullable: true })
  @Column({ nullable: true })
  ipAddress?: string;
}
