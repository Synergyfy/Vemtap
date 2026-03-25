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

  @ManyToMany(() => User)
  @JoinTable({
    name: 'segment_users',
    joinColumn: { name: 'segmentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  users: User[];
}
