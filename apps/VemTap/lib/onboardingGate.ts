import type { Business } from '@/services/businesses/types';

export type OnboardingFieldId = 'category' | 'location' | 'logo' | 'address' | 'plan';

export interface OnboardingField {
    id: OnboardingFieldId;
    title: string;
    description: string;
    step: number | string;
    /** Optional fields appear on the activation checklist but never force a hard redirect. */
    optional?: boolean;
}

export const ONBOARDING_FIELDS: OnboardingField[] = [
    { id: 'category', title: 'Choose Business Category', description: 'Select the category that best describes your business.', step: 2 },
    { id: 'logo', title: 'Upload Business Logo', description: 'Add your brand logo so customers can recognise you.', step: 3, optional: true },
    { id: 'address', title: 'Add Business Address', description: 'Tell customers where to find you.', step: 3 },
    { id: 'location', title: 'Confirm Business Location', description: 'Verify your business location on the map.', step: '3A', optional: true },
    { id: 'plan', title: 'Choose Your Subscription Plan', description: 'Pick a plan — even the free plan gets you started.', step: 5 },
];

export interface OnboardingCheck {
    hasCategory: boolean;
    hasLogo: boolean;
    hasAddress: boolean;
    hasLocation: boolean;
    hasPlan: boolean;
}

export function getOnboardingCheck(business: Business | null | undefined, hasPlan: boolean): OnboardingCheck {
    const category = business?.category || business?.categoryId || business?.subcategory || business?.subcategoryId;
    const address = business?.address?.trim() || (business?.city && business?.state) || business?.city;
    // Backend serves lat/lng as Postgres decimals which can arrive as strings;
    // accept either and treat a genuine 0,0 as unset.
    const lat = business?.latitude != null ? Number(business.latitude) : NaN;
    const lng = business?.longitude != null ? Number(business.longitude) : NaN;
    const hasGpsCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
    return {
        hasCategory: !!category,
        hasLogo: !!business?.logoUrl,
        hasAddress: !!address,
        hasLocation: hasGpsCoords || !!address,
        hasPlan,
    };
}

export function getMissingOnboardingFields(business: Business | null | undefined, hasPlan: boolean): OnboardingField[] {
    const check = getOnboardingCheck(business, hasPlan);
    return ONBOARDING_FIELDS.filter((f) => {
        switch (f.id) {
            case 'category':
                return !check.hasCategory;
            case 'logo':
                return !check.hasLogo;
            case 'address':
                return !check.hasAddress;
            case 'location':
                return !check.hasLocation;
            case 'plan':
                return !check.hasPlan;
        }
    });
}

export function isOnboardingComplete(business: Business | null | undefined, hasPlan: boolean): boolean {
    return getMissingOnboardingFields(business, hasPlan).length === 0;
}

export function nextOnboardingStep(business: Business | null | undefined, hasPlan: boolean): number | string | null {
    const missing = getMissingOnboardingFields(business, hasPlan);
    return missing.length > 0 ? missing[0].step : null;
}

/**
 * Hard requirements only. Optional fields (e.g. location) are still shown on
 * the dashboard activation checklist but never force a redirect away from the
 * dashboard — otherwise a user who skipped location gets bounced back into
 * onboarding forever, even after paying.
 */
export function getMissingRequiredOnboardingFields(
    business: Business | null | undefined,
    hasPlan: boolean,
): OnboardingField[] {
    return getMissingOnboardingFields(business, hasPlan).filter((f) => !f.optional);
}

export function isRequiredOnboardingComplete(
    business: Business | null | undefined,
    hasPlan: boolean,
): boolean {
    return getMissingRequiredOnboardingFields(business, hasPlan).length === 0;
}

export function nextRequiredOnboardingStep(
    business: Business | null | undefined,
    hasPlan: boolean,
): number | string | null {
    const missing = getMissingRequiredOnboardingFields(business, hasPlan);
    return missing.length > 0 ? missing[0].step : null;
}
