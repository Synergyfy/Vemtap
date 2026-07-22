import { Injectable } from '@nestjs/common';
import { AIAnalysisResponse, AIInsight, AIRecommendation, AIQuickAction } from '../dto/ai-analysis-response.dto';

@Injectable()
export class LocalFallbackService {
  generate(
    page: string,
    botData: Record<string, unknown>,
  ): Omit<AIAnalysisResponse, 'page' | 'generatedAt' | 'creditsUsed'> {
    const summary = this.buildSummary(page, botData);
    const insights = this.buildInsights(page, botData);
    const recommendations = this.buildRecommendations(page, botData);
    const quickActions = this.buildQuickActions(page);

    return {
      summary,
      insights,
      recommendations,
      quickActions,
    };
  }

  private buildSummary(page: string, data: Record<string, unknown>): string {
    const totalCustomers = (data.totalCustomers as number) || 0;
    const totalRevenue = (data.totalRevenue as number) || (data.revenueThisMonth as number) || 0;
    const repeatRate = (data.repeatCustomerRate as number) || 0;

    let parts = [`Performance overview for ${page}:`];
    if (totalCustomers > 0) parts.push(`Engaged ${totalCustomers.toLocaleString()} customers`);
    if (totalRevenue > 0) parts.push(`generated ₦${(totalRevenue / 1000).toFixed(0)}K tracked revenue`);
    if (repeatRate > 0) parts.push(`with a ${repeatRate}% repeat customer rate`);

    return parts.join(' ') + '. Focus on key recommendations below to maintain momentum.';
  }

  private buildInsights(page: string, data: Record<string, unknown>): AIInsight[] {
    const insights: AIInsight[] = [];

    if (data.totalCustomers !== undefined) {
      const totalCust = (data.totalCustomers as number) || 0;
      insights.push({
        id: 'fallback-insight-1',
        type: 'trend',
        severity: totalCust > 0 ? 'positive' : 'info',
        title: 'Customer Base',
        description: totalCust > 0 
          ? `Active customer base is recorded at ${totalCust} profiles.`
          : `No registered customer profiles recorded yet.`,
        metric: {
          label: 'Total Customers',
          value: `${totalCust}`,
          isUp: totalCust > 0,
        },
      });
    }

    if (data.repeatCustomerRate !== undefined && (data.totalCustomers as number || 0) > 0) {
      const rate = (data.repeatCustomerRate as number) || 0;
      const isStrong = rate >= 30;
      insights.push({
        id: 'fallback-insight-2',
        type: isStrong ? 'opportunity' : 'improvement',
        severity: isStrong ? 'positive' : 'warning',
        title: isStrong ? 'Loyal Retention' : 'Retention Focus',
        description: `${rate}% of visitors return for repeated business.`,
        metric: {
          label: 'Repeat Rate',
          value: `${rate}%`,
          isUp: isStrong,
        },
      });
    }

    if (data.lowStockCount !== undefined && (data.lowStockCount as number) > 0) {
      insights.push({
        id: 'fallback-insight-3',
        type: 'risk',
        severity: 'warning',
        title: 'Stock Warning',
        description: `${data.lowStockCount} items have reached or dropped below low-stock thresholds.`,
        metric: {
          label: 'Low Stock Items',
          value: `${data.lowStockCount}`,
          isUp: false,
        },
      });
    }

    return insights;
  }

  private buildRecommendations(page: string, data: Record<string, unknown>): AIRecommendation[] {
    const recs: AIRecommendation[] = [];

    if ((data.repeatCustomerRate as number) < 40) {
      recs.push({
        id: 'fallback-rec-1',
        title: 'Launch a Loyalty Program',
        description: 'Drive repeat business by setting up points rewards for returning customers.',
        impact: 'high',
        actionLabel: 'Setup Loyalty',
        actionRoute: '/dashboard/loyalty',
      });
    }

    recs.push({
      id: 'fallback-rec-2',
      title: 'Review Customer Profiles',
      description: 'Explore top spending customer segments and schedule re-engagement offers.',
      impact: 'medium',
      actionLabel: 'View Customers',
      actionRoute: '/dashboard/visitors',
    });

    return recs;
  }

  private buildQuickActions(page: string): AIQuickAction[] {
    switch (page) {
      case 'inventory':
      case 'inventory-stock':
      case 'inventory-low-stock':
        return [
          { id: 'qa-1', label: 'Add Product', icon: 'Plus', route: '/dashboard/inventory/new' },
          { id: 'qa-2', label: 'Update Stock', icon: 'Edit', route: '/dashboard/inventory/update' },
        ];
      case 'customers':
      case 'visitors':
        return [
          { id: 'qa-1', label: 'View Customers', icon: 'Users', route: '/dashboard/visitors' },
          { id: 'qa-2', label: 'Segments', icon: 'Filter', route: '/dashboard/visitors/segments' },
        ];
      default:
        return [
          { id: 'qa-1', label: 'View Analytics', icon: 'BarChart3', route: '/dashboard/analytics' },
          { id: 'qa-2', label: 'Manage Customers', icon: 'Users', route: '/dashboard/visitors' },
          { id: 'qa-3', label: 'POS Terminal', icon: 'ShoppingCart', route: '/dashboard/pos' },
        ];
    }
  }
}
