'use client';

import { useMemo } from 'react';
import { 
    Edit, QrCode, Download, UserPlus, Send
} from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useMarketingAssets, useAnalyticsOverview } from '@/services/marketing-assets/hooks';
import { useDashboardAnalytics } from '@/services/analytics/hooks';

export interface OnboardingItem {
    id: string;
    title: string;
    description: string;
    icon: any;
    isCompleted: boolean;
    route: string;
}

export function useOnboarding() {
    const { data: myBusiness } = useMyBusiness();
    const { data: assets } = useMarketingAssets();
    const { data: marketingAnalytics } = useAnalyticsOverview();
    const { data: dashboardAnalytics } = useDashboardAnalytics();

    const checklistItems = useMemo((): OnboardingItem[] => {
        const stats = dashboardAnalytics?.stats || [];
        const visitorsCount = stats.find(s => s.label.toLowerCase().includes('total visitors'))?.value || '0';
        
        return [
            {
                id: 'profile',
                title: 'Complete Profile',
                description: 'Add your brand logo and business details.',
                icon: Edit,
                isCompleted: !!myBusiness?.logoUrl,
                route: '/dashboard/settings/profile'
            },
            {
                id: 'qr',
                title: 'My Business QR',
                description: 'Manage your primary business QR and customer experience.',
                icon: QrCode,
                isCompleted: !!myBusiness?.id, // Business always has a QR once registered
                route: '/dashboard/customer-experience'
            },
            {
                id: 'assets',
                title: 'Get Marketing Assets',
                description: 'Download print-ready posters and cards.',
                icon: Download,
                isCompleted: !!assets && assets.length > 0,
                route: '/dashboard/marketing-assets'
            },
            {
                id: 'customer',
                title: 'Capture First Customer',
                description: 'See the magic. Capture your first digital lead.',
                icon: UserPlus,
                isCompleted: visitorsCount !== '0',
                route: '/dashboard/visitors'
            },
            {
                id: 'campaign',
                title: 'Send First Campaign',
                description: 'Reward customers with a welcome offer.',
                icon: Send,
                isCompleted: false, // Placeholder for now
                route: '/dashboard/messaging'
            }
        ];
    }, [myBusiness, assets, marketingAnalytics, dashboardAnalytics]);

    const completedCount = checklistItems.filter(i => i.isCompleted).length;
    const totalCount = checklistItems.length;
    const percentage = Math.round((completedCount / totalCount) * 100);
    const isComplete = percentage === 100;
    const nextPendingItem = checklistItems.find(i => !i.isCompleted);

    return {
        checklistItems,
        percentage,
        isComplete,
        nextPendingItem,
        completedCount,
        totalCount
    };
}
