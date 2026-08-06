import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('settings')
export class Setting extends AbstractBaseEntity {
  @ApiProperty({ example: 'VemTap', description: 'Platform Name' })
  @Column({ default: 'VemTap' })
  platformName: string;

  @ApiProperty({ example: 'support@VemTap.com', description: 'Support Email' })
  @Column({ default: 'support@VemTap.com' })
  supportEmail: string;

  @ApiProperty({ example: 'NGN', description: 'Default Currency' })
  @Column({ default: 'NGN' })
  defaultCurrency: string;

  @ApiProperty({ example: 'Africa/Lagos', description: 'Timezone' })
  @Column({ default: 'Africa/Lagos' })
  timezone: string;

  @ApiProperty({ example: true, description: 'Enforce 2FA for Admins' })
  @Column({ default: true })
  enforce2FA: boolean;

  @ApiProperty({
    example: false,
    description: 'Force password reset every 90 days',
  })
  @Column({ default: false })
  passwordExpiry: boolean;

  @ApiProperty({ example: 0.05, description: 'Cost per SMS message' })
  @Column('decimal', { precision: 10, scale: 2, default: 0.05 })
  messagingCostSms: number;

  @ApiProperty({ example: 0.08, description: 'Cost per WhatsApp message' })
  @Column('decimal', { precision: 10, scale: 2, default: 0.08 })
  messagingCostWhatsapp: number;

  @ApiProperty({ example: 0.01, description: 'Cost per Email message' })
  @Column('decimal', { precision: 10, scale: 2, default: 0.01 })
  messagingCostEmail: number;

  @ApiProperty({ example: 15.0, description: 'Price per SMS Credit in NGN' })
  @Column('decimal', { precision: 10, scale: 2, default: 15.0 })
  creditPriceSms: number;

  @ApiProperty({
    example: 25.0,
    description: 'Price per WhatsApp Credit in NGN',
  })
  @Column('decimal', { precision: 10, scale: 2, default: 25.0 })
  creditPriceWhatsapp: number;

  @ApiProperty({ example: 2.0, description: 'Price per Email Credit in NGN' })
  @Column('decimal', { precision: 10, scale: 2, default: 2.0 })
  creditPriceEmail: number;

  @ApiProperty({ example: 50.0, description: 'Price per AI Credit in NGN' })
  @Column('decimal', { precision: 10, scale: 2, default: 50.0 })
  creditPriceAi: number;

  @ApiProperty({ example: 'token_123', description: 'WhatsApp API Token' })
  @Column({ nullable: true })
  whatsappApiToken: string;

  @ApiProperty({
    example: 'verify_token',
    description: 'WhatsApp Webhook Verify Token',
  })
  @Column({ nullable: true })
  whatsappWebhookVerifyToken: string;

  @ApiProperty({ example: '1234567890', description: 'WhatsApp Business ID' })
  @Column({ nullable: true })
  whatsappBusinessId: string;

  @ApiProperty({
    example: 'https://api.whatsapp.com/v15.0/',
    description: 'WhatsApp API Base URL',
  })
  @Column({ default: 'https://graph.facebook.com/v17.0/' })
  whatsappApiBaseUrl: string;

  @ApiProperty({
    example: 20,
    description: 'Percentage earned from direct business referrals',
  })
  @Column('decimal', { precision: 10, scale: 2, default: 20 })
  affiliateDirectCommission: number;

  @ApiProperty({
    example: 5,
    description: 'Percentage earned from sub-affiliate referrals',
  })
  @Column('decimal', { precision: 10, scale: 2, default: 5 })
  affiliateIndirectCommission: number;

  @ApiProperty({
    example: 3,
    description: 'How many months an affiliate earns from a referral',
  })
  @Column({ default: 3 })
  affiliateCommissionDurationMonths: number;

  @Column('decimal', { precision: 10, scale: 2, default: 5000 })
  affiliateMinimumWithdrawal: number;

  @ApiProperty({ example: true, description: 'Enable discovery network' })
  @Column({ default: true })
  discoveryEnableNetwork: boolean;

  @ApiProperty({ example: true, description: 'Enable sponsored campaigns' })
  @Column({ default: true })
  discoveryEnableSponsored: boolean;

  @ApiProperty({ example: true, description: 'Enable B2B partnerships' })
  @Column({ default: true })
  discoveryEnablePartnerships: boolean;

  @ApiProperty({ example: 3, description: 'Max offers shown per visit' })
  @Column({ default: 3 })
  discoveryMaxOffersPerVisit: number;

  @ApiProperty({ example: 5, description: 'Max offers shown per day' })
  @Column({ default: 5 })
  discoveryMaxOffersPerDay: number;

  @ApiProperty({
    example: 500,
    description: 'Default discovery radius in meters',
  })
  @Column({ default: 500 })
  discoveryDefaultRadius: number;

  @ApiProperty({ example: 2000, description: 'Max discovery radius in meters' })
  @Column({ default: 2000 })
  discoveryMaxRadius: number;

  @ApiProperty({ example: 24, description: 'Attribution window in hours' })
  @Column({ default: 24 })
  discoveryAttributionWindow: number;

  @ApiProperty({
    example: true,
    description: 'Enable push notifications for discovery',
  })
  @Column({ default: true })
  discoveryPushEnabled: boolean;

  @ApiProperty({ example: false, description: 'Enable SMS for discovery' })
  @Column({ default: false })
  discoverySmsEnabled: boolean;

  @ApiProperty({ example: true, description: 'Enable email for discovery' })
  @Column({ default: true })
  discoveryEmailEnabled: boolean;

  @ApiProperty({
    example: true,
    description: 'Require admin approval for discovery changes',
  })
  @Column({ default: true })
  discoveryApprovalRequired: boolean;

  @ApiProperty({
    example: [],
    description: 'B2B Partnership reward tiers configuration',
  })
  @Column({ type: 'json', nullable: true })
  partnershipRewardTiers: any;
}
