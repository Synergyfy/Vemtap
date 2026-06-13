'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    BarChart3, TrendingUp, Users, Clock, 
    Smartphone, Globe, MousePointer2, ArrowLeft,
    Download, Calendar, Filter, ChevronRight,
    MapPin, Share2, Info, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQrThriveStore } from '@/store/useQrThriveStore';

const scanData = [
  { name: 'Mon', scans: 400, conv: 240 },
  { name: 'Tue', scans: 600, conv: 380 },
  { name: 'Wed', scans: 500, conv: 310 },
  { name: 'Thu', scans: 900, conv: 520 },
  { name: 'Fri', scans: 1200, conv: 740 },
  { name: 'Sat', scans: 1500, conv: 980 },
  { name: 'Sun', scans: 1300, conv: 820 },
];

const deviceData = [
  { name: 'iOS', value: 65, color: '#066CF4' },
  { name: 'Android', value: 30, color: '#10B981' },
  { name: 'Other', value: 5, color: '#F1F5F9' },
];

export function QRThriveAnalyticsView() {
    const { setView } = useQrThriveStore();

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                        <BarChart3 size={12} /> QR Performance
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">Advanced Analytics</h2>
                </div>
                <div className="flex items-center gap-3">
                   <Button variant="ghost" onClick={() => setView('hub')} className="text-[10px] font-black uppercase tracking-widest text-gray-400">Back to Hub</Button>
                   <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-100 bg-white font-black text-[10px] uppercase tracking-widest text-gray-400">
                      <Download size={16} className="mr-2" /> Export Report
                   </Button>
                </div>
            </div>

            {/* HIGH LEVEL KPIS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Scans', value: '18,420', trend: '+12%', isUp: true, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Unique Users', value: '12,100', trend: '+8%', isUp: true, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Conversions', value: '2,450', trend: '+15%', isUp: true, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Bounce Rate', value: '14%', trend: '-2%', isUp: false, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <Badge className={cn(
                                "border-none font-black text-[8px] uppercase px-2",
                                stat.isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                                {stat.trend}
                            </Badge>
                        </div>
                        <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* MAIN CHART */}
            <div className="rounded-[40px] bg-white p-8 md:p-10 border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Scan & Conversion Trends</h3>
                        <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-widest">Growth over last 7 days</p>
                    </div>
                    <div className="flex bg-gray-50 p-1 rounded-xl">
                        {['7D', '30D', '90D'].map(r => (
                            <button key={r} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black transition-all", r === '7D' ? "bg-white text-[#066CF4] shadow-sm" : "text-gray-400")}>{r}</button>
                        ))}
                    </div>
                </div>
                
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={scanData}>
                            <defs>
                                <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#066CF4" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#066CF4" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                            <Area type="monotone" dataKey="scans" stroke="#066CF4" strokeWidth={4} fillOpacity={1} fill="url(#colorScans)" />
                            <Area type="monotone" dataKey="conv" stroke="#10B981" strokeWidth={4} fill="transparent" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* DEVICE BREAKDOWN */}
                <div className="rounded-[40px] bg-white p-10 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-10">
                    <div className="h-[200px] w-[200px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                                    {deviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-6">
                        <h3 className="text-xl font-black text-gray-900">Device Distribution</h3>
                        <div className="space-y-3">
                            {deviceData.map((d) => (
                                <div key={d.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="text-xs font-bold text-gray-500">{d.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-gray-900">{d.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CONVERSION FUNNEL */}
                <div className="rounded-[40px] bg-gray-900 p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#066CF4]/20 rounded-full blur-2xl" />
                    <h3 className="text-xl font-black mb-10 relative z-10">Conversion Funnel</h3>
                    <div className="space-y-6 relative z-10">
                        {[
                            { label: 'Scanned QR', value: '18,420', perc: '100%' },
                            { label: 'Loaded Experience', value: '16,500', perc: '89%' },
                            { label: 'Interaction', value: '8,200', perc: '44%' },
                            { label: 'Converted', value: '2,450', perc: '13%' },
                        ].map((step, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                                    <span>{step.label}</span>
                                    <span>{step.value} ({step.perc})</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: step.perc }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="h-full bg-[#066CF4]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
