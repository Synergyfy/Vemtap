"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, QrCode, FileText, Download, Award, TrendingUp, Tags, Sparkles, ImageIcon, Medal, GitBranch } from 'lucide-react';
import RewardStatCard from '@/components/loyalty/RewardStatCard';
import { useMarketingAssets, useDownloadsLog, useMarketingTemplates, useMarketingCategories, useMockups, useAIPrompts } from '@/services/marketing-assets/hooks';

function LeaderboardRow({ rank, label, value, unit, max }: { rank: number; label: string; value: number; unit: string; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const medalColors = ['#F59E0B', '#9CA3AF', '#CD7F32'];
  return (
    <div className="flex items-center gap-3 group">
      <div className="size-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
        style={{ backgroundColor: rank <= 3 ? medalColors[rank - 1] + '20' : '#F9FAFB', color: rank <= 3 ? medalColors[rank - 1] : '#9CA3AF' }}>
        {rank <= 3 ? <Medal size={14} /> : rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-800 truncate pr-2">{label}</span>
          <span className="text-xs font-extrabold text-gray-500 shrink-0">{value.toLocaleString()} {unit}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }} />
        </div>
      </div>
    </div>
  );
}

export default function PlatformPrintAnalyticsPage() {
  const { data: assets } = useMarketingAssets();
  const { data: downloads } = useDownloadsLog();
  const { data: templates } = useMarketingTemplates(undefined, undefined, true);
  const { data: categories } = useMarketingCategories(true);
  const { data: mockups } = useMockups(undefined, true);
  const { data: prompts } = useAIPrompts();

  const totalAssets = assets?.length || 0;
  const totalDownloads = downloads?.length || 0;
  const totalTemplates = templates?.length || 0;
  const totalCategories = categories?.filter(c => c.isActive).length || 0;
  const totalMockups = mockups?.length || 0;
  const totalPrompts = prompts?.length || 0;

  // Format breakdown: count downloads by format
  const formatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (downloads || []).forEach(d => {
      const fmt = d.format || 'unknown';
      counts[fmt] = (counts[fmt] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [downloads]);

  const formatTotal = formatCounts.reduce((s, [, c]) => s + c, 0);

  // Top templates: count assets per template
  const topTemplates = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    (assets || []).forEach(a => {
      if (a.templateId) {
        if (!counts[a.templateId]) {
          counts[a.templateId] = { name: a.template?.name || 'Unknown Template', count: 0 };
        }
        counts[a.templateId].count++;
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [assets]);

  const topTemplatesMax = topTemplates.length > 0 ? Math.max(...topTemplates.map(t => t.count)) : 1;

  // Assets per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (assets || []).forEach(a => {
      const cat = a.template?.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [assets]);

  const categoryMax = categoryCounts.length > 0 ? Math.max(...categoryCounts.map(([, c]) => c)) : 1;

  return (
    <div className="space-y-8 pb-10">

      {/* §58.1-58.4: Platform-wide aggregate cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        <RewardStatCard label="Design Templates" value={totalTemplates.toLocaleString()} icon={Layers} color="blue" />
        <RewardStatCard label="Total Assets Generated" value={totalAssets.toLocaleString()} icon={Award} color="indigo" />
        <RewardStatCard label="Total Downloads" value={totalDownloads.toLocaleString()} icon={Download} color="green" />
        <RewardStatCard label="Active Categories" value={totalCategories.toLocaleString()} icon={Tags} color="amber" />
        <RewardStatCard label="Mockup Backdrops" value={totalMockups.toLocaleString()} icon={ImageIcon} color="purple" />
        <RewardStatCard label="AI Prompts Presets" value={totalPrompts.toLocaleString()} icon={Sparkles} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

        {/* §58.3: Format Analytics — most downloaded format breakdown */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
          <h4 className="font-bold text-gray-900 text-base mb-6 flex items-center gap-2">
            <FileText size={18} className="text-gray-500" />
            Format Download Breakdown
          </h4>
          {formatCounts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No downloads recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {formatCounts.map(([format, count]) => {
                const pct = formatTotal > 0 ? Math.round((count / formatTotal) * 100) : 0;
                return (
                  <div key={format} className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-900 font-bold capitalize">{format.replace(/_/g, ' ')}</span>
                      <span className="text-gray-500 font-mono">{count.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-primary rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* §58.2: Template Analytics — most used templates */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Award size={16} />
              Most Used Templates
            </h4>
            {topTemplates.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No template usage data yet.</p>
            ) : (
              <div className="space-y-3 pt-1">
                {topTemplates.slice(0, 5).map((t, i) => (
                  <LeaderboardRow key={t.name} rank={i + 1} label={t.name} value={t.count} unit="uses" max={topTemplatesMax} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* §58.4: Category Performance — assets per category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Tags size={16} className="text-gray-500" />
            Category Performance
          </h4>
          {categoryCounts.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No category data yet.</p>
          ) : (
            <div className="space-y-3 pt-1">
              {categoryCounts.map(([cat, count], i) => (
                <LeaderboardRow key={cat} rank={i + 1} label={cat} value={count} unit="assets" max={categoryMax} />
              ))}
            </div>
          )}
        </div>

        {/* QR Analytics placeholder */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <QrCode size={16} className="text-gray-500" />
            QR Scan Analytics
          </h4>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <QrCode size={40} className="text-gray-200 mb-3" />
            <p className="text-xs text-gray-400 font-medium max-w-[220px]">
              Platform-wide QR scan tracking requires a dedicated admin analytics endpoint. Scans are currently tracked per-business.
            </p>
            <span className="mt-3 text-[10px] font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full">Coming in Phase 2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
