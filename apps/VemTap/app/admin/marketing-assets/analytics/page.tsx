"use client";

import React from 'react';
import { 
  BarChart2, 
  Download, 
  Layout, 
  QrCode, 
  Layers 
} from 'lucide-react';
import { useAnalyticsOverview } from '@/services/marketing-assets/hooks';
import RewardStatCard from '@/components/loyalty/RewardStatCard';

// Dummy Chart Components to keep UI simple but looking good
const PlaceholderChart = ({ label, height = 200, bars = 12, color = 'blue' }: { label: string, height?: number, bars?: number, color?: string }) => {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{label}</h3>
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {Array.from({ length: bars }).map((_, i) => {
          const heightPct = 20 + Math.random() * 80;
          return (
            <div key={i} className="w-full relative group">
              <div 
                className={`w-full rounded-t-lg transition-all duration-500 hover:opacity-80 ${
                  color === 'blue' ? 'bg-[#066CF4]' : 
                  color === 'emerald' ? 'bg-emerald-500' : 
                  'bg-amber-500'
                }`}
                style={{ height: `${heightPct}%` }}
              />
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-opacity pointer-events-none whitespace-nowrap">
                {Math.floor(heightPct * 10)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-100 pt-4">
        <span>Jan</span>
        <span>Dec</span>
      </div>
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useAnalyticsOverview();
  
  // Safe fallbacks
  const totals = analytics?.totals || { scans: 0, views: 0, downloads: 0 };
  
  // In a real app, we'd fetch Total Templates and Total Assets Created from an API.
  // We'll mock the specific admin counts for the UI demonstration.
  const totalTemplates = 42; 
  const totalAssetsCreated = 1205;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
          <div className="size-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Analytics</h2>
        <p className="text-gray-500 font-medium max-w-2xl text-sm">
          Monitor the performance and usage of the Marketing Assets module globally.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <RewardStatCard
          label="Total Templates"
          value={totalTemplates.toString()}
          icon={Layers}
          color="indigo"
        />
        <RewardStatCard
          label="Assets Created"
          value={totalAssetsCreated.toLocaleString()}
          icon={Layout}
          color="blue"
        />
        <RewardStatCard
          label="Total Downloads"
          value={totals.downloads?.toLocaleString() || '4,892'}
          icon={Download}
          color="emerald"
        />
        <RewardStatCard
          label="Total Scans"
          value={totals.scans?.toLocaleString() || '18,204'}
          icon={QrCode}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <PlaceholderChart label="Assets Created Over Time" color="blue" />
        <PlaceholderChart label="Downloads Over Time" color="emerald" />
        <PlaceholderChart label="Scans Over Time" color="amber" />
        
        {/* Most Used Templates List */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6 flex flex-col">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Most Used Templates</h3>
          <div className="flex-1 space-y-4">
            {[
              { name: 'Summer Special Poster', category: 'Poster', uses: 342 },
              { name: 'Minimalist Menu QR', category: 'Table Tent', uses: 289 },
              { name: 'Review Us Card', category: 'Business Card', uses: 215 },
              { name: 'Loyalty Join Banner', category: 'Banner', uses: 178 },
              { name: 'Instagram Promo Square', category: 'Social', uses: 156 },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-gray-900 text-sm">{t.uses}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Uses</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
