'use client';

import React, { useState } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const DATA_BY_RANGE: Record<string, { name: string; customers: number }[]> = {
    '7D': [
        { name: 'Mon', customers: 400 },
        { name: 'Tue', customers: 600 },
        { name: 'Wed', customers: 500 },
        { name: 'Thu', customers: 900 },
        { name: 'Fri', customers: 1200 },
        { name: 'Sat', customers: 1500 },
        { name: 'Sun', customers: 1300 },
    ],
    '30D': [
        { name: 'Week 1', customers: 2400 },
        { name: 'Week 2', customers: 3100 },
        { name: 'Week 3', customers: 2800 },
        { name: 'Week 4', customers: 4200 },
    ],
    '90D': [
        { name: 'Jan', customers: 8200 },
        { name: 'Feb', customers: 9100 },
        { name: 'Mar', customers: 11400 },
    ],
    '12M': [
        { name: 'Q1', customers: 24000 },
        { name: 'Q2', customers: 31000 },
        { name: 'Q3', customers: 28000 },
        { name: 'Q4', customers: 42000 },
    ],
};

const RANGES = ['7D', '30D', '90D', '12M'];

export function CRMGrowthChart() {
    const [selectedRange, setSelectedRange] = useState('7D');
    const [isOpen, setIsOpen] = useState(false);
    const data = DATA_BY_RANGE[selectedRange];

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

            <div className="h-[300px] w-full">
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
