import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Form } from './form.entity';
import { FormAnswer } from './form-answer.entity';

export enum FormFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  DATE = 'date',
}

@Entity('form_fields')
export class FormField extends AbstractBaseEntity {
  @ManyToOne(() => Form, (form) => form.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formId' })
  form: Form;

  @Column()
  formId: string;

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

  @OneToMany(() => FormAnswer, (answer) => answer.field)
  answers: FormAnswer[];
}
