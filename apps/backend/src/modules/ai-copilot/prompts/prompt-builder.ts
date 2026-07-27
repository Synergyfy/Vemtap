import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptBuilder {
  build(
    page: string,
    botData: Record<string, unknown>,
  ): { system: string; user: string } {
    let focusContext = '';
    if (page.startsWith('pos') || page.startsWith('sales')) {
      focusContext = '\n- Focus on transaction velocity, average ticket size, and cashier performance.';
    } else if (page.startsWith('inventory')) {
      focusContext = '\n- Focus on stock health, reorder urgency, and stockout risk.';
    } else if (page.startsWith('customers') || page.startsWith('visitors')) {
      focusContext = '\n- Focus on retention, repeat rate, and re-engagement opportunity.';
    } else if (page.startsWith('loyalty')) {
      focusContext = '\n- Focus on points programme engagement and redemption health.';
    } else if (page.startsWith('analytics')) {
      focusContext = '\n- Focus on revenue trends, period-over-period comparison, and peak patterns.';
    }

    const system = `You are a concise, insightful business advisor for small-to-medium business owners on the Vemtap platform.
Your task is to convert pre-computed business data into a clear, natural-language executive summary, key insights, and actionable recommendations.
CRITICAL RULES:
- Use the exact numbers provided in the data. Do NOT invent numbers.
- Keep the tone encouraging, factual, and action-oriented.
- Output ONLY valid JSON matching the exact schema specified.
- Do NOT output markdown code blocks or additional surrounding text.${focusContext}`;

    const dataFormatted = JSON.stringify(botData, null, 2);

    const user = `Analyze the following pre-computed metrics for page "${page}":

${dataFormatted}

Return a single valid JSON object adhering strictly to this shape:
{
  "summary": "2-3 sentence executive summary of overall state based on the numbers.",
  "insights": [
    {
      "id": "insight-1",
      "type": "trend|opportunity|risk|improvement|summary",
      "severity": "positive|info|warning|critical",
      "title": "Short catchy title",
      "description": "Clear explanation referencing exact metric",
      "metric": { "label": "Metric Name", "value": "123", "change": "+5%", "isUp": true }
    }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Action Title",
      "description": "Specific rationale derived from the data",
      "impact": "high|medium|low",
      "actionLabel": "Button Text",
      "actionRoute": "/dashboard/[route]"
    }
  ],
  "quickActions": [
    { "id": "qa-1", "label": "Action Name", "icon": "lucide-icon-name", "route": "/dashboard/[route]" }
  ]
}`;

    return { system, user };
  }
}
