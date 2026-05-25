import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Form } from './form.entity';
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { FormAnswer } from './form-answer.entity';

@Entity('form_responses')
export class FormResponse extends AbstractBaseEntity {
  @ManyToOne(() => Form, (form) => form.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formId' })
  form: Form;

  @Column()
  formId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'visitorId' })
  visitor: User;

  @Column({ nullable: true })
  visitorId: string | null;

  @ManyToOne(() => Branch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  @OneToMany(() => FormAnswer, (answer) => answer.response, { cascade: true })
  answers: FormAnswer[];
}
