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
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId: string | null;

  @Column({ name: 'session_id' })
  @Index()
  sessionId: string;

  @Column('jsonb', { default: [] })
  messages: ChatMessage[];

  @Column({ name: 'current_path', nullable: true, type: 'varchar' })
  currentPath: string | null;

  @Column({ name: 'user_responses', type: 'jsonb', nullable: true })
  userResponses: UserResponses | null;

  @Column({ name: 'last_activity', nullable: true })
  lastActivity: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
