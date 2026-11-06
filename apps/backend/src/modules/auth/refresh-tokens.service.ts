import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import {
  SessionTokenClaims,
  UserSession,
} from '../users/entities/user-session.entity';

/** Idle sessions end after this long; each refresh starts the period again. */
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/**
 * Two tabs can refresh with the same token at once. The slower one is let
 * through for this long, so it isn't mistaken for a stolen token.
 */
const REUSE_GRACE_MS = 30 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const hashOf = (secret: string) =>
  createHash('sha256').update(secret).digest('hex');

const sameHash = (a: string | null | undefined, b: string) =>
  Boolean(a) &&
  a!.length === b.length &&
  timingSafeEqual(Buffer.from(a!), Buffer.from(b));

export interface RotatedSession {
  session: UserSession;
  /** Null when another request already rotated it: keep the newer token. */
  refreshToken: string | null;
}

/**
 * Refresh tokens are `<session id>.<secret>`. Only the secret's hash is stored,
 * each one works once, and they live on the session, so signing out or
 * revoking a device ends them too.
 */
@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(UserSession)
    private readonly sessions: Repository<UserSession>,
  ) {}

  /** Starts the session's token and remembers the claims to renew with. */
  async issue(sessionId: string, claims: SessionTokenClaims): Promise<string> {
    const secret = randomBytes(32).toString('base64url');
    await this.sessions.update(sessionId, {
      refreshTokenHash: hashOf(secret),
      previousRefreshTokenHash: null,
      refreshRotatedAt: null,
      refreshExpiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      tokenClaims: claims,
    });
    return `${sessionId}.${secret}`;
  }

  /** A role switch stays in force after the next refresh. */
  async updateClaims(sessionId: string, claims: SessionTokenClaims) {
    await this.sessions.update(sessionId, { tokenClaims: claims });
  }

  /**
   * Swaps a valid token for a new one; null when it can't be used. A token
   * that was already swapped and comes back later may have been stolen, so its
   * session ends.
   */
  async rotate(token: string): Promise<RotatedSession | null> {
    const separator = token.indexOf('.');
    const sessionId = token.slice(0, separator);
    const secret = token.slice(separator + 1);
    if (separator < 0 || !UUID.test(sessionId) || !secret) return null;

    const session = await this.sessions
      .createQueryBuilder('session')
      .addSelect([
        'session.refreshTokenHash',
        'session.previousRefreshTokenHash',
        'session.refreshRotatedAt',
        'session.refreshExpiresAt',
        'session.tokenClaims',
      ])
      .where('session.id = :sessionId', { sessionId })
      .andWhere('session.revokedAt IS NULL')
      .getOne();
    if (!session?.refreshExpiresAt || session.refreshExpiresAt < new Date()) {
      return null;
    }

    const hash = hashOf(secret);
    if (sameHash(session.refreshTokenHash, hash)) {
      const next = randomBytes(32).toString('base64url');
      const now = new Date();
      const swapped = await this.sessions.update(
        { id: session.id, refreshTokenHash: hash, revokedAt: IsNull() },
        {
          refreshTokenHash: hashOf(next),
          previousRefreshTokenHash: hash,
          refreshRotatedAt: now,
          refreshExpiresAt: new Date(now.getTime() + REFRESH_TTL_MS),
          lastActiveAt: now,
        },
      );
      return {
        session,
        refreshToken: swapped.affected ? `${session.id}.${next}` : null,
      };
    }

    if (sameHash(session.previousRefreshTokenHash, hash)) {
      const rotatedAt = session.refreshRotatedAt?.getTime() ?? 0;
      if (Date.now() - rotatedAt <= REUSE_GRACE_MS) {
        return { session, refreshToken: null };
      }
      await this.revoke(session.id);
    }
    return null;
  }

  async revoke(sessionId: string) {
    await this.sessions.update(sessionId, { revokedAt: new Date() });
  }
}
