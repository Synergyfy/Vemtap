'use client';

import React, { useState } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVisitorGrowthChart } from '@/services/visitors/hooks';

const RANGES = ['7D', '30D', '90D', '12M'];

interface CRMGrowthChartProps {
    branchId?: string;
}

export function CRMGrowthChart({ branchId }: CRMGrowthChartProps) {
    const [selectedRange, setSelectedRange] = useState('7D');
    const [isOpen, setIsOpen] = useState(false);

    const { data: chartResponse, isLoading } = useVisitorGrowthChart(selectedRange, branchId);
    const data = chartResponse?.data || [];

    return (
        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-black text-gray-900">Customer Growth</h3>
                    <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-widest">Database expansion over time</p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        {selectedRange}
                        <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5">
                            {RANGES.map((range) => (
                                <button
                                    key={range}
                                    onClick={() => { setSelectedRange(range); setIsOpen(false); }}
                                    className={cn(
                                        "w-full text-left px-4 py-2.5 text-sm font-bold transition-colors",
                                        selectedRange === range
                                            ? "text-primary bg-primary/5"
                                            : "text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="h-[300px] w-full relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 rounded-2xl">
                        <Loader2 className="size-8 text-primary animate-spin" />
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#066CF4" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#066CF4" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="customers" 
                            stroke="#066CF4" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorCustomers)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
