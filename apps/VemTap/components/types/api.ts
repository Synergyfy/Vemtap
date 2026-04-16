import type { QRConfiguration } from './qr';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
  planId?: string;
  plan?: Plan;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'non-renewing' | null;
  billingCycle?: 'monthly' | 'quarterly' | 'yearly' | null;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  hasUsedTrial?: boolean;
  isBanned?: boolean;
}


export interface AuthResponse {
  user: User;
}

export interface Tier {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    countries: number;
  };
}

export interface Country {
  code: string;
  name: string;
  tierId: string;
  currencyCode: string;
  currencySymbol: string;
  tier?: Tier;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  qrCodeLimit: number;
  qrCodeTypes: string[];
  isPopular: boolean;
  isDefault: boolean;
  isFree: boolean;
  trialDays: number;
  isActive: boolean;

  // High Income Tier Prices
  highIncomeMonthlyUSD: number;
  highIncomeQuarterlyUSD: number;
  highIncomeYearlyUSD: number;

  // Middle Income Tier Prices
  middleIncomeMonthlyUSD: number;
  middleIncomeQuarterlyUSD: number;
  middleIncomeYearlyUSD: number;

  // Low Income Tier Prices
  lowIncomeMonthlyUSD: number;
  lowIncomeQuarterlyUSD: number;
  lowIncomeYearlyUSD: number;
}

export interface PublicPlan {
  id: string;
  name: string;
  description: string | null;
  qrCodeLimit: number;
  qrCodeTypes: string[];
  isPopular: boolean;
  isDefault: boolean;
  isFree: boolean;
  trialDays: number;
  currency: string;
  currencySymbol: string;
  pricing: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
}

export interface PricingConfig {
  quarterlyDiscount: number;
  yearlyDiscount: number;
}

export interface BackendFolder {
  id: string;
  name: string;
  color: string;
  _count: { qrCodes: number };
}

export interface CreateFolderDto {
  name: string;
  color: string;
}

export interface CreateQRCodeDto {
  name: string;
  description?: string;
  folderId?: string;
  type: string;
  isDynamic?: boolean;
  data: any;
  design: any;
  frame: any;
  logo?: string;
  width?: number;
  height?: number;
  margin?: number;
}

export interface BackendQRCode {
  id: string;
  shortId: string;
  shortUrl: string;
  name: string;
  description?: string;
  folderId?: string;
  type: string;
  isDynamic: boolean;
  status: 'active' | 'archived';
  data: any;
  design: any;
  frame: any;
  logo?: string;
  width: number;
  height: number;
  margin: number;
  createdAt: string;
  updatedAt: string;
  scans: number;
  form?: {
    _count: {
      submissions: number;
    };
  };
  config: QRConfiguration; // To make it easier for our UI
}

export interface Scan {
  id: string;
  qrCodeId: string;
  ip?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  city?: string;
  country?: string;
  region?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalQRs: number;
  totalScans: number;
  uniqueVisitors: number;
  scansLastHour: number;
  deviceDist: Record<string, number>;
  osDist: Record<string, number>;
  browserDist: Record<string, number>;
  countryDist: Record<string, number>;
  timeDist: Record<string, number>;
  chartData: Array<{ name: string; scans: number; unique: number }>;
}

export interface AdminStats {
  totalUsers: number;
  totalQRs: number;
  totalScans: number;
  estimatedRevenue: number;
  chartData: Array<{ name: string; qrs: number }>;
  trends: {
    users: number;
    scans: number;
    qrs: number;
    revenue: number;
  };
}

export interface AdminUser extends User {
  name: string;
  qrs: number;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | null | undefined;
  isBanned: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  pages: number;
}

export interface SystemConfig {
  id: number;
  quarterlyDiscount: number;
  yearlyDiscount: number;
  heroTitle: string;
  heroSubtitle: string;
  features: string[];
  faqs: Array<{ question: string; answer: string }>;
  createdAt: string;
  updatedAt: string;
}
