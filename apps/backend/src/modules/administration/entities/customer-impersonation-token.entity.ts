import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('customer_impersonation_tokens')
export class CustomerImpersonationToken extends AbstractBaseEntity {
  @Column({ unique: true })
  @Index()
  token: string;

  @Column()
  actorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column()
  targetCustomerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'targetCustomerId' })
  targetCustomer: User;

  @Column()
  targetBranchId: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;
}
