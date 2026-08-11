import { Entity, Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from './user.entity';

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
}
