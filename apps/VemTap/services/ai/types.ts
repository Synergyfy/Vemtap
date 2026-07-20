export type AIInsightType = 'trend' | 'opportunity' | 'risk' | 'improvement' | 'summary';

export type AIInsightSeverity = 'positive' | 'info' | 'warning' | 'critical';

export interface AIInsight {
  id: string;
  type: AIInsightType;
  severity: AIInsightSeverity;
  title: string;
  description: string;
  metric?: {
    label: string;
    value: string;
    change?: string;
    isUp?: boolean;
  };
}

export interface AIQuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
  credits?: number;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionLabel: string;
  actionRoute: string;
  credits?: number;
}

export interface BusinessFact {
  label: string;
  value: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  period?: string;
}

export interface AIAnalysisResponse {
  page: string;
  summary: string;
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  quickActions: AIQuickAction[];
  generatedAt: string;
  creditsUsed: number;
}

export interface AIAnalysisRequest {
  page: string;
  context: Record<string, unknown>;
}

export interface AICredits {
  available: number;
  used: number;
}

export const AI_CREDIT_COST = {
  quickAnalysis: 1,
  deepAnalysis: 10,
  generateContent: 5,
} as const;
