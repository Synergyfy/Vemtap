'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useActiveSubscription } from '@/services/subscriptions/hooks';

export default function OnboardingRouteGuard({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const { data: myBusiness, isLoading: businessLoading } = useMyBusiness();
    const { data: subscription, isLoading: subscriptionLoading } = useActiveSubscription();

    const role = (user?.role as string)?.toLowerCase() || '';
    const isOwner = role === 'owner';

    const hasBusiness = !!user?.businessId && !!myBusiness?.id;

    const hasActivePlan =
        !!user?.planId ||
        !!subscription?.plan?.id ||
        !!subscription?.planId ||
        !!subscription?.id;

    const planLocked =
        subscription?.status === 'expired' || subscription?.status === 'cancelled';

    const isSubscriptionPage = pathname?.startsWith('/dashboard/settings/subscription');

    useEffect(() => {
        if (!user || !isOwner) return;
        if (businessLoading || subscriptionLoading) return;

        // Genuinely new user with no business yet → onboarding.
        if (!hasBusiness) {
            router.replace('/onboarding');
            return;
        }

        // Established account with dashboard access. Missing onboarding fields
        // (logo, GPS location, etc.) are a dashboard checklist — never a redirect.
        // Only a missing/expired subscription locks the page, and it points to the
        // subscription page inside the dashboard, NOT onboarding.
        if ((!hasActivePlan || planLocked) && !isSubscriptionPage) {
            router.replace('/dashboard/settings/subscription');
            return;
        }
    }, [user, isOwner, hasBusiness, hasActivePlan, planLocked, subscription, businessLoading, subscriptionLoading, isSubscriptionPage, router]);

    if (!user || !isOwner) return <>{children}</>;

    if (businessLoading || subscriptionLoading) {
        return (
            <div className="flex items-center justify-center p-8 h-screen">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!hasBusiness) return null;

    return <>{children}</>;
}
