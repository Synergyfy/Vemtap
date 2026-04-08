import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportKnowledge, BotInteraction, ChatButton } from './entities/support-bot.entity';
import { BotQueryDto, BotResponseDto } from './dto/support-bot.dto';
import { BotContextService } from './bot-context.service';
import { ConversationContextService } from './conversation-context.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

interface MatchResult {
  knowledge: SupportKnowledge;
  confidence: number;
  matchType: 'exact' | 'keyword' | 'semantic';
}

@Injectable()
export class SupportBotService {
  private readonly logger = new Logger(SupportBotService.name);
  private genAI: GoogleGenerativeAI;
  private readonly CONFIDENCE_THRESHOLD = 70;
  private readonly GEMINI_MODEL = 'gemini-2.5-flash-lite';

  constructor(
    @InjectRepository(SupportKnowledge)
    private readonly knowledgeRepo: Repository<SupportKnowledge>,
    @InjectRepository(BotInteraction)
    private readonly interactionRepo: Repository<BotInteraction>,
    private readonly contextService: BotContextService,
    private readonly conversationContext: ConversationContextService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('Gemini AI initialized successfully');
    } else {
      this.logger.warn('GEMINI_API_KEY not found - AI responses will use fallback');
    }
  }

  async handleQuery(userId: string, dto: BotQueryDto): Promise<BotResponseDto> {
    const { query, context, sessionId } = dto;
    const normalizedQuery = query.toLowerCase().trim();

    const userContext = await this.contextService.getUserContext(userId);
    const convContext = await this.conversationContext.getOrCreateContext(userId, sessionId);
    const recentMessages = await this.conversationContext.getRecentMessages(userId, sessionId || '', 10);

    await this.conversationContext.addMessage(userId, sessionId || convContext.sessionId, 'user', query);

    // Handle casual acknowledgments (hmm, okay, yes, no)
    const casualResponse = this.handleCasualMessage(normalizedQuery);
    if (casualResponse) {
      const interaction = await this.logInteraction(userId, query, casualResponse.content, 'knowledge_base', 100, casualResponse.buttons, convContext.currentPath || undefined);
      await this.conversationContext.addMessage(userId, sessionId || convContext.sessionId, 'bot', casualResponse.content, interaction.id);
      return {
        id: interaction.id,
        content: casualResponse.content,
        source: 'knowledge_base',
        confidence: 100,
        buttons: casualResponse.buttons,
        conversationPath: convContext.currentPath || undefined,
      };
    }

    // Handle identity/meta questions (who are you, are you human)
    const identityResponse = this.handleIdentityQuestion(normalizedQuery);
    if (identityResponse) {
      const interaction = await this.logInteraction(userId, query, identityResponse.content, 'knowledge_base', 100, identityResponse.buttons, convContext.currentPath || undefined);
      await this.conversationContext.addMessage(userId, sessionId || convContext.sessionId, 'bot', identityResponse.content, interaction.id);
      return {
        id: interaction.id,
        content: identityResponse.content,
        source: 'knowledge_base',
        confidence: 100,
        buttons: identityResponse.buttons,
        conversationPath: convContext.currentPath || undefined,
      };
    }

    if (this.isGreeting(normalizedQuery)) {
      const greeting = this.generateGreetingResponse(userContext, convContext.currentPath || undefined);
      const buttons = this.getGreetingButtons();
      const interaction = await this.logInteraction(userId, query, greeting, 'knowledge_base', 100, buttons, convContext.currentPath || undefined);
      
      await this.conversationContext.addMessage(userId, sessionId || convContext.sessionId, 'bot', greeting, interaction.id);
      
      return {
        id: interaction.id,
        content: greeting,
        source: 'knowledge_base',
        confidence: 100,
        buttons,
        conversationPath: convContext.currentPath || undefined,
      };
    }

    const pathResponse = await this.handleConversationPath(normalizedQuery, query, convContext, userId, sessionId || convContext.sessionId);
    if (pathResponse) {
      return pathResponse;
    }

    const matchResult = await this.findBestMatch(normalizedQuery);
    
    if (matchResult && matchResult.confidence >= this.CONFIDENCE_THRESHOLD) {
      const parsedAnswer = this.parseTemplate(matchResult.knowledge.answer, userContext);
      const buttons = matchResult.knowledge.buttons || this.getDefaultButtons(matchResult.knowledge.category || undefined);
      const interaction = await this.logInteraction(userId, query, parsedAnswer, 'knowledge_base', matchResult.confidence, buttons, convContext.currentPath || undefined);
      
      await this.conversationContext.addMessage(userId, sessionId || convContext.sessionId, 'bot', parsedAnswer, interaction.id);
      await this.knowledgeRepo.increment({ id: matchResult.knowledge.id }, 'useCount', 1);
      await this.knowledgeRepo.increment({ id: matchResult.knowledge.id }, 'matchCount', 1);
      
      return {
        id: interaction.id,
        content: parsedAnswer,
        source: 'knowledge_base',
        confidence: matchResult.confidence,
        buttons,
        conversationPath: convContext.currentPath || undefined,
      };
    }

    if (this.genAI) {
      try {
        const aiResponse = await this.getGeminiResponse(query, context, recentMessages, userContext, convContext);
        
        if (aiResponse.answer) {
          await this.autoSaveToKnowledgeBase(query, aiResponse.answer, aiResponse.buttons);
          
          const interaction = await this.logInteraction(userId, query, aiResponse.answer, 'ai', 50, aiResponse.buttons, convContext.currentPath || undefined);
          await this.conversationContext.addMessage(userId, sessionId || convContext.sessionId, 'bot', aiResponse.answer, interaction.id);
          
          return {
            id: interaction.id,
            content: aiResponse.answer,
            source: 'ai',
            confidence: 50,
            buttons: aiResponse.buttons,
            followUp: aiResponse.followUp,
            conversationPath: convContext.currentPath || undefined,
          };
        }
      } catch (error) {
        this.logger.error('Gemini AI Error:', error);
      }
    }

    const fallbackMessage = this.getFallbackMessage(query);
    const buttons = this.getFallbackButtons();
    const interaction = await this.logInteraction(userId, query, fallbackMessage, 'fallback', 0, buttons, convContext.currentPath || undefined);
    await this.conversationContext.addMessage(userId, sessionId || convContext.sessionId, 'bot', fallbackMessage, interaction.id);
    
    return {
      id: interaction.id,
      content: fallbackMessage,
      source: 'fallback',
      confidence: 0,
      buttons,
      conversationPath: convContext.currentPath || undefined,
    };
  }

  private async handleConversationPath(
    normalizedQuery: string,
    originalQuery: string,
    convContext: any,
    userId: string,
    sessionId: string,
  ): Promise<BotResponseDto | null> {
    const path = convContext.currentPath;

    if (!path) {
      const pathTrigger = this.detectPathTrigger(normalizedQuery);
      if (pathTrigger) {
        await this.conversationContext.setPath(userId, sessionId, pathTrigger);
        convContext.currentPath = pathTrigger;
        return this.logPathResponse(await this.getPathResponse(pathTrigger, originalQuery, userId, sessionId), userId, originalQuery, sessionId);
      }
      return null;
    }

    let result: BotResponseDto | null = null;
    switch (path) {
      case 'grow_business':
        result = this.handleGrowBusinessPath(normalizedQuery, originalQuery, convContext, userId, sessionId);
        break;
      case 'exploring':
        result = this.handleExploringPath(normalizedQuery, originalQuery, convContext, userId, sessionId);
        break;
      case 'need_help':
        result = this.handleNeedHelpPath(normalizedQuery, originalQuery, convContext, userId, sessionId);
        break;
    }

    if (result) {
      return this.logPathResponse(result, userId, originalQuery, sessionId);
    }
    return null;
  }

  private async logPathResponse(response: BotResponseDto, userId: string, query: string, sessionId: string): Promise<BotResponseDto> {
    const interaction = await this.logInteraction(userId, query, response.content, 'knowledge_base', response.confidence, response.buttons, response.conversationPath);
    await this.conversationContext.addMessage(userId, sessionId, 'bot', response.content, interaction.id);
    return {
      ...response,
      id: interaction.id,
    };
  }

  private detectPathTrigger(query: string): string | null {
    const growTriggers = ['grow', 'grow my business', 'start', 'get started', 'increase sales', 'more customers', 'business growth'];
    const exploreTriggers = ['exploring', 'learn', 'features', 'pricing', 'how it works', 'information'];
    const helpTriggers = ['help', 'support', 'issue', 'problem', 'not working', 'error'];

    for (const trigger of growTriggers) {
      if (query.includes(trigger)) return 'grow_business';
    }
    for (const trigger of exploreTriggers) {
      if (query.includes(trigger)) return 'exploring';
    }
    for (const trigger of helpTriggers) {
      if (query.includes(trigger)) return 'need_help';
    }
    return null;
  }

  private getPathResponse(path: string, query: string, userId: string, sessionId: string): BotResponseDto {
    const buttons: ChatButton[] = [];

    switch (path) {
      case 'grow_business':
        return {
          id: '',
          content: "Great! What type of business do you run?",
          source: 'knowledge_base',
          confidence: 100,
          buttons: [
            { label: 'Fashion', action: 'action', value: 'fashion' },
            { label: 'Restaurant', action: 'action', value: 'restaurant' },
            { label: 'Service', action: 'action', value: 'service' },
            { label: 'Other', action: 'action', value: 'other' },
          ],
          conversationPath: path,
          suggestedAction: 'business_type_selection',
        };
      case 'exploring':
        return {
          id: '',
          content: "No problem! What would you like to learn about?",
          source: 'knowledge_base',
          confidence: 100,
          buttons: [
            { label: 'Features', action: 'action', value: 'features' },
            { label: 'Pricing', action: 'action', value: 'pricing' },
            { label: 'How It Works', action: 'action', value: 'how_it_works' },
          ],
          conversationPath: path,
          suggestedAction: 'topic_selection',
        };
      case 'need_help':
        return {
          id: '',
          content: "I'm here to help. What do you need assistance with?",
          source: 'knowledge_base',
          confidence: 100,
          buttons: [
            { label: 'Account Issue', action: 'action', value: 'account_issue' },
            { label: 'Setup Help', action: 'action', value: 'setup_help' },
            { label: 'Talk to Human', action: 'action', value: 'human_agent' },
          ],
          conversationPath: path,
          suggestedAction: 'help_type_selection',
        };
      default:
        return {
          id: '',
          content: "How can I help you?",
          source: 'knowledge_base',
          confidence: 100,
          buttons: this.getDefaultButtons('general'),
          conversationPath: path,
        };
    }
  }

  private handleGrowBusinessPath(
    query: string,
    originalQuery: string,
    convContext: any,
    userId: string,
    sessionId: string,
  ): BotResponseDto | null {
    const responses = convContext.userResponses || {};

    if (!responses.businessType) {
      const businessTypes = ['fashion', 'restaurant', 'service', 'other'];
      const selectedType = businessTypes.find(type => query.includes(type));
      
      if (selectedType) {
        this.conversationContext.addUserResponse(userId, sessionId, 'businessType', selectedType);
        return {
          id: '',
          content: `Great! ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} businesses use VemTap to capture customers and grow sales. How many customers do you get daily?`,
          source: 'knowledge_base',
          confidence: 100,
          buttons: [
            { label: '1-10', action: 'action', value: '1-10' },
            { label: '10-50', action: 'action', value: '10-50' },
            { label: '50+', action: 'action', value: '50+' },
          ],
          conversationPath: 'grow_business',
          suggestedAction: 'customer_volume_selection',
        };
      }
      return null;
    }

    if (!responses.customerVolume) {
      const volumes = ['1-10', '10-50', '50+'];
      const selectedVolume = volumes.find(v => query.includes(v));
      
      if (selectedVolume) {
        this.conversationContext.addUserResponse(userId, sessionId, 'customerVolume', selectedVolume);
        return {
          id: '',
          content: "What is your biggest challenge right now?",
          source: 'knowledge_base',
          confidence: 100,
          buttons: [
            { label: 'Getting customers', action: 'action', value: 'getting_customers' },
            { label: 'Tracking customers', action: 'action', value: 'tracking' },
            { label: 'Increasing sales', action: 'action', value: 'sales' },
            { label: 'Managing orders', action: 'action', value: 'orders' },
          ],
          conversationPath: 'grow_business',
          suggestedAction: 'challenge_selection',
        };
      }
      return null;
    }

    if (!responses.challenge) {
      const challenges = ['getting_customers', 'tracking', 'sales', 'orders'];
      const selectedChallenge = challenges.find(c => query.includes(c.replace('_', ' ')));
      
      if (selectedChallenge) {
        this.conversationContext.addUserResponse(userId, sessionId, 'challenge', selectedChallenge);
        
        const businessType = responses.businessType;
        const volume = responses.customerVolume;
        const recommendation = this.getRecommendation(businessType, volume, selectedChallenge);
        
        return {
          id: '',
          content: recommendation,
          source: 'knowledge_base',
          confidence: 100,
          buttons: [
            { label: 'Get Started', action: 'url', value: '/auth/signup' },
            { label: 'Talk to Human', action: 'action', value: 'human_agent' },
          ],
          conversationPath: 'grow_business',
          suggestedAction: 'conversion',
        };
      }
      return null;
    }

    return null;
  }

  private handleExploringPath(
    query: string,
    originalQuery: string,
    convContext: any,
    userId: string,
    sessionId: string,
  ): BotResponseDto | null {
    const responses = convContext.userResponses || {};

    if (!responses.topic) {
      const topics = ['features', 'pricing', 'how_it_works'];
      const selectedTopic = topics.find(t => query.includes(t));
      
      if (selectedTopic) {
        this.conversationContext.addUserResponse(userId, sessionId, 'topic', selectedTopic);
        
        const responses: Record<string, { content: string; buttons: ChatButton[] }> = {
          features: {
            content: "VemTap helps you capture customers, engage them, and grow your business using QR codes, NFC, and smart links.",
            buttons: [
              { label: 'See How It Works', action: 'url', value: '/features' },
              { label: 'Get Started', action: 'url', value: '/auth/signup' },
            ],
          },
          pricing: {
            content: "We offer flexible plans for all business sizes, including a free plan to get started.",
            buttons: [
              { label: 'View Pricing', action: 'url', value: '/pricing' },
              { label: 'Talk to Human', action: 'action', value: 'human_agent' },
            ],
          },
          how_it_works: {
            content: "Customers scan your QR code, interact with your business, and you capture their details for follow-up and engagement.",
            buttons: [
              { label: 'Try Demo', action: 'url', value: '/demo' },
              { label: 'Get Started', action: 'url', value: '/auth/signup' },
            ],
          },
        };
        
        const response = responses[selectedTopic] || responses.features;
        return {
          id: '',
          content: response.content,
          source: 'knowledge_base',
          confidence: 100,
          buttons: response.buttons,
          conversationPath: 'exploring',
        };
      }
      return null;
    }

    return null;
  }

  private handleNeedHelpPath(
    query: string,
    originalQuery: string,
    convContext: any,
    userId: string,
    sessionId: string,
  ): BotResponseDto | null {
    if (query.includes('human') || query.includes('agent') || query.includes('real person')) {
      return {
        id: '',
        content: "Let me connect you to a human agent for better assistance.",
        source: 'knowledge_base',
        confidence: 100,
        buttons: [
          { label: 'Chat on WhatsApp', action: 'url', value: 'https://wa.me/234XXXXXXXXXX' },
          { label: 'Open Support Ticket', action: 'action', value: 'open_ticket' },
        ],
        conversationPath: 'need_help',
        suggestedAction: 'escalate',
      };
    }

    if (query.includes('account')) {
      return {
        id: '',
        content: "I can help with account issues. What seems to be the problem? (e.g., can't login, password reset, billing)",
        source: 'knowledge_base',
        confidence: 100,
        buttons: [
          { label: 'Talk to Human', action: 'action', value: 'human_agent' },
        ],
        conversationPath: 'need_help',
      };
    }

    if (query.includes('setup')) {
      return {
        id: '',
        content: "Let's get you set up! Visit your dashboard settings or I can guide you step by step.",
        source: 'knowledge_base',
        confidence: 100,
        buttons: [
          { label: 'Go to Dashboard', action: 'url', value: '/dashboard' },
          { label: 'Talk to Human', action: 'action', value: 'human_agent' },
        ],
        conversationPath: 'need_help',
      };
    }

    return null;
  }

  private getRecommendation(businessType: string, volume: string, challenge: string): string {
    const recommendations: Record<string, string> = {
      fashion: "Fashion stores use VemTap to capture customer details, promote new arrivals, and follow up with buyers. This can help you increase repeat purchases.",
      restaurant: "Restaurants use VemTap to take orders, reduce wait time, and manage customer flow. Perfect for increasing turnover during peak hours.",
      service: "Service providers like barbers and salons use VemTap to allow customers to book appointments and reduce waiting time.",
      other: "VemTap helps businesses of all types capture customer data, engage visitors, and increase sales through QR codes and NFC.",
    };

    const baseRecommendation = recommendations[businessType] || recommendations.other;
    return `${baseRecommendation}\n\nBased on your needs, VemTap can help you ${this.getChallengeSolution(challenge)}. Would you like to get started?`;
  }

  private getChallengeSolution(challenge: string): string {
    const solutions: Record<string, string> = {
      getting_customers: 'attract more customers through smart QR and NFC marketing',
      tracking: 'track every visitor and customer interaction automatically',
      sales: 'turn more visitors into paying customers with automated follow-ups',
      orders: 'manage orders and customer requests more efficiently',
    };
    return solutions[challenge] || 'grow your business';
  }

  private async findBestMatch(query: string): Promise<MatchResult | null> {
    const exactMatch = await this.findExactMatch(query);
    if (exactMatch) {
      return { knowledge: exactMatch, confidence: 95, matchType: 'exact' };
    }

    const keywordMatches = await this.findKeywordMatches(query);
    if (keywordMatches.length > 0) {
      return keywordMatches[0];
    }

    const semanticMatch = await this.findSemanticMatch(query);
    if (semanticMatch) {
      return semanticMatch;
    }

    return null;
  }

  private async findExactMatch(query: string): Promise<SupportKnowledge | null> {
    return this.knowledgeRepo.findOne({
      where: { question: query, isActive: true },
    });
  }

  private async findKeywordMatches(query: string): Promise<MatchResult[]> {
    const allKnowledge = await this.knowledgeRepo.find({ where: { isActive: true } });
    
    const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    
    const results: MatchResult[] = [];

    for (const item of allKnowledge) {
      const itemKeywords = item.keywords.map(kw => kw.toLowerCase().replace(/[^\w\s]/g, ''));
      const itemText = (item.question + ' ' + item.answer).toLowerCase().replace(/[^\w\s]/g, '');
      const itemWords = itemText.split(/\s+/).filter(w => w.length > 2);

      let score = 0;
      let keywordMatches = 0;

      for (const word of queryWords) {
        if (itemKeywords.includes(word)) {
          score += 3;
          keywordMatches++;
        }
        if (itemWords.includes(word)) {
          score += 1;
        }
      }

      const jaccard = this.jaccardSimilarity(queryWords, itemWords);
      score += jaccard * 10;

      if (score > 0) {
        let confidence = Math.min(score * 10, 95);
        
        const useBoost = Math.min((item.useCount || 0) / 50, 0.15) * 100;
        confidence += useBoost;
        
        const successBoost = (item.successRate || 0) * 10;
        confidence += successBoost;
        
        if (query.length < 15) confidence *= 0.9;
        
        confidence = Math.min(confidence, 95);

        results.push({
          knowledge: item,
          confidence: Math.round(confidence * 10) / 10,
          matchType: 'keyword',
        });
      }
    }

    return results
      .filter(r => r.confidence >= 30)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  private async findSemanticMatch(query: string): Promise<MatchResult | null> {
    const allKnowledge = await this.knowledgeRepo.find({ 
      where: { isActive: true },
      order: { useCount: 'DESC' },
      take: 20,
    });

    const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    
    let bestMatch: MatchResult | null = null;
    let bestScore = 0;

    for (const item of allKnowledge) {
      const itemText = (item.question + ' ' + item.answer + ' ' + item.keywords.join(' ')).toLowerCase();
      const itemWords = itemText.split(/[^\w]+/).filter(w => w.length > 2);
      
      const intersection = queryWords.filter(w => 
        itemWords.some(iw => iw.includes(w) || w.includes(iw))
      );
      
      const union = [...new Set([...queryWords, ...itemWords])];
      const similarity = intersection.length / union.length;
      
      const score = similarity * 50 + (item.useCount || 0) * 0.1;
      
      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestMatch = {
          knowledge: item,
          confidence: Math.round(score * 40 * 10) / 10,
          matchType: 'semantic',
        };
      }
    }

    return bestMatch;
  }

  private jaccardSimilarity(set1: string[], set2: string[]): number {
    if (set1.length === 0 || set2.length === 0) return 0;
    const s1 = new Set(set1);
    const s2 = new Set(set2);
    const intersection = [...s1].filter(x => s2.has(x)).length;
    const union = new Set([...s1, ...s2]).size;
    return intersection / union;
  }

  private async getGeminiResponse(
    query: string,
    context?: string,
    history: any[] = [],
    userContext?: any,
    convContext?: any,
  ): Promise<{ answer: string; buttons?: ChatButton[]; followUp?: string[] }> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    const model = this.genAI.getGenerativeModel({ model: this.GEMINI_MODEL });

    const relevantKnowledge = await this.findKnowledgeContext(query);
    const knowledgeContext = relevantKnowledge.length > 0
      ? `Relevant Information from our Knowledge Base:\n${relevantKnowledge.map(k => `- Question: ${k.question}\n  Answer: ${k.answer}`).join('\n')}`
      : 'No specific knowledge base articles found for this query.';

    const conversationHistory = history.length > 0
      ? `Recent Conversation:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}`
      : 'No previous messages in this conversation.';

    const prompt = `You are the VemTap AI Assistant — a warm, professional, sales-savvy chatbot for VemTap, a business growth platform that helps businesses capture customer data, engage visitors, and increase sales using QR codes, NFC, and smart links.

IMPORTANT PERSONALITY & BRAND VOICE:
- Be warm, friendly, and use emojis naturally (👋 😊 🚀 ✅ 💡)
- Keep responses concise (under 150 words)
- Always guide users toward getting started or learning more
- When you don't know something, offer to connect with a human agent — never make up features
- For the Nigerian market: be empathetic about budget concerns, tech worries, and WhatsApp-first mindset

OBJECTION HANDLING:
- "I don't have money" → Highlight the free plan, zero risk
- "My customers don't use QR codes" → Mention NFC (just tap, no app needed) and links
- "I already use WhatsApp" → VemTap works alongside WhatsApp for data capture
- "I don't understand technology" → Emphasize simplicity, offer step-by-step guidance
- "Is it worth it?" → Share value proposition: turn visitors into paying customers

ABOUT VEMTAP:
- Business growth platform for capturing customer data via NFC, QR codes, and links
- Features: visitor tracking, messaging (SMS/WhatsApp/Email), loyalty programs, analytics, digital catalogue, surveys, multi-branch support
- Free plan available, paid plans for more features
- Built for Nigeria, works globally
- No app download needed — works from browser

USER CONTEXT:
- Name: ${userContext?.name || 'there'}
- Business: ${userContext?.businessName || 'VemTap User'}
- Credits: SMS(${userContext?.credits?.sms || 0}), Email(${userContext?.credits?.email || 0}), WhatsApp(${userContext?.credits?.whatsapp || 0})

CURRENT PAGE CONTEXT: ${context || 'General Dashboard'}

${conversationHistory}

${knowledgeContext}

RESPONSE RULES:
1. Answer the user's question based on the knowledge base and context provided.
2. ALWAYS include 1-3 relevant action buttons in your response.
3. Common button actions: Get Started (/auth/signup), View Pricing (/pricing), Talk to Human (action:human_agent), Chat on WhatsApp (url:https://wa.me/234XXXXXXXXXX), View Dashboard (/dashboard)
4. If the user shows high intent ("I'm ready", "how do I start?"), push for signup.
5. If the user seems confused after 2+ messages, offer human escalation.

Respond ONLY in this JSON format (no other text):
{
  "answer": "Your response text here...",
  "buttons": [{"label": "Button Label", "action": "url", "value": "/path or https://..."}],
  "followUp": ["Optional follow-up question 1", "Optional follow-up question 2"]
}

User's question: ${query}`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          answer: parsed.answer || "I'm not sure how to help with that.",
          buttons: parsed.buttons || this.getDefaultButtons('general'),
          followUp: parsed.followUp,
        };
      }
      
      return { answer: text, buttons: this.getDefaultButtons('general') };
    } catch (error) {
      this.logger.error('Gemini response error:', error);
      throw error;
    }
  }

  private async findKnowledgeContext(query: string): Promise<SupportKnowledge[]> {
    const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    
    if (queryWords.length === 0) return [];

    const allKnowledge = await this.knowledgeRepo.find({ where: { isActive: true } });
    
    const scored = allKnowledge.map(item => {
      let score = 0;
      const itemText = (item.question + ' ' + item.answer + ' ' + item.keywords.join(' ')).toLowerCase();
      
      for (const word of queryWords) {
        if (itemText.includes(word)) score++;
        if (item.keywords.some(kw => kw.toLowerCase().includes(word) || word.includes(kw.toLowerCase()))) score += 2;
      }
      return { item, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.item);
  }

  private async autoSaveToKnowledgeBase(query: string, answer: string, buttons?: ChatButton[]): Promise<void> {
    try {
      const keywords = this.extractKeywords(query);
      
      const existing = await this.knowledgeRepo.findOne({ where: { question: query } });
      if (existing) return;

      const newKnowledge = this.knowledgeRepo.create({
        question: query,
        answer,
        keywords,
        category: this.categorizeQuery(query),
        isActive: true,
        isAiGenerated: true,
        useCount: 0,
        confidence: 50,
        successRate: 0,
        matchCount: 0,
        buttons: buttons || this.getDefaultButtons('general'),
      });
      
      await this.knowledgeRepo.save(newKnowledge);
      this.logger.log(`Auto-saved new knowledge: ${query.substring(0, 50)}...`);
    } catch (error) {
      this.logger.error('Failed to auto-save knowledge:', error);
    }
  }

  private extractKeywords(query: string): string[] {
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'how', 'what', 'why', 'when', 'where', 'can', 'do', 'i', 'you', 'to', 'for', 'of', 'in', 'on', 'at', 'it'];
    const words = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w));
    
    return [...new Set(words)].slice(0, 10);
  }

  private categorizeQuery(query: string): string {
    const categories: Record<string, string[]> = {
      billing: ['credit', 'payment', 'bill', 'price', 'cost', 'subscription', 'plan', 'upgrade'],
      technical: ['error', 'not working', 'bug', 'issue', 'problem', 'crash', 'fail'],
      features: ['feature', 'function', 'capability', 'how', 'what can', 'able to'],
      sales: ['buy', 'purchase', 'get started', 'sign up', 'register', 'pricing', 'cost'],
      support: ['help', 'support', 'assist', 'contact', 'agent', 'human'],
      account: ['account', 'login', 'password', 'profile', 'settings'],
      general: [],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => query.toLowerCase().includes(kw))) {
        return category;
      }
    }
    return 'general';
  }

  private isGreeting(query: string): boolean {
    const greetings = [
      'hi', 'hello', 'good morning', 'good day', 'good afternoon', 'good evening',
      'hola', 'hey', 'yo', 'sup', 'howdy', 'greetings', 'what\'s up', 'hi there',
      'are you there',
    ];
    const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '').trim();
    return greetings.includes(cleanQuery) || greetings.some(g => cleanQuery.startsWith(g + ' ') || cleanQuery === g);
  }

  private handleCasualMessage(query: string): { content: string; buttons?: ChatButton[] } | null {
    const casualMap: Record<string, { content: string; buttons?: ChatButton[] }> = {
      'hmm': {
        content: "I'm here whenever you're ready 😊",
        buttons: [
          { label: 'Grow My Business', action: 'action', value: 'I want to grow my business' },
          { label: 'I Need Help', action: 'action', value: 'I need help' },
        ],
      },
      'okay': {
        content: "Great! What would you like to do next?",
        buttons: this.getGreetingButtons(),
      },
      'ok': {
        content: "Great! What would you like to do next?",
        buttons: this.getGreetingButtons(),
      },
      'yes': {
        content: "Awesome 👍 How can I help further?",
        buttons: this.getGreetingButtons(),
      },
      'no': {
        content: "No problem. Let me know if you need anything later! 😊",
        buttons: [
          { label: 'Get Started', action: 'url', value: '/auth/signup' },
          { label: 'Talk to Human', action: 'action', value: 'human_agent' },
        ],
      },
      'thank you': {
        content: "You're welcome! 😊 If you need anything else, feel free to ask.",
        buttons: [
          { label: 'Get Started', action: 'url', value: '/auth/signup' },
        ],
      },
      'thanks': {
        content: "You're welcome! 😊 If you need anything else, feel free to ask.",
        buttons: [
          { label: 'Get Started', action: 'url', value: '/auth/signup' },
        ],
      },
      'bye': {
        content: "Goodbye! 👋 Have a great day! Feel free to come back if you need any help.",
        buttons: [],
      },
      'goodbye': {
        content: "Goodbye! 👋 Have a great day! Feel free to come back if you need any help.",
        buttons: [],
      },
    };

    const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '').trim();
    return casualMap[cleanQuery] || null;
  }

  private handleIdentityQuestion(query: string): { content: string; buttons?: ChatButton[] } | null {
    const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '').trim();

    const identityTriggers: { patterns: string[]; response: { content: string; buttons?: ChatButton[] } }[] = [
      {
        patterns: ['who are you', 'what are you', 'whats your name'],
        response: {
          content: "I am VemTap's virtual assistant 🤖 I'm here to help you understand how VemTap works and assist you with anything you need.",
          buttons: [
            { label: 'Learn About VemTap', action: 'action', value: 'What is Vemtap?' },
            { label: 'Talk to Human', action: 'action', value: 'human_agent' },
          ],
        },
      },
      {
        patterns: ['are you human', 'are you a human', 'are you real', 'are you a robot', 'are you a bot', 'are you ai'],
        response: {
          content: "I'm an AI assistant created to help you quickly 🤖 But if you need a human, I can connect you right away!",
          buttons: [
            { label: 'Talk to Human Agent', action: 'action', value: 'human_agent' },
            { label: 'Chat on WhatsApp', action: 'url', value: 'https://wa.me/234XXXXXXXXXX' },
          ],
        },
      },
      {
        patterns: ['can i speak to a human', 'speak to human', 'talk to someone', 'real person', 'human agent', 'live agent', 'connect me'],
        response: {
          content: "Yes, I can connect you to a human support agent. Please hold on while I arrange that for you.",
          buttons: [
            { label: 'Talk to Human Agent', action: 'action', value: 'open_ticket' },
            { label: 'Chat on WhatsApp', action: 'url', value: 'https://wa.me/234XXXXXXXXXX' },
          ],
        },
      },
      {
        patterns: ['i dont understand', 'i don understand', 'confused', 'what do you mean'],
        response: {
          content: "No problem! Could you please rephrase your question? Or I can connect you with a human for better assistance.",
          buttons: [
            { label: 'Talk to Human', action: 'action', value: 'human_agent' },
            { label: 'Chat on WhatsApp', action: 'url', value: 'https://wa.me/234XXXXXXXXXX' },
          ],
        },
      },
    ];

    for (const trigger of identityTriggers) {
      if (trigger.patterns.some(p => cleanQuery.includes(p) || cleanQuery === p)) {
        return trigger.response;
      }
    }
    return null;
  }

  private generateGreetingResponse(context: any, currentPath?: string): string {
    const name = context?.name;
    const hour = new Date().getHours();
    let timeGreeting = 'Hello';
    
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    if (currentPath) {
      return `${timeGreeting}${name ? ', ' + name : ''}! 👋 Welcome back! How can I help you continue?`;
    }

    const responses = [
      `${timeGreeting}${name ? ', ' + name : ''}! 👋 Welcome to VemTap! What would you like to do today?`,
      `Hi${name ? ' ' + name : ''}! I'm your VemTap assistant. How can I help you grow your business?`,
      `${timeGreeting}${name ? ', ' + name : ''}! 😊 Ready to capture more customers with VemTap?`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private parseTemplate(answer: string, context: any): string {
    if (!context) return answer;

    return answer
      .replace(/{{name}}/g, context.name || 'there')
      .replace(/{{businessName}}/g, context.businessName || 'your business')
      .replace(/{{smsCredits}}/g, context.credits?.sms?.toString() || '0')
      .replace(/{{emailCredits}}/g, context.credits?.email?.toString() || '0')
      .replace(/{{whatsappCredits}}/g, context.credits?.whatsapp?.toString() || '0')
      .replace(/{{openTickets}}/g, context.openTickets?.toString() || '0');
  }

  private getGreetingButtons(): ChatButton[] {
    return [
      { label: 'Grow My Business', action: 'action', value: 'grow_business' },
      { label: 'Just Exploring', action: 'action', value: 'exploring' },
      { label: 'I Need Help', action: 'action', value: 'need_help' },
    ];
  }

  private getDefaultButtons(category?: string): ChatButton[] {
    const buttonsByCategory: Record<string, ChatButton[]> = {
      billing: [
        { label: 'View Pricing', action: 'url', value: '/pricing' },
        { label: 'Talk to Human', action: 'action', value: 'human_agent' },
      ],
      sales: [
        { label: 'Get Started', action: 'url', value: '/auth/signup' },
        { label: 'Talk to Human', action: 'action', value: 'human_agent' },
      ],
      support: [
        { label: 'Talk to Human', action: 'action', value: 'human_agent' },
        { label: 'Chat on WhatsApp', action: 'url', value: 'https://wa.me/234XXXXXXXXXX' },
      ],
      technical: [
        { label: 'Open Support Ticket', action: 'action', value: 'open_ticket' },
        { label: 'Talk to Human', action: 'action', value: 'human_agent' },
      ],
      general: [
        { label: 'Get Started', action: 'url', value: '/auth/signup' },
        { label: 'Talk to Human', action: 'action', value: 'human_agent' },
      ],
    };

    return buttonsByCategory[category || 'general'] || buttonsByCategory.general;
  }

  private getFallbackButtons(): ChatButton[] {
    return [
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
      { label: 'Chat on WhatsApp', action: 'url', value: 'https://wa.me/234XXXXXXXXXX' },
    ];
  }

  private getFallbackMessage(query: string): string {
    const messages = [
      "I'm not quite sure about that. Would you like me to connect you with a human agent?",
      "That's an interesting question! For specific assistance, I can connect you with our support team.",
      "I don't have that information yet, but our team can help! Want me to connect you?",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  async updateInteraction(id: string, wasHelpful: boolean) {
    const interaction = await this.interactionRepo.findOne({ where: { id } });
    if (!interaction) return null;
    
    interaction.wasHelpful = wasHelpful;
    
    if (interaction.knowledgeId && wasHelpful) {
      const knowledge = await this.knowledgeRepo.findOne({ where: { id: interaction.knowledgeId } });
      if (knowledge) {
        const total = knowledge.matchCount || 1;
        const helpful = (knowledge.successRate * total + (wasHelpful ? 1 : 0)) / (total + 1);
        knowledge.successRate = helpful;
        await this.knowledgeRepo.save(knowledge);
      }
    }
    
    return this.interactionRepo.save(interaction);
  }

  private async logInteraction(
    userId: string,
    query: string,
    response: string,
    source: string,
    confidence: number,
    buttons?: ChatButton[],
    conversationPath?: string,
  ) {
    const interaction = this.interactionRepo.create({
      userId,
      query,
      response,
      source,
      confidence,
      buttons: buttons || null,
      conversationPath: conversationPath || null,
    });
    return this.interactionRepo.save(interaction);
  }

  async addKnowledge(dto: any) {
    const item = this.knowledgeRepo.create({
      ...dto,
      useCount: 0,
      confidence: 50,
      successRate: 0,
      matchCount: 0,
      isAiGenerated: false,
    });
    return this.knowledgeRepo.save(item);
  }

  async getMissedQuestions() {
    return this.interactionRepo.find({
      where: { source: 'fallback' },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getKnowledgeStats() {
    const total = await this.knowledgeRepo.count({ where: { isActive: true } });
    const aiGenerated = await this.knowledgeRepo.count({ where: { isActive: true, isAiGenerated: true } });
    const topUsed = await this.knowledgeRepo.find({
      where: { isActive: true },
      order: { useCount: 'DESC' },
      take: 10,
      select: ['id', 'question', 'useCount', 'successRate'],
    });
    
    return { total, aiGenerated, humanCreated: total - aiGenerated, topUsed };
  }
}
