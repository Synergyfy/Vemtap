import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('business_credits')
export class BusinessCredit extends AbstractBaseEntity {
  @OneToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ApiProperty({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @Column()
  branchId: string;

  @ApiProperty({ example: 500 })
  @Column({ type: 'int', default: 0 })
  smsBalance: number;

  @ApiProperty({ example: 1000 })
  @Column({ type: 'int', default: 0 })
  emailBalance: number;

  @ApiProperty({ example: 200 })
  @Column({ type: 'int', default: 0 })
  whatsappBalance: number;
}
