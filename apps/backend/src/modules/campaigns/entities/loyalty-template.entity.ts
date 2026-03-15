import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('loyalty_templates')
export class LoyaltyTemplate extends AbstractBaseEntity {
  @ApiProperty({ example: 'Cafe Welcome Boost' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Great for cafés and casual dining.' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: 'JSON structure of loyalty rules' })
  @Column({ type: 'jsonb' })
  rules: any;

  @ApiProperty({ description: 'JSON structure of rewards to create' })
  @Column({ type: 'jsonb' })
  rewards: any[];

  @Column({ default: 'published' })
  status: string;
}
