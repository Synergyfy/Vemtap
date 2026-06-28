import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum ExternalLeadStatus {
  NEW = 'new',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

@Entity('external_lead_statuses')
export class ExternalLeadStatusEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The ID of the lead from the external system (QR Thrive)',
  })
  @Column({ unique: true })
  @Index()
  externalLeadId: string;

  @ApiProperty({ enum: ExternalLeadStatus, default: ExternalLeadStatus.NEW })
  @Column({
    type: 'enum',
    enum: ExternalLeadStatus,
    default: ExternalLeadStatus.NEW,
  })
  status: ExternalLeadStatus;

  @ApiProperty({ description: 'Internal notes for this lead' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: 'ID of the business this lead belongs to' })
  @Column()
  @Index()
  businessId: string;

  @ApiProperty({ description: 'ID of the branch this lead belongs to' })
  @Column()
  @Index()
  branchId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
