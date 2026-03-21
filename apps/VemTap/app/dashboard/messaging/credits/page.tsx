'use client';

import React, { useState } from 'react';
import { useMyCredits, useMessagingAnalytics } from '@/services/messaging/hooks';
import { fetchCreditPlans, purchaseCreditPlan } from '@/lib/api/credit-plans';
import { useQuery } from '@tanstack/react-query';
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
  RefreshCw
} from 'lucide-react';
import { notify } from '@/lib/notify';
import { usePaystackPayment } from 'react-paystack';
import { useAuthStore } from '@/store/useAuthStore';

const CreditCardComponent = ({ title, amount, icon: Icon, color, subtitle, unavailable }: any) => (
  <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all ${unavailable ? 'opacity-60 grayscale cursor-not-allowed border-slate-200 bg-slate-50' : 'hover:shadow-md'}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
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
      <span className="text-3xl font-display font-black text-slate-900">
        {unavailable ? '---' : amount.toLocaleString()}
      </span>
      <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Credits</span>
    </div>
    <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
  </div>
);

export default function MessagingCreditsPage() {
  const user = useAuthStore((state) => state.user);
  const { data: credits, isLoading: creditsLoading, refetch: refetchCredits } = useMyCredits();
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['credit-plans'],
    queryFn: fetchCreditPlans
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPlan = plans?.find(p => p.id === selectedPlanId);

  const handlePaymentSuccess = async (reference: { reference: string }) => {
    if (!selectedPlanId) return;
    setIsProcessing(true);
    try {
      await purchaseCreditPlan(selectedPlanId, {
        businessId: user?.businessId || '',
        reference: reference.reference
      });
      notify.success('Credits purchased successfully!');
      refetchCredits();
      setSelectedPlanId(null);
    } catch (err: any) {
      notify.error(err.message || 'Failed to complete purchase');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentClose = () => {
    setIsProcessing(false);
  };

  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || '',
    amount: (selectedPlan?.price || 0) * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  };

  const initializePayment = usePaystackPayment(config);

  const handlePurchase = (planId: string) => {
    setSelectedPlanId(planId);
    // In a real app, this would trigger Paystack
    // For this prototype, we'll just show the plan selection and then initialize payment
  };

  if (creditsLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-primary mb-2">
            <RefreshCw size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Billing & Usage</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-slate-900">
            Messaging Credits
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage your SMS, WhatsApp, and Email credit balances.</p>
        </div>
      </div>

      {/* Credit Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CreditCardComponent 
          title="SMS Credits" 
          amount={credits?.smsCredits || 0} 
          icon={MessageSquare} 
          color="bg-blue-500"
          subtitle="Direct SMS Campaigns"
        />
        <CreditCardComponent 
          title="WhatsApp Credits" 
          amount={credits?.whatsappCredits || 0} 
          icon={Zap} 
          color="bg-green-500"
          subtitle="Messaging API (Disabled)"
          unavailable
        />
        <CreditCardComponent 
          title="Email Credits" 
          amount={credits?.emailCredits || 0} 
          icon={Mail} 
          color="bg-purple-500"
          subtitle="Email Newsletters & Alerts"
        />
      </div>

      {/* Buy Credits Section */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
        
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-display font-bold text-white mb-4">Top-up Your Credits</h2>
          <p className="text-slate-400 font-medium">Choose a package to increase your messaging capacity instantly. Credits are added immediately after payment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {plans?.map((plan) => (
            <div key={plan.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-all group">
              <h3 className="text-white font-bold text-xl mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-display font-black text-white">₦{plan.price.toLocaleString()}</span>
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
                  <li className="flex items-center gap-3 text-slate-400/60 text-sm font-medium">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    </div>
                    WhatsApp Supported (Coming Soon)
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
              </ul>

              <button 
                onClick={() => {
                   setSelectedPlanId(plan.id);
                   // In a real app, initializePayment(handlePaymentSuccess, handlePaymentClose)
                   // For prototype, we'll simulate Paystack
                   setTimeout(() => {
                      if (confirm(`Simulate Paystack payment for ${plan.name} (₦${plan.price.toLocaleString()})?`)) {
                        handlePaymentSuccess({ reference: 'T' + Date.now() });
                      }
                   }, 100);
                }}
                disabled={isProcessing}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 group-hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
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

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-6">
            <History size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Usage History</h3>
          <p className="text-slate-600 font-medium mb-6">View detailed logs of your messaging activities and credit deductions.</p>
          <button className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:gap-3 transition-all">
            <span>View Full Logs</span>
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
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
