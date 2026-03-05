import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { FormResponse } from './form-response.entity';
import { FormField } from './form-field.entity';

@Entity('form_answers')
export class FormAnswer extends AbstractBaseEntity {
  @ManyToOne(() => FormResponse, (response) => response.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'responseId' })
  response: FormResponse;

  @Column()
  responseId: string;

  @ManyToOne(() => FormField, (field) => field.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fieldId' })
  field: FormField;

  @Column()
  fieldId: string;

  @Column({ type: 'text', nullable: true })
  value: string;
}
