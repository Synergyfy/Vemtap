import { Injectable, Logger } from '@nestjs/common';
import { BotRegistry } from './bots/bot-registry';
import { PromptBuilder } from './prompts/prompt-builder';
import { ResponseParser } from './prompts/response-parser';
import { OpenAIClient } from './openai/openai.client';
import { LocalFallbackService } from './services/local-fallback.service';
import { AiCreditService } from './services/ai-credit.service';
import { AIAnalysisResponse } from './dto/ai-analysis-response.dto';

@Injectable()
export class AiCopilotService {
  private readonly logger = new Logger(AiCopilotService.name);

  constructor(
    private readonly botRegistry: BotRegistry,
    private readonly promptBuilder: PromptBuilder,
    private readonly responseParser: ResponseParser,
    private readonly openAiClient: OpenAIClient,
    private readonly localFallback: LocalFallbackService,
    private readonly aiCreditService: AiCreditService,
  ) {}

  async analyze(
    page: string,
    branchId: string,
    context?: Record<string, unknown>,
  ): Promise<AIAnalysisResponse> {
    // 1. Enforce credit limit — throws ForbiddenException if out of credits or not enabled
    await this.aiCreditService.consume(branchId);

    // 2. Get appropriate bot for target page and compute metrics
    const bot = this.botRegistry.get(page);
    const botData = await bot.compute(branchId, context);

    // 3. Build prompts
    const { system, user } = this.promptBuilder.build(page, botData);

    let parsed: Omit<
      AIAnalysisResponse,
      'page' | 'generatedAt' | 'creditsUsed'
    >;

    // 4. Try OpenAI analysis if client is available
    if (this.openAiClient.isAvailable()) {
      try {
        const rawResponse = await this.openAiClient.analyze(system, user);
        parsed = this.responseParser.parse(rawResponse, page);
      } catch (error) {
        this.logger.warn(
          `OpenAI call failed for page "${page}": ${error.message}. Using local fallback heuristics.`,
        );
        parsed = this.localFallback.generate(page, botData);
      }
    } else {
      this.logger.log(`Using local fallback heuristics for page "${page}".`);
      parsed = this.localFallback.generate(page, botData);
    }

    return {
      ...parsed,
      page,
      generatedAt: new Date().toISOString(),
      creditsUsed: 1, // One credit was already deducted above via aiCreditService.consume()
    };
  }

  async getCredits(branchId: string): Promise<{
    available: number;
    used: number;
    limit: number;
    enabled: boolean;
  }> {
    return this.aiCreditService.getStatus(branchId);
  }
}
