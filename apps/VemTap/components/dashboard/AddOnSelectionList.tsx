'use client';

import React from 'react';
import { AddOn } from '@/services/addons/types';
import { CheckCircle2, Plus, Box, Zap, Sparkles, TrendingUp } from 'lucide-react';

interface Props {
    addons: AddOn[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    billingPeriod: 'monthly' | 'quarterly' | 'yearly';
}

export default function AddOnSelectionList({ addons, selectedIds, onToggle, billingPeriod }: Props) {
    const formatPrice = (price: number) => {
        let displayPrice = price;
        if (billingPeriod === 'yearly') displayPrice = price * 12;
        if (billingPeriod === 'quarterly') displayPrice = price * 3;
        
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(displayPrice);
    };

    if (addons.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-xs font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} className="text-primary" />
                        Available Add-ons
                    </h4>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">Boost your plan with extra capabilities.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {addons.map((addon) => {
                    const isSelected = selectedIds.includes(addon.id);
                    return (
                        <button
                            key={addon.id}
                            type="button"
                            onClick={() => onToggle(addon.id)}
                            className={`
                                group relative flex items-center gap-4 p-4 rounded-2xl border transition-all text-left
                                ${isSelected 
                                    ? 'bg-primary/5 border-primary shadow-sm' 
                                    : 'bg-white border-slate-100 hover:border-primary/30 hover:bg-slate-50'
                                }
                            `}
                        >
                            <div className={`
                                size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                                ${isSelected ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'}
                            `}>
                                {addon.type === 'RESOURCE' ? <Box size={20} /> : <Zap size={20} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h5 className={`text-[11px] font-black uppercase tracking-tight truncate flex items-center gap-2 ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                                        {addon.name}
                                        {addon.type === 'RESOURCE' && addon.additionalLimit && (
                                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[7px] rounded-full font-black shadow-sm shadow-emerald-200 flex items-center gap-0.5">
                                                <TrendingUp size={8} strokeWidth={4} />
                                                +{addon.additionalLimit}
                                            </span>
                                        )}
                                    </h5>
                                    <p className="text-[11px] font-black text-primary shrink-0">
                                        +{formatPrice(addon.price)}
                                        <span className="text-[9px] opacity-60 font-medium ml-0.5">
                                            /{billingPeriod === 'yearly' ? 'yr' : billingPeriod === 'quarterly' ? 'qtr' : 'mo'}
                                        </span>
                                    </p>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-1 leading-relaxed">
                                    {addon.description}
                                </p>
                            </div>

                            <div className={`
                                size-5 rounded-full border flex items-center justify-center transition-all shrink-0
                                ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white group-hover:border-primary/50'}
                            `}>
                                {isSelected ? <CheckCircle2 size={12} /> : <Plus size={12} className="text-slate-300" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
