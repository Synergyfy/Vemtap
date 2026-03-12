import { Entity, Column, ManyToOne, OneToMany, JoinColumn, BeforeInsert } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { FormResponse } from './form-response.entity';
import { FormField } from './form-field.entity';
import { generateUniqueCode } from '../../../common/utils/random.util';
import { ApiProperty } from '@nestjs/swagger';

@Entity('forms')
export class Form extends AbstractBaseEntity {
  @ApiProperty({ example: 'ABC123XYZ', description: 'Unique 9-character alphanumeric code for the form' })
  @Column({ unique: true })
  uniqueCode: string;

  @ApiProperty({ example: 'Customer Feedback' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Let us know how your visit went', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isPublished: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  adminDisabled: boolean;

  @ApiProperty({ example: false, description: 'Show form after lead capture' })
  @Column({ default: false })
  showAfterLeadCapture: boolean;

  @ApiProperty({ example: 0, description: 'Total number of responses received' })
  @Column({ default: 0 })
  responseCount: number;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  @OneToMany(() => FormField, (field) => field.form, { cascade: true })
  fields: FormField[];

  @OneToMany(() => FormResponse, (response) => response.form)
  responses: FormResponse[];

  @BeforeInsert()
  generateUniqueCode() {
    if (!this.uniqueCode) {
      this.uniqueCode = generateUniqueCode(9);
    }
  }
}
