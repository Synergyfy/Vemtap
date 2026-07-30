export type AIInsightType =
  'trend' | 'opportunity' | 'risk' | 'improvement' | 'summary';
export type AIInsightSeverity = 'positive' | 'info' | 'warning' | 'critical';

export interface AIInsightMetric {
  label: string;
  value: string;
  change?: string;
  isUp?: boolean;
}

export interface AIInsight {
  id: string;
  type: AIInsightType;
  severity: AIInsightSeverity;
  title: string;
  description: string;
  metric?: AIInsightMetric;
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

export interface AIQuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
  credits?: number;
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
