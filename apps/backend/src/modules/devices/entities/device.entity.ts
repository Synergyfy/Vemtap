import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Visit } from '../../visitors/entities/visit.entity';
import { Order } from '../../products/entities/order.entity';

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('devices')
export class Device extends AbstractBaseEntity {
  @ApiProperty({ example: 'Front Entrance Tag', description: 'Device name' })
  @Column()
  name: string;

  @ApiProperty({ example: 'LT-8829-X', description: 'Unique Serial Code' })
  @Column({ unique: true })
  code: string; // Serial number

  @ApiProperty({
    enum: DeviceStatus,
    example: DeviceStatus.ACTIVE,
    description: 'Current status',
  })
  @Column({
    type: 'simple-enum',
    enum: DeviceStatus,
    default: DeviceStatus.ACTIVE,
  })
  status: DeviceStatus;

  @ApiProperty({ example: 'Main Lobby', description: 'Physical location' })
  @Column({ nullable: true })
  location: string;

  @ApiProperty({ example: 120, description: 'Total number of scans' })
  @Column({ default: 0 })
  totalScans: number;

  @ApiProperty({ example: 'Card', description: 'Form factor of the device' })
  @Column({ default: 'Card' })
  type: string;

  @ApiProperty({ example: 100, description: 'Battery percentage level' })
  @Column({ default: 100 })
  batteryLevel: number;

  @ApiProperty({
    example: '2023-10-27T10:00:00Z',
    description: 'Last active timestamp',
  })
  @Column({ nullable: true })
  lastActive: Date;

  @ManyToOne(() => Business, (business) => business.devices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Business ID',
  })
  @Column({ nullable: true })
  businessId: string;

  @OneToMany(() => Visit, (visit) => visit.device)
  visits: Visit[];

  @ManyToOne(() => Order, (order) => order.devices, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({
    example: 'order-uuid',
    description: 'Order ID the device was generated from',
    required: false,
  })
  @Column({ nullable: true })
  orderId: string;
}
