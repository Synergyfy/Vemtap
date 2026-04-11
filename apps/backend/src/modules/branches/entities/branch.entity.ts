import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { User } from '../../users/entities/user.entity';
import { Visit } from '../../visitors/entities/visit.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import type { MessageCampaign } from '../../messaging/entities/message-campaign.entity';
import { ApiProperty } from '@nestjs/swagger';
import { generateUniqueCode } from '../../../common/utils/random.util';

@Entity('branches')
export class Branch extends AbstractBaseEntity {
  @ApiProperty({
    example: 'BR123XYZ',
    description: 'Unique 9-character alphanumeric code for the branch',
  })
  @Column({ unique: true })
  uniqueCode: string;

  @ApiProperty({ example: 'Main Office' })
  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isMainBranch: boolean;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  whatsappNumber: string;

  @Column({ nullable: true })
  officialEmail: string;

  @ApiProperty({
    example: '#2563EB',
    description: 'The primary color for branch forms',
  })
  @Column({ default: '#2563EB' })
  formAppearanceColor: string;

  @ApiProperty({
    example: 'Quick Link',
    description: 'Tag for the welcome screen',
  })
  @Column({ default: 'Quick Link' })
  welcomeTag: string;

  @ApiProperty({
    example: 'Connect with us',
    description: 'Title for the welcome screen',
  })
  @Column({ default: 'Connect with us' })
  welcomeTitle: string;

  @ApiProperty({
    example: 'Leave your details to stay in touch and earn rewards.',
    description: 'Message for the welcome screen',
  })
  @Column({
    type: 'text',
    default: 'Leave your details to stay in touch and earn rewards.',
  })
  welcomeMessage: string;

  @ApiProperty({
    example: 'Visit recorded successfully!',
    description: 'Title for the success screen',
  })
  @Column({ default: 'Visit recorded successfully!' })
  successTitle: string;

  @ApiProperty({
    example: 'Thank you for visiting our store',
    description: 'Description for the success screen',
  })
  @Column({ type: 'text', default: 'Thank you for visiting our store' })
  successDescription: string;

  @Column({ type: 'text', nullable: true })
  successMessage: string;

  @Column({ type: 'text', nullable: true })
  privacyMessage: string;

  @Column({ type: 'text', nullable: true })
  rewardMessage: string;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column({ type: 'jsonb', nullable: true })
  businessHours: Record<string, any>;

  @ApiProperty({
    example: {
      instagram: 'https://instagram.com/johndoe',
      linkedin: 'https://linkedin.com/company/johndoe',
      reviewUrl: 'https://g.page/r/...',
    },
    description: 'User engagement settings (social links, etc.)',
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  engagement?: Record<string, any>;

  @Column({ default: false })
  rewardEnabled: boolean;

  @Column({ default: 5 })
  rewardVisitThreshold: number;

  @Column({ nullable: true })
  linkedinUrl: string;

  @Column({ nullable: true })
  reviewUrl: string;

  @Column({ default: true })
  showReview: boolean;

  @Column({ default: true })
  showSocial: boolean;

  @Column({ default: true })
  showFeedback: boolean;

  @ManyToOne(() => Business, (business) => business.branches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @OneToMany(() => User, (user) => user.branch)
  staff: User[];

  @OneToMany(() => Visit, (visit) => visit.branch)
  visits: Visit[];

  @OneToMany(() => Campaign, (campaign) => campaign.branch)
  campaigns: Campaign[];

  @OneToMany('MessageCampaign', 'branch')
  messageCampaigns: MessageCampaign[];

  @BeforeInsert()
  generateUniqueCode() {
    if (!this.uniqueCode) {
      this.uniqueCode = generateUniqueCode(9);
    }
  }
}
