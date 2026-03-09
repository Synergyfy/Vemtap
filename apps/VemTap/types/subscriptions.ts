export interface CapabilityLimit {
  limit: number | 'unlimited';
  used: number;
  remaining: number | 'unlimited';
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
    analytics: 'basic' | 'advanced' | 'none';
    features: string[];
    credits: {
      sms: number;
      email: number;
      whatsapp: number;
    };
  };
}
