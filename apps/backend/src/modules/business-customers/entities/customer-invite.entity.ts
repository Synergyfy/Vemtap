import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

/**
 * A shareable "join our customer list" link. Anyone holding the token can
 * leave their details for the business until the link expires or is revoked.
 */
@Entity('customer_invites')
export class CustomerInvite extends AbstractBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'uuid' })
  createdById: string;

  @Index({ unique: true })
  @Column()
  token: string;

  @Column({ type: 'simple-array', nullable: true })
  channels: string[] | null;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  registrations: number;
}
