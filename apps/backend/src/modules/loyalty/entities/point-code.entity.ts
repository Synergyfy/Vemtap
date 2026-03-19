import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('point_codes')
export class PointCode extends AbstractBaseEntity {
  @ApiProperty()
  @Column({ unique: true })
  code: string;

  @ApiProperty()
  @Column()
  points: number;

  @ApiProperty()
  @Column({ default: false })
  isUsed: boolean;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usedById' })
  usedBy: User;

  @Column({ nullable: true })
  usedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;
}
