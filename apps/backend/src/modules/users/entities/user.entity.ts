import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
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
import { Message } from '../../messaging/entities/message.entity';
import { ConversationThread } from '../../messaging/entities/conversation-thread.entity';
import { Segment } from '../../contacts/entities/segment.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  OWNER = 'Owner',
  MANAGER = 'Manager',
  STAFF = 'Staff',
  ADMIN = 'Admin',
  CUSTOMER = 'Customer',
  AGENT = 'Agent',
}

export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  INVITED = 'Invited',
  PENDING = 'Pending',
  SUSPENDED = 'Suspended',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
}

@Entity('users')
export class User extends AbstractBaseEntity {
  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @ApiProperty({ enum: AuthProvider, example: AuthProvider.LOCAL })
  @Column({
    type: 'simple-enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  authProvider: AuthProvider;

  @ApiProperty({ example: '1234567890', nullable: true })
  @Column({ unique: true, nullable: true })
  googleId: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', nullable: true })
  @Column({ nullable: true })
  avatar: string;

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
  @Column({ nullable: true, unique: true })
  phone: string;

  @ApiProperty({ example: 'Store Manager', nullable: true })
  @Column({ nullable: true })
  jobTitle: string;

  @ApiProperty({ example: ['view_reports', 'manage_staff'], nullable: true })
  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];

  @ApiProperty({ example: 'ACTIVE', enum: UserStatus })
  @Column({
    type: 'simple-enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @ApiProperty({ example: 'CUST-12345', nullable: true })
  @Column({ unique: true, nullable: true })
  uniqueCode: string;

  @ApiProperty({ example: '2023-10-25T10:00:00.000Z', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastActive: Date;

  @ApiProperty({ example: 'fcm-token-string', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  pushToken: string | null;

  // Relation to branch they belong to
  @ManyToOne(() => Branch, (branch) => branch.staff, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ApiProperty({ example: 'uuid-string', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'uuid-string', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  // Relation to business they own
  @OneToOne(() => Business, (business) => business.owner)
  ownedBusiness: Business;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Visit, (visit) => visit.customer)
  visits: Visit[];

  @OneToMany(() => Message, (message) => message.customer)
  messages: Message[];

  @OneToMany(() => ConversationThread, (thread) => thread.customer)
  threads: ConversationThread[];

  @ManyToMany(() => Segment, (segment) => segment.users)
  segments: Segment[];

  @ApiProperty({ example: ['SMS', 'WhatsApp'], nullable: true })
  @Column({ type: 'simple-array', nullable: true })
  optInChannels: string[];

  @ApiProperty({ example: false })
  @Column({ default: false })
  optOut: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the user has changed their default password',
  })
  @Column({ default: false })
  isPasswordChanged: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase();
    }
  }
}
