'use client';

import React from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Banknote, TrendingUp, ShoppingBag, Loader2 } from 'lucide-react';
import { usePosDashboard, usePosTopProducts } from '@/services/pos/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { motion } from 'framer-motion';

export default function DetailedSalesReports() {
  const { activeBranchId } = useActiveBranch();
  const { data: dashboard, isLoading: dashLoading } = usePosDashboard(activeBranchId ?? undefined);
  const { data: topProducts, isLoading: topLoading } = usePosTopProducts(activeBranchId ?? undefined);

  const isLoading = dashLoading || topLoading;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto h-full flex items-center justify-center pt-4 px-4 md:px-0 pb-24 min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const totalRevenue = dashboard?.revenue ?? 0;
  const transactionCount = dashboard?.transactionCount ?? 0;
  const avgSaleValue = dashboard?.averageSaleValue ?? 0;
  const paymentBreakdown = dashboard?.paymentBreakdown ?? {};

  const kpis = [
    { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Transactions', value: transactionCount.toLocaleString(), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg Sale Value', value: `₦${Math.round(avgSaleValue).toLocaleString()}`, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const paymentMethods = Object.entries(paymentBreakdown).map(([method, amount]) => ({
    method: method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, ' '),
    amount: amount as number,
    percentage: totalRevenue > 0 ? Math.round(((amount as number) / totalRevenue) * 100) : 0,
  }));

  const topItems = topProducts ?? [];

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Detailed Sales Reports"
        subtitle="Deep dive into your revenue streams"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm"
          >
            <div className={`size-10 rounded-lg flex items-center justify-center mb-4 ${kpi.bg} ${kpi.color}`}>
              <kpi.icon size={20} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{kpi.label}</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Top Selling Products */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Top Selling Products</h3>
          {topItems.length > 0 ? (
            <div className="space-y-2">
              {topItems.slice(0, 5).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                      {i + 1}
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">₦{(item.revenue ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] font-medium text-gray-400">{item.quantity} sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[180px] text-gray-300 text-xs font-semibold uppercase tracking-wider">
              Your first sale is closer than you think — start capturing customers today
            </div>
          )}
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Payment Breakdown</h3>
          {paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((pm, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700">{pm.method}</span>
                    <span className="text-xs font-bold text-gray-900">₦{pm.amount.toLocaleString()} · {pm.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[#066CF4] h-2 rounded-full transition-all duration-700"
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[180px] text-gray-300 text-xs font-semibold uppercase tracking-wider">
              Payment insights will appear once customers start transacting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
