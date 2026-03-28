import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Device } from '../../devices/entities/device.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { CatalogueOrder } from '../../catalogue-orders/entities/catalogue-order.entity';

@Entity('visits')
export class Visit extends AbstractBaseEntity {
  @ManyToOne(() => User, (user) => user.visits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  customerId: string;

  @ManyToOne(() => Branch, (branch) => branch.visits, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

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

  @OneToOne(() => CatalogueOrder, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order: CatalogueOrder;

  @Column({ type: 'uuid', nullable: true })
  orderId: string;
}
