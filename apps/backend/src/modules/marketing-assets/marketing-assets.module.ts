import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { MarketingTemplate } from './entities/marketing-template.entity';
import { MarketingAsset } from './entities/marketing-asset.entity';
import { MarketingAssetVersion } from './entities/marketing-asset-version.entity';
import { MarketingDownload } from './entities/marketing-download.entity';
import { MarketingMockup } from './entities/marketing-mockup.entity';
import { MarketingAIPrompt } from './entities/marketing-ai-prompt.entity';
import { MarketingAnalytics } from './entities/marketing-analytics.entity';
import { MarketingBrandOverride } from './entities/marketing-brand-override.entity';
import { MarketingCategory } from './entities/marketing-category.entity';
import { MarketingSetting } from './entities/marketing-setting.entity';
import { MarketingBrandRule } from './entities/marketing-brand-rule.entity';
import { MarketingAuditLog } from './entities/marketing-audit-log.entity';
import { MarketingTemplateStyle } from './entities/marketing-template-style.entity';
import { MarketingTemplateFormat } from './entities/marketing-template-format.entity';
import { Business } from '../businesses/entities/business.entity';

// Controllers
import { MarketingTemplatesController } from './controllers/marketing-templates.controller';
import { MarketingAssetsController } from './controllers/marketing-assets.controller';
import { MockupsController } from './controllers/mockups.controller';
import { AIPromptsController } from './controllers/ai-prompts.controller';
import { DownloadsController } from './controllers/downloads.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { BrandProfileController } from './controllers/brand-profile.controller';
import { CategoriesController } from './controllers/categories.controller';
import { SettingsController } from './controllers/settings.controller';
import { BrandRulesController } from './controllers/brand-rules.controller';
import { AuditLogsController } from './controllers/audit-logs.controller';
import { TemplateStylesController } from './controllers/template-styles.controller';
import { TemplateFormatsController } from './controllers/template-formats.controller';

// Services
import { TemplatesService } from './services/templates.service';
import { AssetsService } from './services/assets.service';
import { MockupsService } from './services/mockups.service';
import { AIPromptsService } from './services/ai-prompts.service';
import { DownloadsService } from './services/downloads.service';
import { AnalyticsService } from './services/analytics.service';
import { BrandProfileService } from './services/brand-profile.service';
import { CategoriesService } from './services/categories.service';
import { SettingsService } from './services/settings.service';
import { BrandRulesService } from './services/brand-rules.service';
import { AuditLogService } from './services/audit-log.service';
import { TemplateStylesService } from './services/template-styles.service';
import { TemplateFormatsService } from './services/template-formats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketingTemplate,
      MarketingAsset,
      MarketingAssetVersion,
      MarketingDownload,
      MarketingMockup,
      MarketingAIPrompt,
      MarketingAnalytics,
      MarketingBrandOverride,
      MarketingCategory,
      MarketingSetting,
      MarketingBrandRule,
      MarketingAuditLog,
      MarketingTemplateStyle,
      MarketingTemplateFormat,
      Business,
    ]),
  ],
  controllers: [
    MarketingTemplatesController,
    MarketingAssetsController,
    MockupsController,
    AIPromptsController,
    DownloadsController,
    AnalyticsController,
    BrandProfileController,
    CategoriesController,
    SettingsController,
    BrandRulesController,
    AuditLogsController,
    TemplateStylesController,
    TemplateFormatsController,
  ],
  providers: [
    TemplatesService,
    AssetsService,
    MockupsService,
    AIPromptsService,
    DownloadsService,
    AnalyticsService,
    BrandProfileService,
    CategoriesService,
    SettingsService,
    BrandRulesService,
    AuditLogService,
    TemplateStylesService,
    TemplateFormatsService,
  ],
  exports: [
    TemplatesService,
    AssetsService,
    MockupsService,
    AIPromptsService,
    DownloadsService,
    AnalyticsService,
    BrandProfileService,
    CategoriesService,
    SettingsService,
    BrandRulesService,
    AuditLogService,
    TemplateStylesService,
    TemplateFormatsService,
  ],
})
export class MarketingAssetsModule {}
