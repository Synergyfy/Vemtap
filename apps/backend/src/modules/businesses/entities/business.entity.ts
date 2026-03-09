import { Entity, Column, OneToMany, JoinColumn, OneToOne, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Category } from './category.entity';
import { Subcategory } from './subcategory.entity';

export enum BusinessType {
  RESTAURANT = 'RESTAURANT',
  RETAIL = 'RETAIL',
  GYM = 'GYM',
  EVENT = 'EVENT',
  LOGISTICS = 'LOGISTICS',
  BEAUTY_WELLNESS = 'BEAUTY_WELLNESS',
}

export enum BusinessStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

@Entity('businesses')
export class Business extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: BusinessType,
    default: BusinessType.RETAIL,
  })
  type: BusinessType;

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

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  whatsappNumber: string;

  // Relation to the owner
  @OneToOne(() => User, (user) => user.ownedBusiness, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => Branch, (branch) => branch.business)
  branches: Branch[];

  totalBranches?: number;
}
