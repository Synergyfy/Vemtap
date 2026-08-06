import type {
  AIAnalysisResponse,
  AIInsight,
  AIRecommendation,
  AIQuickAction,
  BusinessFact,
  AIInsightType,
  AIInsightSeverity,
} from './types';

interface DashboardContext {
  totalCustomers?: number;
  totalRevenue?: number;
  averageSpending?: number;
  churnRate?: number;
  repeatCustomerRate?: number;
  totalVisitors?: number;
  activeCampaigns?: number;
  customerLifetimeValue?: number;
  peakHours?: { hour: string; visits: number }[];
}

function generateTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function generateSummary(context: DashboardContext): string {
  const parts: string[] = [];

  if (context.totalCustomers && context.totalCustomers > 0) {
    parts.push(`You've engaged ${context.totalCustomers.toLocaleString()} customers`);
  }
  if (context.totalRevenue && context.totalRevenue > 0) {
    parts.push(`generating ₦${(context.totalRevenue / 1000).toFixed(0)}K in tracked revenue`);
  }

  const trends: string[] = [];
  if (context.repeatCustomerRate && context.repeatCustomerRate > 40) {
    trends.push('repeat business is strong');
  } else if (context.repeatCustomerRate && context.repeatCustomerRate > 20) {
    trends.push('repeat business has room to grow');
  }

  if (context.churnRate && context.churnRate < 10) {
    trends.push('churn is well controlled');
  } else if (context.churnRate && context.churnRate > 25) {
    trends.push('churn needs attention');
  }

  if (trends.length === 0) {
    trends.push('your business is active');
  }

  const summary = `${parts.join(' and ')}, and ${trends.join('. ')}. Focus on high-impact actions below to keep momentum.`;
  return summary;
}

function generateInsights(context: DashboardContext): AIInsight[] {
  const insights: AIInsight[] = [];
  let id = 0;

  const nextId = () => `insight-${++id}`;
  const rng = (seed: number) => ((seed * 9301 + 49297) % 233280) / 233280;

  const seed =
    (context.totalCustomers ?? 100) * 31 +
    (context.totalRevenue ?? 50000) * 37 +
    (context.repeatCustomerRate ?? 30) * 41;

  const rand = (min: number, max: number) => min + rng(Math.floor(seed * (id + 1))) * (max - min);

  // Trend: Customer growth
  if (context.totalCustomers && context.totalCustomers > 0) {
    const growthRate = rand(2, 18);
    insights.push({
      id: nextId(),
      type: 'trend',
      severity: growthRate > 10 ? 'positive' : 'info',
      title: 'Customer Growth Trend',
      description:
        growthRate > 10
          ? `Customer acquisition is strong at ${growthRate.toFixed(0)}% growth this period. Your engagement channels are driving results.`
          : `Customer growth is steady at ${growthRate.toFixed(0)}%. Consider expanding your acquisition channels to accelerate.`,
      metric: {
        label: 'Growth Rate',
        value: `${growthRate.toFixed(0)}%`,
        change: growthRate > 10 ? `+${(growthRate * 0.3).toFixed(1)}%` : `+${(growthRate * 0.1).toFixed(1)}%`,
        isUp: true,
      },
    });
  }

  // Repeat customer insight
  if (context.repeatCustomerRate !== undefined) {
    const isStrong = context.repeatCustomerRate > 40;
    insights.push({
      id: nextId(),
      type: isStrong ? 'opportunity' : 'improvement',
      severity: isStrong ? 'positive' : 'warning',
      title: isStrong ? 'Loyal Customer Base' : 'Repeat Visit Opportunity',
      description: isStrong
        ? `${context.repeatCustomerRate.toFixed(0)}% of customers return — well above average. Your experience quality is a competitive advantage.`
        : `Only ${context.repeatCustomerRate.toFixed(0)}% of customers return. A loyalty program could significantly improve retention.`,
      metric: {
        label: 'Repeat Rate',
        value: `${context.repeatCustomerRate.toFixed(0)}%`,
        change: isStrong ? '+5.2%' : '-3.1%',
        isUp: isStrong,
      },
    });
  }

  // Churn risk
  if (context.churnRate !== undefined && context.churnRate > 0) {
    const isHigh = context.churnRate > 20;
    insights.push({
      id: nextId(),
      type: 'risk',
      severity: isHigh ? 'critical' : 'info',
      title: isHigh ? 'Elevated Churn Risk' : 'Churn Under Control',
      description: isHigh
        ? `${context.churnRate.toFixed(0)}% churn rate is above healthy levels. Recent drop-offs suggest re-engagement campaigns are needed.`
        : `Churn at ${context.churnRate.toFixed(0)}% is within a healthy range. Continue monitoring for early warning signs.`,
      metric: {
        label: 'Churn Rate',
        value: `${context.churnRate.toFixed(0)}%`,
        change: isHigh ? '+2.3%' : '-0.8%',
        isUp: !isHigh,
      },
    });
  }

  // Peak hours insight
  if (context.peakHours && context.peakHours.length > 0) {
    const peak = context.peakHours.reduce((max, h) => (h.visits > max.visits ? h : max));
    insights.push({
      id: nextId(),
      type: 'opportunity',
      severity: 'info',
      title: 'Peak Traffic Window',
      description: `Your busiest period is ${peak.hour} with ${peak.visits} visits. Consider scheduling promotions and staffing during this window to maximize revenue.`,
      metric: {
        label: 'Peak Hour',
        value: peak.hour,
      },
    });
  }

  // Average spending opportunity
  if (context.averageSpending && context.averageSpending > 0) {
    const isGrowing = context.averageSpending > 5000;
    insights.push({
      id: nextId(),
      type: isGrowing ? 'trend' : 'opportunity',
      severity: isGrowing ? 'positive' : 'info',
      title: isGrowing ? 'Rising Average Spend' : 'Upsell Opportunity',
      description: isGrowing
        ? `Average spend is ₦${context.averageSpending.toLocaleString()} — trending upward. Bundle offers and premium items could further increase this.`
        : `Average spend is ₦${context.averageSpending.toLocaleString()}. Suggesting add-ons or volume discounts could lift this metric.`,
      metric: {
        label: 'Avg. Spend',
        value: `₦${context.averageSpending.toLocaleString()}`,
        change: isGrowing ? '+8.3%' : '+1.2%',
        isUp: true,
      },
    });
  }

  return insights;
}

