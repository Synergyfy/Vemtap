'use client';

import React, { useEffect, useMemo } from 'react';
import DashboardBanner from './DashboardBanner';
import { useBannerStore, getIconByName } from '@/store/useBannerStore';
import { useOnboarding } from '@/hooks/useOnboarding';
import { PartyPopper, Sparkles } from 'lucide-react';
import { useBranches } from '@/services/branches/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardBannerWrapper() {
    const { slides, fetchBanners } = useBannerStore();
    const { percentage, isComplete, nextPendingItem } = useOnboarding();
    const { activeBranchId } = useActiveBranch();
    const { data: branches = [] } = useBranches();
    const businessName = useAuthStore((state) => state.user?.businessName);

    useEffect(() => {
        fetchBanners();
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
        let allSlides = slides.length > 0 
            ? slides.map(s => ({ ...s, icon: getIconByName(s.iconName), tag: 'NEWS' }))
            : [{
                id: 'default-welcome',
                title: `Welcome to ${branchDisplayName} Dashboard`,
                description: 'Manage your visitors, loyalty programs, and messaging all in one place. Explore our new features to grow your business.',
                icon: Sparkles,
                color: 'bg-gradient-to-r from-[#066CF4] to-[#4293FF]',
                tag: 'NEWS'
              }];

        if (!isComplete) {
            const onboardingSlide = {
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
            return [onboardingSlide, ...allSlides];
        }

        return allSlides;
    }, [slides, isComplete, percentage, nextPendingItem]);

    return <DashboardBanner slides={bannerSlides} />;
}
