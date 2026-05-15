'use client';

import React, { useEffect, useMemo } from 'react';
import DashboardBanner from './DashboardBanner';
import { useBannerStore, getIconByName } from '@/store/useBannerStore';

export default function DashboardBannerWrapper() {
    const { slides, fetchBanners } = useBannerStore();

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const bannerSlides = useMemo(() => slides.map(s => ({
        ...s,
        icon: getIconByName(s.iconName)
    })), [slides]);

    return <DashboardBanner slides={bannerSlides} />;
}
