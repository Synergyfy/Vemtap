import { Entity, Column, ManyToOne, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Visit } from '../../visitors/entities/visit.entity';
import { Branch } from '../../branches/entities/branch.entity';

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
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];

  @Column({
    type: 'simple-enum',
    enum: UserStatus,
    default: UserStatus.INVITED,
  })
  status: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastActive: Date;

  // Relation to the business they belong to (Staff/Manager/Owner)
  @ManyToOne(() => Business, (business) => business.staff, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ nullable: true })
  businessId: string;

  // Relation to branch they belong to
  @ManyToOne(() => Branch, (branch) => branch.staff, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  // Relation to business they own
  @OneToOne(() => Business, (business) => business.owner)
  ownedBusiness: Business;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Visit, (visit) => visit.customer)
  visits: Visit[];
}
