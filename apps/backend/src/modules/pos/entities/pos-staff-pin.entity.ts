import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { User } from '../../users/entities/user.entity';

/** A staff member's POS passcode at one business. Only the hash is stored. */
@Entity('pos_staff_pins')
@Index(['businessId', 'userId'], { unique: true, where: '"deletedAt" IS NULL' })
export class PosStaffPin extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @Exclude()
  @Column({ type: 'varchar', length: 100 })
  pinHash: string;

  @ApiProperty({ example: true })
  @Column({ default: false })
  isSupervisor: boolean;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  failedAttempts: number;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date | null;
}
