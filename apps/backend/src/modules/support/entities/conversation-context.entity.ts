import { Entity, Column, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  messageId?: string;
}

interface UserResponses {
  businessType?: string;
  customerVolume?: string;
  challenge?: string;
  intent?: string;
  [key: string]: any;
}

@Entity('bot_conversation_context')
@Index(['userId', 'sessionId'])
export class BotConversationContext extends AbstractBaseEntity {
  @Column()
  @Index()
  userId: string;

  @Column()
  sessionId: string;

  @Column('jsonb', { default: [] })
  messages: ChatMessage[];

  @Column({ nullable: true, type: 'varchar' })
  currentPath: string | null;

  @Column('jsonb', { nullable: true })
  userResponses: UserResponses | null;

  @Column({ nullable: true })
  lastActivity: Date;

  @Column({ default: true })
  isActive: boolean;
}
