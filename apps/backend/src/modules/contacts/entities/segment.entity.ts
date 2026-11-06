import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../businesses/entities/business.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum SegmentType {
  /** Hand-picked members (`segment_users`). */
  STATIC = 'static',
  /** Members computed from `criteria` on every read. */
  DYNAMIC = 'dynamic',
}

@Entity('segments')
export class Segment extends AbstractBaseEntity {
  @ApiProperty({ example: 'VIP Customers' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Highest spending customers', nullable: true })
  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ApiProperty({ example: 'uuid-branch' })
  @Column()
  branchId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'uuid-business' })
  @Column()
  businessId: string;

  @ApiProperty({ enum: SegmentType, example: 'static' })
  @Column({ type: 'varchar', length: 20, default: SegmentType.STATIC })
  type: SegmentType;

  @ApiProperty({
    nullable: true,
    example: {
      recency: { visitedWithinDays: 30 },
      spend: { minAverageTicket: 20000 },
    },
    description: 'Rule set for dynamic segments',
  })
  @Column({ type: 'jsonb', nullable: true })
  criteria: Record<string, unknown> | null;

  @ApiProperty({ example: 436, description: 'Members at `lastComputedAt`' })
  @Column({ type: 'int', default: 0 })
  size: number;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastComputedAt: Date | null;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'segment_users',
    joinColumn: { name: 'segmentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  users: User[];
}
