'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { usePosDashboard, usePosSales } from '@/services/pos/hooks';
import { useCatalogueItemsPublic } from '@/services/catalogue/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { TrendingUp, Banknote, Package, Users, ArrowUpRight, ArrowDownRight, Activity, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { startOfDay, endOfDay, subDays, subMonths, subYears, format } from 'date-fns';

type Period = '7days' | 'thisMonth' | 'thisYear';

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const [period, setPeriod] = useState<Period>('7days');

  const { data: dashboard } = usePosDashboard(activeBranchId ?? undefined);
  const { data: productsData } = useCatalogueItemsPublic(activeBranchId ?? '');
  const products = productsData?.data ?? [];

  const dateRange = useMemo(() => {
    const now = new Date();
    const to = endOfDay(now);
    let from: Date;
    switch (period) {
      case 'thisMonth': from = startOfDay(subMonths(now, 1)); break;
      case 'thisYear': from = startOfDay(subYears(now, 1)); break;
      default: from = startOfDay(subDays(now, 6)); break;
    }
    return { dateFrom: from.toISOString(), dateTo: to.toISOString(), days: Math.ceil((to.getTime() - from.getTime()) / 86400000) };
  }, [period]);

  const { data: salesData } = usePosSales({ branchId: activeBranchId ?? undefined, dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo, limit: 1000 });

  const dailyRevenue = useMemo(() => {
    if (!salesData?.data) return [];
    const map = new Map<string, number>();
    for (const sale of salesData.data) {
      const day = format(new Date(sale.createdAt), 'yyyy-MM-dd');
      map.set(day, (map.get(day) ?? 0) + sale.total);
    }
    const entries = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    const maxVal = Math.max(...entries.map(([_, v]) => v), 1);
    return entries.map(([date, revenue]) => ({
      date,
      revenue,
      height: Math.max((revenue / maxVal) * 100, 4),
    }));
  }, [salesData]);

  const totalRevenue = dashboard?.revenue ?? 0;
  const transactionCount = dashboard?.transactionCount ?? 0;
  const inventoryValue = products.reduce((acc: number, p: any) => acc + ((p.price || 0) * (p.stockQuantity || 0)), 0);

  const metrics = [
    { label: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, trend: null, isUp: null, icon: Banknote, color: 'text-emerald-500 bg-emerald-50' },
    { label: "Transactions", value: transactionCount.toString(), trend: null, isUp: null, icon: TrendingUp, color: 'text-blue-500 bg-blue-50' },
    { label: "Inventory Retail Value", value: `₦${inventoryValue.toLocaleString()}`, trend: null, isUp: null, icon: Package, color: 'text-purple-500 bg-purple-50' },
    { label: "Total Products", value: products.length.toString(), trend: null, isUp: null, icon: Activity, color: 'text-amber-500 bg-amber-50' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <POSPageHeader
        title="Analytics & Reports"
        subtitle="Business performance at a glance"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {metrics.map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition-shadow group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("size-10 rounded-lg flex items-center justify-center", metric.color)}>
                <metric.icon size={18} />
              </div>
              {metric.trend != null && (
                <div className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg", metric.isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                  {metric.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {metric.trend}
                </div>
              )}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-1">{metric.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight group-hover:text-[#066CF4] transition-colors">{metric.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base md:text-lg font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                {period === '7days' ? 'Last 7 Days' : period === 'thisMonth' ? 'Last 30 Days' : 'This Year'}
              </p>
            </div>
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600 rounded-xl px-4 py-2 pr-8 outline-none appearance-none cursor-pointer"
              >
                <option value="7days">Last 7 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="thisYear">This Year</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>

          <div className="flex-1 flex items-end justify-center border border-gray-100 rounded-xl bg-gray-50/50 p-6 min-h-[280px]">
            {dailyRevenue.length > 0 ? (
              <div className="w-full h-full flex items-end justify-between gap-2 self-end">
                {dailyRevenue.map((d, i) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[9px] font-bold text-gray-400">₦{(d.revenue / 1000).toFixed(d.revenue >= 1000 ? 1 : 0)}k</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${d.height}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                      className="w-full max-w-[48px] bg-gradient-to-t from-[#066CF4] to-[#4A9AF5] rounded-t-lg cursor-pointer hover:opacity-80 transition-opacity"
                      title={`${format(new Date(d.date), 'MMM d')}: ₦${d.revenue.toLocaleString()}`}
                    />
                    <span className="text-[8px] font-bold text-gray-400 uppercase whitespace-nowrap">
                      {format(new Date(d.date), 'd MMM')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center w-full">
                <TrendingUp size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue data will appear once customers start engaging</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-4">Detailed Reports</h3>

            <div className="space-y-2.5">
              <button onClick={() => router.push('/dashboard/analytics/sales')} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-blue-200 text-gray-500 group-hover:text-blue-500">
                    <Banknote size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-blue-600">Sales Report</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">By category & time</p>
                  </div>
                </div>
              </button>

              <button onClick={() => router.push('/dashboard/analytics/inventory')} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-emerald-200 text-gray-500 group-hover:text-emerald-500">
                    <Package size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-600">Inventory Valuation</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">COGS & Shrinkage</p>
                  </div>
                </div>
              </button>

              <button disabled className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-transparent opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                    <Users size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900">Staff Performance</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Coming soon</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
