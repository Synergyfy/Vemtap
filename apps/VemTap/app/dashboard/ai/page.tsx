'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Coins, TrendingUp, History, Zap, ArrowRight, ExternalLink, Calculator, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAIStore } from '@/store/useAIStore';
import { useAICredits } from '@/services/ai/hooks';
import { AI_CREDIT_COST } from '@/services/ai/types';
import { useSystemSettingsStore } from '@/store/useSystemSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { purchaseCustomCredits } from '@/lib/api/credit-plans';
import { loadPaystackScript } from '@/lib/loadPaystackScript';

const naira = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export default function AICreditsPage() {
  const router = useRouter();
  const { refetch: refetchCredits } = useAICredits();
  const credits = useAIStore((state) => state.credits);
  const lastUpdated = useAIStore((state) => state.lastUpdated);
  const settings = useSystemSettingsStore();
  const user = useAuthStore((state) => state.user);
  const { activeBranchId } = useActiveBranch();
  const [customAmount, setCustomAmount] = useState('');
  const [customCredits, setCustomCredits] = useState(0);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const resolvedBranchId = activeBranchId || user?.branchId || '';

  const isUnlimited = credits.limit === -1;
  const activePackages = settings.aiCreditPackages.filter(p => p.isActive);
  const usageHistory = Object.entries(lastUpdated)
    .filter(([_, ts]) => ts)
    .sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 20);

  const creditPrice = settings.aiCreditPrice || 50;
  const handleCustomAmountChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    setCustomAmount(num.toLocaleString());
    setCustomCredits(Math.floor(num / creditPrice));
  };

  const handlePurchase = async (aiAmount: number, amount: number, key: string) => {
    if (purchasing) return;
    const email = user?.email;
    if (!email || !resolvedBranchId) {
      toast.error('Branch not found. Please log in again.');
      return;
    }
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey || publicKey.includes('placeholder')) {
      toast.error('Payment system is not configured. Please set up your Paystack key in environment variables or contact support.');
      return;
    }

    setPurchasing(key);
    try {
      await loadPaystackScript();
      const reference = `AI-TOPUP-${resolvedBranchId}-${Date.now()}`;
      // @ts-ignore
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email,
        amount: amount * 100,
        currency: 'NGN',
        ref: reference,
        onClose: () => {
          setPurchasing(null);
          toast.error('Payment window closed');
        },
        callback: (response: any) => {
          (async () => {
            try {
              await purchaseCustomCredits({
                branchId: resolvedBranchId,
                reference: response.reference,
                smsAmount: 0,
                whatsappAmount: 0,
                emailAmount: 0,
                aiAmount,
              });
              await refetchCredits();
              toast.success(`${aiAmount.toLocaleString()} AI credits added to your wallet!`);
            } catch (error: any) {
              toast.error(error instanceof Error ? error.message : 'Payment verified but activation failed. Please contact support.');
            } finally {
              setPurchasing(null);
            }
          })();
        },
      });
      handler.openIframe();
    } catch (error: any) {
      setPurchasing(null);
      toast.error(error instanceof Error ? error.message : 'Could not start payment. Please try again.');
    }
  };

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
                <p className="text-4xl font-bold text-gray-900">
                  {isUnlimited ? 'Unlimited' : credits.available}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {isUnlimited ? 'Unlimited allowance on your plan' : `${credits.used} of ${credits.limit} credits used this month`}
                </p>
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
              <p className="text-2xl font-bold text-gray-900">{AI_CREDIT_COST.quickAnalysis}</p>
              <p className="text-xs text-gray-500">credit per analysis</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-purple-600" />
                <span className="text-sm font-bold text-gray-900">Deep Analysis</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{AI_CREDIT_COST.deepAnalysis}</p>
              <p className="text-xs text-gray-500">credits per analysis</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-600" />
                <span className="text-sm font-bold text-gray-900">Content Generation</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{AI_CREDIT_COST.generateContent}</p>
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
                    <p className="text-3xl font-bold text-gray-900">{pkg.credits}</p>
                    <p className="text-sm font-semibold text-gray-500 mt-1">credits</p>
                    <div className="h-px bg-gray-100 my-4" />
                    <p className="text-2xl font-bold text-gray-900">{naira(pkg.price)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {naira(Math.round(pkg.price / pkg.credits))} / credit
                    </p>
                    <button
                      onClick={() => handlePurchase(pkg.credits, pkg.price, `pkg-${pkg.id}`)}
                      disabled={purchasing !== null}
                      className="mt-4 w-full h-11 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {purchasing === `pkg-${pkg.id}` ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Purchase
                          <ArrowRight size={14} />
                        </>
                      )}
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

        {/* Custom Amount */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calculator size={20} className="text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Custom Amount</h2>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Enter amount (NGN)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">₦</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="0"
                  className="w-full h-14 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white text-2xl font-bold text-gray-900 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
              {customCredits > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  You get <span className="font-bold text-purple-600">{customCredits.toLocaleString()} AI credits</span> (₦{creditPrice.toLocaleString()} / credit)
                </p>
              )}
            </div>
            <button
              disabled={customCredits === 0 || purchasing !== null}
              className="h-14 px-8 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-600/20 shrink-0"
              onClick={() => {
                const numAmount = parseInt(customAmount.replace(/[^0-9]/g, ''), 10) || 0;
                handlePurchase(customCredits, numAmount, 'custom');
              }}
            >
              {purchasing === 'custom' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Buy Custom Credits
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
