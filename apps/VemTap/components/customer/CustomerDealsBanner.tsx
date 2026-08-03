'use client';

import React, { useEffect, useMemo } from 'react';
import DashboardBanner, { BannerSlide } from '@/components/dashboard/DashboardBanner';
import { useBannerStore, getIconByName } from '@/store/useBannerStore';
import { resolveBannerText } from '@/lib/utils';

interface CustomerDealsBannerProps {
    memberSlide?: BannerSlide;
    firstName?: string;
}

export default function CustomerDealsBanner({ memberSlide, firstName }: CustomerDealsBannerProps) {
    const { customerSlides, fetchBanners } = useBannerStore();

    useEffect(() => {
        fetchBanners('customer');
    }, [fetchBanners]);

    const slides = useMemo<BannerSlide[]>(() => {
        const resolveVars = { firstName: firstName || 'there', name: firstName || 'there' };
        const list: BannerSlide[] = [];

        if (memberSlide) {
            list.push(memberSlide);
        }

        customerSlides.forEach((s) => {
            list.push({
                id: s.id,
                title: resolveBannerText(s.title, resolveVars),
                description: resolveBannerText(s.description, resolveVars),
                icon: getIconByName(s.iconName),
                actionLabel: resolveBannerText(s.actionLabel, resolveVars),
                actionUrl: s.actionUrl,
                color: s.color || 'bg-gradient-to-r from-emerald-600 to-teal-500',
                targetType: s.targetType,
                targetId: s.targetId,
            });
        });

        return list;
    }, [customerSlides, memberSlide, firstName]);

    return <DashboardBanner slides={slides} autoPlayInterval={6000} />;
}
