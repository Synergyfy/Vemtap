import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface RewardStatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        isUp: boolean;
    };
    description?: string;
    color?: string;
}

export default function RewardStatCard({ 
    label, 
    value, 
    icon: Icon, 
    trend, 
    description,
    color = 'primary' 
}: RewardStatCardProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-3 md:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group"
        >
            <div className="flex items-start justify-between">
                <div className={`p-1.5 md:p-3 rounded-xl md:rounded-2xl bg-${color}/10 text-${color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={18} className="md:w-6 md:h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold ${
                        trend.isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                        {trend.isUp ? <TrendingUp size={12} className="md:w-3.5 md:h-3.5" /> : <TrendingDown size={12} className="md:w-3.5 md:h-3.5" />}
                        {trend.value}
                    </div>
                )}
            </div>
            
            <div className="mt-2 md:mt-4">
                <h3 className="text-[10px] md:text-sm font-medium text-gray-500 uppercase tracking-wider line-clamp-1">{label}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg md:text-3xl font-bold text-gray-900">{value}</span>
                </div>
                {description && (
                    <p className="text-[10px] md:text-sm text-gray-400 mt-1 line-clamp-1">{description}</p>
                )}
            </div>
        </motion.div>
    );
}
