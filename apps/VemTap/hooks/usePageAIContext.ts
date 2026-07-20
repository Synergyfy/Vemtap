'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export type AdvisorRole =
  | 'Business Advisor'
  | 'Customer Advisor'
  | 'Inventory Advisor'
  | 'Sales Advisor'
  | 'Marketing Advisor'
  | 'Analytics Advisor'
  | 'Loyalty Advisor'
  | 'Messaging Advisor'
  | 'Settings Advisor'
  | 'Team Advisor'
  | 'Support Advisor'
  | 'Engagement Advisor'
  | 'Growth Advisor'
  | 'Automation Advisor'
  | 'QR Advisor'
  | 'Compliance Advisor'
  | 'Catalogue Advisor';

interface PageAIContext {
  role: AdvisorRole;
  page: string;
  description: string;
}

function pathToAdvisor(pathname: string): PageAIContext {
  const path = pathname.replace(/\/dashboard(?:\/|$)/, '').replace(/\/$/, '');

  if (!path || path === '') {
    return { role: 'Business Advisor', page: 'dashboard', description: 'overall business performance' };
  }

  const firstSegment = path.split('/')[1] || path.split('/')[0];

  const advisors: Record<string, PageAIContext> = {
    analytics: { role: 'Analytics Advisor', page: 'analytics', description: 'analytics and performance metrics' },
    'analytics/sales': { role: 'Sales Advisor', page: 'analytics-sales', description: 'sales analytics and trends' },
    'analytics/customers': { role: 'Customer Advisor', page: 'analytics-customers', description: 'customer analytics and segments' },
    'analytics/inventory': { role: 'Inventory Advisor', page: 'analytics-inventory', description: 'inventory analytics' },
    'analytics/marketing': { role: 'Marketing Advisor', page: 'analytics-marketing', description: 'marketing performance' },
    'analytics/footfall': { role: 'Analytics Advisor', page: 'analytics-footfall', description: 'footfall and visitor patterns' },
    'analytics/peak-times': { role: 'Analytics Advisor', page: 'analytics-peak-times', description: 'peak time analysis' },
    'analytics/discovery': { role: 'Growth Advisor', page: 'analytics-discovery', description: 'discovery network analytics' },
    'analytics/customer-value': { role: 'Customer Advisor', page: 'analytics-customer-value', description: 'customer lifetime value' },
    visitors: { role: 'Customer Advisor', page: 'visitors', description: 'visitor insights and behavior' },
    customers: { role: 'Customer Advisor', page: 'customers', description: 'customer profiles and engagement' },
    inventory: { role: 'Inventory Advisor', page: 'inventory', description: 'inventory levels and stock management' },
    'inventory/stock': { role: 'Inventory Advisor', page: 'inventory-stock', description: 'stock levels and movements' },
    'inventory/low-stock': { role: 'Inventory Advisor', page: 'inventory-low-stock', description: 'low stock alerts' },
    'inventory/adjustments': { role: 'Inventory Advisor', page: 'inventory-adjustments', description: 'inventory adjustments' },
    'inventory/counting': { role: 'Inventory Advisor', page: 'inventory-counting', description: 'stock counting sessions' },
    'inventory/receiving': { role: 'Inventory Advisor', page: 'inventory-receiving', description: 'inventory receiving' },
    'inventory/history': { role: 'Inventory Advisor', page: 'inventory-history', description: 'inventory history' },
    pos: { role: 'Sales Advisor', page: 'pos', description: 'POS operations and sales' },
    'pos/register': { role: 'Sales Advisor', page: 'pos-register', description: 'POS register and transactions' },
    'pos/sales': { role: 'Sales Advisor', page: 'pos-sales', description: 'sales history and receipts' },
    'pos/customers': { role: 'Customer Advisor', page: 'pos-customers', description: 'POS customer profiles' },
    'pos/products': { role: 'Inventory Advisor', page: 'pos-products', description: 'POS product catalog' },
    sales: { role: 'Sales Advisor', page: 'sales', description: 'sales performance and revenue' },
    loyalty: { role: 'Loyalty Advisor', page: 'loyalty', description: 'loyalty program and rewards' },
    messaging: { role: 'Messaging Advisor', page: 'messaging', description: 'messaging campaigns and channels' },
    marketing: { role: 'Marketing Advisor', page: 'marketing', description: 'marketing assets and campaigns' },
    'marketing-assets': { role: 'Marketing Advisor', page: 'marketing-assets', description: 'marketing materials and creatives' },
    engagement: { role: 'Engagement Advisor', page: 'engagement', description: 'customer engagement and forms' },
    'customer-experience': { role: 'Engagement Advisor', page: 'customer-experience', description: 'customer experience setup' },
    'customer-capture': { role: 'Engagement Advisor', page: 'customer-capture', description: 'customer capture setup' },
    'explore-qrthrive': { role: 'QR Advisor', page: 'qrthrive', description: 'QR code campaigns and leads' },
    discovery: { role: 'Growth Advisor', page: 'discovery', description: 'business discovery network' },
    referrals: { role: 'Growth Advisor', page: 'referrals', description: 'referral program and earnings' },
    'business-partnership': { role: 'Growth Advisor', page: 'partnership', description: 'business partnerships' },
    'products-stock': { role: 'Inventory Advisor', page: 'products-stock', description: 'products and stock management' },
    catalogue: { role: 'Catalogue Advisor', page: 'catalogue', description: 'product catalog and orders' },
    settings: { role: 'Settings Advisor', page: 'settings', description: 'business configuration' },
    staff: { role: 'Team Advisor', page: 'staff', description: 'team management and roles' },
    support: { role: 'Support Advisor', page: 'support', description: 'support tickets and agents' },
    automations: { role: 'Automation Advisor', page: 'automations', description: 'automation rules and workflows' },
    devices: { role: 'Settings Advisor', page: 'devices', description: 'device management' },
    compliance: { role: 'Compliance Advisor', page: 'compliance', description: 'compliance and legal' },
    notifications: { role: 'Business Advisor', page: 'notifications', description: 'notifications and alerts' },
    feedback: { role: 'Customer Advisor', page: 'feedback', description: 'customer reviews and feedback' },
    intelligence: { role: 'Customer Advisor', page: 'intelligence', description: 'customer intelligence and insights' },
    tutorial: { role: 'Business Advisor', page: 'tutorial', description: 'onboarding and tutorials' },
    'business-link': { role: 'Growth Advisor', page: 'business-link', description: 'business link and sharing' },
    hardware: { role: 'Sales Advisor', page: 'hardware', description: 'hardware and devices' },
    commerce: { role: 'Sales Advisor', page: 'commerce', description: 'commerce and store management' },
    more: { role: 'Business Advisor', page: 'more', description: 'additional tools and resources' },
    ai: { role: 'Business Advisor', page: 'ai-credits', description: 'AI credits and usage' },
    'ai/reports': { role: 'Business Advisor', page: 'ai-reports', description: 'AI report bank' },
  };

  const matched = advisors[path] || advisors[firstSegment];
  if (matched) return matched;

  return { role: 'Business Advisor', page: 'dashboard', description: 'your business' };
}

export function usePageAIContext(): PageAIContext {
  const pathname = usePathname();
  return useMemo(() => pathToAdvisor(pathname), [pathname]);
}

export function getPageAIContext(pathname: string): PageAIContext {
  return pathToAdvisor(pathname);
}
