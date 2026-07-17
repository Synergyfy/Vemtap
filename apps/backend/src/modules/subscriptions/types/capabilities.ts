export interface CapabilityLimit {
  enabled: boolean;
  limit: number | 'unlimited';
  used: number;
  remaining: number | 'unlimited';
}

export interface AddOnCapabilityInfo {
  id: string;
  name: string;
  type: 'RESOURCE' | 'SERVICE';
  targetCapability?: string;
  additionalLimit: number;
  expiresAt: Date;
  quantity: number;
}

export interface SubscriptionCapabilities {
  plan: string;
  isActive: boolean;
  isTrial: boolean;
  capabilities: {
    teamMembers: CapabilityLimit;
    tags: CapabilityLimit;
    loyaltyPrograms: CapabilityLimit;
    branches: CapabilityLimit;
    automations: CapabilityLimit;
    analytics: {
      enabled: boolean;
      level: 'basic' | 'advanced' | 'none';
    };
    messaging: {
      enabled: boolean;
    };
    catalogueItems: CapabilityLimit;
    catalogueCategories: CapabilityLimit;
    catalogueOffers: CapabilityLimit;
    inventory: CapabilityLimit;
    pos: CapabilityLimit;
    visitors: {
      enabled: boolean;
    };
    inAppChat: {
      enabled: boolean;
    };
    forms: CapabilityLimit;
    businessQr: {
      enabled: boolean;
    };
    marketingKit: CapabilityLimit;
    discovery: {
      enabled: boolean;
    };
    staffRoles: CapabilityLimit;
    activityLog: {
      enabled: boolean;
    };
    qrCodes: CapabilityLimit;
    features: string[];
    credits: {
      sms: number;
      email: number;
      whatsapp: number;
    };
  };
  addOns: AddOnCapabilityInfo[];
}
