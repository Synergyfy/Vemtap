'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMyCredits } from '@/services/messaging/hooks';
import { 
  fetchCreditPlans, 
  purchaseCreditPlan, 
  fetchCreditRates, 
  purchaseCustomCredits 
} from '@/lib/api/credit-plans';
import { useQuery } from '@tanstack/react-query';
import { loadPaystackScript } from '@/lib/loadPaystackScript';
import { 
  CreditCard, 
  MessageSquare, 
  Mail, 
  Zap, 
  ArrowUpRight, 
  TrendingUp, 
  History, 
  ShieldCheck,
  PlusCircle,
  Loader2,
  RefreshCw,
  Calculator,
  Sparkles,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { notify } from '@/lib/notify';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { cn } from '@/lib/utils';

const CHANNEL_TABS_UNUSED = null; // Tabs removed - navigation via Messaging Center

const CreditCardComponent = ({ title, amount, icon: Icon, color, subtitle, unavailable }: any) => (
  <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all ${unavailable ? 'opacity-60 grayscale cursor-not-allowed border-slate-200 bg-slate-50' : 'hover:shadow-md'}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`size-9 md:size-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      {unavailable ? (
        <div className="flex items-center gap-1 text-slate-500 font-bold text-xs bg-slate-200 px-2 py-1 rounded-full">
          <ShieldCheck size={12} />
          <span>Unavailable</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-green-500 font-bold text-xs bg-green-50 px-2 py-1 rounded-full">
          <TrendingUp size={12} />
          <span>Active</span>
        </div>
      )}
    </div>
    <h3 className="text-slate-500 font-bold text-sm mb-1">{title}</h3>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl md:text-3xl font-bold text-slate-900">
        {unavailable ? '---' : amount.toLocaleString()}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Credits</span>
    </div>
    <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{subtitle}</p>
  </div>
);

export default function MessagingCreditsPage() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { activeBranchId } = useActiveBranch();
  const resolvedBranchId = activeBranchId || user?.branchId || '';

  const { data: credits, isLoading: creditsLoading, refetch: refetchCredits } = useMyCredits();
  
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['credit-plans'],
    queryFn: fetchCreditPlans
  });

  const { data: rates, isLoading: ratesLoading } = useQuery({
    queryKey: ['credit-rates'],
    queryFn: fetchCreditRates
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'package' | 'custom' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom Top-Up state
  const [smsAmount, setSmsAmount] = useState<number>(0);
  const [whatsappAmount, setWhatsappAmount] = useState<number>(0);
  const [emailAmount, setEmailAmount] = useState<number>(0);
  const [aiAmount, setAiAmount] = useState<number>(0);

  const selectedPlan = plans?.find(p => p.id === selectedPlanId);

  const smsPrice = rates?.creditPriceSms ?? 15.00;
  const whatsappPrice = rates?.creditPriceWhatsapp ?? 25.00;
  const emailPrice = rates?.creditPriceEmail ?? 2.00;
  const aiPrice = rates?.creditPriceAi ?? 50.00;

  const smsCost = smsAmount * smsPrice;
  const whatsappCost = whatsappAmount * whatsappPrice;
  const emailCost = emailAmount * emailPrice;
  const aiCost = aiAmount * aiPrice;
  const totalCost = smsCost + whatsappCost + emailCost + aiCost;

  const handlePaymentSuccess = async (
    reference: string,
    mode: 'package' | 'custom',
    params: { planId?: string; sms?: number; whatsapp?: number; email?: number; ai?: number }
  ) => {
    setIsProcessing(true);
    try {
      if (mode === 'package') {
        const planId = params.planId || selectedPlanId;
        if (!planId) return;
        await purchaseCreditPlan(planId, {
          branchId: resolvedBranchId,
          reference: reference
        });
      } else {
        await purchaseCustomCredits({
          branchId: resolvedBranchId,
          reference: reference,
          smsAmount: params.sms ?? smsAmount,
          whatsappAmount: params.whatsapp ?? whatsappAmount,
          emailAmount: params.email ?? emailAmount,
          aiAmount: params.ai ?? aiAmount
        });
      }
      notify.success('Credits purchased successfully!');
      refetchCredits();
      setSelectedPlanId(null);
      setPaymentMode(null);
      // Reset custom values
      setSmsAmount(0);
      setWhatsappAmount(0);
      setEmailAmount(0);
      setAiAmount(0);
    } catch (err: any) {
      notify.error(err.message || 'Failed to complete purchase');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchasePlan = async (planId: string) => {
    setSelectedPlanId(planId);
    setPaymentMode('package');
    const plan = plans?.find(p => p.id === planId);
    if (!plan) return;

    const email = user?.email;
    if (!email) {
      notify.error('User email not found. Please log in again.');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey || publicKey.includes('placeholder')) {
      setIsProcessing(true);
      setTimeout(() => {
        if (confirm(`[PROTOTYPE SIMULATION] Simulate Paystack payment for ${plan.name} (₦${plan.price.toLocaleString()})?`)) {
          handlePaymentSuccess(
            'sim-ref-' + Date.now(),
            'package',
            { planId }
          );
        } else {
          setIsProcessing(false);
          setPaymentMode(null);
          setSelectedPlanId(null);
        }
      }, 100);
    } else {
      setIsProcessing(true);
      try {
        await loadPaystackScript();
        // @ts-ignore
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: email,
          amount: Math.round(plan.price * 100),
          currency: 'NGN',
          ref: `PLAN-${resolvedBranchId}-${Date.now()}`,
          onClose: () => {
            setIsProcessing(false);
            setPaymentMode(null);
            setSelectedPlanId(null);
            notify.error('Payment window closed');
          },
          callback: (response: any) => {
            handlePaymentSuccess(
              response.reference,
              'package',
              { planId }
            );
          }
        });
        handler.openIframe();
      } catch (err: any) {
        setIsProcessing(false);
        setPaymentMode(null);
        setSelectedPlanId(null);
        notify.error('Failed to initialize Paystack checkout: ' + (err.message || err));
      }
    }
  };

  const handlePurchaseCustom = async () => {
    if (totalCost <= 0) {
      notify.error('Please select at least one credit to top-up');
      return;
    }
    setPaymentMode('custom');
    
    const email = user?.email;
    if (!email) {
      notify.error('User email not found. Please log in again.');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey || publicKey.includes('placeholder')) {
      setIsProcessing(true);
      setTimeout(() => {
        if (confirm(`[PROTOTYPE SIMULATION] Simulate Paystack payment for Custom Top-Up (₦${totalCost.toLocaleString()})?\n\nBreakdown:\n- SMS: ${smsAmount.toLocaleString()} credits (₦${smsCost.toLocaleString()})\n- WhatsApp: ${whatsappAmount.toLocaleString()} credits (₦${whatsappCost.toLocaleString()})\n- Email: ${emailAmount.toLocaleString()} credits (₦${emailCost.toLocaleString()})\n- AI: ${aiAmount.toLocaleString()} credits (₦${aiCost.toLocaleString()})`)) {
          handlePaymentSuccess(
            'sim-ref-' + Date.now(),
            'custom',
            { sms: smsAmount, whatsapp: whatsappAmount, email: emailAmount, ai: aiAmount }
          );
        } else {
          setIsProcessing(false);
          setPaymentMode(null);
        }
      }, 100);
    } else {
      setIsProcessing(true);
      try {
        await loadPaystackScript();
        // @ts-ignore
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: email,
          amount: Math.round(totalCost * 100),
          currency: 'NGN',
          ref: `CUSTOM-${resolvedBranchId}-${Date.now()}`,
          onClose: () => {
            setIsProcessing(false);
            setPaymentMode(null);
            notify.error('Payment window closed');
          },
          callback: (response: any) => {
            handlePaymentSuccess(
              response.reference,
              'custom',
              { sms: smsAmount, whatsapp: whatsappAmount, email: emailAmount }
            );
          }
        });
        handler.openIframe();
      } catch (err: any) {
        setIsProcessing(false);
        setPaymentMode(null);
        notify.error('Failed to initialize Paystack checkout: ' + (err.message || err));
      }
    }
  };

  if (creditsLoading || plansLoading || ratesLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 md:px-8">
      {/* Back to Messaging Central */}
      <div className="flex items-center gap-4 pt-4">
        <Link
          href="/dashboard/messaging"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all text-xs font-semibold uppercase tracking-wider active:scale-95"
        >
          <ArrowLeft size={16} />
          Messaging Center
        </Link>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Credits</h1>
        <p className="text-sm text-text-secondary font-medium">Manage your messaging credit balance.</p>
      </div>

      {/* Credit Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CreditCardComponent 
          title="SMS Credits" 
          amount={credits?.smsCredits || 0} 
          icon={MessageSquare} 
          color="bg-blue-500"
          subtitle="Direct SMS Messages"
        />
        <CreditCardComponent 
          title="WhatsApp Credits" 
          amount={credits?.whatsappCredits || 0} 
          icon={Zap} 
          color="bg-green-500"
          subtitle="Messaging API"
          unavailable={true}
        />
        <CreditCardComponent 
          title="Email Credits" 
          amount={credits?.emailCredits || 0} 
          icon={Mail} 
          color="bg-purple-500"
          subtitle="Email Newsletters & Alerts"
        />
        <CreditCardComponent 
          title="AI Credits" 
          amount={credits?.aiCredits || 0} 
          icon={Sparkles} 
          color="bg-amber-500"
          subtitle="AI Copilot & Smart Features"
        />
      </div>

      {/* Buy Credits Section */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
        
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Top-up Packages</h2>
          <p className="text-slate-400 font-medium">Choose a pre-configured package to increase your messaging capacity instantly. Credits are added immediately after payment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {plans?.map((plan) => (
            <div key={plan.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-all group">
              <h3 className="text-white font-bold text-xl mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-2xl md:text-3xl font-bold text-white">₦{plan.price.toLocaleString()}</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.smsAmount > 0 && (
                  <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    </div>
                    {plan.smsAmount.toLocaleString()} SMS Credits
                  </li>
                )}
                {plan.whatsappAmount > 0 && (
                  <li className="flex items-center gap-3 text-slate-300 text-sm font-medium opacity-50">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    </div>
                    {plan.whatsappAmount.toLocaleString()} WhatsApp Credits
                  </li>
                )}
                {plan.emailAmount > 0 && (
                  <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    </div>
                    {plan.emailAmount.toLocaleString()} Email Credits
                  </li>
                )}
                {plan.aiAmount > 0 && (
                  <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    </div>
                    {plan.aiAmount.toLocaleString()} AI Credits
                  </li>
                )}
              </ul>

              <button 
                onClick={() => handlePurchasePlan(plan.id)}
                disabled={isProcessing}
                className="w-full h-10 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl group-hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing && selectedPlanId === plan.id ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <PlusCircle size={18} />
                )}
                Buy Package
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Top-up Calculator */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 md:p-12 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-12">
          {/* Left Column: Input Panel */}
          <div className="flex-1 space-y-8">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Calculator size={18} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Custom Top-up</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Custom Credits Calculator</h2>
              <p className="text-slate-500 font-medium mt-1">Need a specific amount of credits? Drag the sliders or type in your exact counts below.</p>
            </div>

            <div className="space-y-6">
              {/* SMS Slider & Input */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">SMS Credits</h4>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">₦{smsPrice.toFixed(2)} / credit</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={smsAmount || ''}
                      onChange={(e) => setSmsAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-slate-400 font-bold text-xs">Qty</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={smsAmount}
                  onChange={(e) => setSmsAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
                <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                  <span>0 credits</span>
                  <span className="font-semibold text-blue-600">Subtotal: ₦{smsCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  <span>10,000+ credits</span>
                </div>
              </div>

              {/* WhatsApp Slider & Input */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 opacity-50 pointer-events-none">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm">WhatsApp Credits</h4>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">₦{whatsappPrice.toFixed(2)} / credit</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={whatsappAmount || ''}
                      onChange={(e) => setWhatsappAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-800 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                    <span className="text-slate-400 font-bold text-xs">Qty</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={whatsappAmount}
                  onChange={(e) => setWhatsappAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500 focus:outline-none"
                />
                <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                  <span>0 credits</span>
                  <span className="font-semibold text-green-600">Subtotal: ₦{whatsappCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  <span>10,000+ credits</span>
                </div>
              </div>

              {/* Email Slider & Input */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                      <Mail size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Email Credits</h4>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">₦{emailPrice.toFixed(2)} / credit</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={emailAmount || ''}
                      onChange={(e) => setEmailAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-800 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                    <span className="text-slate-400 font-bold text-xs">Qty</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={emailAmount}
                  onChange={(e) => setEmailAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
                />
                <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                  <span>0 credits</span>
                  <span className="font-semibold text-purple-600">Subtotal: ₦{emailCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  <span>10,000+ credits</span>
                </div>
              </div>

              {/* AI Credits Slider & Input */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">AI Credits</h4>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">₦{aiPrice.toFixed(2)} / credit</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={aiAmount || ''}
                      onChange={(e) => setAiAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-800 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-slate-400 font-bold text-xs">Qty</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={aiAmount}
                  onChange={(e) => setAiAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                />
                <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                  <span>0 credits</span>
                  <span className="font-semibold text-amber-600">Subtotal: ₦{aiCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  <span>2,000+ credits</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout panel */}
          <div className="w-full lg:w-96">
            <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between h-full border border-slate-800 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles size={16} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Order Summary</span>
                </div>

                <h3 className="text-lg md:text-xl font-bold tracking-tight">Top-up Summary</h3>

                {/* Subtotals list */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">SMS Credits ({smsAmount.toLocaleString()})</span>
                    <span className="text-slate-200 font-bold">₦{smsCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-sm opacity-50">
                    <span className="text-slate-400 font-medium">WhatsApp ({whatsappAmount.toLocaleString()})</span>
                    <span className="text-slate-200 font-bold">₦{whatsappCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">Email Credits ({emailAmount.toLocaleString()})</span>
                    <span className="text-slate-200 font-bold">₦{emailCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">AI Credits ({aiAmount.toLocaleString()})</span>
                    <span className="text-slate-200 font-bold">₦{aiCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>

                {/* Total Cost Box */}
                <div className="pt-6 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Amount</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-bold text-white">₦{totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-8 relative z-10">
                <button
                  onClick={handlePurchaseCustom}
                  disabled={isProcessing || totalCost <= 0}
                  className="w-full h-10 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-primary/95 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing && paymentMode === 'custom' ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <CreditCard size={18} />
                  )}
                  <span>Instant Custom Top-Up</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-semibold uppercase tracking-wider text-center">
                  <ShieldCheck size={12} className="text-primary" />
                  <span>Secured by Paystack</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 gap-8">        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-6">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Credit Expiry</h3>
          <p className="text-slate-600 font-medium mb-6">Subscription credits reset every month. Top-up credits remain valid for 90 days from purchase.</p>
          <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
            <span>Learn more about billing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
