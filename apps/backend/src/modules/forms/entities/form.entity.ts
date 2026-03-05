import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { FormResponse } from './form-response.entity';
import { FormField } from './form-field.entity';

@Entity('forms')
export class Form extends AbstractBaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublished: boolean;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  // Optional: If mapped to a specific branch
  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @OneToMany(() => FormField, (field) => field.form, { cascade: true })
  fields: FormField[];

  @OneToMany(() => FormResponse, (response) => response.form)
  responses: FormResponse[];
}
