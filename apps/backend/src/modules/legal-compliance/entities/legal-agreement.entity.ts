import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { LegalAgreementAcceptance } from './legal-agreement-acceptance.entity';

@Entity('legal_agreements')
export class LegalAgreement extends AbstractBaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  slug: string;

  @Column({ length: 50 })
  version: string;

  @Column({ type: 'text', nullable: true })
  contentUrl: string;

  @Column({ type: 'timestamptz' })
  effectiveDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => LegalAgreementAcceptance, (acceptance) => acceptance.agreement)
  acceptances: LegalAgreementAcceptance[];
}