function generateRecommendations(context: DashboardContext): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];
  let id = 0;

  const nextId = () => `rec-${++id}`;

  if (context.repeatCustomerRate !== undefined && context.repeatCustomerRate < 40) {
    recommendations.push({
      id: nextId(),
      title: 'Launch a Loyalty Program',
      description: 'Boost repeat visits by up to 35% with a points-based loyalty program. Your current repeat rate has room to grow.',
      impact: 'high',
      actionLabel: 'Open Loyalty',
      actionRoute: '/dashboard/loyalty',
    });
  }

  if (context.totalCustomers && context.totalCustomers > 0) {
    recommendations.push({
      id: nextId(),
      title: 'Review Your Customers',
      description: `${context.totalCustomers.toLocaleString()} customers in your network. Check for high-value segments and inactive profiles that need re-engagement.`,
      impact: 'high',
      actionLabel: 'View Customers',
      actionRoute: '/dashboard/visitors',
    });
  }

  if (context.churnRate && context.churnRate > 15) {
    recommendations.push({
      id: nextId(),
      title: 'Create a Re-engagement Campaign',
      description: `With ${context.churnRate.toFixed(0)}% churn, a targeted campaign could recover at-risk customers. Use your messaging channels to reach them.`,
      impact: 'medium',
      actionLabel: 'Launch Campaign',
      actionRoute: '/dashboard/marketing-assets/create',
    });
  }

  if (context.activeCampaigns !== undefined && context.activeCampaigns < 2) {
    recommendations.push({
      id: nextId(),
      title: 'Generate a Promotion',
      description: 'You have no active promotions. A time-limited offer could drive immediate traffic and increase this period\'s revenue.',
      impact: 'medium',
      actionLabel: 'Generate Promotion',
      actionRoute: '/dashboard/marketing-assets',
    });
  }

  recommendations.push({
    id: nextId(),
    title: 'Review Your Analytics',
    description: 'Dive deeper into your performance metrics to identify hidden opportunities and optimize your strategy.',
    impact: 'low',
    actionLabel: 'View Analytics',
    actionRoute: '/dashboard/analytics',
  });

  return recommendations;
}

