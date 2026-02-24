import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('otps')
export class Otp extends AbstractBaseEntity {
  @Column()
  email: string;

  @Column()
  code: string;

  @Column()
  expiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}
