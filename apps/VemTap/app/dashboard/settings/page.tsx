"use client";

import React from 'react';
import { 
    SettingsOverviewHeader, 
    BusinessProfileCard, 
    SettingsNavigationCards 
} from '@/components/dashboard/settings/SettingsComponents';
import { ProfileSettingsView } from '@/components/dashboard/settings/ProfileSettings';
import { TeamSettingsView } from '@/components/dashboard/settings/TeamSettings';
import { SubscriptionSettingsView } from '@/components/dashboard/settings/SubscriptionSettings';
import { BillingSettingsView } from '@/components/dashboard/settings/BillingSettings';
import { NotificationSettingsView, SecuritySettingsView } from '@/components/dashboard/settings/OtherSettings';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useSettingsStore } from '@/store/useSettingsStore';
import Spinner from '@/components/ui/Spinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
    const { data: business, isLoading } = useMyBusiness();
    const { activeTab, setActiveTab } = useSettingsStore();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileSettingsView business={business} />;
            case 'team': return <TeamSettingsView />;
            case 'subscription': return <SubscriptionSettingsView />;
            case 'billing': return <BillingSettingsView />;
            case 'notifications': return <NotificationSettingsView />;
            case 'security': return <SecuritySettingsView />;
            default: return <SettingsNavigationCards />;
        }
    };

    const isHubView = activeTab === 'profile' || activeTab === 'team' || activeTab === 'subscription' || activeTab === 'billing' || activeTab === 'notifications' || activeTab === 'security';

    return (
        <div className="pb-24 md:pb-10 max-w-5xl mx-auto p-4 md:p-8">
            <SettingsOverviewHeader />
            
            {!isHubView && (
                <>
                  <BusinessProfileCard business={business} />
                  <SettingsNavigationCards />
                </>
            )}

            {isHubView && (
                <>
                  <Button variant="ghost" onClick={() => setActiveTab('profile')} className="mb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <ArrowLeft className="mr-2" size={14} /> Back to Settings
                  </Button>
                  {renderContent()}
                </>
            )}
        </div>
    );
}
