import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIClient {
  private readonly logger = new Logger(OpenAIClient.name);
  private client: OpenAI | null = null;
  private model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY is not set. OpenAI analysis calls will fallback locally.');
    }
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  async analyze(systemPrompt: string, userPrompt: string, retries = 2): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client is not configured.');
    }

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await this.client.chat.completions.create(
          {
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 600,
            response_format: { type: 'json_object' },
          },
          { timeout: 8000 },
        );

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
          throw new Error('Received empty response from OpenAI');
        }

        return content;
      } catch (error) {
        attempt++;
        if (attempt > retries) {
          throw error;
        }
        this.logger.warn(`OpenAI call failed (attempt ${attempt}): ${error.message}. Retrying in 500ms...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    throw new Error('OpenAI call failed after retries');
  }
}
