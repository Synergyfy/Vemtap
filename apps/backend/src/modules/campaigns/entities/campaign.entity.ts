import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { CampaignType, CampaignStatus } from '../dto/create-campaign.dto';

@Entity('campaigns')
export class Campaign extends AbstractBaseEntity {
  @ApiProperty({
    example: 'Weekend Coffee Special',
    description: 'The name of the campaign',
  })
  @Column()
  name: string;

  @ApiProperty({
    enum: CampaignType,
    example: CampaignType.WHATSAPP,
    description: 'Communication channel',
  })
  @Column({
    type: 'enum',
    enum: CampaignType,
    default: CampaignType.WHATSAPP,
  })
  type: CampaignType;

  @ApiProperty({ example: 'all', description: 'Target audience segment' })
  @Column()
  audience: string;

  @ApiProperty({
    example: 'Hello {name}, enjoy 50% off your next coffee!',
    description: 'Message content',
  })
  @Column('text')
  message: string;

  @ApiProperty({
    example: '2024-10-12T10:00:00Z',
    description: 'Scheduled send time',
    required: false,
  })
  @Column({ nullable: true })
  scheduledFor: Date;

  @ApiProperty({
    enum: CampaignStatus,
    example: CampaignStatus.DRAFT,
    description: 'Current status',
  })
  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @ApiProperty({ example: 150, description: 'Number of messages sent' })
  @Column({ default: 0 })
  sent: number;

  @ApiProperty({ example: '98%', description: 'Delivery rate' })
  @Column({ default: '0%' })
  delivered: string;

  @ApiProperty({ example: 45, description: 'Number of link clicks' })
  @Column({ default: 0 })
  clicks: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the branch',
  })
  @Column({ nullable: true })
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  @ApiProperty({
    example: 'This weekend only',
    description: 'Email subject line (Email campaigns)',
    required: false,
  })
  @Column({ type: 'varchar', length: 200, nullable: true })
  subject: string | null;

  @ApiProperty({ example: 'https://urbangrill.ng/menu', required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  link: string | null;

  @ApiProperty({ example: 'Urban Grill', required: false })
  @Column({ type: 'varchar', length: 80, nullable: true })
  senderName: string | null;

  @ApiProperty({ example: 'hello@urbangrill.ng', required: false })
  @Column({ type: 'varchar', length: 254, nullable: true })
  replyTo: string | null;

  /** The messaging engine's `message_campaigns` row its messages are filed under. */
  @Column({ type: 'uuid', nullable: true })
  messageCampaignId: string | null;

  /** Customers a scheduled campaign goes to; set by `POST /:id/send`. */
  @Column({ type: 'jsonb', nullable: true, select: false })
  recipientIds: string[] | null;

  @ManyToOne(() => Branch, (branch) => branch.campaigns, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;
}
