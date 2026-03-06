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
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon size={20} />
                </div>
                {showTrend && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${trend.isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend.value}
                    </div>
                )}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">{label}</p>
            <p
                title={value}
                className={`${looksLongTextValue ? 'text-base leading-6 break-words' : 'text-3xl'} font-display font-bold text-text-main`}
            >
                {value}
            </p>
        </div>
    );
}
