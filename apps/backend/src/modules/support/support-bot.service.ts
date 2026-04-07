import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportKnowledge, BotInteraction } from './entities/support-bot.entity';
import { BotQueryDto } from './dto/support-bot.dto';
import { BotContextService } from './bot-context.service';
import OpenAI from 'openai';

@Injectable()
export class SupportBotService {
  private readonly logger = new Logger(SupportBotService.name);
  private openai: OpenAI;

  constructor(
    @InjectRepository(SupportKnowledge)
    private readonly knowledgeRepo: Repository<SupportKnowledge>,
    @InjectRepository(BotInteraction)
    private readonly interactionRepo: Repository<BotInteraction>,
    private readonly contextService: BotContextService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    });
  }

  async handleQuery(userId: string, dto: BotQueryDto) {
    const { query, context, history } = dto;
    const normalizedQuery = query.toLowerCase().trim();

    // Fetch user context for personalization
    const userContext = await this.contextService.getUserContext(userId);

    // 1. Tier 1: Exact Match in Knowledge Base
    const exactMatch = await this.findExactMatch(normalizedQuery);
    if (exactMatch) {
      const parsedAnswer = this.parseTemplate(exactMatch.answer, userContext, exactMatch.link);
      const interaction = await this.logInteraction(userId, query, parsedAnswer, 'rule', exactMatch.id);
      return { id: interaction.id, content: parsedAnswer, source: 'rule' };
    }

    // 2. Tier 2: Keyword Matching
    const keywordMatch = await this.findKeywordMatch(normalizedQuery);
    if (keywordMatch) {
      const parsedAnswer = this.parseTemplate(keywordMatch.answer, userContext, keywordMatch.link);
      const interaction = await this.logInteraction(userId, query, parsedAnswer, 'rule', keywordMatch.id);
      return { id: interaction.id, content: parsedAnswer, source: 'rule' };
    }

    // 3. Tier 3: AI Fallback (Only if enabled and API key exists)
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key') {
      try {
        const aiResponse = await this.getAIResponse(query, context, history, userContext);
        const interaction = await this.logInteraction(userId, query, aiResponse, 'ai');
        return { id: interaction.id, content: aiResponse, source: 'ai' };
      } catch (error) {
        this.logger.error('OpenAI Error:', error);
      }
    }

    // 4. Final Fallback
    const fallbackMessage = "I'm sorry, I couldn't find a specific answer to that. Would you like to speak with a human agent?";
    const interaction = await this.logInteraction(userId, query, fallbackMessage, 'fallback');
    return { id: interaction.id, content: fallbackMessage, source: 'fallback' };
  }

  async updateInteraction(id: string, wasHelpful: boolean) {
    const interaction = await this.interactionRepo.findOne({ where: { id } });
    if (!interaction) return null;
    interaction.wasHelpful = wasHelpful;
    return this.interactionRepo.save(interaction);
  }

  private parseTemplate(answer: string, context: any, link?: string) {
    if (!context) return answer;

    let finalAnswer = answer
      .replace(/{{name}}/g, context.name || 'there')
      .replace(/{{businessName}}/g, context.businessName || 'your business')
      .replace(/{{smsCredits}}/g, context.credits?.sms?.toString() || '0')
      .replace(/{{emailCredits}}/g, context.credits?.email?.toString() || '0')
      .replace(/{{whatsappCredits}}/g, context.credits?.whatsapp?.toString() || '0')
      .replace(/{{openTickets}}/g, context.openTickets?.toString() || '0');

    if (link) {
      finalAnswer += `\n\n🔗 [Click here to go there](${link})`;
    }

    return finalAnswer;
  }

  private async findExactMatch(query: string) {
    return this.knowledgeRepo.findOne({
      where: { question: query, isActive: true },
    });
  }

  private async findKeywordMatch(query: string) {
    // Basic keyword overlapping search with normalization
    const allKnowledge = await this.knowledgeRepo.find({ where: { isActive: true } });
    
    // Normalize query: lowercase, remove punctuation
    const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 1);

    let bestMatch: SupportKnowledge | null = null;
    let maxOverlap = 0;

    for (const item of allKnowledge) {
      // Normalize keywords from DB
      const itemKeywords = item.keywords.map(kw => kw.toLowerCase().replace(/[^\w\s]/g, ''));
      const overlap = itemKeywords.filter(kw => queryWords.includes(kw)).length;
      
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestMatch = item;
      }
    }

    // Threshold: At least 1 keyword must match
    return maxOverlap > 0 ? bestMatch : null;
  }

  private async getAIResponse(query: string, context?: string, history: any[] = [], userContext?: any) {
    const systemPrompt = `You are the VemTap AI Assistant.
    Help the user with platform questions. 
    Current Context: ${context || 'General Dashboard'}
    User Context: ${JSON.stringify(userContext || {})}
    If you don't know the answer, suggest contacting human support.
    Be concise and professional.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-5).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: query },
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content || 'Internal AI error';
  }

  private async logInteraction(userId: string, query: string, response: string, source: string, knowledgeId?: string) {
    const interaction = this.interactionRepo.create({
      userId,
      query,
      response,
      source,
      knowledgeId,
    });
    const saved = await this.interactionRepo.save(interaction);

    if (knowledgeId) {
      await this.knowledgeRepo.increment({ id: knowledgeId }, 'useCount', 1);
    }

    return saved;
  }

  // --- Admin Methods ---
  async addKnowledge(dto: any) {
    const item = this.knowledgeRepo.create(dto);
    return this.knowledgeRepo.save(item);
  }

  async getMissedQuestions() {
    return this.interactionRepo.find({
      where: { source: 'fallback' },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
