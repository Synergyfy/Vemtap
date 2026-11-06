import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { BotRegistry } from './bots/bot-registry';
import { PromptBuilder } from './prompts/prompt-builder';
import { ResponseParser } from './prompts/response-parser';
import { OpenAIClient } from './openai/openai.client';
import { LocalFallbackService } from './services/local-fallback.service';
import { AiCreditService } from './services/ai-credit.service';
import { AIAnalysisResponse } from './dto/ai-analysis-response.dto';
import { PaymentsService } from '../payments/payments.service';
import { CreditService } from '../messaging/services/credit.service';
import { Channel } from '../messaging/enums/channel.enum';
import { CreditTransactionType } from '../messaging/enums/credit-transaction-type.enum';
import {
  PaymentPurpose,
  PaymentStatus,
} from '../payments/entities/payment.entity';

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
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => CreditService))
    private readonly creditService: CreditService,
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

  async purchaseCredits(
    branchId: string,
    credits: number,
    amount: number,
    reference: string,
  ) {
    // Idempotency: check if reference has already been processed
    const existingPayment =
      await this.paymentsService.findByReference(reference);
    if (existingPayment) {
      this.logger.warn(
        `Idempotency triggered: AI credits purchase for reference ${reference} has already been processed.`,
      );
      return { success: true, message: 'Purchase already processed' };
    }

    // Verify payment via Paystack
    const paymentData = await this.paymentsService.verifyTransaction(reference);
    if (!paymentData) {
      this.logger.error(
        `Payment verification failed for reference: ${reference}`,
      );
      throw new BadRequestException(
        'Payment verification failed. Please check your transaction reference.',
      );
    }

    const paidAmount = Math.round(paymentData.amount / 100);
    if (paidAmount < amount) {
      this.logger.warn(
        `Insufficient payment for AI credits. Expected ${amount}, got ${paidAmount}`,
      );
      throw new BadRequestException(
        `Insufficient payment amount. Expected ${amount}, but verified payment was ${paidAmount}`,
      );
    }

    // Resolve businessId from branchId
    const branch = await this.creditService
      .getOrCreateWallet(branchId)
      .catch(() => null);
    const businessId = branch?.businessId || branchId;

    // Record the payment
    await this.paymentsService.recordPayment({
      reference,
      amount,
      purpose: PaymentPurpose.CREDIT_TOPUP,
      status: PaymentStatus.SUCCESS,
      branchId,
      businessId,
      metadata: { type: 'ai_credits', credits },
    });

    // Add AI credits to wallet
    await this.creditService.addCredits(
      businessId,
      Channel.AI,
      credits,
      CreditTransactionType.CREDIT_TOPUP,
      `AI Credit Pack: ${credits} credits`,
    );

    this.logger.log(
      `AI credits purchased: ${credits} credits for business ${businessId}`,
    );

    return { success: true, credits };
  }
}
