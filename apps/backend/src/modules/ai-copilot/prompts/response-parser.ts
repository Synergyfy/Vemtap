import { Injectable } from '@nestjs/common';
import { AIAnalysisResponse } from '../dto/ai-analysis-response.dto';

@Injectable()
export class ResponseParser {
  parse(rawJson: string, page: string): Omit<AIAnalysisResponse, 'page' | 'generatedAt' | 'creditsUsed'> {
    try {
      const cleaned = rawJson
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      return {
        summary: parsed.summary || `Analysis completed for ${page}. Review your key insights below.`,
        insights: Array.isArray(parsed.insights)
          ? parsed.insights.map((item: any, idx: number) => ({
              id: item.id || `insight-${idx + 1}`,
              type: item.type || 'summary',
              severity: item.severity || 'info',
              title: item.title || 'Insight',
              description: item.description || '',
              ...(item.metric ? { metric: item.metric } : {}),
            }))
          : [],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.map((rec: any, idx: number) => ({
              id: rec.id || `rec-${idx + 1}`,
              title: rec.title || 'Recommendation',
              description: rec.description || '',
              impact: rec.impact || 'medium',
              actionLabel: rec.actionLabel || 'View Details',
              actionRoute: rec.actionRoute || '/dashboard',
            }))
          : [],
        quickActions: Array.isArray(parsed.quickActions)
          ? parsed.quickActions.map((qa: any, idx: number) => ({
              id: qa.id || `qa-${idx + 1}`,
              label: qa.label || 'Quick Action',
              icon: qa.icon || 'Sparkles',
              route: qa.route || '/dashboard',
            }))
          : [],
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response JSON: ${error.message}`);
    }
  }
}
