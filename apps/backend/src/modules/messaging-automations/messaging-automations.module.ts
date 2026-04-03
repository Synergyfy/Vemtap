import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationRule } from './entities/automation-rule.entity';
import { ChatSettings } from './entities/chat-settings.entity';
import { FaqTrigger } from './entities/faq-trigger.entity';
import { MessageTemplate } from './entities/message-template.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { MessagingAutomationsService } from './messaging-automations.service';
import { AutomationRuleController } from './automation-rule.controller';
import { MessagingChatSettingsController } from './messaging-chat-settings.controller';
import { MessageTemplateController } from './message-template.controller';

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
  controllers: [
    AutomationRuleController,
    MessagingChatSettingsController,
    MessageTemplateController,
  ],
  providers: [MessagingAutomationsService],
  exports: [MessagingAutomationsService],
})
export class MessagingAutomationsModule {}
