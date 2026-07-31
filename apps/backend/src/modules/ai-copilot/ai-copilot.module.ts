import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MessagingModule } from '../messaging/messaging.module';
import { AiCopilotController } from './ai-copilot.controller';
import { AiCopilotService } from './ai-copilot.service';
import { BotRegistry } from './bots/bot-registry';
import { DashboardBot } from './bots/dashboard.bot';
import { CustomersBot } from './bots/customers.bot';
import { AnalyticsBot } from './bots/analytics.bot';
import { InventoryBot } from './bots/inventory.bot';
import { SalesBot } from './bots/sales.bot';
import { LoyaltyBot } from './bots/loyalty.bot';
import { MessagingBot } from './bots/messaging.bot';
import { CatalogueBot } from './bots/catalogue.bot';
import { SalesAnalyticsBot } from './bots/analytics/sales-analytics.bot';
import { CustomerAnalyticsBot } from './bots/analytics/customer-analytics.bot';
import { PeakTimesAnalyticsBot } from './bots/analytics/peak-times-analytics.bot';
import { LowStockBot } from './bots/inventory/low-stock.bot';
import { PosRegisterBot } from './bots/pos/pos-register.bot';
import { ReferralsBot } from './bots/referrals/referrals.bot';
import { AutomationsBot } from './bots/automations/automations.bot';
import { SupportBot } from './bots/support/support.bot';
import { StaffBot } from './bots/staff/staff.bot';
import { PromptBuilder } from './prompts/prompt-builder';
import { ResponseParser } from './prompts/response-parser';
import { OpenAIClient } from './openai/openai.client';
import { LocalFallbackService } from './services/local-fallback.service';
import { AiCreditService } from './services/ai-credit.service';
import { AiCreditUsage } from './entities/ai-credit-usage.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AiCreditUsage, Subscription, Plan]),
    forwardRef(() => MessagingModule),
  ],
  controllers: [AiCopilotController],
  providers: [
    AiCopilotService,
    AiCreditService,
    BotRegistry,
    DashboardBot,
    CustomersBot,
    AnalyticsBot,
    InventoryBot,
    SalesBot,
    LoyaltyBot,
    MessagingBot,
    CatalogueBot,
    SalesAnalyticsBot,
    CustomerAnalyticsBot,
    PeakTimesAnalyticsBot,
    LowStockBot,
    PosRegisterBot,
    ReferralsBot,
    AutomationsBot,
    SupportBot,
    StaffBot,
    PromptBuilder,
    ResponseParser,
    OpenAIClient,
    LocalFallbackService,
  ],
  exports: [AiCopilotService, AiCreditService, OpenAIClient],
})
export class AiCopilotModule {}
