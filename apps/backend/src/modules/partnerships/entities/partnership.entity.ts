import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum PartnershipStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  DECLINED = 'Declined',
}

@Entity('partnerships')
@Unique(['initiatorBranchId', 'recipientBranchId'])
export class Partnership extends AbstractBaseEntity {
  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the initiator branch',
  })
  @Column({ type: 'uuid' })
  initiatorBranchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'initiatorBranchId' })
  initiatorBranch: Branch;

  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the recipient branch',
  })
  @Column({ type: 'uuid' })
  recipientBranchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientBranchId' })
  recipientBranch: Branch;

  @ApiProperty({ enum: PartnershipStatus, example: PartnershipStatus.PENDING })
  @Column({
    type: 'simple-enum',
    enum: PartnershipStatus,
    default: PartnershipStatus.PENDING,
  })
  status: PartnershipStatus;
}
