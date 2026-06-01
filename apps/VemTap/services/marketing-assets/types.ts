export interface MarketingTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  categoryId?: string;
  categoryRelation?: MarketingCategory;
  type: string;
  layoutConfig: {
    backgroundColor: string;
    textColor: string;
    title: string;
    subtitle?: string;
    tagline?: string;
    accentColor: string;
    borderColor?: string;
    logoPosition?: 'top' | 'bottom' | 'hidden';
    [key: string]: any;
  };
  isActive: boolean;
  thumbnailUrl?: string;
  qrCodeConfig?: {
    color?: string;
    backgroundColor?: string;
    margin?: number;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MarketingAsset {
  id: string;
  name: string;
  businessId: string;
  branchId?: string;
  templateId?: string;
  type: string;
  customConfig: {
    backgroundColor: string;
    textColor: string;
    title: string;
    subtitle?: string;
    tagline?: string;
    accentColor: string;
    borderColor?: string;
    logoPosition?: 'top' | 'bottom' | 'hidden';
    [key: string]: any;
  };
  qrCodeContent: string;
  qrCodeConfig?: {
    color?: string;
    backgroundColor?: string;
    margin?: number;
    [key: string]: any;
  };
  thumbnailUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  template?: MarketingTemplate;
}

export interface MarketingMockup {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  overlayConfig: {
    x: number;
    y: number;
    width: number;
    height: number;
    perspective?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    [key: string]: any;
  };
  isActive: boolean;
}

export interface MarketingAIPrompt {
  id: string;
  name: string;
  category: string;
  promptTemplate: string;
  isActive: boolean;
}

export interface DownloadLog {
  id: string;
  assetId: string;
  businessId: string;
  format: string;
  downloadedAt: string;
  asset?: MarketingAsset;
}

export interface DailyAnalytics {
  date: string;
  scans: number;
  views: number;
}

export interface AssetAnalytics {
  assetId: string;
  totals: {
    scans: number;
    views: number;
    conversionRate: number;
  };
  daily: DailyAnalytics[];
}

export interface OverviewAnalytics {
  totals: {
    scans: number;
    views: number;
    downloads: number;
    conversionRate: number;
  };
  daily: DailyAnalytics[];
  topTemplates?: { templateId: string; name: string; uses: number }[];
  mostActiveBranches?: { branchId: string; name: string; assets: number; scans: number }[];
  mostDownloadedAssets?: { assetId: string; name: string; downloads: number }[];
}

export interface MarketingCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingSetting {
  id: string;
  key: string;
  value: string;
  type?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingBrandRule {
  id: string;
  businessId: string;
  logoRequired: boolean;
  primaryColorRequired: boolean;
  secondaryColorRequired: boolean;
  fontFamilyRequired: boolean;
  website?: string;
  phone?: string;
  email?: string;
  socialLinks?: any;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingAuditLog {
  id: string;
  businessId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateStyle {
  id: string;
  name: string;
  slug: string;
  description?: string;
  bgColor: string;
  accentColor: string;
  borderColor: string;
  qrFgColor: string;
  qrBgColor: string;
  textColor: string;
  fontConfig?: Record<string, any>;
  layoutConfig?: Record<string, any>;
  ctaConfig?: Record<string, any>;
  qrConfig?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFormat {
  id: string;
  name: string;
  slug: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  printMarginMm: number;
  resolution: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfile {
  businessId: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline: string | null;
  fontFamily: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  socialLinks?: any;
  isOverridden: boolean;
}
