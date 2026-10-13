import { Injectable, Logger } from '@nestjs/common';

/** What a presence channel is keyed on. */
export type PresenceKind = 'user' | 'business';

/**
 * JSON-safe presence snapshot. `lastSeen` is an ISO string so the value can
 * travel straight through a socket.io ack without extra serialisation.
 */
export interface PresenceStatus {
  isOnline: boolean;
  lastSeen: string | null;
}

const OFFLINE: PresenceStatus = { isOnline: false, lastSeen: null };

/**
 * Who is connected right now.
 *
 * Channels are keyed `kind:id` so one service answers both questions the app
 * asks: "is this customer online" (staff side, keyed by user) and "is anyone
 * from this business online" (customer side, keyed by business). A business
 * channel goes online when any of its staff sockets connects — a thread only
 * knows the business, never which staff member will pick it up.
 *
 * The store is in-process on purpose: the gateway broadcasts `presence:update`
 * through a plain `server.emit`, which only ever reaches sockets on this
 * process, so a shared store would advertise statuses this process cannot keep
 * updated. Scaling the API horizontally needs a socket.io Redis adapter and a
 * shared presence store together — do not add one without the other.
 *
 * The `users.isOnline` / `users.lastSeen` columns are written by the gateway on
 * every connect/disconnect so REST payloads keep a durable last-seen value.
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  /** `kind:id` → socket ids currently held by this process. */
  private readonly sockets = new Map<string, Set<string>>();

  /** `kind:id` → the moment it last came online or went offline. */
  private readonly lastSeen = new Map<string, Date>();

  private static key(kind: PresenceKind, id: string): string {
    return `${kind}:${id}`;
  }

  setOnline(kind: PresenceKind, id: string, socketId: string): PresenceStatus {
    const key = PresenceService.key(kind, id);
    let set = this.sockets.get(key);
    if (!set) {
      set = new Set();
      this.sockets.set(key, set);
    }
    set.add(socketId);
    const seen = new Date();
    this.lastSeen.set(key, seen);
    this.logger.debug(`${key} online (${set.size} socket(s))`);
    return { isOnline: true, lastSeen: seen.toISOString() };
  }

  /**
   * Drops one socket of a channel. The channel stays online while any other
   * socket of the same user/business is still held here.
   */
  setOffline(kind: PresenceKind, id: string, socketId: string): PresenceStatus {
    const key = PresenceService.key(kind, id);
    const set = this.sockets.get(key);
    set?.delete(socketId);

    if (set && set.size > 0) {
      return { isOnline: true, lastSeen: this.lastSeen.get(key)?.toISOString() ?? null };
    }

    this.sockets.delete(key);
    const seen = new Date();
    this.lastSeen.set(key, seen);
    this.logger.debug(`${key} offline`);
    return { isOnline: false, lastSeen: seen.toISOString() };
  }

  getStatus(kind: PresenceKind, id: string): PresenceStatus {
    const key = PresenceService.key(kind, id);
    const online = (this.sockets.get(key)?.size ?? 0) > 0;
    return {
      isOnline: online,
      lastSeen: this.lastSeen.get(key)?.toISOString() ?? null,
    };
  }

  /** Many statuses in one pass, as a plain object so it survives JSON. */
  getStatuses(kind: PresenceKind, ids: string[]): Record<string, PresenceStatus> {
    const out: Record<string, PresenceStatus> = {};
    for (const id of ids ?? []) {
      if (id) out[id] = this.getStatus(kind, id);
    }
    return out;
  }

  /** Test/debug helper: forget everything (not used by the gateway). */
  reset(): void {
    this.sockets.clear();
    this.lastSeen.clear();
  }

  /** Never-observed channel: offline with no known last-seen. */
  static unknown(): PresenceStatus {
    return OFFLINE;
  }
}
