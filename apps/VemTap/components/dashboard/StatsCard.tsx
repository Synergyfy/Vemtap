import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
    label: string;
    value: string;
    icon: LucideIcon;
    trend?: {
        value: string;
        isUp: boolean;
    };
    color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
}

export default function StatsCard({ label, value, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
    const colorClasses = {
        blue: 'bg-primary/10 text-primary',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        red: 'bg-red-50 text-red-600',
    };

    const normalizedTrend = trend?.value?.trim().toLowerCase();
    const showTrend = !!trend && !!normalizedTrend && normalizedTrend !== 'n/a' && normalizedTrend !== 'na' && normalizedTrend !== '-';
    const looksLongTextValue = value.length > 12 && /[a-zA-Z]/.test(value);

    return (
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className={`size-10 md:size-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon size={18} className="md:size-5" />
                </div>
                {showTrend && (
                    <div className={`flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${trend.isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {trend.isUp ? <TrendingUp size={10} className="md:size-3" /> : <TrendingDown size={10} className="md:size-3" />}
                        {trend.value}
                    </div>
                )}
            </div>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-secondary mb-0.5 md:mb-1">{label}</p>
            <p
                title={value}
                className={`${looksLongTextValue ? 'text-sm md:text-base leading-6 break-words' : 'text-2xl md:text-3xl'} font-display font-bold text-text-main`}
            >
                {value}
            </p>
        </div>
    );
}
