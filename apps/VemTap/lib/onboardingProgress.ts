'use client';

export interface OnboardingProgress {
    currentStep: number | string;
    data: Record<string, unknown>;
    refCode?: string | null;
    savedAt: number;
}

const KEY_PREFIX = 'vemtap-onboarding-progress';

export function onboardingProgressKey(userId: string): string {
    return `${KEY_PREFIX}-${userId}`;
}

export function loadOnboardingProgress(userId?: string): OnboardingProgress | null {
    if (!userId) return null;
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(onboardingProgressKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as OnboardingProgress;
        if (parsed.currentStep == null) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function saveOnboardingProgress(
    userId: string | undefined,
    currentStep: number | string,
    data: Record<string, unknown>,
    refCode?: string | null,
): void {
    if (!userId) return;
    if (typeof window === 'undefined') return;
    try {
        const payload: OnboardingProgress = { currentStep, data, refCode, savedAt: Date.now() };
        window.localStorage.setItem(onboardingProgressKey(userId), JSON.stringify(payload));
    } catch {}
}

export function clearOnboardingProgress(userId?: string): void {
    if (!userId) return;
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(onboardingProgressKey(userId));
    } catch {}
}

export function hasSavedOnboardingProgress(userId?: string): boolean {
    return !!loadOnboardingProgress(userId);
}