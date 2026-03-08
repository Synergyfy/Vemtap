import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { FormFieldTemplate } from './form-field-template.entity';

@Entity('form_templates')
export class FormTemplate extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => FormFieldTemplate, (field) => field.template, {
    cascade: true,
  })
  fields: FormFieldTemplate[];
}
