'use client';

import React, { useEffect, useMemo } from 'react';
import DashboardBanner, { BannerSlide } from './DashboardBanner';
import { useBannerStore, getIconByName } from '@/store/useBannerStore';
import { useOnboarding } from '@/hooks/useOnboarding';
import { PartyPopper, Sparkles, Bot } from 'lucide-react';
import { useBranches } from '@/services/branches/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useAuthStore } from '@/store/useAuthStore';
import { resolveBannerText } from '@/lib/utils';

interface DashboardBannerWrapperProps {
    onAnalyzeDashboard?: () => void;
}

export default function DashboardBannerWrapper({ onAnalyzeDashboard }: DashboardBannerWrapperProps) {
    const { businessSlides, fetchBanners } = useBannerStore();
    const { percentage, isComplete, nextPendingItem } = useOnboarding();
    const { activeBranchId } = useActiveBranch();
    const { data: branches = [] } = useBranches();
    const businessName = useAuthStore((state) => state.user?.businessName);

    useEffect(() => {
        fetchBanners('business');
    }, [fetchBanners]);

    const activeBranch = branches.find(b => b.id === activeBranchId);
    const branchDisplayName = useMemo(() => {
        if (!activeBranchId) return 'All Locations';
        const normalized = (activeBranch?.name || '').trim();
        const isDefaultLabel = /^main\s*branch$/i.test(normalized);
        if (activeBranch?.isMainBranch && (isDefaultLabel || !normalized) && businessName) return businessName;
        return normalized || businessName || 'Main Branch';
    }, [activeBranch, activeBranchId, businessName]);

    const bannerSlides = useMemo(() => {
        const resolveVars = {
            businessName: businessName || branchDisplayName,
            branchName: branchDisplayName,
            firstName: businessName || branchDisplayName,
        };

        const allSlides: BannerSlide[] =
            businessSlides.length > 0
                ? businessSlides.map(s => ({ ...s, icon: getIconByName(s.iconName), tag: 'NEWS' }))
                : [{
                    id: 'default-welcome',
                    title: `Welcome to {businessName} Dashboard`,
                    description: 'Track visitors, loyalty, and messaging all in one place. Use the menu to manage your day-to-day.',
                    icon: Sparkles,
                    color: 'bg-gradient-to-r from-[#066CF4] to-[#4293FF]',
                    tag: 'NEWS'
                }];

        const resolved: BannerSlide[] = allSlides.map((s) => ({
            ...s,
            title: resolveBannerText(s.title, resolveVars),
            description: resolveBannerText(s.description, resolveVars),
            actionLabel: resolveBannerText(s.actionLabel, resolveVars),
        }));

        if (!isComplete) {
            const onboardingSlide: BannerSlide = {
                id: 'onboarding-progress',
                title: `${percentage}% Setup Complete`,
                description: nextPendingItem?.description || 'Your journey to seamless customer engagement starts here.',
                icon: PartyPopper,
                actionLabel: 'Continue Setup',
                actionUrl: nextPendingItem?.route || '/dashboard',
                color: 'bg-white border-2 border-[#066CF4]/10',
                tag: 'SETUP',
                isLight: true
            };
            return [onboardingSlide, ...resolved];
        }

        return resolved;
    }, [businessSlides, isComplete, percentage, nextPendingItem, businessName, branchDisplayName]);

    const businessAdvisorSlide = useMemo(() => ({
        id: 'business-advisor',
        title: 'Business Advisor',
        description: 'Get AI-powered insights about your business performance, customer behavior, and growth opportunities.',
        icon: Bot,
        actionLabel: 'Analyze Dashboard',
        onAction: onAnalyzeDashboard,
        color: 'bg-gradient-to-r from-blue-500 to-purple-600',
        tag: 'AI'
    }), [onAnalyzeDashboard]);

    const allSlides = useMemo(() => {
        return [businessAdvisorSlide, ...bannerSlides];
    }, [businessAdvisorSlide, bannerSlides]);

    return <DashboardBanner slides={allSlides} />;
}
