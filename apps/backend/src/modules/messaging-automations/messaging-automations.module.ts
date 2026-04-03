import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationRule } from './entities/automation-rule.entity';
import { ChatSettings } from './entities/chat-settings.entity';
import { FaqTrigger } from './entities/faq-trigger.entity';
import { MessageTemplate } from './entities/message-template.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { MessagingAutomationsService } from './messaging-automations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AutomationRule,
      ChatSettings,
      FaqTrigger,
      MessageTemplate,
      Subscription,
    ]),
  ],
  controllers: [],
  providers: [MessagingAutomationsService],
  exports: [MessagingAutomationsService],
})
export class MessagingAutomationsModule {}
