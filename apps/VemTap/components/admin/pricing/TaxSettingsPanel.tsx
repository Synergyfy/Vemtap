'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Save, Loader2, SwitchCamera, Power, History, ShieldCheck, Percent, Coins, CheckCircle2, XCircle } from 'lucide-react';
import { useTaxConfig, useTaxHistory, useUpdateTaxConfig, useToggleTaxConfig } from '@/services/subscriptions/hooks';
import type { TaxType, SubscriptionTaxConfig } from '@/types/subscriptions';

interface FormState {
    name: string;
    taxType: TaxType;
    rate: string;
}

export default function TaxSettingsPanel() {
    const { data: config, isLoading: configLoading, isError: configError } = useTaxConfig();
    const { data: history = [], isLoading: historyLoading } = useTaxHistory();
    const updateMutation = useUpdateTaxConfig();
    const toggleMutation = useToggleTaxConfig();

    // Prefer the active config; fall back to the latest history row.
    const activeConfig = config ?? history.find((h) => h.isActive) ?? (history.length ? history[0] : null);

    const [form, setForm] = useState<FormState>(() =>
        activeConfig
            ? { name: activeConfig.name, taxType: activeConfig.taxType, rate: String(activeConfig.rate) }
            : { name: 'VAT', taxType: 'percentage', rate: '7.5' },
    );

    const [dirty, setDirty] = useState(false);
    const [reason, setReason] = useState('');

    const syncFormFromConfig = (cfg: SubscriptionTaxConfig | null | undefined) => {
        if (!cfg) return;
        setForm({ name: cfg.name, taxType: cfg.taxType, rate: String(cfg.rate) });
        setDirty(false);
    };

    const handleSave = async () => {
        const rate = Number(form.rate);
        if (!form.name.trim()) return toast.error('Tax name is required');
        if (!Number.isFinite(rate) || rate < 0) return toast.error('Enter a valid non-negative rate/amount');
        if (!reason.trim()) return toast.error('A change reason is required for the audit trail');

        await updateMutation.mutateAsync({
            name: form.name.trim(),
            taxType: form.taxType,
            rate,
            isEnabled: activeConfig?.isEnabled ?? true,
            changeReason: reason.trim(),
        }, {
            onSuccess: () => {
                toast.success('Tax configuration updated');
                setReason('');
            },
            onError: (e: any) => toast.error(e?.message || 'Failed to update tax configuration'),
        });
    };

    const handleToggle = async (next: boolean) => {
        if (!reason.trim()) return toast.error('A change reason is required for the audit trail');
        await toggleMutation.mutateAsync({ isEnabled: next, changeReason: reason.trim() }, {
            onSuccess: () => {
                toast.success(next ? 'Tax enabled' : 'Tax disabled');
                setReason('');
            },
            onError: (e: any) => toast.error(e?.message || 'Failed to toggle tax'),
        });
    };

    const fmt = (n: number) => new Intl.NumberFormat('en-NG', { currency: 'NGN', style: 'currency', minimumFractionDigits: 0 }).format(n);

    if (configLoading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-sm font-bold text-slate-400">Loading tax configuration…</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Active + controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status card */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:col-span-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <SwitchCamera size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Status</span>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${activeConfig?.isEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                            {activeConfig?.isEnabled ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            {activeConfig?.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>

                    {activeConfig ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="size-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                                    {activeConfig.taxType === 'fixed' ? <Coins size={20} /> : <Percent size={20} />}
                                </div>
                                <div>
                                    <p className="text-lg font-black text-text-main">{activeConfig.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {activeConfig.taxType === 'fixed' ? `${fmt(activeConfig.rate)} flat fee` : `${activeConfig.rate}%`} · Active
                                    </p>
                                </div>
                            </div>
                            <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                                Applying tax to <span className="font-bold">all subscription &amp; add-on charges</span>. When disabled, tax is 0 and totals equal base price.
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm font-medium text-slate-400">No tax configuration found yet. Create one below.</p>
                    )}

                    {/* Toggle */}
                    <div className="border-t border-slate-100 pt-4 mt-auto space-y-3">
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Change reason (required)"
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleToggle(true)}
                                disabled={toggleMutation.isPending || activeConfig?.isEnabled}
                                className="h-10 flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {toggleMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
                                Enable
                            </button>
                            <button
                                onClick={() => handleToggle(false)}
                                disabled={toggleMutation.isPending || !activeConfig?.isEnabled}
                                className="h-10 flex items-center justify-center gap-2 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {toggleMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
                                Disable
                            </button>
                        </div>
                    </div>
                </div>

                {/* Edit form */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:col-span-2">
                    <div className="flex items-center gap-2 text-slate-400 mb-5">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Configure Tax Rule</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Tax Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => { setForm({ ...form, name: e.target.value }); setDirty(true); }}
                                placeholder="e.g. VAT"
                                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Type</label>
                            <div className="flex gap-2">
                                {(['percentage', 'fixed'] as TaxType[]).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => { setForm({ ...form, taxType: t }); setDirty(true); }}
                                        className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${form.taxType === t ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                    >
                                        {t === 'percentage' ? '% Percentage' : '₦ Fixed'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                {form.taxType === 'fixed' ? 'Flat Rate (₦)' : 'Rate (%)'}
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={form.rate}
                                onChange={(e) => { setForm({ ...form, rate: e.target.value }); setDirty(true); }}
                                placeholder={form.taxType === 'fixed' ? '500' : '7.5'}
                                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Change Reason*</label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => { setReason(e.target.value); setDirty(true); }}
                                placeholder="e.g. Statutory VAT rate adjustment"
                                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending || !dirty || !reason.trim()}
                            className="inline-flex items-center gap-2 h-11 px-6 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {updateMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                            Save Tax Rule
                        </button>
                        {activeConfig && dirty && (
                            <button
                                onClick={() => syncFormFromConfig(activeConfig)}
                                className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        )}
                        <p className="text-[10px] font-medium text-slate-400 ml-auto">
                            Saving creates a new row &amp; records the audit trail.
                        </p>
                    </div>
                </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                    <History size={15} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Immutable Audit History</span>
                    {configError && (
                        <span className="ml-auto text-[10px] font-bold text-amber-600">Tax endpoint unreachable — showing cached state</span>
                    )}
                </div>
                {historyLoading ? (
                    <div className="py-16 flex justify-center">
                        <Loader2 size={22} className="animate-spin text-primary" />
                    </div>
                ) : history.length === 0 ? (
                    <p className="py-14 text-center text-sm font-medium text-slate-400">No tax configuration changes recorded yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Name / Rule</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Change Reason</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Changed By</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Changed At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((row, idx) => (
                                    <motion.tr
                                        key={row.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="border-b border-slate-50 last:border-0"
                                    >
                                        <td className="px-6 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${row.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {row.isActive ? 'Active' : 'Archived'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="size-8 bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center">
                                                    {row.taxType === 'fixed' ? <Coins size={14} /> : <Percent size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-text-main">{row.name}</p>
                                                    <p className="text-[10px] font-medium text-slate-400">
                                                        {row.taxType === 'fixed' ? `₦${row.rate.toLocaleString()} flat` : `${row.rate}%`}
                                                        {row.isEnabled ? ' · applied' : ' · exempted'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <p className="text-xs font-medium text-slate-600 max-w-xs">{row.changeReason || '—'}</p>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            {row.changedBy ? (
                                                <div>
                                                    <p className="text-xs font-bold text-text-main">{row.changedBy.firstName} {row.changedBy.lastName}</p>
                                                    <p className="text-[10px] font-medium text-slate-400">{row.changedBy.email}</p>
                                                </div>
                                            ) : (
                                                <p className="text-xs font-medium text-slate-400">System</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <p className="text-xs font-medium text-slate-500 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</p>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
