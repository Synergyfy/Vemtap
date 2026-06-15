'use client';

import React from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

const data = [
  { name: 'Mon', customers: 400 },
  { name: 'Tue', customers: 600 },
  { name: 'Wed', customers: 500 },
  { name: 'Thu', customers: 900 },
  { name: 'Fri', customers: 1200 },
  { name: 'Sat', customers: 1500 },
  { name: 'Sun', customers: 1300 },
];

export function CRMGrowthChart() {
    return (
        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-black text-gray-900">Customer Growth</h3>
                    <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-widest">Database expansion over time</p>
                </div>
                <div className="flex bg-gray-50 p-1 rounded-xl">
                    {['7D', '30D', '90D', '12M'].map((range) => (
                        <button 
                            key={range}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                                range === '7D' ? 'bg-white text-[#066CF4] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
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
