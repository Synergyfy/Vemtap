import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { QRType } from '../enums';

@Entity('qr_thrive_code_mappings')
export class QrThriveCodeMapping extends AbstractBaseEntity {
  @Index({ unique: true })
  @Column({ unique: true })
  qrThriveCodeId: string;

  @Index()
  @Column()
  shortId: string;

  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: QRType,
  })
  type: QRType;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ default: 0 })
  clicks: number;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  branchId: string;

  @Column({ nullable: true })
  qrThriveUserId: string;

  @Column({ default: false })
  isFeaturedOnUbl: boolean;
}
