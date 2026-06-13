import {
  Entity,
  Column,
  OneToMany,
  JoinColumn,
  OneToOne,
  ManyToOne,
  BeforeInsert,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Category } from './category.entity';
import { Subcategory } from './subcategory.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { generateUniqueCode } from '../../../common/utils/random.util';

export enum BusinessStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

@Entity('businesses')
export class Business extends AbstractBaseEntity {
  @ApiProperty({
    example: 'BIZ123XYZ',
    description: 'Unique 9-character alphanumeric code for the business',
  })
  @Column({ unique: true })
  uniqueCode: string;

  @ApiProperty({ example: 'The Azure Bistro' })
  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: BusinessStatus,
    default: BusinessStatus.PENDING,
  })
  status: BusinessStatus;

  @Column({ nullable: true })
  suspensionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'simple-array', nullable: true })
  documents: string[];

  @Column({ default: false })
  isRegistered: boolean;

  @Column({ nullable: true })
  registrationNumber: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => Subcategory, { nullable: true })
  @JoinColumn({ name: 'subcategoryId' })
  subcategory: Subcategory;

  @Column({ nullable: true })
  subcategoryId: string;

  @Column({ nullable: true })
  otherSubcategoryName: string;

  @Column({ nullable: true })
  monthlyVisitors: string;

  @Column({ nullable: true })
  goal: string;

  @Column({ nullable: true })
  officialEmail: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  whatsappNumber: string;

  @ApiPropertyOptional({ example: 'We serve local delicacies.' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiPropertyOptional({ example: { Monday: { open: '08:00', close: '18:00', isClosed: false, is24h: false } } })
  @Column({ type: 'jsonb', nullable: true })
  openingHours: Record<string, any>;

  @ApiPropertyOptional({ example: 'Africa/Lagos' })
  @Column({ nullable: true })
  timezone: string;

  @ApiPropertyOptional({ example: true })
  @Column({ default: true })
  isVisible: boolean;

  @ApiPropertyOptional({ example: { facebook: 'https://facebook.com/mybiz' } })
  @Column({ type: 'jsonb', nullable: true })
  socials: Record<string, string>;

  @ApiProperty({
    example: false,
    description: 'Whether the business is verified by admin',
  })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({ example: '2026-03-21T18:00:00Z', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  // Relation to the owner
  @OneToOne(() => User, (user) => user.ownedBusiness, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;


  @Column()
  ownerId: string;

  @ApiProperty({ example: 'AFF001', nullable: true })
  @Column({ nullable: true })
  referralCode: string;

  @OneToMany(() => Branch, (branch) => branch.business)
  branches: Branch[];

  totalBranches?: number;

  @BeforeInsert()
  generateUniqueCode() {
    if (!this.uniqueCode) {
      this.uniqueCode = generateUniqueCode(9);
    }
  }
}
