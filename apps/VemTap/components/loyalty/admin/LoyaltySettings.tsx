"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Info, AlertCircle, Settings2, Zap, DollarSign, Clock } from 'lucide-react';
import { LoyaltyRule, RuleType } from '@/types/loyalty';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';

interface LoyaltySettingsProps {
    rules: LoyaltyRule;
    onSave: (rules: Partial<LoyaltyRule>) => Promise<void>;
    className?: string;
}

export const LoyaltySettings: React.FC<LoyaltySettingsProps> = ({ rules, onSave, className }) => {
    const [formData, setFormData] = useState<Partial<LoyaltyRule>>(rules);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(rules);
    }, [rules]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(formData);
            notify.success('Loyalty rules updated successfully');
        } catch (error) {
            notify.error('Failed to update loyalty rules');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={cn("bg-white border border-slate-200 overflow-hidden rounded-[2rem] md:rounded-3xl", className)}>
            <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Settings2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg md:text-xl font-display font-black text-slate-900 leading-tight uppercase tracking-tighter">Program Configuration</h3>
                        <p className="text-[10px] md:text-xs text-slate-500 font-medium">Define how your customers earn loyalty points</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto bg-primary text-white px-8 h-12 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-2 rounded-xl"
                >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Rules</span>
                </button>
            </div>

            <div className="p-4 md:p-8 space-y-10">
                {/* Core Rules Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">01</span>
                        <h4 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px] md:text-xs">Earning Mechanism</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(['spending', 'visit', 'hybrid'] as RuleType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFormData({ ...formData, ruleType: type })}
                                className={cn(
                                    "p-5 md:p-6 border text-left transition-all relative overflow-hidden group rounded-[1.5rem]",
                                    formData.ruleType === type
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                                    formData.ruleType === type ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                )}>
                                    {type === 'spending' ? <DollarSign className="w-6 h-6" /> : type === 'visit' ? <Zap className="w-6 h-6" /> : <Settings2 className="w-6 h-6" />}
                                </div>
                                <h5 className="font-black text-base text-slate-900 uppercase tracking-tighter mb-1">{type} Based</h5>
                                <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed">
                                    {type === 'spending' ? 'Points awarded per amount spent' : type === 'visit' ? 'Fixed points per checkout visit' : 'Combine both spending and visit points'}
                                </p>
                                {formData.ruleType === type && (
                                    <motion.div layoutId="active-rule" className="absolute top-4 right-4">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm" />
                                    </motion.div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-5 md:p-8 bg-slate-50 border border-slate-100 space-y-6 rounded-[2rem]">
                        {(formData.ruleType === 'spending' || formData.ruleType === 'hybrid') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Base Amount (₦)</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">₦</span>
                                        <input
                                            type="number"
                                            value={formData.spendingBaseAmount}
                                            onChange={(e) => setFormData({ ...formData, spendingBaseAmount: Number(e.target.value) })}
                                            className="w-full h-14 pl-10 pr-6 bg-white border border-slate-200 font-black text-lg focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all rounded-2xl shadow-sm"
                                            placeholder="1,000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Points Awarded</label>
                                    <input
                                        type="number"
                                        value={formData.spendingBasePoints}
                                        onChange={(e) => setFormData({ ...formData, spendingBasePoints: Number(e.target.value) })}
                                        className="w-full h-14 px-6 bg-white border border-slate-200 font-black text-lg focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all rounded-2xl shadow-sm"
                                        placeholder="10"
                                    />
                                </div>
                            </div>
                        )}

                        {(formData.ruleType === 'visit' || formData.ruleType === 'hybrid') && (
                            <div className={cn(
                                "grid grid-cols-1 md:grid-cols-2 gap-6",
                                (formData.ruleType === 'hybrid') && "pt-8 border-t border-slate-200"
                            )}>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Points Per Visit</label>
                                    <input
                                        type="number"
                                        value={formData.visitPoints}
                                        onChange={(e) => setFormData({ ...formData, visitPoints: Number(e.target.value) })}
                                        className="w-full h-14 px-6 bg-white border border-slate-200 font-black text-lg focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all rounded-2xl shadow-sm"
                                        placeholder="5"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 ml-1">
                                        Visit Cooldown (Hours)
                                        <Info className="w-3.5 h-3.5 text-slate-300" />
                                    </label>
                                    <div className="relative">
                                        <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="number"
                                            value={formData.visitCooldownHours}
                                            onChange={(e) => setFormData({ ...formData, visitCooldownHours: Number(e.target.value) })}
                                            className="w-full h-14 pl-12 pr-6 bg-white border border-slate-200 font-black text-lg focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all rounded-2xl shadow-sm"
                                            placeholder="24"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Bonuses Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">02</span>
                        <h4 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px] md:text-xs">Engagement Bonuses</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                        {[
                            { label: 'First Visit', key: 'firstVisitBonus', icon: Zap },
                            { label: 'Birthday', key: 'birthdayBonus', icon: Clock },
                            { label: 'Referral', key: 'referralBonus', icon: RefreshCw }
                        ].map((bonus) => (
                            <div key={bonus.key} className="p-6 md:p-8 border border-slate-100 bg-slate-50 relative group rounded-[1.5rem] shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 bg-white border border-slate-100 flex items-center justify-center text-slate-400 rounded-xl shadow-sm transition-transform group-hover:scale-110">
                                        <bonus.icon className="w-5 h-5" />
                                    </div>
                                    <h5 className="font-black text-[10px] md:text-xs uppercase tracking-widest text-slate-900">{bonus.label} Bonus</h5>
                                </div>
                                <div className="space-y-3">
                                    <input
                                        type="number"
                                        value={formData[bonus.key as keyof LoyaltyRule] as number}
                                        onChange={(e) => setFormData({ ...formData, [bonus.key]: Number(e.target.value) })}
                                        className="w-full h-12 px-5 bg-white border border-slate-200 font-black text-base focus:border-primary outline-none transition-all rounded-xl shadow-sm"
                                        placeholder="0"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium leading-tight">Additional points for {bonus.label.toLowerCase()} events</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Global Security / Abuse Section */}
                <section className="space-y-6 pt-6 border-t border-slate-100">
                    <div className="bg-amber-50 border border-amber-100 p-5 md:p-6 flex flex-col sm:flex-row items-start gap-4 rounded-2xl">
                        <div className="bg-amber-100 p-2 text-amber-600 rounded-lg">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900 text-xs md:text-sm mb-1 uppercase tracking-tight">Abuse Prevention</h4>
                            <p className="text-[10px] md:text-xs text-amber-700 leading-relaxed mb-4">
                                Wait-time restrictions are enforced globally. Only one rewarded visit per 24 hours (or your custom cooldown) is allowed from the same device.
                            </p>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 accent-primary rounded"
                                    />
                                    <span className="text-[10px] md:text-xs font-bold text-amber-900 uppercase tracking-widest">Enable Loyalty Program</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
