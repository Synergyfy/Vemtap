'use client';

import React, { useState } from 'react';
import { 
    Users, 
    Search, 
    UserPlus, 
    MessageSquare, 
    Shield, 
    MoreVertical,
    CheckCircle2,
    Clock,
    Filter
} from 'lucide-react';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

const agents = [
    { id: 1, name: 'Alex Rivera', role: 'Support Lead', status: 'Active', activeTickets: 12, avgResponse: '15m', avatar: null, online: true },
    { id: 2, name: 'Sarah Chen', role: 'Technical Specialist', status: 'Active', activeTickets: 8, avgResponse: '22m', avatar: null, online: true },
    { id: 3, name: 'Marcus Wright', role: 'Billing Support', status: 'Away', activeTickets: 5, avgResponse: '1h 5m', avatar: null, online: false },
    { id: 4, name: 'Elena Gomez', role: 'Support Agent', status: 'Active', activeTickets: 15, avgResponse: '18m', avatar: null, online: true },
];

export default function AgentAssignmentPage() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2"><h1 className="text-2xl font-display font-black text-slate-900 tracking-tight">Agent Management</h1><PageGuideButton /><AICopilotButton /></div>
                    <p className="text-slate-500 text-sm font-medium mt-1">Assign roles and monitor performance of your support team.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20 active:scale-95">
                        <UserPlus size={18} />
                        Add Agent
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search agents..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Sort by:</span>
                        <select className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer">
                            <option>Performance</option>
                            <option>Active Tickets</option>
                            <option>Alphabetical</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Agent</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Active Tickets</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Avg. Response</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {agents.map((agent) => (
                                <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                    {agent.name.charAt(0)}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${agent.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 font-display">{agent.name}</div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase">ID: AG-{agent.id}032</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Shield size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-600">{agent.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            agent.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {agent.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare size={14} className="text-slate-400" />
                                            <span className="text-sm font-bold text-slate-800">{agent.activeTickets}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-600">{agent.avgResponse}</span>
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

                <div className="p-4 bg-slate-50/30 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Showing 4 agents</p>
                    <button className="text-xs font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 py-2 px-4 transition-all">
                        View Audit Log
                    </button>
                </div>
            </div>
        </div>
    );
}