function generateQuickActions(_context: DashboardContext): AIQuickAction[] {
  return [
    { id: 'qa-1', label: 'View Customers', icon: 'Users', route: '/dashboard/visitors' },
    { id: 'qa-2', label: 'New Campaign', icon: 'Send', route: '/dashboard/marketing-assets/create' },
    { id: 'qa-3', label: 'Check Reviews', icon: 'MessageSquare', route: '/dashboard/engagement/forms' },
    { id: 'qa-4', label: 'Open Loyalty', icon: 'Gift', route: '/dashboard/loyalty' },
  ];
}

// MOCK: Replace with real AI API call
export function getDashboardAnalysis(context: DashboardContext = {}): AIAnalysisResponse {
  const insights = generateInsights(context);
  const recommendations = generateRecommendations(context);
  const quickActions = generateQuickActions(context);
  const summary = generateSummary(context);

  return {
    page: 'dashboard',
    summary,
    insights,
    recommendations,
    quickActions,
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

// MOCK: Replace with real AI API call
export function getCustomerAnalysis(): AIAnalysisResponse {
  return {
    page: 'customers',
    summary: 'You have a growing customer base with opportunities to increase retention through targeted engagement and loyalty programs.',
    insights: [
      { id: 'ci-1', type: 'trend', severity: 'positive', title: 'Steady Acquisition', description: 'Customer acquisition has been consistent over the past 30 days. New visitor capture rates are healthy across all channels.' },
      { id: 'ci-2', type: 'opportunity', severity: 'info', title: 'Segmentation Potential', description: 'Identify high-value customer segments based on visit frequency and spending. Targeted campaigns can increase lifetime value by up to 25%.' },
      { id: 'ci-3', type: 'improvement', severity: 'warning', title: 'Inactive Profiles', description: 'Some customer profiles show no recent activity. A re-engagement sequence could reactivate dormant relationships.' },
    ],
    recommendations: [
      { id: 'cr-1', title: 'Segment Your Customers', description: 'Group customers by behavior and spending patterns to create targeted campaigns.', impact: 'high', actionLabel: 'View Segments', actionRoute: '/dashboard/visitors/segments' },
      { id: 'cr-2', title: 'Launch Re-engagement', description: 'Reach out to inactive customers with a special offer to bring them back.', impact: 'medium', actionLabel: 'Create Campaign', actionRoute: '/dashboard/marketing-assets/create' },
    ],
    quickActions: [
      { id: 'cq-1', label: 'All Visitors', icon: 'Users', route: '/dashboard/visitors/all' },
      { id: 'cq-2', label: 'New Visitors', icon: 'UserPlus', route: '/dashboard/visitors/new' },
      { id: 'cq-3', label: 'Import', icon: 'Send', route: '/dashboard/visitors/import' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

export function getInventoryAnalysis(): AIAnalysisResponse {
  return {
    page: 'inventory',
    summary: 'Your inventory levels are within normal ranges. Proactive stock management can prevent shortages and reduce carrying costs.',
    insights: [
      { id: 'ii-1', type: 'risk', severity: 'warning', title: 'Low Stock Alert', description: 'Some high-turnover items are approaching minimum stock levels. Reorder soon to avoid stockouts during peak hours.' },
      { id: 'ii-2', type: 'opportunity', severity: 'info', title: 'Slow Movers Identified', description: 'Several items have not moved in over 30 days. Consider bundling them with popular items or running a clearance promotion.' },
      { id: 'ii-3', type: 'trend', severity: 'positive', title: 'Stock Turnover Improving', description: 'Overall inventory turnover has improved by 8% compared to last period, indicating better demand alignment.' },
    ],
    recommendations: [
      { id: 'ir-1', title: 'Review Low Stock', description: 'Check which items need immediate reordering to prevent stockouts.', impact: 'high', actionLabel: 'View Low Stock', actionRoute: '/dashboard/inventory/low-stock' },
      { id: 'ir-2', title: 'Run Stock Count', description: 'Schedule a stock counting session to ensure system accuracy.', impact: 'medium', actionLabel: 'Start Count', actionRoute: '/dashboard/inventory/counting' },
    ],
    quickActions: [
      { id: 'iq-1', label: 'Stock Levels', icon: 'Package', route: '/dashboard/inventory/stock' },
      { id: 'iq-2', label: 'Adjustments', icon: 'Settings', route: '/dashboard/inventory/adjustments' },
      { id: 'iq-3', label: 'Receiving', icon: 'ArrowRight', route: '/dashboard/inventory/receiving' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

export function getSalesAnalysis(): AIAnalysisResponse {
  return {
    page: 'sales',
    summary: 'Revenue is steady with identifiable opportunities to increase average transaction value and frequency.',
    insights: [
      { id: 'si-1', type: 'trend', severity: 'positive', title: 'Revenue Trending Up', description: 'Sales have shown consistent week-over-week growth. Peak transaction times align with customer footfall patterns.' },
      { id: 'si-2', type: 'opportunity', severity: 'info', title: 'Upsell Opportunity', description: 'Average order value can be increased by suggesting complementary items at checkout. Staff training on upselling could lift revenue by 10-15%.' },
    ],
    recommendations: [
      { id: 'sr-1', title: 'Review Top Products', description: 'Identify your best-selling items and ensure they are always in stock.', impact: 'high', actionLabel: 'View Sales', actionRoute: '/dashboard/sales' },
      { id: 'sr-2', title: 'Analyze Peak Hours', description: 'Optimize staffing and promotions around your busiest sales periods.', impact: 'medium', actionLabel: 'Peak Times', actionRoute: '/dashboard/analytics/peak-times' },
    ],
    quickActions: [
      { id: 'sq-1', label: 'New Sale', icon: 'ShoppingBag', route: '/dashboard/pos/register' },
      { id: 'sq-2', label: 'Sales History', icon: 'Activity', route: '/dashboard/pos/sales' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

export function getMarketingAnalysis(): AIAnalysisResponse {
  return {
    page: 'marketing',
    summary: 'Your marketing channels are active. Data-driven campaign optimization can significantly improve ROI and customer reach.',
    insights: [
      { id: 'mi-1', type: 'opportunity', severity: 'info', title: 'Channel Performance', description: 'Review which messaging channels drive the most engagement. Focus budget on highest-performing channels for maximum ROI.' },
      { id: 'mi-2', type: 'improvement', severity: 'warning', title: 'Campaign Frequency', description: 'Campaigns sent during peak engagement windows see 40% higher open rates. Schedule sends based on customer activity patterns.' },
    ],
    recommendations: [
      { id: 'mr-1', title: 'Create Campaign', description: 'Launch a targeted campaign to your customer segments with personalized messaging.', impact: 'high', actionLabel: 'New Campaign', actionRoute: '/dashboard/marketing-assets/create' },
      { id: 'mr-2', title: 'Review Assets', description: 'Update your marketing kit with fresh creatives and offers.', impact: 'medium', actionLabel: 'Marketing Kit', actionRoute: '/dashboard/marketing-assets' },
    ],
    quickActions: [
      { id: 'mq-1', label: 'New Campaign', icon: 'Send', route: '/dashboard/marketing-assets/create' },
      { id: 'mq-2', label: 'My QR', icon: 'QrCode', route: '/dashboard/customer-experience' },
      { id: 'mq-3', label: 'Channels', icon: 'Zap', route: '/dashboard/messaging' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

export function getLoyaltyAnalysis(): AIAnalysisResponse {
  return {
    page: 'loyalty',
    summary: 'Your loyalty program drives repeat business. Optimizing reward structures can further increase member engagement and retention.',
    insights: [
      { id: 'li-1', type: 'trend', severity: 'positive', title: 'Membership Growth', description: 'Loyalty membership is growing steadily. Active members spend 2.5x more than non-members on average.' },
      { id: 'li-2', type: 'opportunity', severity: 'info', title: 'Redemption Rate', description: 'Reward redemption rate indicates strong engagement. Consider adding tiered rewards to incentivize higher spending.' },
    ],
    recommendations: [
      { id: 'lr-1', title: 'Review Rewards', description: 'Update your reward catalog to keep it fresh and appealing to members.', impact: 'high', actionLabel: 'View Rewards', actionRoute: '/dashboard/loyalty/rewards' },
      { id: 'lr-2', title: 'Check Redemptions', description: 'Monitor recent reward redemptions and identify popular reward categories.', impact: 'medium', actionLabel: 'Redemptions', actionRoute: '/dashboard/loyalty/redemptions' },
    ],
    quickActions: [
      { id: 'lq-1', label: 'Award Points', icon: 'Gift', route: '/dashboard/loyalty/award' },
      { id: 'lq-2', label: 'Redeem', icon: 'ArrowRight', route: '/dashboard/loyalty/redeem' },
      { id: 'lq-3', label: 'Settings', icon: 'Settings', route: '/dashboard/loyalty/settings' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

export function getMessagingAnalysis(): AIAnalysisResponse {
  return {
    page: 'messaging',
    summary: 'Your messaging channels are set up and ready. Strategic campaign planning can maximize reach and engagement.',
    insights: [
      { id: 'msi-1', type: 'opportunity', severity: 'info', title: 'Multi-Channel Reach', description: 'Using multiple channels (SMS, WhatsApp, Email) increases customer reach by 60% compared to single-channel campaigns.' },
      { id: 'msi-2', type: 'improvement', severity: 'warning', title: 'Template Optimization', description: 'Message templates with personalized fields see higher engagement. Review and update your templates regularly.' },
    ],
    recommendations: [
      { id: 'msr-1', title: 'Create Broadcast', description: 'Send a broadcast message to your customer segments.', impact: 'high', actionLabel: 'Compose Message', actionRoute: '/dashboard/messaging/compose' },
      { id: 'msr-2', title: 'Review Templates', description: 'Update your message templates for better engagement rates.', impact: 'medium', actionLabel: 'Templates', actionRoute: '/dashboard/messaging/templates' },
    ],
    quickActions: [
      { id: 'msq-1', label: 'SMS', icon: 'MessageSquare', route: '/dashboard/messaging/sms' },
      { id: 'msq-2', label: 'WhatsApp', icon: 'Send', route: '/dashboard/messaging/whatsapp' },
      { id: 'msq-3', label: 'Email', icon: 'Mail', route: '/dashboard/messaging/email' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

export function getAnalyticsAnalysis(): AIAnalysisResponse {
  return {
    page: 'analytics',
    summary: 'Your business data reveals actionable patterns. Focus on the metrics that directly impact revenue and customer satisfaction.',
    insights: [
      { id: 'ai-1', type: 'trend', severity: 'info', title: 'Data Patterns Detected', description: 'Several meaningful patterns emerge from your analytics data. Week-over-week comparisons show consistent growth in key areas.' },
      { id: 'ai-2', type: 'opportunity', severity: 'positive', title: 'Growth Indicators', description: 'Customer acquisition cost is decreasing while lifetime value shows an upward trend — a strong sign of healthy business growth.' },
    ],
    recommendations: [
      { id: 'ar-1', title: 'Explore Analytics', description: 'Dive deep into your performance metrics across all business areas.', impact: 'high', actionLabel: 'Full Analytics', actionRoute: '/dashboard/analytics' },
      { id: 'ar-2', title: 'Review Footfall', description: 'Understand visitor traffic patterns to optimize staffing and operations.', impact: 'medium', actionLabel: 'Footfall', actionRoute: '/dashboard/analytics/footfall' },
    ],
    quickActions: [
      { id: 'aq-1', label: 'Sales Analytics', icon: 'TrendingUp', route: '/dashboard/analytics/sales' },
      { id: 'aq-2', label: 'Customer Analytics', icon: 'Users', route: '/dashboard/analytics/customers' },
      { id: 'aq-3', label: 'Inventory Analytics', icon: 'Package', route: '/dashboard/analytics/inventory' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

export function getEngagementAnalysis(): AIAnalysisResponse {
  return {
    page: 'engagement',
    summary: 'Your engagement tools are capturing customer data effectively. Optimizing forms and experiences can improve conversion rates.',
    insights: [
      { id: 'ei-1', type: 'opportunity', severity: 'info', title: 'Form Performance', description: 'Review which forms have the highest completion rates. Streamlining longer forms could improve overall data capture.' },
      { id: 'ei-2', type: 'improvement', severity: 'info', title: 'Experience Optimization', description: 'The customer capture experience directly impacts conversion. Small UX improvements can lead to significant gains in data collection.' },
    ],
    recommendations: [
      { id: 'er-1', title: 'Review Forms', description: 'Check your active forms and their performance metrics.', impact: 'high', actionLabel: 'View Forms', actionRoute: '/dashboard/engagement/forms' },
      { id: 'er-2', title: 'Customize Experience', description: 'Tailor the customer capture experience to match your brand.', impact: 'medium', actionLabel: 'Experience', actionRoute: '/dashboard/engagement/experience' },
    ],
    quickActions: [
      { id: 'eq-1', label: 'Active Forms', icon: 'FileText', route: '/dashboard/engagement/forms/active' },
      { id: 'eq-2', label: 'Responses', icon: 'Activity', route: '/dashboard/engagement/forms/responses' },
      { id: 'eq-3', label: 'Social Links', icon: 'MessageSquare', route: '/dashboard/engagement/socials' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

export function getGrowthAnalysis(): AIAnalysisResponse {
  return {
    page: 'growth',
    summary: 'Your business growth channels are active. Expanding your network and referral programs can accelerate customer acquisition.',
    insights: [
      { id: 'gi-1', type: 'opportunity', severity: 'info', title: 'Network Effect', description: 'Businesses in the discovery network see 30% more customer engagement. Active participation increases your visibility.' },
      { id: 'gi-2', type: 'trend', severity: 'positive', title: 'Referral Potential', description: 'Referred customers have higher retention rates. Strengthening your referral program could bring in more quality leads.' },
    ],
    recommendations: [
      { id: 'gr-1', title: 'Explore Discovery', description: 'Find new businesses to partner with and expand your reach.', impact: 'high', actionLabel: 'Discovery Network', actionRoute: '/dashboard/discovery' },
      { id: 'gr-2', title: 'Check Referrals', description: 'Review your referral program performance and earnings.', impact: 'medium', actionLabel: 'Referrals', actionRoute: '/dashboard/referrals' },
    ],
    quickActions: [
      { id: 'gq-1', label: 'Discovery', icon: 'Search', route: '/dashboard/discovery' },
      { id: 'gq-2', label: 'Referral Link', icon: 'Link', route: '/dashboard/referrals/link' },
      { id: 'gq-3', label: 'Partnerships', icon: 'Users', route: '/dashboard/business-partnership' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

export function getSettingsAnalysis(): AIAnalysisResponse {
  return {
    page: 'settings',
    summary: 'Your business configuration is well organized. Regular review of settings ensures optimal platform performance.',
    insights: [
      { id: 'sti-1', type: 'summary', severity: 'info', title: 'Configuration Status', description: 'All critical business settings are configured. Reviewing optional settings can unlock additional platform capabilities.' },
    ],
    recommendations: [
      { id: 'str-1', title: 'Review Profile', description: 'Ensure your business profile information is complete and up to date.', impact: 'high', actionLabel: 'Business Profile', actionRoute: '/dashboard/settings/profile' },
      { id: 'str-2', title: 'Check Subscription', description: 'Review your current plan and available features.', impact: 'medium', actionLabel: 'Subscription', actionRoute: '/dashboard/settings/subscription' },
    ],
    quickActions: [
      { id: 'stq-1', label: 'Profile', icon: 'Settings', route: '/dashboard/settings/profile' },
      { id: 'stq-2', label: 'Branches', icon: 'Users', route: '/dashboard/settings/branches' },
      { id: 'stq-3', label: 'Team', icon: 'UserPlus', route: '/dashboard/staff' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

export function getQRAnalysis(): AIAnalysisResponse {
  return {
    page: 'qrthrive',
    summary: 'Your QR code campaigns are driving customer engagement. Optimizing placement and offers can increase scan rates.',
    insights: [
      { id: 'qi-1', type: 'trend', severity: 'positive', title: 'Scan Activity', description: 'QR code scans are generating consistent customer engagement. Each scan represents a direct connection with a potential customer.' },
      { id: 'qi-2', type: 'opportunity', severity: 'info', title: 'Lead Generation', description: 'QR codes are effective lead generation tools. Combine with compelling offers to maximize conversion from scans.' },
    ],
    recommendations: [
      { id: 'qr-1', title: 'Explore QR Thrive', description: 'Discover new QR code strategies and campaign options.', impact: 'high', actionLabel: 'Explore', actionRoute: '/dashboard/explore-qrthrive' },
      { id: 'qr-2', title: 'Review Leads', description: 'Check the leads generated from your QR code campaigns.', impact: 'medium', actionLabel: 'View Leads', actionRoute: '/dashboard/explore-qrthrive/leads' },
    ],
    quickActions: [
      { id: 'qq-1', label: 'My QR', icon: 'QrCode', route: '/dashboard/customer-experience' },
      { id: 'qq-2', label: 'Leads', icon: 'Users', route: '/dashboard/explore-qrthrive/leads' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

export function getTeamAnalysis(): AIAnalysisResponse {
  return {
    page: 'staff',
    summary: 'Your team is configured with role-based access. Regular review of permissions and activity ensures operational security.',
    insights: [
      { id: 'ti-1', type: 'summary', severity: 'info', title: 'Team Structure', description: 'Role-based access is properly configured. Ensure each team member has the minimum permissions needed for their role.' },
      { id: 'ti-2', type: 'improvement', severity: 'info', title: 'Activity Monitoring', description: 'Review staff activity logs to identify training opportunities and ensure compliance with best practices.' },
    ],
    recommendations: [
      { id: 'tr-1', title: 'Review Staff', description: 'Check your team members and their assigned roles.', impact: 'high', actionLabel: 'View Staff', actionRoute: '/dashboard/staff' },
      { id: 'tr-2', title: 'Check Activity', description: 'Monitor recent staff activity for security and compliance.', impact: 'medium', actionLabel: 'Activity Log', actionRoute: '/dashboard/staff/activity' },
    ],
    quickActions: [
      { id: 'tq-1', label: 'Staff List', icon: 'Users', route: '/dashboard/staff' },
      { id: 'tq-2', label: 'Roles', icon: 'Shield', route: '/dashboard/staff/roles' },
      { id: 'tq-3', label: 'Activity', icon: 'Activity', route: '/dashboard/staff/activity' },
    ],
    generatedAt: new Date().toISOString(),
    creditsUsed: 1,
  };
}

// MOCK: Replace with real AI API call
export function getAIAnalysis(page: string, context: Record<string, unknown> = {}): AIAnalysisResponse {
  switch (page) {
    case 'dashboard':
      return getDashboardAnalysis(context as DashboardContext);
    case 'visitors':
    case 'customers':
    case 'analytics-customers':
    case 'analytics-customer-value':
    case 'pos-customers':
    case 'feedback':
    case 'intelligence':
      return getCustomerAnalysis();
    case 'inventory':
    case 'inventory-stock':
    case 'inventory-low-stock':
    case 'inventory-adjustments':
    case 'inventory-counting':
    case 'inventory-receiving':
    case 'inventory-history':
    case 'analytics-inventory':
    case 'pos-products':
    case 'products-stock':
      return getInventoryAnalysis();
    case 'sales':
    case 'pos':
    case 'pos-register':
    case 'pos-sales':
    case 'analytics-sales':
    case 'commerce':
    case 'hardware':
      return getSalesAnalysis();
    case 'marketing':
    case 'marketing-assets':
    case 'analytics-marketing':
      return getMarketingAnalysis();
    case 'loyalty':
      return getLoyaltyAnalysis();
    case 'messaging':
      return getMessagingAnalysis();
    case 'analytics':
    case 'analytics-footfall':
    case 'analytics-peak-times':
    case 'analytics-discovery':
      return getAnalyticsAnalysis();
    case 'engagement':
    case 'customer-experience':
    case 'customer-capture':
      return getEngagementAnalysis();
    case 'discovery':
    case 'referrals':
    case 'partnership':
    case 'business-link':
      return getGrowthAnalysis();
    case 'settings':
    case 'devices':
      return getSettingsAnalysis();
    case 'qrthrive':
      return getQRAnalysis();
    case 'staff':
      return getTeamAnalysis();
    case 'support':
    case 'automations':
    case 'notifications':
    case 'tutorial':
    case 'compliance':
    case 'more':
    case 'catalogue':
    default:
      return getDashboardAnalysis(context as DashboardContext);
  }
}
