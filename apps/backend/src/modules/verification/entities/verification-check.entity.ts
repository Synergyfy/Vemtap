import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';

export enum VerificationCheckKind {
  /** Who runs the account (ID + selfie). */
  IDENTITY = 'identity',
  /** The business itself (CAC, or an unregistered-business submission). */
  BUSINESS = 'business',
}

export enum VerificationCheckStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  /** A person at VEMTAP needs to look at it. */
  NEEDS_REVIEW = 'needs_review',
  FAILED = 'failed',
}

export enum IdentityDocumentType {
  NIN = 'nin',
  DRIVERS_LICENSE = 'drivers_license',
  VOTERS_CARD = 'voters_card',
  PASSPORT = 'passport',
  /** CAC registration (RC / BN / IT number). */
  CAC = 'cac',
  /** Business without CAC registration. */
  UNREGISTERED = 'unregistered',
}

/**
 * One verification attempt and its outcome. Deliberately minimal: masked ID
 * number, the names that were compared and the result — never photos, full
 * registry records or the raw ID number.
 */
@Entity('verification_checks')
@Index('IDX_verification_checks_business_kind', [
  'businessId',
  'kind',
  'createdAt',
])
export class VerificationCheck extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @ApiProperty({ description: 'Who submitted it' })
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty({ enum: VerificationCheckKind })
  @Column({ type: 'varchar', length: 20 })
  kind: VerificationCheckKind;

  @ApiProperty({ enum: IdentityDocumentType })
  @Column({ type: 'varchar', length: 30 })
  idType: IdentityDocumentType;

  @ApiProperty({ example: '•••••••8901', nullable: true })
  @Column({ type: 'varchar', length: 40, nullable: true })
  idNumberMasked: string | null;

  @ApiProperty({ enum: VerificationCheckStatus })
  @Column({
    type: 'varchar',
    length: 20,
    default: VerificationCheckStatus.PENDING,
  })
  status: VerificationCheckStatus;

  @Column({ type: 'varchar', length: 30, default: 'bytid' })
  provider: string;

  /** bytID's id for the check, to look it up or match webhooks. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  providerCheckId: string | null;

  /** Our idempotency reference sent to bytID (unique per attempt). */
  @Index('UQ_verification_checks_reference', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  reference: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  livenessSessionId: string | null;

  @ApiProperty({
    description:
      'Name on the record and whether it matched the account / business',
    example: { recordName: 'ADAEZE TEST OKAFOR', matched: true },
  })
  @Column({ type: 'jsonb', nullable: true })
  nameMatch: Record<string, unknown> | null;

  @ApiProperty({ nullable: true, example: { status: 'matched', score: 94 } })
  @Column({ type: 'jsonb', nullable: true })
  faceMatch: { status: string; score: number | null } | null;

  @ApiProperty({ example: ['face_not_matched'] })
  @Column({ type: 'jsonb', nullable: true })
  reasons: string[] | null;

  /** Uploaded evidence (passport photo, CAC certificate, …). */
  @Column({ type: 'jsonb', nullable: true })
  documentUrls: string[] | null;

  /** What the owner wrote when asking for a manual review. */
  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewNote: string | null;
}
