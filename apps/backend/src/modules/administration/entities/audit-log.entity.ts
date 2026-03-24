import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../businesses/entities/business.entity';
import { BackendModule } from '../../../common/enums/backend-module.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('audit_logs')
export class AuditLog extends AbstractBaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'actorId' })
  @Index()
  actor: User;

  @ApiProperty({ description: 'The ID of the admin or agent who performed the action' })
  @Column()
  actorId: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'businessId' })
  @Index()
  business: Business;

  @ApiProperty({ description: 'The business context for the action' })
  @Column({ nullable: true })
  businessId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branchId' })
  @Index()
  branch: Branch;

  @ApiProperty({ description: 'The branch context for the action' })
  @Column({ nullable: true })
  branchId: string;

  @ApiProperty({ enum: BackendModule, description: 'The module where the action was performed' })
  @Column({ type: 'simple-enum', enum: BackendModule })
  module: BackendModule;

  @ApiProperty({ description: 'The HTTP method of the request' })
  @Column()
  method: string;

  @ApiProperty({ description: 'The request endpoint/URL' })
  @Column()
  endpoint: string;

  @ApiProperty({ description: 'The payload/body of the request' })
  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @ApiProperty({ description: 'The HTTP response status code' })
  @Column({ nullable: true })
  statusCode: number;

  @ApiProperty({ description: 'The IP address of the actor' })
  @Column({ nullable: true })
  ipAddress: string;

  @ApiProperty({ description: 'The User Agent string' })
  @Column({ nullable: true })
  userAgent: string;

  @ApiProperty({ description: 'The impersonation token used (if any)' })
  @Column({ nullable: true })
  impersonationTokenId: string;
}
