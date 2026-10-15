import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification extends AbstractBaseEntity {
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: 'info' }) // info, success, warning, error
  type: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'varchar', nullable: true })
  actionUrl: string | null;

  /**
   * Optional payload the row was written with — a shifted till total, a
   * rating, a deal's claim velocity. The notification title and message are
   * prose, and prose is what the customer reads; this is the structured part
   * the row should have carried in the first place, so a screen can show the
   * figure without re-deriving it.
   *
   * Nullable because the rows written before this existed have none, and
   * nullable-by-default keeps an absent payload from being an empty object.
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  /**
   * The domain event the row describes, as distinct from `type` — which is
   * the display tone (`info` / `success` / `warning` / `error`). The two are
   * not interchangeable: a rating writes a *different* tone per star value
   * (`success` for 4★, `error` for 2★), so anything keyed on `type` would
   * never group the same event. `eventType` is the stable discriminator —
   * `new_rating`, `new_order`, `new_message`, and so on — and is what the
   * batching key and the copy templates are keyed on.
   *
   * Null on rows written before this column existed, and null means "never
   * batch": a legacy row's tone-bearing `type` is not evidence about which
   * event produced it.
   */
  @Column({ type: 'varchar', nullable: true })
  eventType: string | null;

  /**
   * Batching identity: `userId:eventType`, optionally suffixed with an
   * entity id so events that must stay separate (one thread's messages)
   * do not collapse together.
   *
   * Null on rows that are not batchable, which is every type outside the
   * batching allowlist plus every legacy row. A row with a null batchKey is
   * simply an ordinary notification.
   */
  @Column({ type: 'varchar', nullable: true })
  batchKey: string | null;

  /**
   * How many events this row currently stands for. 1 for a plain row and for
   * the first event of a batch; the read path derives the aggregate copy
   * ("Jane and 3 others rated your business") from it.
   */
  @Column({ type: 'int', default: 1 })
  groupCount: number;

  /**
   * When this row's batching window closed, or null while it is still open.
   *
   * The authoritative window is `createdAt + windowMs` — this column is a
   * convenience so the "find the open batch" lookup can use an index instead
   * of a date comparison, and so a row can record whether a closer already
   * ran. Null-and-expired is still treated as closed by the read path, so a
   * lost BullMQ job degrades to a late batch rather than a permanently open
   * one.
   */
  @Column({ type: 'timestamp', nullable: true })
  flushedAt: Date | null;
}
