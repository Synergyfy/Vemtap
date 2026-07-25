import type { PricingPlan } from '@/types/pricing';
import { NAVIGATION_SECTIONS } from '@/constants/ownerNavigation';

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

// Maps submenu labels to known PricingPlan feature IDs for backward compatibility
const FEATURE_ID_MAP: Record<string, string> = {
    'catalogue': 'catalogue',
    'inventory': 'inventory',
    'pos home': 'pos',
    'orders': 'pos-orders',
    'settings': 'settings',
    'help': 'pos-help',
    'overview': 'nav-overview',
    'customer list': 'customer-list',
    'loyalty': 'loyalty',
    'visitors': 'visitors',
    'sales dashboard': 'sales-dashboard',
    'directory': 'staff-directory',
    'roles & permissions': 'staff-roles',
    'activity log': 'activity-log',
    'profile': 'profile',
    'subscription': 'subscription',
    'ai credits': 'ai-credits',
    'ai reports': 'ai-reports',
    'support': 'support',
    'compliance': 'compliance',
    'sales reports': 'analytics-sales',
    'inventory reports': 'analytics-inventory',
    'customers': 'analytics-customers',
    'discovery': 'analytics-discovery',
    'footfall': 'analytics-footfall',
    'marketing': 'analytics-marketing',
    'peak times': 'analytics-peak-times',
    'get customers': 'discovery',
    'business partnership': 'business-partnership',
};

// Label→ID for parent nav items (used as fallback featureId)
const PARENT_FEATURE_ID_MAP: Record<string, string> = {
    'dashboard': 'dashboard',
    'sales': 'sales',
    'products & stock': 'products-stock',
    'customers': 'customers',
    'in-app chat': 'in-app-chat',
    'channels': 'channels',
    'forms': 'forms',
    'my business qr': 'business-qr',
    'marketing kit': 'marketing-kit',
    'get customers': 'discovery',
    'analytics': 'analytics',
    'staff': 'staff',
    'locations': 'locations',
    'explore qrthrive': 'qr-codes',
    'settings': 'preferences',
};

