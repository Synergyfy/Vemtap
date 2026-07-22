import type { PricingPlan } from '@/types/pricing';

export type PermissionLevel = 'yes' | 'no' | 'limited';

export interface PlanFeature {
    id: string;
    label: string;
    parentId?: string;
    defaultLevel: PermissionLevel;
    defaultLimit?: number;
    limitUnit?: string;
    limitPlaceholder?: string;
}

export interface PermissionSection {
    id: string;
    label: string;
    features: PlanFeature[];
}

export interface FeaturePermission {
    level: PermissionLevel;
    limit?: number;
}

export interface PlanPermissionConfig {
    planId: string;
    planName: string;
    features: Record<string, FeaturePermission>;
}

// ─── All Dashboard Features (from ownerNavigation.ts) ─────────────────────────

export const PERMISSION_SECTIONS: PermissionSection[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        features: [
            { id: 'dashboard', label: 'Dashboard', parentId: undefined, defaultLevel: 'yes', defaultLimit: undefined },
        ],
    },
    {
        id: 'my-store',
        label: 'My Store',
        features: [
            { id: 'products-stock', label: 'Products & Stock', parentId: undefined, defaultLevel: 'yes', defaultLimit: undefined },
            { id: 'catalogue', label: 'Catalogue', parentId: 'products-stock', defaultLevel: 'limited', defaultLimit: 50, limitUnit: 'items', limitPlaceholder: 'Max items' },
            { id: 'inventory', label: 'Inventory', parentId: 'products-stock', defaultLevel: 'yes', defaultLimit: undefined },
            { id: 'sales', label: 'Sales', parentId: undefined, defaultLevel: 'yes', defaultLimit: undefined },
            { id: 'pos', label: 'POS Terminal', parentId: 'sales', defaultLevel: 'limited', defaultLimit: 1, limitUnit: 'terminals', limitPlaceholder: 'Max terminals' },
            { id: 'customers', label: 'Customers', parentId: undefined, defaultLevel: 'yes', defaultLimit: undefined },
            { id: 'customer-list', label: 'Customer List', parentId: 'customers', defaultLevel: 'yes', defaultLimit: undefined },
            { id: 'loyalty', label: 'Loyalty Programs', parentId: 'customers', defaultLevel: 'limited', defaultLimit: 1, limitUnit: 'programs', limitPlaceholder: 'Max programs' },
            { id: 'visitors', label: 'Visitors', parentId: 'customers', defaultLevel: 'yes', defaultLimit: undefined },
        ],
    },
    {
        id: 'customer-engagement',
        label: 'Customer Engagement',
        features: [
            { id: 'in-app-chat', label: 'In-App Chat', parentId: undefined, defaultLevel: 'yes', defaultLimit: undefined },
            { id: 'channels', label: 'Messaging Channels', parentId: undefined, defaultLevel: 'limited', defaultLimit: 100, limitUnit: 'credits/mo', limitPlaceholder: 'Monthly credits' },
            { id: 'forms', label: 'Forms', parentId: undefined, defaultLevel: 'yes', defaultLimit: undefined },
        ],
    },
    {
        id: 'customer-experience',
        label: 'Customer Experience',
        features: [
            { id: 'business-qr', label: 'Business QR', parentId: undefined, defaultLevel: 'yes', defaultLimit: undefined },
            { id: 'marketing-kit', label: 'Marketing Kit', parentId: undefined, defaultLevel: 'limited', defaultLimit: 5, limitUnit: 'assets', limitPlaceholder: 'Max assets' },
        ],
    },
    {
        id: 'get-customers',
        label: 'Get Customers',
        features: [
            { id: 'discovery', label: 'Discovery Network', parentId: undefined, defaultLevel: 'no', defaultLimit: undefined },
        ],
    },
    {
        id: 'analytics',
        label: 'Analytics',
        features: [
            { id: 'analytics', label: 'Advanced Analytics', parentId: undefined, defaultLevel: 'limited', defaultLimit: 3, limitUnit: 'months', limitPlaceholder: 'Months of data' },
            { id: 'ai-copilot', label: 'AI Copilot Assistant', parentId: 'analytics', defaultLevel: 'limited', defaultLimit: 50, limitUnit: 'credits/mo', limitPlaceholder: 'Monthly credits' },
        ],
    },
    {
        id: 'manage',
        label: 'Manage',
        features: [
            { id: 'staff', label: 'Staff', parentId: undefined, defaultLevel: 'limited', defaultLimit: 1, limitUnit: 'members', limitPlaceholder: 'Max staff' },
            { id: 'staff-roles', label: 'Staff Roles & Permissions', parentId: 'staff', defaultLevel: 'limited', defaultLimit: 1, limitUnit: 'roles', limitPlaceholder: 'Max roles' },
            { id: 'activity-log', label: 'Activity Log', parentId: 'staff', defaultLevel: 'no', defaultLimit: undefined },
            { id: 'locations', label: 'Locations (Branches)', parentId: undefined, defaultLevel: 'limited', defaultLimit: 1, limitUnit: 'branches', limitPlaceholder: 'Max branches' },
        ],
    },
    {
        id: 'qrthrive',
        label: 'QRThrive',
        features: [
            { id: 'qr-codes', label: 'QR Codes', parentId: undefined, defaultLevel: 'limited', defaultLimit: 5, limitUnit: 'codes', limitPlaceholder: 'Max codes' },
        ],
    },
    {
        id: 'settings',
        label: 'Settings',
        features: [
            { id: 'settings', label: 'Settings', parentId: undefined, defaultLevel: 'yes', defaultLimit: undefined },
            { id: 'profile', label: 'Profile', parentId: 'settings', defaultLevel: 'yes', defaultLimit: undefined },
            { id: 'subscription', label: 'Subscription', parentId: 'settings', defaultLevel: 'yes', defaultLimit: undefined },
            { id: 'support', label: 'Support', parentId: 'settings', defaultLevel: 'yes', defaultLimit: undefined },
        ],
    },
];

