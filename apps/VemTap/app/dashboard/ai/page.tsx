'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Coins, TrendingUp, History, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { useAIStore } from '@/store/useAIStore';
import { AI_CREDIT_COST } from '@/services/ai/types';
import { useSystemSettingsStore } from '@/store/useSystemSettingsStore';

const naira = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export default function AICreditsPage() {
  const router = useRouter();
  const credits = useAIStore((state) => state.credits);
  const lastUpdated = useAIStore((state) => state.lastUpdated);
  const settings = useSystemSettingsStore();

  const activePackages = settings.aiCreditPackages.filter(p => p.isActive);
  const usageHistory = Object.entries(lastUpdated)
    .filter(([_, ts]) => ts)
    .sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <main className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Credits</h1>
            <p className="text-sm text-gray-500">Manage your AI analysis credits and usage</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="size-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Coins size={32} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Available Credits</p>
                <p className="text-4xl font-black text-gray-900">{credits.available}</p>
                <p className="text-sm text-gray-400 mt-1">{credits.used} credits used total</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard/settings/subscription')}
                className="h-12 px-6 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2"
              >
                <Zap size={16} />
                Buy More via Add-Ons
              </button>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Credit Costs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-blue-600" />
                <span className="text-sm font-bold text-gray-900">Quick Analysis</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{AI_CREDIT_COST.quickAnalysis}</p>
              <p className="text-xs text-gray-500">credit per analysis</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-purple-600" />
                <span className="text-sm font-bold text-gray-900">Deep Analysis</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{AI_CREDIT_COST.deepAnalysis}</p>
              <p className="text-xs text-gray-500">credits per analysis</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-600" />
                <span className="text-sm font-bold text-gray-900">Content Generation</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{AI_CREDIT_COST.generateContent}</p>
              <p className="text-xs text-gray-500">credits per generation</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
            <Coins size={14} className="text-amber-500" />
            <span>1 credit = {naira(settings.aiCreditPrice)}</span>
          </div>
        </div>

        {/* Usage History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Usage History</h2>
            <History size={18} className="text-gray-400" />
          </div>
          {usageHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No AI analysis performed yet.</p>
              <p className="text-xs text-gray-300 mt-1">Run an analysis on any dashboard page to see history here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {usageHistory.map(([page, ts]) => (
                <div key={page} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{page.replace(/-/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{new Date(ts).toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {AI_CREDIT_COST.quickAnalysis} credit
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buy Credits */}
        <div id="buy-credits" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Purchase Credits</h2>
          </div>
          {activePackages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-400 font-medium">No purchase packages available at this time.</p>
              <p className="text-xs text-gray-300 mt-1">Check back later or contact support.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative rounded-xl border-2 p-5 transition-all hover:shadow-md ${
                    pkg.popular
                      ? 'border-blue-500 bg-blue-50/30'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      Best Value
                    </span>
                  )}
                  <div className="text-center pt-1">
                    <p className="text-3xl font-black text-gray-900">{pkg.credits}</p>
                    <p className="text-sm font-semibold text-gray-500 mt-1">credits</p>
                    <div className="h-px bg-gray-100 my-4" />
                    <p className="text-2xl font-bold text-gray-900">{naira(pkg.price)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {naira(Math.round(pkg.price / pkg.credits))} / credit
                    </p>
                    <button className="mt-4 w-full h-11 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2">
                      Purchase
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 text-center mt-6">
            Credits never expire. Purchases are non-refundable. Contact support for custom packages.
          </p>
        </div>
      </main>
    </div>
  );
}
