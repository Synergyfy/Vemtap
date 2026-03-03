import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Visit } from '../../visitors/entities/visit.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  OWNER = 'Owner',
  MANAGER = 'Manager',
  STAFF = 'Staff',
  ADMIN = 'Admin',
  CUSTOMER = 'Customer',
}

export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  INVITED = 'Invited',
  PENDING = 'Pending',
  SUSPENDED = 'Suspended',
}

@Entity('users')
export class User extends AbstractBaseEntity {
  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @ApiProperty({ example: 'John' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Column()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.OWNER })
  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @ApiProperty({ example: '+2348012345678', nullable: true })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ example: 'Store Manager', nullable: true })
  @Column({ nullable: true })
  jobTitle: string;

  @ApiProperty({ example: ['view_reports', 'manage_staff'], nullable: true })
  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @Column({
    type: 'simple-enum',
    enum: UserStatus,
    default: UserStatus.INVITED,
  })
  status: UserStatus;

  @ApiProperty({ example: '2023-10-25T10:00:00.000Z', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastActive: Date;

  // Relation to the business they belong to (Staff/Manager/Owner)
  @ManyToOne(() => Business, (business) => business.staff, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'uuid-string', nullable: true })
  @Column({ nullable: true })
  businessId: string;

  // Relation to branch they belong to
  @ManyToOne(() => Branch, (branch) => branch.staff, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ApiProperty({ example: 'uuid-string', nullable: true })
  @Column({ nullable: true })
  branchId: string;

  // Relation to business they own
  @OneToOne(() => Business, (business) => business.owner)
  ownedBusiness: Business;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @ApiProperty({
    example: {
      instagram: { profile: 'johndoe', link: 'https://instagr.am/johndoe' },
    },
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  engagement: Record<string, any>;

  @OneToMany(() => Visit, (visit) => visit.customer)
  visits: Visit[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase();
    }
  }
}
