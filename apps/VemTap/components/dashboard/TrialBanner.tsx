'use client';

import { useRouter } from 'next/navigation';
import { Clock, ArrowRight } from 'lucide-react';
import { useActiveSubscription } from '@/services/subscriptions/hooks';

interface TrialBannerProps {
    onUpgrade?: () => void;
}

export default function TrialBanner({ onUpgrade }: TrialBannerProps) {
    const router = useRouter();
    const { data: subscription, isLoading } = useActiveSubscription();

    if (isLoading) {
        return null;
    }

    const isOnTrial = subscription?.status === 'trial';

    if (!isOnTrial || !subscription?.trialEndDate) {
        return null;
    }

    const trialEndDate = new Date(subscription.trialEndDate);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const planName = subscription?.plan?.name || 'Premium';

    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade();
        } else {
            router.push('/settings?tab=subscription');
        }
    };

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600 shrink-0">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-900">
                            Free Trial - {planName}
                        </p>
                        <p className="text-xs text-amber-700">
                            {daysRemaining > 0 
                                ? `Your trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}` 
                                : 'Your trial ends today!'
                            }
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleUpgrade}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-colors shrink-0"
                >
                    Upgrade Now
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
