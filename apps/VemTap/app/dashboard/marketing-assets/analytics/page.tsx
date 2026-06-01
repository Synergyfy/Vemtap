"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAnalyticsOverview, useMarketingAssets, useAssetAnalytics, useDownloadsLog } from '@/services/marketing-assets/hooks';
import {
  BarChart2,
  TrendingUp,
  Eye,
  QrCode,
  Filter,
  Calendar,
  Download,
  Layers,
  Medal,
  GitBranch,
  Trophy,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

// ─── Leaderboard row component ─────────────────────────────────────────────
function LeaderboardRow({
  rank,
  label,
  value,
  unit,
  max,
}: {
  rank: number;
  label: string;
  value: number;
  unit: string;
  max: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const medalColors = ['#F59E0B', '#9CA3AF', '#CD7F32'];

  return (
    <div className="flex items-center gap-3 group">
      <div
        className="size-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
        style={{
          backgroundColor: rank <= 3 ? medalColors[rank - 1] + '20' : '#F9FAFB',
          color: rank <= 3 ? medalColors[rank - 1] : '#9CA3AF',
        }}
      >
        {rank <= 3 ? <Medal size={14} /> : rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-800 truncate pr-2">{label}</span>
          <span className="text-xs font-extrabold text-gray-500 shrink-0">
            {value.toLocaleString()} {unit}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #2563EB, #7C3AED)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard card component ─────────────────────────────────────────────
function LeaderboardCard({
  icon,
  title,
  subtitle,
  rows,
  unit,
  emptyMessage,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  rows: { label: string; value: number }[];
  unit: string;
  emptyMessage: string;
}) {
  const max = rows.length > 0 ? Math.max(...rows.map((r) => r.value)) : 1;
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-primary/8 text-primary rounded-xl shrink-0">{icon}</div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm leading-tight">{title}</h4>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{subtitle}</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center">{emptyMessage}</p>
      ) : (
        <div className="space-y-3 pt-1">
          {rows.map((row, i) => (
            <LeaderboardRow
              key={i}
              rank={i + 1}
              label={row.label}
              value={row.value}
              unit={unit}
              max={max}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main analytics page ─────────────────────────────────────────────────────
const DATE_PRESETS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
];

export default function ScanInsightsPage() {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('all');
  const [datePreset, setDatePreset] = useState('30d');

  const getDateRange = () => {
    const now = new Date();
    if (datePreset === '7d') return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
    if (datePreset === '30d') return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
    if (datePreset === '90d') return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
    return { start: '', end: '' };
  };

  const { start: dateStart, end: dateEnd } = getDateRange();

  const { data: assets } = useMarketingAssets();

  // Aggregate overview stats
  const { data: overviewAnalytics, isLoading: overviewLoading } = useAnalyticsOverview();

  // Download logs for Download Trends chart
  const { data: logs } = useDownloadsLog();

  // Granular asset specific stats (with date range)
  const { data: assetAnalytics, isLoading: assetLoading } = useAssetAnalytics(
    selectedAssetId === 'all' ? '' : selectedAssetId,
    dateStart || undefined,
    dateEnd || undefined
  );

  const activeAnalytics = selectedAssetId === 'all' ? overviewAnalytics : assetAnalytics;
  const isLoading = selectedAssetId === 'all' ? overviewLoading : assetLoading;

  const totals = activeAnalytics?.totals || { scans: 0, views: 0, conversionRate: 0, downloads: 0 };
  const chartData = activeAnalytics?.daily || [];

  // Leaderboard data (only available in overview mode)
  const topTemplates = (overviewAnalytics?.topTemplates || []).map((t) => ({
    label: t.name,
    value: t.uses,
  }));

  const mostActiveBranches = (overviewAnalytics?.mostActiveBranches || []).map((b) => ({
    label: b.name,
    value: b.scans,
  }));

  const mostDownloadedAssets = (overviewAnalytics?.mostDownloadedAssets || []).map((a) => ({
    label: a.name,
    value: a.downloads,
  }));

  // Fallback: derive leaderboards client-side from existing assets when API doesn't provide them
  const derivedTopTemplates =
    topTemplates.length > 0
      ? topTemplates
      : (() => {
          const counts: Record<string, { name: string; count: number }> = {};
          (assets || []).forEach((a) => {
            if (a.templateId && a.template?.name) {
              if (!counts[a.templateId]) counts[a.templateId] = { name: a.template.name, count: 0 };
              counts[a.templateId].count++;
            }
          });
          return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((c) => ({ label: c.name, value: c.count }));
        })();

  const derivedMostDownloaded =
    mostDownloadedAssets.length > 0
      ? mostDownloadedAssets
      : (assets || [])
          .slice()
          .sort((a: any, b: any) => (b.downloadCount || 0) - (a.downloadCount || 0))
          .slice(0, 5)
          .map((a: any) => ({ label: a.name, value: a.downloadCount || 0 }));

  return (
    <div className="space-y-6 pb-10">

      {/* Scope Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-primary size-5" />
          <h3 className="font-bold text-gray-900 text-sm md:text-base">Scan Analytics</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
            {DATE_PRESETS.map((p) => (
              <button key={p.value} onClick={() => setDatePreset(p.value)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${datePreset === p.value ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
            <Filter size={13} className="text-gray-400" />
            <select value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)}
              className="text-xs bg-transparent font-bold focus:outline-none text-gray-700 cursor-pointer">
              <option value="all">All Assets</option>
              {assets?.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'QR Scans', value: totals.scans, icon: <QrCode size={18} />, color: 'green' },
          { label: 'Impressions', value: totals.views, icon: <Eye size={18} />, color: 'blue' },
          { label: 'Downloads', value: (totals as any).downloads ?? 0, icon: <Download size={18} />, color: 'purple' },
          { label: 'Conversion Rate', value: `${totals.conversionRate}%`, icon: <TrendingUp size={18} />, color: 'amber' },
        ].map((kpi) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3"
          >
            <div className={`p-2.5 bg-${kpi.color}-50 text-${kpi.color}-600 rounded-xl shrink-0`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{kpi.label}</p>
              <p className="font-extrabold text-gray-900 text-lg leading-tight">
                {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-gray-900 text-base">Scan &amp; Views Trend</h4>
          <span className="text-[10px] uppercase font-extrabold text-slate-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 flex items-center gap-1">
            <Calendar size={12} />
            {DATE_PRESETS.find(p => p.value === datePreset)?.label || 'Custom'}
          </span>
        </div>

        <div className="h-56 w-full text-xs font-semibold">
          {isLoading ? (
            <div className="size-full bg-gray-50 rounded-xl animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="size-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <Layers size={28} className="opacity-40" />
              <span className="text-xs">Analytics will appear once customers begin scanning your QR codes.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(str) => {
                    const d = new Date(str);
                    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  }}
                  stroke="#9CA3AF"
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  }
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  name="Scans"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorScans)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Download & Creation Trends (PRD §131) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Download Trends */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h4 className="font-bold text-gray-900 text-base mb-6 flex items-center gap-2">
            <Download size={16} className="text-gray-500" /> Download Trends
          </h4>
          <div className="h-44 w-full text-xs font-semibold">
            {(() => {
              const downloadByDate: Record<string, number> = {};
              const filteredLogs = datePreset === 'all'
                ? (logs || [])
                : (logs || []).filter((log) => {
                    const logDate = new Date(log.downloadedAt);
                    return logDate >= new Date(dateStart) && logDate <= new Date(dateEnd + 'T23:59:59');
                  });
              filteredLogs.forEach((log) => {
                const d = new Date(log.downloadedAt).toISOString().split('T')[0];
                downloadByDate[d] = (downloadByDate[d] || 0) + 1;
              });
              const downloadChartData = Object.entries(downloadByDate)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-30)
                .map(([date, downloads]) => ({ date, downloads }));
              return downloadChartData.length === 0 ? (
                <div className="size-full flex items-center justify-center text-gray-400 gap-2">
                  <Layers size={24} className="opacity-40" />
                  <span className="text-xs">No downloads yet.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={downloadChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB' }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} />
                    <Bar dataKey="downloads" name="Downloads" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

        {/* Asset Creation Trends */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h4 className="font-bold text-gray-900 text-base mb-6 flex items-center gap-2">
            <Layers size={16} className="text-gray-500" /> Asset Creation Trends
          </h4>
          <div className="h-44 w-full text-xs font-semibold">
            {(() => {
              const creationByDate: Record<string, number> = {};
              const filteredAssets = datePreset === 'all'
                ? (assets || [])
                : (assets || []).filter((asset) => {
                    const created = new Date(asset.createdAt);
                    return created >= new Date(dateStart) && created <= new Date(dateEnd + 'T23:59:59');
                  });
              filteredAssets.forEach((asset) => {
                const d = new Date(asset.createdAt).toISOString().split('T')[0];
                creationByDate[d] = (creationByDate[d] || 0) + 1;
              });
              const creationChartData = Object.entries(creationByDate)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-30)
                .map(([date, count]) => ({ date, count }));
              return creationChartData.length === 0 ? (
                <div className="size-full flex items-center justify-center text-gray-400 gap-2">
                  <Layers size={24} className="opacity-40" />
                  <span className="text-xs">No assets created yet.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB' }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} />
                    <Bar dataKey="count" name="Assets Created" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ─── Leaderboards (PRD §27) ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Templates */}
        <LeaderboardCard
          icon={<Trophy size={18} />}
          title="Top Templates"
          subtitle="Most used design templates"
          rows={derivedTopTemplates.slice(0, 5)}
          unit="uses"
          emptyMessage="No template usage data yet — generate assets from a template to populate this."
        />

        {/* Most Active Branches */}
        <LeaderboardCard
          icon={<GitBranch size={18} />}
          title="Most Active Branches"
          subtitle="Branches with most QR scans"
          rows={mostActiveBranches.slice(0, 5)}
          unit="scans"
          emptyMessage="No branch scan data yet — deploy QR stands to your branches to populate this."
        />

        {/* Most Downloaded Assets */}
        <LeaderboardCard
          icon={<Download size={18} />}
          title="Most Downloaded Assets"
          subtitle="Your highest-downloaded creative assets"
          rows={derivedMostDownloaded.slice(0, 5)}
          unit="downloads"
          emptyMessage="No downloads recorded yet — download an asset from your Library to populate this."
        />

      </div>

      {/* QR Tip footer */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-sm">
        <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-2">QR Tip</h4>
        <p className="text-xs text-slate-300 leading-relaxed font-semibold">
          Add a catchy incentive tagline (e.g. &ldquo;Scan to get a free drink&rdquo;) to your marketing assets.
          Customizing tagline incentives typically boosts QR stand conversions by{' '}
          <span className="text-primary font-bold">18%</span>.
        </p>
      </div>

    </div>
  );
}
