import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum PushTransport {
  /** Expo push — the transport the React Native app's expo-notifications uses. */
  EXPO = 'EXPO',
  /** Web Push (VAPID) — the transport the browser service worker uses. */
  WEB = 'WEB',
}

/**
 * A push token registered by one user on one device.
 *
 * The old `users.pushToken` column held a single serialised Web Push
 * subscription, which could not represent an Expo token (`ExponentPushToken[…]`)
 * — the two are different transports with different invalid-token semantics.
 * It also capped a user at one device, so an owner's phone and a staff tablet
 * overwrote each other.
 *
 * `token` is unique across the whole table: the same token re-registering
 * (app reinstall, re-login) must upsert rather than duplicate.
 */
@Entity('push_tokens')
@Index('IDX_push_tokens_user', ['userId'])
export class PushToken extends AbstractBaseEntity {
  @ManyToOne(() => User, (user) => user.pushTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  /** Expo token or serialised Web Push subscription, per `transport`. */
  @Column({ type: 'varchar' })
  @Index('UQ_push_tokens_token', { unique: true })
  token: string;

  @Column({ type: 'varchar', default: PushTransport.EXPO })
  transport: PushTransport;

  /** ios | android | web — helps read delivery logs, not used for routing. */
  @Column({ type: 'varchar', nullable: true })
  platform: string | null;

  /** Last time this token was confirmed alive by a delivery attempt. */
  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;
}
