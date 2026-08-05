'use client';

import React from 'react';
import { ShieldCheck, CheckCircle, XCircle, Clock, AlertTriangle, FileText, UserCheck, Building2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useRouter } from 'next/navigation';

const KYC_TIERS = [
  {
    level: 1,
    name: 'Basic',
    label: 'Bronze',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconColor: 'text-amber-500',
    requirements: ['Business Name & Address', 'Phone Number', 'Email Address'],
    limits: 'Up to ₦500,000 monthly transactions',
  },
  {
    level: 2,
    name: 'Intermediate',
    label: 'Silver',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    iconColor: 'text-gray-400',
    requirements: ['All Basic requirements', 'Valid Government ID', 'Utility Bill (Proof of Address)'],
    limits: 'Up to ₦5,000,000 monthly transactions',
  },
  {
    level: 3,
    name: 'Advanced',
    label: 'Gold',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-100',
    iconColor: 'text-yellow-500',
    requirements: ['All Intermediate requirements', 'CAC Certificate', 'Business Registration Number'],
    limits: 'Unlimited monthly transactions',
  },
];

export function KycSettingsView() {
  const router = useRouter();
  const { data: business } = useMyBusiness();

  const hasCac = !!business?.cacDocument;
  const hasId = !!business?.idDocument;
  const hasUtility = !!(business as any)?.utilityBill;
  const hasName = !!business?.name;
  const hasPhone = !!business?.phone;
  const hasEmail = !!business?.officialEmail;

  const basicComplete = hasName && hasPhone && hasEmail;
  const intermediateComplete = basicComplete && hasId && hasUtility;
  const advancedComplete = intermediateComplete && hasCac;

  const getCurrentTier = () => {
    if (advancedComplete) return 3;
    if (intermediateComplete) return 2;
    if (basicComplete) return 1;
    return 0;
  };

  const currentTier = getCurrentTier();
  const status = business?.status || 'pending';
  const isVerified = status === 'active';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KYC Status Header */}
      <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
        <div className="flex items-start gap-6">
          <div className={cn(
            "size-14 rounded-2xl border flex items-center justify-center shrink-0",
            isVerified ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
          )}>
            {isVerified ? (
              <ShieldCheck size={28} className="text-emerald-500" />
            ) : (
              <Clock size={28} className="text-amber-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-gray-900 mb-1">KYC Verification</h3>
            <p className="text-xs text-gray-500 font-medium">
              {isVerified
                ? 'Your business is verified. You have access to all features.'
                : 'Complete your KYC to unlock higher transaction limits and full access.'}
            </p>
          </div>
          <div className={cn(
            "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest shrink-0",
            isVerified ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
            status === 'suspended' ? "bg-red-50 text-red-600 border-red-100" :
            "bg-amber-50 text-amber-600 border-amber-100"
          )}>
            {isVerified ? 'Verified' : status === 'suspended' ? 'Suspended' : 'Pending'}
          </div>
        </div>

        {!isVerified && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
            <AlertTriangle size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-700">Verification in progress</p>
              <p className="text-[10px] text-blue-600 font-medium mt-0.5">Our team will review your submitted documents and update your status within 1-2 business days.</p>
            </div>
          </div>
        )}
      </div>

      {/* KYC Tiers */}
      <div className="space-y-4">
        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest px-1">Verification Tiers</h4>
        {KYC_TIERS.map((tier) => {
          const isUnlocked = currentTier >= tier.level;
          const isCurrent = currentTier === tier.level - 1;
          const isLocked = currentTier < tier.level - 1;

          return (
            <div
              key={tier.level}
              className={cn(
                "rounded-[32px] p-6 border transition-all",
                isUnlocked ? "bg-white border-emerald-100 shadow-sm" :
                isCurrent ? "bg-white border-[#066CF4]/30 shadow-sm shadow-[#066CF4]/5" :
                "bg-gray-50/50 border-gray-100 opacity-70"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "size-12 rounded-2xl flex items-center justify-center shrink-0 border",
                  isUnlocked ? "bg-emerald-50 border-emerald-100" :
                  isCurrent ? "bg-[#066CF4]/5 border-[#066CF4]/20" :
                  "bg-gray-100 border-gray-200"
                )}>
                  {isUnlocked ? (
                    <CheckCircle size={22} className="text-emerald-500" />
                  ) : (
                    <span className="text-lg font-black text-gray-400">{tier.level}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-base font-black text-gray-900">Tier {tier.level}: {tier.name}</h4>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                      tier.bg, tier.color, tier.border
                    )}>
                      {tier.label}
                    </span>
                    {isUnlocked && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium mb-3">{tier.limits}</p>
                  <div className="space-y-1.5">
                    {tier.requirements.map((req, i) => {
                      const isMet = isUnlocked || (isCurrent && i < 2); // simplified check
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {isUnlocked ? (
                            <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                          ) : (
                            <div className="size-3 rounded-full border-2 border-gray-300 shrink-0" />
                          )}
                          <span className={isUnlocked ? "text-gray-700 font-medium" : "text-gray-400"}>{req}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {isCurrent && (
                  <button
                    onClick={() => router.push('/dashboard/settings')}
                    className="px-5 h-10 bg-[#066CF4] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shrink-0 flex items-center gap-1"
                  >
                    Complete <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
