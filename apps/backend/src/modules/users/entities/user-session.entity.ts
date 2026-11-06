import { Entity, Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from './user.entity';

/** What the session's next access token carries, so a refresh keeps the shell. */
export interface SessionTokenClaims {
  role?: string;
  businessId?: string | null;
  branchId?: string | null;
  referralCode?: string;
}

@Entity('user_sessions')
export class UserSession extends AbstractBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 'Web browser' })
  deviceName: string;

  @Column({ default: 'web' })
  platform: string;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'timestamp' })
  lastActiveAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  // Hidden from normal reads so they never reach a linked-devices response.
  @Column({ type: 'varchar', nullable: true, select: false })
  refreshTokenHash: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  previousRefreshTokenHash: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  refreshRotatedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  refreshExpiresAt: Date | null;

  @Column({ type: 'jsonb', nullable: true, select: false })
  tokenClaims: SessionTokenClaims | null;
}
