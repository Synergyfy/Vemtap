// ─── Types ────────────────────────────────────────────────────────────────────

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
