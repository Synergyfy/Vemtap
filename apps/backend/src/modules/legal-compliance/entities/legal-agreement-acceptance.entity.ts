import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { LegalAgreement } from './legal-agreement.entity';
import { User } from '../../users/entities/user.entity';

@Entity('legal_agreement_acceptances')
export class LegalAgreementAcceptance extends AbstractBaseEntity {
  @ManyToOne(() => LegalAgreement, (agreement) => agreement.acceptances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agreementId' })
  agreement: LegalAgreement;

  @Column()
  agreementId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ length: 50 })
  version: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'timestamptz' })
  acceptedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  signatureHash: string;
}
