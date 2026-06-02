"use client";

import React, { useState, useMemo } from 'react';
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
  Trophy,
  FileText,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const FORMAT_OPTIONS = ['All', 'png', 'pdf'];
const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  ready: { label: 'Ready', className: 'bg-green-50 text-green-700' },
  processing: { label: 'Processing', className: 'bg-amber-50 text-amber-700' },
  failed: { label: 'Failed', className: 'bg-rose-50 text-rose-700' },
};
function getSyntheticStatus(log: any): 'ready' | 'processing' | 'failed' {
  if (log.asset) return 'ready';
  return 'failed';
}

export default function ScanInsightsPage() {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('all');
  const [datePreset, setDatePreset] = useState('30d');

  const [formatFilter, setFormatFilter] = useState('All');
  const [logDateFilter, setLogDateFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');

  const datePresets = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'This Year', value: 'year' },
  ];

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
  const { data: downloadLogs, isLoading: logsLoading } = useDownloadsLog();

  const filteredLogs = useMemo(() => {
    if (!downloadLogs) return [];
    return downloadLogs.filter((log: any) => {
      const matchFormat = formatFilter === 'All' || log.format === formatFilter;
      const matchSearch = !logSearch || log.asset?.name?.toLowerCase().includes(logSearch.toLowerCase());
      let matchDate = true;
      if (logDateFilter !== 'all') {
        const d = new Date(log.downloadedAt);
        const now = new Date();
        if (logDateFilter === 'today') matchDate = d.toDateString() === now.toDateString();
        else if (logDateFilter === '7d') matchDate = d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (logDateFilter === '30d') matchDate = d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        else if (logDateFilter === 'year') matchDate = d.getFullYear() === now.getFullYear();
      }
      return matchFormat && matchSearch && matchDate;
    });
  }, [downloadLogs, formatFilter, logDateFilter, logSearch]);

  const { data: overviewAnalytics, isLoading: overviewLoading } = useAnalyticsOverview();

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

      {/* ─── Leaderboards (PRD §27) ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Top Templates */}
        <LeaderboardCard
          icon={<Trophy size={18} />}
          title="Top Templates"
          subtitle="Most used design templates"
          rows={derivedTopTemplates.slice(0, 5)}
          unit="uses"
          emptyMessage="No template usage data yet — generate assets from a template to populate this."
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

      {/* ─── Print Output Logs ─────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm">
        <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
          <FileText className="text-primary size-4 md:size-5" />
          Print Output Logs
        </h3>

        <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-gray-50">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg md:rounded-xl overflow-x-auto">
            <Filter size={12} className="text-gray-400 ml-1.5 shrink-0" />
            {datePresets.map((p) => (
              <button key={p.value} onClick={() => setLogDateFilter(p.value)}
                className={`px-2 py-1 rounded-md md:px-2.5 md:py-1.5 md:rounded-lg text-[9px] md:text-[10px] font-bold transition-all whitespace-nowrap ${logDateFilter === p.value ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {FORMAT_OPTIONS.map((fmt) => (
              <button key={fmt} onClick={() => setFormatFilter(fmt)}
                className={`px-2 py-1 rounded-md md:px-2.5 md:py-1.5 md:rounded-lg text-[9px] md:text-[10px] font-bold transition-all ${formatFilter === fmt ? 'bg-primary text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:text-gray-800'}`}>
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[120px] max-w-[200px]">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search assets..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-[10px] border border-gray-100 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white font-medium text-gray-800" />
          </div>
        </div>

        {logsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="inline-flex size-10 bg-gray-50 text-gray-400 rounded-full items-center justify-center">
              <Layers size={18} />
            </div>
            <p className="text-xs text-gray-400 font-medium">No downloads available yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[9px] md:text-[10px] font-extrabold uppercase text-gray-400">
                  <th className="pb-2 pl-2">Asset Name</th>
                  <th className="pb-2">Format</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Downloaded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                {filteredLogs.map((log: any) => {
                  const status = getSyntheticStatus(log);
                  const badge = STATUS_BADGES[status];
                  return (
                    <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 pl-2 font-bold text-gray-900 text-xs">{log.asset?.name || 'Deleted Asset'}</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 uppercase">
                          {log.format.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td className="py-2.5 text-gray-500 text-[10px]">
                        <div className="flex items-center gap-1">
                          <Calendar size={10} className="text-gray-400" />
                          {new Date(log.downloadedAt).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[9px] text-gray-400 font-medium mt-3 text-center">
              Showing {filteredLogs.length} of {downloadLogs?.length || 0} downloads
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
