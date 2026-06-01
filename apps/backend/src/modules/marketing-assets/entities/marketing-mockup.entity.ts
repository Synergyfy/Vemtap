import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('marketing_mockups')
export class MarketingMockup extends AbstractBaseEntity {
  @ApiProperty({ example: 'Wooden Table Stand Mockup' })
  @Column()
  name: string;

  @ApiProperty({ example: 'table_tent', description: 'Compatible asset type' })
  @Column()
  type: string;

  @ApiProperty({ example: 'https://cdn.vemtap.com/mockups/wooden-table.png' })
  @Column()
  imageUrl: string;

  @ApiProperty({ description: 'Overlay details (x, y, width, height, rotateX, rotateY, perspective) for dynamic preview scaling/skewing' })
  @Column({ type: 'jsonb' })
  overlayConfig: any;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;
}