// ─── Default Permission Presets ────────────────────────────────────────────────

export function buildDefaultPermissions(
    planName: string,
    planId: string
): PlanPermissionConfig {
    const nameLower = planName.toLowerCase();
    const features: Record<string, FeaturePermission> = {};

    PERMISSION_SECTIONS.forEach(section => {
        section.features.forEach(f => {
            // Determine level based on plan
            let level: PermissionLevel = 'no';
            if (
                nameLower.includes('platinum') ||
                nameLower.includes('enterprise') ||
                nameLower.includes('premium')
            ) {
                level = 'yes';
            } else if (
                nameLower.includes('gold') ||
                nameLower.includes('pro')
            ) {
                level = f.defaultLevel;
            } else if (nameLower.includes('silver') || nameLower.includes('basic')) {
                level = f.defaultLevel === 'yes' ? 'yes' : 'limited';
            } else if (nameLower.includes('free') || nameLower.includes('starter')) {
                level = f.defaultLevel === 'yes' ? 'yes' : 'no';
            } else {
                // Unknown plan — conservative defaults
                level = f.defaultLevel === 'yes' ? 'yes' : 'no';
            }

            // Adjust limits per plan
            let limit = f.defaultLimit;
            if (level === 'yes') {
                limit = undefined; // Unlimited
            } else if (level === 'limited') {
                if (nameLower.includes('silver') || nameLower.includes('basic')) {
                    limit = f.defaultLimit ? Math.floor(f.defaultLimit * 0.5) : 1;
                } else if (nameLower.includes('free') || nameLower.includes('starter')) {
                    limit = f.defaultLimit ? Math.floor(f.defaultLimit * 0.25) : 1;
                }
                if (limit !== undefined && limit < 1) limit = 1;
            }

            features[f.id] = { level, limit };
        });
    });

    return { planId, planName, features };
}

export function mapPlanToConfig(plan: PricingPlan): PlanPermissionConfig {
    const features: Record<string, FeaturePermission> = {};

    // Helper to extract boolean toggle and limit
    const getPerm = (enabled: boolean, limit: number | null | undefined): FeaturePermission => {
        if (!enabled) return { level: 'no' };
        if (limit === -1) {
            return { level: 'yes' };
        }
        if (limit !== null && limit !== undefined && limit > 0) {
            return { level: 'limited', limit };
        }
        return { level: 'no' };
    };

    features['dashboard'] = { level: 'yes' };
    features['products-stock'] = { level: 'yes' };
    features['catalogue'] = getPerm(plan.catalogueEnabled, plan.maxCatalogueItems);
    features['inventory'] = getPerm(!!plan.inventoryEnabled, plan.inventoryLimit);
    features['sales'] = { level: 'yes' };
    features['pos'] = getPerm(!!plan.posEnabled, plan.posTerminalLimit);
    features['customers'] = { level: 'yes' };
    features['customer-list'] = { level: 'yes' };
    features['loyalty'] = getPerm(plan.loyaltyEnabled, plan.loyaltyLimit);
    features['visitors'] = { level: plan.visitorsEnabled ? 'yes' : 'no' };
    features['in-app-chat'] = { level: plan.inAppChatEnabled ? 'yes' : 'no' };
    features['channels'] = { level: plan.messagingEnabled ? 'yes' : 'no' };
    features['forms'] = getPerm(!!plan.formsEnabled, plan.formsLimit);
    features['business-qr'] = { level: plan.businessQrEnabled ? 'yes' : 'no' };
    features['marketing-kit'] = getPerm(!!plan.marketingKitEnabled, plan.marketingKitLimit);
    features['discovery'] = { level: plan.discoveryEnabled ? 'yes' : 'no' };
    
    // Analytics
    if (!plan.analyticsEnabled) {
        features['analytics'] = { level: 'no' };
    } else {
        features['analytics'] = plan.analyticsLevel === 'basic' 
            ? { level: 'limited', limit: 3 } // Default basic analytics limit in months
            : { level: 'yes' };
    }

    features['staff'] = getPerm(plan.teamMembersEnabled, plan.teamMembersLimit);
    features['staff-roles'] = getPerm(!!plan.staffRolesEnabled, plan.staffRolesLimit);
    features['activity-log'] = { level: plan.activityLogEnabled ? 'yes' : 'no' };
    features['locations'] = getPerm(plan.branchesEnabled, plan.branchLimit);
    features['qr-codes'] = getPerm(!!plan.qrCodesEnabled, plan.qrCodesLimit);
    features['ai-copilot'] = getPerm(!!plan.aiCopilotEnabled, plan.aiCredits);
    
    // Settings, Profile, Subscription, Support
    features['settings'] = { level: 'yes' };
    features['profile'] = { level: 'yes' };
    features['subscription'] = { level: 'yes' };
    features['support'] = { level: 'yes' };

    return {
        planId: plan.id,
        planName: plan.name,
        features
    };
}

