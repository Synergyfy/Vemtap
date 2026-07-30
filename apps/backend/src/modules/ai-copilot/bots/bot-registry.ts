import { Injectable, Logger } from '@nestjs/common';
import { IPageBot } from './bot.interface';
import { DashboardBot } from './dashboard.bot';
import { CustomersBot } from './customers.bot';
import { AnalyticsBot } from './analytics.bot';
import { InventoryBot } from './inventory.bot';
import { SalesBot } from './sales.bot';
import { LoyaltyBot } from './loyalty.bot';
import { MessagingBot } from './messaging.bot';
import { CatalogueBot } from './catalogue.bot';
import { SalesAnalyticsBot } from './analytics/sales-analytics.bot';
import { CustomerAnalyticsBot } from './analytics/customer-analytics.bot';
import { PeakTimesAnalyticsBot } from './analytics/peak-times-analytics.bot';
import { LowStockBot } from './inventory/low-stock.bot';
import { PosRegisterBot } from './pos/pos-register.bot';
import { ReferralsBot } from './referrals/referrals.bot';
import { AutomationsBot } from './automations/automations.bot';
import { SupportBot } from './support/support.bot';
import { StaffBot } from './staff/staff.bot';

@Injectable()
export class BotRegistry {
  private bots: Map<string, IPageBot> = new Map();
  private readonly logger = new Logger(BotRegistry.name);

  constructor(
    private readonly dashboardBot: DashboardBot,
    private readonly customersBot: CustomersBot,
    private readonly analyticsBot: AnalyticsBot,
    private readonly inventoryBot: InventoryBot,
    private readonly salesBot: SalesBot,
    private readonly loyaltyBot: LoyaltyBot,
    private readonly messagingBot: MessagingBot,
    private readonly catalogueBot: CatalogueBot,
    private readonly salesAnalyticsBot: SalesAnalyticsBot,
    private readonly customerAnalyticsBot: CustomerAnalyticsBot,
    private readonly peakTimesAnalyticsBot: PeakTimesAnalyticsBot,
    private readonly lowStockBot: LowStockBot,
    private readonly posRegisterBot: PosRegisterBot,
    private readonly referralsBot: ReferralsBot,
    private readonly automationsBot: AutomationsBot,
    private readonly supportBot: SupportBot,
    private readonly staffBot: StaffBot,
  ) {
    this.register('dashboard', this.dashboardBot);
    this.register('customers', this.customersBot);
    this.register('visitors', this.customersBot);
    this.register('feedback', this.customersBot);
    this.register('intelligence', this.customersBot);

    this.register('analytics', this.analyticsBot);
    this.register('analytics-sales', this.salesAnalyticsBot);
    this.register('analytics-customers', this.customerAnalyticsBot);
    this.register('analytics-marketing', this.analyticsBot);
    this.register('analytics-footfall', this.peakTimesAnalyticsBot);
    this.register('analytics-peak-times', this.peakTimesAnalyticsBot);

    this.register('inventory', this.inventoryBot);
    this.register('inventory-stock', this.inventoryBot);
    this.register('inventory-low-stock', this.lowStockBot);
    this.register('products-stock', this.inventoryBot);

    this.register('pos', this.salesBot);
    this.register('pos-register', this.posRegisterBot);
    this.register('pos-sales', this.salesBot);
    this.register('sales', this.salesBot);
    this.register('commerce', this.salesBot);

    this.register('loyalty', this.loyaltyBot);
    this.register('messaging', this.messagingBot);
    this.register('catalogue', this.catalogueBot);

    this.register('referrals', this.referralsBot);
    this.register('referrals-link', this.referralsBot);
    this.register('referrals-tracking', this.referralsBot);
    this.register('referrals-payouts', this.referralsBot);
    this.register('referrals-earnings', this.referralsBot);

    this.register('automations', this.automationsBot);
    this.register('automations-welcome', this.automationsBot);
    this.register('automations-reactivation', this.automationsBot);

    this.register('support', this.supportBot);
    this.register('support-agents', this.supportBot);
    this.register('support-automations', this.supportBot);

    this.register('staff', this.staffBot);
  }

  register(pageKey: string, bot: IPageBot) {
    this.bots.set(pageKey, bot);
  }

  get(pageKey: string): IPageBot {
    const mainKey = pageKey.split('/')[0];
    const bot = this.bots.get(pageKey) || this.bots.get(mainKey);
    if (!bot) {
      this.logger.warn(
        `No bot found for page '${pageKey}'. Falling back to DashboardBot.`,
      );
      return this.dashboardBot;
    }
    return bot;
  }
}
