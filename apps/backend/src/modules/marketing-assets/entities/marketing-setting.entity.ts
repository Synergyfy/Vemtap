import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('marketing_settings')
export class MarketingSetting extends AbstractBaseEntity {
  @ApiProperty({ example: 'ai_daily_limit', description: 'Unique setting key' })
  @Column({ unique: true })
  key: string;

  @ApiProperty({ example: '50', description: 'Setting value stored as text' })
  @Column({ type: 'text' })
  value: string;

  @ApiProperty({ example: 'number', nullable: true })
  @Column({ nullable: true })
  type?: string;

  @ApiProperty({ example: 'Daily AI generation limit per business', nullable: true })
  @Column({ nullable: true })
  description?: string;
}
