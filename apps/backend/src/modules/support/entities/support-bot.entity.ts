import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ChatButton {
  @ApiProperty()
  label: string;

  @ApiProperty({ enum: ['navigate', 'url', 'action'] })
  action: 'navigate' | 'url' | 'action';

  @ApiProperty()
  value: string;
}

@Entity('support_knowledge')
export class SupportKnowledge extends AbstractBaseEntity {
  @ApiProperty({ example: 'How to top up credits' })
  @Column()
  question: string;

  @ApiProperty({
    example: 'You can top up credits by going to Settings > Billing.',
  })
  @Column('text')
  answer: string;

  @ApiProperty({ example: ['credits', 'topup', 'balance'] })
  @Column('jsonb', { default: [] })
  @Index({ fulltext: true })
  keywords: string[];

  @ApiProperty({ example: 'billing' })
  @Column({ nullable: true, type: 'varchar' })
  category: string | null;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  useCount: number;

  @ApiProperty({ example: 0 })
  @Column({ name: 'confidence', type: 'float', default: 0 })
  confidence: number;

  @ApiProperty({ example: 0 })
  @Column({ name: 'success_rate', type: 'float', default: 0 })
  successRate: number;

  @ApiProperty({ example: 0 })
  @Column({ name: 'match_count', default: 0 })
  matchCount: number;

  @ApiProperty({ example: true })
  @Column({ name: 'is_ai_generated', default: false })
  isAiGenerated: boolean;

  @ApiProperty({ example: '/dashboard/settings/billing' })
  @Column({ nullable: true, type: 'varchar' })
  link: string | null;

  @ApiProperty({
    example: [
      {
        label: 'View Pricing',
        action: 'navigate',
        value: '/dashboard/settings/billing',
      },
    ],
    type: [ChatButton],
  })
  @Column('jsonb', { nullable: true })
  buttons: ChatButton[] | null;
}

@Entity('bot_interactions')
export class BotInteraction extends AbstractBaseEntity {
  @Column({ nullable: true, type: 'varchar' })
  userId: string | null;

  @Column()
  query: string;

  @Column('text')
  response: string;

  @Column({
    enum: ['knowledge_base', 'ai', 'fallback'],
    default: 'knowledge_base',
  })
  source: string;

  @Column({ name: 'confidence', type: 'float', default: 0 })
  confidence: number;

  @Column({ nullable: true, type: 'varchar' })
  knowledgeId: string | null;

  @Column({ default: false })
  wasHelpful: boolean;

  @ApiProperty({ type: [ChatButton] })
  @Column('jsonb', { nullable: true })
  buttons: ChatButton[] | null;

  @Column({ name: 'conversation_path', nullable: true, type: 'varchar' })
  conversationPath: string | null;
}
