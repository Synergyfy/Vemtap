import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Device } from '../../devices/entities/device.entity';
import { Branch } from '../../branches/entities/branch.entity';

export enum BusinessType {
  RESTAURANT = 'RESTAURANT',
  RETAIL = 'RETAIL',
  GYM = 'GYM',
  EVENT = 'EVENT',
  LOGISTICS = 'LOGISTICS',
  BEAUTY_WELLNESS = 'BEAUTY_WELLNESS',
}

export enum BusinessStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

@Entity('businesses')
export class Business extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: BusinessType,
    default: BusinessType.RETAIL,
  })
  type: BusinessType;

  @Column({
    type: 'simple-enum',
    enum: BusinessStatus,
    default: BusinessStatus.PENDING,
  })
  status: BusinessStatus;

  @Column({ nullable: true })
  suspensionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'simple-array', nullable: true })
  documents: string[];

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  monthlyVisitors: string;

  @Column({ nullable: true })
  goal: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  whatsappNumber: string;

  @Column({ nullable: true })
  officialEmail: string;

  @Column({ type: 'text', nullable: true })
  welcomeMessage: string;

  @Column({ type: 'text', nullable: true })
  successMessage: string;

  @Column({ type: 'text', nullable: true })
  privacyMessage: string;

  @Column({ type: 'text', nullable: true })
  rewardMessage: string;

  @Column({ default: false })
  rewardEnabled: boolean;

  @Column({ default: 5 })
  rewardVisitThreshold: number;

  // Relation to the owner
  @OneToOne(() => User, (user) => user.ownedBusiness, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  // Relation to staff members
  @OneToMany(() => User, (user) => user.business)
  staff: User[];

  @OneToMany(() => Device, (device) => device.business)
  devices: Device[];

  @OneToMany(() => Branch, (branch) => branch.business)
  branches: Branch[];
}
