import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
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

describe('AiCopilotService', () => {
  let service: AiCopilotService;

  const mockDataSource = {
    query: jest.fn().mockResolvedValue([]),
  };

  const mockAiCreditService = {
    consume: jest.fn().mockResolvedValue(undefined),
    getStatus: jest.fn().mockResolvedValue({ available: 99, used: 1, limit: 100, enabled: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCopilotService,
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
        {
          provide: AiCreditService,
          useValue: mockAiCreditService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(''),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AiCopilotService>(AiCopilotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should analyze main customers page and return valid response shape', async () => {
    const res = await service.analyze('customers', 'branch-123');

    expect(res).toBeDefined();
    expect(res.page).toBe('customers');
    expect(res.summary).toBeDefined();
    expect(Array.isArray(res.insights)).toBe(true);
    expect(Array.isArray(res.recommendations)).toBe(true);
    expect(Array.isArray(res.quickActions)).toBe(true);
    expect(res.creditsUsed).toBe(1);
  });

  it('should analyze sub-pages (analytics-sales, inventory-low-stock, pos-register, referrals) successfully', async () => {
    const pages = ['analytics-sales', 'inventory-low-stock', 'pos-register', 'referrals', 'automations', 'support', 'staff'];

    for (const page of pages) {
      const res = await service.analyze(page, 'branch-123');
      expect(res).toBeDefined();
      expect(res.page).toBe(page);
      expect(res.summary).toBeDefined();
    }
  });

  it('should not return a non-zero repeat rate when total customers is 0', async () => {
    mockDataSource.query.mockResolvedValueOnce([{ total: 0, new_this_month: 0, repeat_rate: null, churn_rate: null, inactive_count: 0, avg_spend: 0 }]);
    const res = await service.analyze('customers', 'branch-empty');

    expect(res).toBeDefined();
    const repeatInsight = res.insights.find((i) => i.title === 'Loyal Retention');
    expect(repeatInsight).toBeUndefined(); // Should not display loyal retention if total customers is 0
  });
});
