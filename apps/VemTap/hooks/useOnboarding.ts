'use client';

import { useMemo } from 'react';
import { 
    QrCode, UserPlus, Send, Tags, Image, MapPin, MapPinned, Crown, Tag
} from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAnalyticsOverview } from '@/services/marketing-assets/hooks';
import { useDashboardAnalytics } from '@/services/analytics/hooks';
import { useActiveSubscription } from '@/services/subscriptions/hooks';
import { useCatalogueOffersAdmin } from '@/services/catalogue/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { getOnboardingCheck } from '@/lib/onboardingGate';

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
    const { data: marketingAnalytics } = useAnalyticsOverview();
    const { data: dashboardAnalytics } = useDashboardAnalytics();
    const user = useAuthStore((state) => state.user);
    const { data: subscription } = useActiveSubscription();
    const { data: offers } = useCatalogueOffersAdmin();

    const checklistItems = useMemo((): OnboardingItem[] => {
        const stats = dashboardAnalytics?.stats || [];
        const visitorsCount = stats.find(s => s.label.toLowerCase().includes('total visitors'))?.value || '0';
        const hasPlan = !!user?.planId || !!subscription?.plan?.id || !!subscription?.planId;
        const check = getOnboardingCheck(myBusiness ?? null, hasPlan);

        return [
            {
                id: 'category',
                title: 'Choose Business Category',
                description: 'Select the category that best describes your business.',
                icon: Tags,
                isCompleted: check.hasCategory,
                route: '/onboarding?step=2'
            },
            {
                id: 'logo',
                title: 'Upload Business Logo',
                description: 'Add your brand logo so customers can recognise you.',
                icon: Image,
                isCompleted: check.hasLogo,
                route: '/onboarding?step=3'
            },
            {
                id: 'address',
                title: 'Add Business Address',
                description: 'Tell customers where to find you.',
                icon: MapPin,
                isCompleted: check.hasAddress,
                route: '/onboarding?step=3'
            },
            {
                id: 'location',
                title: 'Confirm Business Location',
                description: 'Verify your business location on the map.',
                icon: MapPinned,
                isCompleted: check.hasLocation,
                route: '/onboarding?step=3A'
            },
            {
                id: 'plan',
                title: 'Choose Your Subscription Plan',
                description: 'Pick a plan — even the free plan gets you started.',
                icon: Crown,
                isCompleted: check.hasPlan,
                route: '/onboarding?step=5'
            },
            {
                id: 'qr',
                title: 'My Business QR',
                description: 'Manage your primary business QR and customer experience.',
                icon: QrCode,
                isCompleted: !!myBusiness?.id,
                route: '/dashboard/customer-experience'
            },
            {
                id: 'deals',
                title: 'Create Deals',
                description: 'Set up attractive offers to bring in customers.',
                icon: Tag,
                isCompleted: !!offers && offers.length > 0,
                route: '/dashboard/discovery/deals'
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
                isCompleted: false,
                route: '/dashboard/messaging'
            }
        ].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
    }, [myBusiness, marketingAnalytics, dashboardAnalytics, user?.planId, subscription, offers]);

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
