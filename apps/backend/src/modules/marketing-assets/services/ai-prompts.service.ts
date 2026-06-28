import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingAIPrompt } from '../entities/marketing-ai-prompt.entity';
import { CreateAIPromptDto } from '../dto/create-ai-prompt.dto';
import { GenerateAIContentDto } from '../dto/generate-ai-content.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAI } from 'openai';

@Injectable()
export class AIPromptsService {
  private openAiClient: OpenAI | null = null;
  private geminiClient: any = null;

  constructor(
    @InjectRepository(MarketingAIPrompt)
    private readonly promptRepo: Repository<MarketingAIPrompt>,
  ) {
    // Initialise clients if API keys are available in env
    if (process.env.OPENAI_API_KEY) {
      this.openAiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.GEMINI_API_KEY) {
      // @google/generative-ai SDK setup
      this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  async create(createDto: CreateAIPromptDto): Promise<MarketingAIPrompt> {
    const prompt = this.promptRepo.create(createDto);
    return this.promptRepo.save(prompt);
  }

  async findAll(activeOnly = true): Promise<MarketingAIPrompt[]> {
    const query = this.promptRepo.createQueryBuilder('prompt');
    if (activeOnly) {
      query.andWhere('prompt.isActive = :isActive', { isActive: true });
    }
    return query
      .orderBy('prompt.category', 'ASC')
      .addOrderBy('prompt.name', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<MarketingAIPrompt> {
    const prompt = await this.promptRepo.findOne({ where: { id } });
    if (!prompt) {
      throw new NotFoundException(`AI prompt with ID ${id} not found`);
    }
    return prompt;
  }

  async update(
    id: string,
    updateDto: Partial<CreateAIPromptDto>,
  ): Promise<MarketingAIPrompt> {
    const prompt = await this.findOne(id);
    Object.assign(prompt, updateDto);
    return this.promptRepo.save(prompt);
  }

  async remove(id: string): Promise<void> {
    const prompt = await this.findOne(id);
    await this.promptRepo.remove(prompt);
  }

  async generateContent(dto: GenerateAIContentDto): Promise<{ text: string }> {
    const promptTemplate = await this.findOne(dto.promptId);

    // Format prompt template with parameters
    let promptText = promptTemplate.promptTemplate;
    const params = {
      businessType: dto.businessType || 'business',
      businessName: dto.businessName || 'our store',
      subject: dto.subject || 'Google Reviews',
      tone: dto.tone || 'Friendly and Catchy',
    };

    for (const [key, value] of Object.entries(params)) {
      promptText = promptText.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    // 1. Try Gemini if configured
    if (this.geminiClient) {
      try {
        const model = this.geminiClient.getGenerativeModel({
          model: 'gemini-flash-latest',
        });
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text()?.trim();
        if (text) return { text };
      } catch (e) {
        console.warn('Gemini Generation failed, falling back to Local', e);
      }
    }

    // 3. Fallback: High-Quality Local Heuristics
    const fallbackOptions: Record<string, string[]> = {
      'review request': [
        `Love our food? Scan the QR code to review us on Google & help other foodies find ${params.businessName}!`,
        `Your feedback makes our day! Tap here or scan to leave a review for ${params.businessName}. Thank you!`,
        `Had a great experience at ${params.businessName}? Leave a quick Google review & let us know how we did!`,
      ],
      'discount promo': [
        `Scan & unlock a special 15% discount on your next bill at ${params.businessName}!`,
        `Thank you for being our guest! Scan this QR code to claim your surprise reward today.`,
        `Flash Sale! Scan now to get exclusive deals directly on your phone at ${params.businessName}.`,
      ],
      'social follow': [
        `Stay connected! Scan here to follow ${params.businessName} on Instagram for daily specials & behind-the-scenes!`,
        `Join the community! Scan code to follow us on Instagram & TikTok for exclusive subscriber discounts!`,
        `Love what you see? Scan to join our mailing list for direct deals & event invites!`,
      ],
      'contactless menu': [
        `Welcome to ${params.businessName}! Scan this QR code to browse our full digital menu & specials!`,
        `Skip the wait! Scan the QR code to view our menu & order directly from your table.`,
        `Hungry? Scan to check out our seasonal menu items, allergens, and drink specials!`,
      ],
    };

    const key = promptTemplate.category.toLowerCase();
    const suggestions = fallbackOptions[key] || [
      `Welcome to ${params.businessName}! Scan the QR code to connect with us & learn more about our ${params.businessType} services!`,
      `Thank you for choosing ${params.businessName}! Scan here to view our digital portal & latest offerings!`,
      `Scan now to experience the best of ${params.businessName} instantly on your smartphone!`,
    ];

    // Pick a random suggestion
    const randomIdx = Math.floor(Math.random() * suggestions.length);
    return { text: suggestions[randomIdx] };
  }
}
