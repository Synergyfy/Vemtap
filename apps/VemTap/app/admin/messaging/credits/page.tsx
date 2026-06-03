'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminSystemSettingsApi, adminCreditPlansApi } from '@/lib/api/admin';
import { fetchCreditPlans, CreditPlan } from '@/lib/api/credit-plans';
import {
  Coins,
  MessageSquare,
  Mail,
  Zap,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Save,
  TrendingUp,
  Settings,
  AlertCircle,
  X,
  Sparkles,
  Percent,
  Check,
  Package,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';

interface PlanFormState {
  id?: string;
  name: string;
  description: string;
  price: number;
  smsAmount: number;
  emailAmount: number;
  whatsappAmount: number;
  isActive: boolean;
}

const defaultFormState: PlanFormState = {
  name: '',
  description: '',
  price: 0,
  smsAmount: 0,
  emailAmount: 0,
  whatsappAmount: 0,
  isActive: true
};

export default function AdminCreditsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formState, setFormState] = useState<PlanFormState>(defaultFormState);
  
  // Rate Editing state
  const [ratesForm, setRatesForm] = useState({
    creditPriceSms: 15.00,
    creditPriceWhatsapp: 25.00,
    creditPriceEmail: 2.00
  });

  // 1. Queries
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await adminSystemSettingsApi.get();
      // Initialize rates local state when settings fetch completes
      if (res) {
        setRatesForm({
          creditPriceSms: Number(res.creditPriceSms) || 15.00,
          creditPriceWhatsapp: Number(res.creditPriceWhatsapp) || 25.00,
          creditPriceEmail: Number(res.creditPriceEmail) || 2.00
        });
      }
      return res;
    }
  });

  const { data: plans, isLoading: isPlansLoading } = useQuery({
    queryKey: ['credit-plans'],
    queryFn: fetchCreditPlans
  });

  // 2. Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => adminSystemSettingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Global pricing rates updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update pricing rates');
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: any) => adminCreditPlansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-plans'] });
      setIsModalOpen(false);
      setFormState(defaultFormState);
      toast.success('Credit package created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create credit package');
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminCreditPlansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-plans'] });
      setIsModalOpen(false);
      setFormState(defaultFormState);
      toast.success('Credit package updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update credit package');
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => adminCreditPlansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-plans'] });
      toast.success('Credit package deactivated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to deactivate package');
    }
  });

  // 3. Handlers
  const handleRatesSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      creditPriceSms: Number(ratesForm.creditPriceSms),
      creditPriceWhatsapp: Number(ratesForm.creditPriceWhatsapp),
      creditPriceEmail: Number(ratesForm.creditPriceEmail)
    });
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formState.name,
      description: formState.description,
      price: Number(formState.price),
      smsAmount: Number(formState.smsAmount),
      emailAmount: Number(formState.emailAmount),
      whatsappAmount: Number(formState.whatsappAmount),
      isActive: formState.isActive
    };

    if (modalMode === 'create') {
      createPlanMutation.mutate(payload);
    } else if (modalMode === 'edit' && formState.id) {
      updatePlanMutation.mutate({ id: formState.id, data: payload });
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormState(defaultFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: CreditPlan) => {
    setModalMode('edit');
    setFormState({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      smsAmount: plan.smsAmount,
      emailAmount: plan.emailAmount,
      whatsappAmount: plan.whatsappAmount,
      isActive: plan.isActive
    });
    setIsModalOpen(true);
  };

  const isPageLoading = isSettingsLoading || isPlansLoading;

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 md:p-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-primary mb-2">
            <Coins size={20} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">Platform Pricing</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-slate-900">
            Credits & Packages Control
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Configure global messaging purchase rates and build custom predefined top-up packages.
          </p>
        </div>
      </div>

      {/* Grid: Global Rates & Package Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Per-Credit Rates Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="text-slate-400" size={18} />
            <h2 className="font-bold text-slate-900 text-lg">Unit Purchase Pricing</h2>
          </div>

          <form onSubmit={handleRatesSave} className="space-y-6 flex-1 flex flex-col">
            {/* SMS Rate */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <MessageSquare size={16} />
                  SMS Credit
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Per Unit</span>
              </div>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₦</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={ratesForm.creditPriceSms}
                  onChange={(e) => setRatesForm({ ...ratesForm, creditPriceSms: Number(e.target.value) })}
                  className="w-full h-11 pl-8 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* WhatsApp Rate */}
            <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-green-900 flex items-center gap-2">
                  <Zap size={16} />
                  WhatsApp Credit
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Per Unit</span>
              </div>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₦</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={ratesForm.creditPriceWhatsapp}
                  onChange={(e) => setRatesForm({ ...ratesForm, creditPriceWhatsapp: Number(e.target.value) })}
                  className="w-full h-11 pl-8 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
            </div>

            {/* Email Rate */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-purple-900 flex items-center gap-2">
                  <Mail size={16} />
                  Email Credit
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Per Unit</span>
              </div>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₦</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={ratesForm.creditPriceEmail}
                  onChange={(e) => setRatesForm({ ...ratesForm, creditPriceEmail: Number(e.target.value) })}
                  className="w-full h-11 pl-8 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="w-full mt-auto py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
              {updateSettingsMutation.isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              <span>Update Pricing Rates</span>
            </button>
          </form>
        </div>

        {/* Dynamic Credit Package List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Layers className="text-slate-400" size={18} />
              <h2 className="font-bold text-slate-900 text-lg">Active Packages</h2>
            </div>
            <button
              onClick={openCreateModal}
              className="py-2.5 px-4 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              <span>New Package</span>
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {plans && plans.length > 0 ? (
              <div className="space-y-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-colors gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-950 text-base">{plan.name}</span>
                        {!plan.isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium max-w-md line-clamp-1">{plan.description}</p>
                      
                      {/* Token Summary */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        {plan.smsAmount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            <MessageSquare size={12} />
                            {plan.smsAmount.toLocaleString()} SMS
                          </span>
                        )}
                        {plan.whatsappAmount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                            <Zap size={12} />
                            {plan.whatsappAmount.toLocaleString()} WhatsApp
                          </span>
                        )}
                        {plan.emailAmount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                            <Mail size={12} />
                            {plan.emailAmount.toLocaleString()} Email
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <div className="text-right">
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Package Price</p>
                        <p className="font-display font-black text-slate-900 text-lg">₦{plan.price.toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to deactivate the package "${plan.name}"?`)) {
                              deletePlanMutation.mutate(plan.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-slate-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                  <Package size={28} />
                </div>
                <h3 className="font-bold text-slate-700 text-sm">No Predefined Packages</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-[240px]">Create packages to let customers purchase bundled credits easily.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create/Edit Package */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/60 z-60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl p-8 z-70 border border-slate-100 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary animate-spin" style={{ animationDuration: '3s' }} size={20} />
                  <h3 className="font-bold text-slate-900 text-xl">
                    {modalMode === 'create' ? 'Create Credit Package' : 'Edit Credit Package'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-5">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Package Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starter Booster"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-primary/30 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
                  <textarea
                    placeholder="Brief detail of credits included..."
                    rows={2}
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary/30 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  />
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Package Price (₦)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₦</span>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="5000"
                      value={formState.price || ''}
                      onChange={(e) => setFormState({ ...formState, price: Number(e.target.value) })}
                      className="w-full h-11 pl-8 pr-4 bg-slate-50 border border-slate-200 focus:border-primary/30 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>

                {/* Token Bundles */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Token Bundles</label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* SMS */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 justify-center">
                        <MessageSquare size={12} /> SMS
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formState.smsAmount || ''}
                        onChange={(e) => setFormState({ ...formState, smsAmount: Number(e.target.value) })}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      />
                    </div>
                    {/* WhatsApp */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 justify-center">
                        <Zap size={12} /> WhatsApp
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formState.whatsappAmount || ''}
                        onChange={(e) => setFormState({ ...formState, whatsappAmount: Number(e.target.value) })}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500/10"
                      />
                    </div>
                    {/* Email */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 justify-center">
                        <Mail size={12} /> Email
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formState.emailAmount || ''}
                        onChange={(e) => setFormState({ ...formState, emailAmount: Number(e.target.value) })}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Package Status</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Toggle whether this bundle is visible to owners immediately.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormState({ ...formState, isActive: !formState.isActive })}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${formState.isActive ? 'bg-primary' : 'bg-slate-300'}`}
                  >
                    <motion.div
                      layout
                      className="w-4 h-4 bg-white rounded-full shadow"
                      animate={{ x: formState.isActive ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-sm transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:opacity-95"
                  >
                    {(createPlanMutation.isPending || updatePlanMutation.isPending) ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                    <span>{modalMode === 'create' ? 'Create Bundle' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
