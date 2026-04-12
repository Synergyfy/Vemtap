import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('qr_thrive_user_mappings')
export class QrThriveUserMapping extends AbstractBaseEntity {
  @Column({ unique: true })
  qrThriveUserId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  userId: string;
}
