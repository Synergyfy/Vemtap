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
}
