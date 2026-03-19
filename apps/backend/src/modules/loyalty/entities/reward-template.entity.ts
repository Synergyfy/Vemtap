import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum RewardCategory {
  CUSTOM_DISCOUNT = 'custom_discount',
  FREE_PRODUCT = 'free_product',
  SERVICE_UPGRADE = 'service_upgrade',
  TANGIBLE_GIFTS = 'tangible_gifts',
}

@Entity('reward_templates')
export class RewardTemplate extends AbstractBaseEntity {
  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @ApiProperty()
  @Column()
  pointsRequired: number;

  @ApiProperty({ enum: RewardCategory })
  @Column({ type: 'simple-enum', enum: RewardCategory })
  category: RewardCategory;

  @ApiProperty()
  @Column({ nullable: true })
  coverImage: string;

  @ApiProperty()
  @Column({ type: 'simple-array', nullable: true })
  galleryImages: string[];

  @ManyToOne(() => User)
  createdBy: User;

  @Column()
  createdById: string;
}