export function mapConfigToPlanDto(
    config: PlanPermissionConfig,
    existingPlan?: PricingPlan
): Partial<PricingPlan> {
    const dto: Partial<PricingPlan> = {};

    const getEnabledAndLimit = (featId: string) => {
        const feat = config.features[featId];
        if (!feat || feat.level === 'no') return { enabled: false, limit: null };
        if (feat.level === 'limited') return { enabled: true, limit: feat.limit || null };
        return { enabled: true, limit: -1 };
    };

    const getEnabledOnly = (featId: string) => {
        const feat = config.features[featId];
        return !!feat && feat.level === 'yes';
    };

    // Catalogue
    const catalogue = getEnabledAndLimit('catalogue');
    dto.catalogueEnabled = catalogue.enabled;
    dto.maxCatalogueItems = catalogue.limit;
    // Retain categories/offers if existing plan, otherwise null
    if (existingPlan) {
        dto.maxCatalogueCategories = catalogue.enabled ? existingPlan.maxCatalogueCategories : null;
        dto.maxCatalogueOffers = catalogue.enabled ? existingPlan.maxCatalogueOffers : null;
    }

    // Inventory
    const inventory = getEnabledAndLimit('inventory');
    dto.inventoryEnabled = inventory.enabled;
    dto.inventoryLimit = inventory.limit;

    // POS
    const pos = getEnabledAndLimit('pos');
    dto.posEnabled = pos.enabled;
    dto.posTerminalLimit = pos.limit;

    // Loyalty
    const loyalty = getEnabledAndLimit('loyalty');
    dto.loyaltyEnabled = loyalty.enabled;
    dto.loyaltyLimit = loyalty.limit;

    // Visitors
    dto.visitorsEnabled = getEnabledOnly('visitors');

    // In-App Chat
    dto.inAppChatEnabled = getEnabledOnly('in-app-chat');

    // Messaging
    dto.messagingEnabled = getEnabledOnly('channels');

    // Forms
    const forms = getEnabledAndLimit('forms');
    dto.formsEnabled = forms.enabled;
    dto.formsLimit = forms.limit;

    // Business QR
    dto.businessQrEnabled = getEnabledOnly('business-qr');

    // Marketing Kit
    const marketing = getEnabledAndLimit('marketing-kit');
    dto.marketingKitEnabled = marketing.enabled;
    dto.marketingKitLimit = marketing.limit;

    // Discovery Network
    dto.discoveryEnabled = getEnabledOnly('discovery');

    // Analytics
    const analyticsFeat = config.features['analytics'];
    if (!analyticsFeat || analyticsFeat.level === 'no') {
        dto.analyticsEnabled = false;
        dto.analyticsLevel = 'none';
    } else {
        dto.analyticsEnabled = true;
        dto.analyticsLevel = analyticsFeat.level === 'yes' ? 'advanced' : 'basic';
    }

    // Staff
    const staff = getEnabledAndLimit('staff');
    dto.teamMembersEnabled = staff.enabled;
    dto.teamMembersLimit = staff.limit;

    // Staff Roles
    const staffRoles = getEnabledAndLimit('staff-roles');
    dto.staffRolesEnabled = staffRoles.enabled;
    dto.staffRolesLimit = staffRoles.limit;

    // Activity Log
    dto.activityLogEnabled = getEnabledOnly('activity-log');

    // Locations
    const locations = getEnabledAndLimit('locations');
    dto.branchesEnabled = locations.enabled;
    dto.branchLimit = locations.limit || 1; // Default to at least 1 branch if enabled

    // QR Codes
    const qrCodes = getEnabledAndLimit('qr-codes');
    dto.qrCodesEnabled = qrCodes.enabled;
    dto.qrCodesLimit = qrCodes.limit;

    // AI Copilot
    const aiCopilot = getEnabledAndLimit('ai-copilot');
    dto.aiCopilotEnabled = aiCopilot.enabled;
    dto.aiCredits = aiCopilot.limit;

    return dto;
}
