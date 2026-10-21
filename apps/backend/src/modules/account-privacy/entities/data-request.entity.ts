import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export enum DataRequestType {
  EXPORT = 'export',
  RECTIFICATION = 'rectification',
}

export enum DataRequestStatus {
  OPEN = 'open',
  COMPLETED = 'completed',
}

/**
 * An NDPR data-subject request made from the account settings: a data export
 * (completed at once) or a rectification request (open until the DPO closes it).
 */
@Entity('data_requests')
export class DataRequest extends AbstractBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  businessId: string | null;

  @ApiProperty({ enum: DataRequestType })
  @Column({ type: 'varchar', length: 20 })
  type: DataRequestType;

  @ApiProperty({ enum: DataRequestStatus })
  @Column({ type: 'varchar', length: 20 })
  status: DataRequestStatus;

  @ApiProperty({ example: 'DR-7KX2P9Q4' })
  @Column({ length: 20 })
  reference: string;

  @ApiProperty({
    example: 'My business phone number is wrong on invoices.',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  details: string | null;

  /** Deadline the NDPR gives for answering (72 hours from the request). */
  @ApiProperty()
  @Column({ type: 'timestamp' })
  dueAt: Date;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;
}
