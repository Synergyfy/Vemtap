'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import UpgradeModal from './UpgradeModal';
import { Lock } from 'lucide-react';

interface PageLockWrapperProps {
  children: React.ReactNode;
  feature: string;
  featureName: string;
}

export default function PageLockWrapper({ children, feature, featureName }: PageLockWrapperProps) {
  const pathname = usePathname();
  const { isFeatureLocked, fetchCapabilities, capabilities, isLoading } = useSubscriptionStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!capabilities) {
      fetchCapabilities();
    }
  }, [capabilities, fetchCapabilities]);

  // Close modal on navigation
  useEffect(() => {
    setShowModal(false);
  }, [pathname]);

  const locked = isFeatureLocked(feature);

  useEffect(() => {
    if (locked && !isLoading) {
      setShowModal(true);
    }
  }, [locked, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-gray-50/50 flex flex-col items-center justify-center p-8">
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none filter blur-sm">
            {children}
        </div>
        
        <div className="text-center z-10 max-w-md">
            <div className="size-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-primary mx-auto mb-6 border border-gray-100">
                <Lock size={40} />
            </div>
            <h2 className="text-3xl font-display font-bold text-text-main mb-3">Locked Feature</h2>
            <p className="text-text-secondary font-medium mb-8">
                The {featureName} module is not included in your current plan. Please upgrade to unlock this and more.
            </p>
            
            <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
            >
                Upgrade Plan
            </button>
        </div>

        <UpgradeModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          featureName={featureName}
        />
      </div>
    );
  }

  return <>{children}</>;
}
