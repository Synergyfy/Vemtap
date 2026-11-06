'use client';

import React from 'react';

interface DistanceNoticeBannerProps {
  locationName?: string | null;
  minDistanceKm?: number | null;
  onOpenLocationModal: () => void;
  className?: string;
}

export default function DistanceNoticeBanner({
  locationName,
  minDistanceKm,
  onOpenLocationModal,
  className = '',
}: DistanceNoticeBannerProps) {
  const displayLocation = locationName?.trim() || 'your area';
  const displayDistance = minDistanceKm ? `${Math.round(minDistanceKm)}+ km away` : '15+ km away';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#c8daf8] bg-gradient-to-br from-[#eff5ff] via-[#f7faff] to-white p-4 sm:p-5 shadow-sm transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#0055c4]/10 text-[#0055c4] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-sm">
            <span className="material-symbols-outlined text-[22px]">travel_explore</span>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[14px] sm:text-[15px] font-bold text-[#191c1e] tracking-tight">
                Widening your radius
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0055c4]/10 text-[#0055c4] text-[11px] font-bold tracking-wide">
                <span className="material-symbols-outlined text-[13px]">near_me</span>
                {displayDistance}
              </span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-[#424655] leading-relaxed max-w-2xl">
              The closest deals to <span className="font-semibold text-[#191c1e]">{displayLocation}</span> are a little further out today. We’ve pulled in top-rated offers across the region so you don’t miss out on savings!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenLocationModal}
          className="self-start sm:self-center shrink-0 px-3.5 py-2 rounded-xl bg-white border border-[#0055c4]/30 hover:border-[#0055c4] text-[#0055c4] text-[12px] font-bold shadow-sm transition-all hover:bg-[#eff5ff] active:scale-95 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">edit_location</span>
          Change Location
        </button>
      </div>
    </div>
  );
}
