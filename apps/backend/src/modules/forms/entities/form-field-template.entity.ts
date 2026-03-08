import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { FormTemplate } from './form-template.entity';
import { FormFieldType } from './form-field.entity';

@Entity('form_field_templates')
export class FormFieldTemplate extends AbstractBaseEntity {
  @ManyToOne(() => FormTemplate, (template) => template.fields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'templateId' })
  template: FormTemplate;

  @Column()
  templateId: string;

  @Column({
    type: 'simple-enum',
    enum: FormFieldType,
    default: FormFieldType.TEXT,
  })
  type: FormFieldType;

  @Column()
  question: string;

  @Column({ type: 'simple-array', nullable: true })
  options: string[]; // For SELECT, RADIO, CHECKBOX

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: 0 })
  order: number;
}
