import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Device } from '../../devices/entities/device.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('visits')
export class Visit extends AbstractBaseEntity {
  @ManyToOne(() => User, (user) => user.visits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  customerId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ nullable: true })
  businessId: string;

  @ManyToOne(() => Branch, (branch) => branch.visits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  branchId: string;

  @ManyToOne(() => Device, (device) => device.visits, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column({ nullable: true })
  deviceId: string;

  @Column({
    type: 'varchar',
    default: 'new',
  })
  status: 'new' | 'returning';
}
