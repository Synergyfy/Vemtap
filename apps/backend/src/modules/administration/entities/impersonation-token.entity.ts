import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('impersonation_tokens')
export class ImpersonationToken extends AbstractBaseEntity {
  @ApiProperty({ description: 'The unique impersonation token' })
  @Column({ unique: true })
  @Index()
  token: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @ApiProperty({ description: 'The ID of the admin or agent performing the action' })
  @Column()
  actorId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'targetBranchId' })
  targetBranch: Branch;

  @ApiProperty({ description: 'The ID of the branch being impersonated' })
  @Column()
  targetBranchId: string;

  @ApiProperty({ description: 'When the token expires' })
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ApiProperty({ description: 'Whether the token is still active' })
  @Column({ default: true })
  isActive: boolean;
}
