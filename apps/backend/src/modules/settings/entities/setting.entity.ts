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
}
