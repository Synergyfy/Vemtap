'use client';

import React from 'react';
import { 
    Users, 
    Ticket, 
    Timer, 
    Star, 
    MoreVertical, 
    Search,
    Filter,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Circle
} from 'lucide-react';

const stats = [
    { label: 'Total Requests', value: '1,542', change: '+12.5%', trend: 'up', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Open Tickets', value: '48', sub: 'High Priority', trend: 'neutral', icon: Ticket, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg. Response', value: '2h 15m', change: '-15m', trend: 'down', icon: Timer, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Satisfaction', value: '4.8/5.0', change: '+0.2', trend: 'up', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const categories = [
    { id: 1, name: 'Technical Support', count: 452, sla: '4h', priority: 'High', status: 'Active' },
    { id: 2, name: 'Billing & Payments', count: 284, sla: '24h', priority: 'Medium', status: 'Active' },
    { id: 3, name: 'Account Access', count: 156, sla: '2h', priority: 'Critical', status: 'Active' },
    { id: 4, name: 'General Inquiry', count: 650, sla: '48h', priority: 'Low', status: 'Active' },
];

export default function SupportDashboard() {
    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight">Customer Support Tools</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage, automate and monitor your customer support operations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20">
                        <Plus size={18} />
                        New Ticket
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <button className="text-slate-400 hover:text-slate-600">
                                <MoreVertical size={20} />
                            </button>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-display font-black text-slate-900">{stat.value}</h3>
                                {stat.change && (
                                    <span className={`text-xs font-bold flex items-center ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        {stat.change}
                                    </span>
                                )}
                                {stat.sub && (
                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                                        {stat.sub}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Table Area */}
            <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="font-display font-black text-slate-900 text-lg">Ticket Categories</h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search categories..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tickets</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">SLA Goal</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Default Priority</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 underline decoration-slate-200 underline-offset-4 decoration-2 group-hover:decoration-amber-500/30 transition-all font-display">
                                            {cat.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-slate-600">{cat.count}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Timer size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-600">{cat.sla}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                            cat.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                            cat.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                                            cat.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {cat.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Circle size={8} className="fill-emerald-500 text-emerald-500" />
                                            <span className="text-sm font-medium text-slate-600">{cat.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-slate-50/30 border-t border-slate-50 flex justify-center">
                    <button className="text-xs font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 py-2 px-4 transition-all">
                        View All Categories
                    </button>
                </div>
            </div>
        </div>
    );
}
