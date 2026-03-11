import { Entity, Column, ManyToOne, OneToMany, JoinColumn, BeforeInsert } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { FormResponse } from './form-response.entity';
import { FormField } from './form-field.entity';
import { generateUniqueCode } from '../../../common/utils/random.util';

@Entity('forms')
export class Form extends AbstractBaseEntity {
  @Column({ unique: true })
  uniqueCode: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: false })
  adminDisabled: boolean;

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
