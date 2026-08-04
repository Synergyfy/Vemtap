import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { PosRegisterSession } from './pos-register-session.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';

@Entity('pos_cash_drops')
@Index(['registerSessionId', 'createdAt'])
export class PosCashDrop extends AbstractBaseEntity {
  @ManyToOne(() => PosRegisterSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registerSessionId' })
  registerSession: PosRegisterSession;

  @Column({ type: 'uuid' })
  registerSessionId: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'uuid' })
  branchId: string;

  @Column({ type: 'uuid' })
  droppedById: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text' })
  reason: string;
}
