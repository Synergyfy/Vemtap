import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY not found in environment variables');
    }
  }

  async generateInsights(profilingData: any): Promise<{
    summary: string;
    problems: string[];
    recommendations: string[];
    suggestedPackage: string;
    packageReason: string;
    qrStrategy: string[];
    salesPitch: string;
    aiAnalysis: string;
  }> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized. Check API key.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

      const prompt = `
        You are an expert Business Consultant for Vemtap, an NFC/QR-powered visitor engagement and loyalty platform.
        Analyze the following business profiling data and provide surgical, high-conversion growth insights.

        BUSINESS DATA:
        ${JSON.stringify(profilingData, null, 2)}

        Provide your response in EXACTLY this JSON format:
        {
          "summary": "A concise 1-2 sentence overview of the business status.",
          "problems": ["Problem 1", "Problem 2", "Problem 3"],
          "recommendations": ["Surgical solution 1", "Surgical solution 2", "Surgical solution 3"],
          "suggestedPackage": "Silver, Gold, or Platinum",
          "packageReason": "Why this specific package fits their scale and pain points.",
          "qrStrategy": ["Placement 1", "Placement 2", "Placement 3"],
          "salesPitch": "A high-impact, persuasive 2-3 sentence pitch an agent can use.",
          "aiAnalysis": "A deep, 2-paragraph strategic analysis of their digital growth potential."
        }

        RULES:
        1. Focus on how Vemtap (NFC/QR/Loyalty/WhatsApp automation) solves their specific problems.
        2. Keep recommendations "surgical" and actionable.
        3. The tone should be professional, data-driven, and highly persuasive.
        4. Return ONLY the JSON object.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response (in case AI adds markdown blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response as JSON');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Error generating AI insights', error);
      throw error;
    }
  }
}
