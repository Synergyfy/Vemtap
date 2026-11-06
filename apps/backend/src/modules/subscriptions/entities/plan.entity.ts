import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Subscription } from './subscription.entity';

@Entity('plans')
export class Plan extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quarterlyPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  yearlyPrice: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column({ default: false })
  isFree: boolean;

  @Column({ type: 'int', default: 30 })
  trialDurationDays: number;

  @Column('text', { array: true, default: [] })
  features: string[];

  @Column({ default: false })
  messagingEnabled: boolean;

  @Column({ type: 'int', default: 0 })
  smsCredits: number;

  @Column({ type: 'int', default: 0 })
  emailCredits: number;

  @Column({ type: 'int', default: 0 })
  whatsappCredits: number;

  // Feature Limits (-1 or null will imply unlimited natively but let's just stick to -1 as unlimited or use nullable)
  @Column({ default: false })
  teamMembersEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  teamMembersLimit: number | null;

  @Column({ type: 'int', nullable: true })
  loyaltyLimit: number | null;

  @Column({ default: false })
  loyaltyEnabled: boolean;

  @Column({ default: false })
  branchesEnabled: boolean;

  @Column({ type: 'int', default: 1 })
  branchLimit: number;

  @Column({ default: false })
  analyticsEnabled: boolean;

  @Column({ default: 'basic' })
  analyticsLevel: string;

  @Column({ default: false })
  catalogueEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  maxCatalogueItems: number | null;

  @Column({ type: 'int', nullable: true })
  maxCatalogueCategories: number | null;

  @Column({ type: 'int', nullable: true })
  maxCatalogueOffers: number | null;

  @Column({ default: false })
  automationsEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  maxAutomations: number | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  qrThrivePlanId: string | null;

  @Column({ default: false })
  isPopular: boolean;

  // New permission columns - feature toggles and limits
  @Column({ default: false })
  inventoryEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  inventoryLimit: number | null;

  @Column({ default: false })
  posEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  posTerminalLimit: number | null;

  @Column({ default: false })
  visitorsEnabled: boolean;

  @Column({ default: false })
  inAppChatEnabled: boolean;

  @Column({ default: false })
  formsEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  formsLimit: number | null;

  @Column({ default: false })
  businessQrEnabled: boolean;

  @Column({ default: false })
  marketingKitEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  marketingKitLimit: number | null;

  @Column({ default: false })
  discoveryEnabled: boolean;

  @Column({ default: false })
  staffRolesEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  staffRolesLimit: number | null;

  @Column({ default: false })
  activityLogEnabled: boolean;

  @Column({ default: false })
  qrCodesEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  qrCodesLimit: number | null;

  // AI Copilot
  @Column({ default: false })
  aiCopilotEnabled: boolean;

  @Column({ type: 'int', default: 0 })
  aiCredits: number; // Monthly AI credit allowance. 0 = disabled. -1 = unlimited.

  @Column({ default: false })
  autoFeatureDeals: boolean;

  @Column({ type: 'timestamp', nullable: true })
  permissionsConfiguredAt: Date | null;

  @OneToMany(() => Subscription, (sub) => sub.plan)
  subscriptions: Subscription[];
}