function labelToId(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function deriveFeatureId(navItemId: string, label: string, parentLabel?: string): string {
    const lower = label.toLowerCase().trim();
    if (FEATURE_ID_MAP[lower]) return FEATURE_ID_MAP[lower];
    if (parentLabel) {
        const parentLower = parentLabel.toLowerCase().trim();
        if (PARENT_FEATURE_ID_MAP[parentLower]) {
            return `${PARENT_FEATURE_ID_MAP[parentLower]}-${labelToId(label)}`;
        }
    }
    const parentKey = parentLabel?.toLowerCase().trim() || '';
    if (PARENT_FEATURE_ID_MAP[parentKey]) return PARENT_FEATURE_ID_MAP[parentKey];
    return navItemId;
}

// ─── Build permission sections from the sidebar navigation tree ──────────

export function buildPermissionSectionsFromNavigation(): PermissionSection[] {
    return NAVIGATION_SECTIONS
        .filter(s => s.items.length > 0)
        .map(section => {
            const sectionLabel = section.label || section.items[0]?.label || 'General';
            const features: PlanFeature[] = [];

            section.items.forEach(item => {
                const itemFeatureId = deriveFeatureId(item.id, item.label);

                if (item.submenu && item.submenu.length > 0) {
                    // Parent item represents the category
                    features.push({
                        id: itemFeatureId,
                        label: item.label,
                        parentId: undefined,
                        defaultLevel: 'yes',
                        defaultLimit: undefined,
                    });
                    // Submenu items are children
                    item.submenu.forEach(sub => {
                        const subId = deriveFeatureId(sub.label.toLowerCase(), sub.label, item.label);
                        features.push({
                            id: subId,
                            label: sub.label,
                            parentId: itemFeatureId,
                            defaultLevel: 'yes',
                            defaultLimit: undefined,
                        });
                    });
                } else {
                    features.push({
                        id: itemFeatureId,
                        label: item.label,
                        parentId: undefined,
                        defaultLevel: 'yes',
                        defaultLimit: undefined,
                    });
                }
            });

            return {
                id: section.id || `section-${labelToId(sectionLabel)}`,
                label: sectionLabel,
                features,
            };
        });
}

// ─── Known permission IDs that map to PricingPlan fields ───────────

const PLANNED_FEATURE_DEFAULTS: Record<string, { level: PermissionLevel; limit?: number; unit?: string; placeholder?: string }> = {
    'dashboard': { level: 'yes' },
    'products-stock': { level: 'yes' },
    'catalogue': { level: 'limited', limit: 50, unit: 'items', placeholder: 'Max items' },
    'inventory': { level: 'yes' },
    'sales': { level: 'yes' },
    'pos': { level: 'limited', limit: 1, unit: 'terminals', placeholder: 'Max terminals' },
    'customers': { level: 'yes' },
    'customer-list': { level: 'yes' },
    'loyalty': { level: 'limited', limit: 1, unit: 'programs', placeholder: 'Max programs' },
    'visitors': { level: 'yes' },
    'in-app-chat': { level: 'yes' },
    'channels': { level: 'limited', limit: 100, unit: 'credits/mo', placeholder: 'Monthly credits' },
    'forms': { level: 'yes' },
    'business-qr': { level: 'yes' },
    'marketing-kit': { level: 'limited', limit: 5, unit: 'assets', placeholder: 'Max assets' },
    'discovery': { level: 'no' },
    'analytics': { level: 'limited', limit: 3, unit: 'months', placeholder: 'Months of data' },
    'staff': { level: 'limited', limit: 1, unit: 'members', placeholder: 'Max staff' },
    'staff-roles': { level: 'limited', limit: 1, unit: 'roles', placeholder: 'Max roles' },
    'activity-log': { level: 'no' },
    'locations': { level: 'limited', limit: 1, unit: 'branches', placeholder: 'Max branches' },
    'qr-codes': { level: 'limited', limit: 5, unit: 'codes', placeholder: 'Max codes' },
    'ai-copilot': { level: 'limited', limit: 50, unit: 'credits/mo', placeholder: 'Monthly credits' },
    'settings': { level: 'yes' },
    'profile': { level: 'yes' },
    'subscription': { level: 'yes' },
    'support': { level: 'yes' },
};

// Apply known defaults to the dynamically-built permission tree
export function applyFeatureDefaults(sections: PermissionSection[]): PermissionSection[] {
    return sections.map(section => ({
        ...section,
        features: section.features.map(f => {
            const known = PLANNED_FEATURE_DEFAULTS[f.id];
            if (known) {
                return {
                    ...f,
                    defaultLevel: known.level,
                    defaultLimit: known.limit,
                    limitUnit: known.unit,
                    limitPlaceholder: known.placeholder,
                };
            }
            // Unknown / new features default to unlimited yes
            return f;
        }),
    }));
}

// ─── Default Permission Presets ────────────────────────────────────────────────

export function buildDefaultPermissions(
    planName: string,
    planId: string
): PlanPermissionConfig {
    const nameLower = planName.toLowerCase();
    const features: Record<string, FeaturePermission> = {};
    const sections = applyFeatureDefaults(buildPermissionSectionsFromNavigation());

    sections.forEach(section => {
        section.features.forEach(f => {
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
                level = f.defaultLevel === 'yes' ? 'yes' : 'no';
            }

            let limit = f.defaultLimit;
            if (level === 'yes') {
                limit = undefined;
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

// ─── Legacy PERMISSION_SECTIONS (kept for backward compatibility) ─────

export const PERMISSION_SECTIONS: PermissionSection[] = applyFeatureDefaults(buildPermissionSectionsFromNavigation());

// ─── Map PricingPlan → PlanPermissionConfig ──────────────────────────

function getPerm(enabled: boolean, limit: number | null | undefined): FeaturePermission {
    if (!enabled) return { level: 'no' };
    if (limit === -1) return { level: 'yes' };
    if (limit !== null && limit !== undefined && limit > 0) return { level: 'limited', limit };
    return { level: 'no' };
}

export function mapPlanToConfig(plan: PricingPlan): PlanPermissionConfig {
    const features: Record<string, FeaturePermission> = {};
    const sections = PERMISSION_SECTIONS;

    // Always-enabled core features
    const alwaysYes = ['dashboard', 'products-stock', 'sales', 'customers', 'customer-list', 'settings', 'profile', 'subscription', 'support'];
    alwaysYes.forEach(id => { features[id] = { level: 'yes' }; });

    // Known PricingPlan-backed features
    if (plan) {
        features['catalogue'] = getPerm(plan.catalogueEnabled, plan.maxCatalogueItems);
        features['inventory'] = getPerm(!!plan.inventoryEnabled, plan.inventoryLimit);
        features['pos'] = getPerm(!!plan.posEnabled, plan.posTerminalLimit);
        features['loyalty'] = getPerm(plan.loyaltyEnabled, plan.loyaltyLimit);
        features['visitors'] = { level: plan.visitorsEnabled ? 'yes' : 'no' };
        features['in-app-chat'] = { level: plan.inAppChatEnabled ? 'yes' : 'no' };
        features['channels'] = { level: plan.messagingEnabled ? 'yes' : 'no' };
        features['forms'] = getPerm(!!plan.formsEnabled, plan.formsLimit);
        features['business-qr'] = { level: plan.businessQrEnabled ? 'yes' : 'no' };
        features['marketing-kit'] = getPerm(!!plan.marketingKitEnabled, plan.marketingKitLimit);
        features['discovery'] = { level: plan.discoveryEnabled ? 'yes' : 'no' };
        features['settings'] = { level: 'yes' };
        features['profile'] = { level: 'yes' };
        features['subscription'] = { level: 'yes' };
        features['support'] = { level: 'yes' };
        features['staff'] = getPerm(plan.teamMembersEnabled, plan.teamMembersLimit);
        features['staff-roles'] = getPerm(!!plan.staffRolesEnabled, plan.staffRolesLimit);
        features['activity-log'] = { level: plan.activityLogEnabled ? 'yes' : 'no' };
        features['locations'] = getPerm(plan.branchesEnabled, plan.branchLimit);
        features['qr-codes'] = getPerm(!!plan.qrCodesEnabled, plan.qrCodesLimit);

        if (!plan.analyticsEnabled) {
            features['analytics'] = { level: 'no' };
        } else {
            features['analytics'] = plan.analyticsLevel === 'basic'
                ? { level: 'limited', limit: 3 }
                : { level: 'yes' };
        }

        features['ai-copilot'] = getPerm(!!plan.aiCopilotEnabled, plan.aiCredits);
    }

    // Fill remaining features from nav tree defaults
    sections.forEach(section => {
        section.features.forEach(f => {
            if (features[f.id] === undefined) {
                features[f.id] = { level: f.defaultLevel, limit: f.defaultLimit };
            }
        });
    });

    return { planId: plan.id, planName: plan.name, features };
}

// ─── Map PlanPermissionConfig → PricingPlan partial DTO ─────────────

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

    const catalogue = getEnabledAndLimit('catalogue');
    dto.catalogueEnabled = catalogue.enabled;
    dto.maxCatalogueItems = catalogue.limit;
    if (existingPlan) {
        dto.maxCatalogueCategories = catalogue.enabled ? existingPlan.maxCatalogueCategories : null;
        dto.maxCatalogueOffers = catalogue.enabled ? existingPlan.maxCatalogueOffers : null;
    }

    const inventory = getEnabledAndLimit('inventory');
    dto.inventoryEnabled = inventory.enabled;
    dto.inventoryLimit = inventory.limit;

    const pos = getEnabledAndLimit('pos');
    dto.posEnabled = pos.enabled;
    dto.posTerminalLimit = pos.limit;

    const loyalty = getEnabledAndLimit('loyalty');
    dto.loyaltyEnabled = loyalty.enabled;
    dto.loyaltyLimit = loyalty.limit;

    dto.visitorsEnabled = getEnabledOnly('visitors');
    dto.inAppChatEnabled = getEnabledOnly('in-app-chat');
    dto.messagingEnabled = getEnabledOnly('channels');

    const forms = getEnabledAndLimit('forms');
    dto.formsEnabled = forms.enabled;
    dto.formsLimit = forms.limit;

    dto.businessQrEnabled = getEnabledOnly('business-qr');

    const marketing = getEnabledAndLimit('marketing-kit');
    dto.marketingKitEnabled = marketing.enabled;
    dto.marketingKitLimit = marketing.limit;

    dto.discoveryEnabled = getEnabledOnly('discovery');

    const analyticsFeat = config.features['analytics'];
    if (!analyticsFeat || analyticsFeat.level === 'no') {
        dto.analyticsEnabled = false;
        dto.analyticsLevel = 'none';
    } else {
        dto.analyticsEnabled = true;
        dto.analyticsLevel = analyticsFeat.level === 'yes' ? 'advanced' : 'basic';
    }

    const staff = getEnabledAndLimit('staff');
    dto.teamMembersEnabled = staff.enabled;
    dto.teamMembersLimit = staff.limit;

    const staffRoles = getEnabledAndLimit('staff-roles');
    dto.staffRolesEnabled = staffRoles.enabled;
    dto.staffRolesLimit = staffRoles.limit;

    dto.activityLogEnabled = getEnabledOnly('activity-log');

    const locations = getEnabledAndLimit('locations');
    dto.branchesEnabled = locations.enabled;
    dto.branchLimit = locations.limit || 1;

    const qrCodes = getEnabledAndLimit('qr-codes');
    dto.qrCodesEnabled = qrCodes.enabled;
    dto.qrCodesLimit = qrCodes.limit;

    const aiCopilot = getEnabledAndLimit('ai-copilot');
    dto.aiCopilotEnabled = aiCopilot.enabled;
    dto.aiCredits = aiCopilot.limit;

    return dto;
}
