'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ClipboardList, 
    Plus, 
    PlusCircle,
    Search, 
    ChevronRight,
    TrendingUp, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    Building2,
    MapPin,
    ArrowLeft,
    Download,
    Trash2,
    User,
    LayoutGrid,
    X,
    Zap,
    LayoutDashboard,
    Files,
    Megaphone,
    HelpCircle
} from 'lucide-react';
import { businessProfilingApi, BusinessProfile, BusinessProfileFormData } from '@/lib/api/business-profiling';
import { notify } from '@/lib/notify';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import GamifiedNewProfile from './GamifiedNewProfile';


// --- Sub-components (could be moved to separate files later) ---


const OverviewTab = ({ stats, recentProfiles, onView }: any) => {
    const statCards = [
        { label: 'Total Profiles', value: stats.total, icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'High Priority', value: stats.high, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        { label: 'Medium Priority', value: stats.medium, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Low Priority', value: stats.low, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon className={card.color} size={24} />
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">{card.label}</p>
                        <h3 className="text-2xl font-bold text-text-main">{card.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Profiles */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-bold text-text-main flex items-center gap-2">
                             Recent Profiles
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-500 text-xs font-black uppercase tracking-widest px-4">
                                    <th className="px-6 py-4">Business</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentProfiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No profiles yet</td>
                                    </tr>
                                ) : (
                                    recentProfiles.map((p: BusinessProfile) => (
                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-text-main text-sm">{p.businessName}</div>
                                                <div className="text-xs text-gray-400 capitalize">{p.businessType}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    p.priority === 'High' ? 'bg-red-50 text-red-600' :
                                                    p.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                                }`}>
                                                    {p.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    p.status === 'Closed' ? 'bg-green-100 text-green-700' :
                                                    p.status === 'Interested' ? 'bg-blue-100 text-blue-700' :
                                                    p.status === 'Contacted' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => onView(p.id)}
                                                    className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Status Summary (Simple Bars) */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-text-main mb-6">Status Summary</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Not Contacted', value: stats.notContacted, color: 'bg-gray-200' },
                            { label: 'Contacted', value: stats.contacted, color: 'bg-primary' },
                            { label: 'Interested', value: stats.interested, color: 'bg-blue-500' },
                            { label: 'Closed', value: stats.closed, color: 'bg-green-500' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-gray-500 uppercase tracking-wider">{item.label}</span>
                                    <span className="font-black text-text-main">{item.value}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${item.color}`} 
                                        style={{ width: stats.total > 0 ? `${(item.value / stats.total) * 100}%` : '0%' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface FilterState {
    search: string;
    priority: string;
    status: string;
}

const ListTab = ({ profiles, filters, setFilters, onView, onUpdateStatus, onDelete }: any) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search business, location..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={filters.search}
                        onChange={(e) => setFilters((prev: FilterState) => ({ ...prev, search: e.target.value }))}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select 
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-600 flex-1 md:w-40"
                        value={filters.priority}
                        onChange={(e) => setFilters((prev: FilterState) => ({ ...prev, priority: e.target.value }))}
                    >
                        <option value="">Priority (All)</option>
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                    </select>
                    <select 
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-600 flex-1 md:w-40"
                        value={filters.status}
                        onChange={(e) => setFilters((prev: FilterState) => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">Status (All)</option>
                        <option value="Not Contacted">Not Contacted</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Interested">Interested</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4 hidden md:table-cell">ID</th>
                                <th className="px-6 py-4">Business</th>
                                <th className="px-6 py-4 hidden lg:table-cell">Location</th>
                                <th className="px-6 py-4 hidden md:table-cell">Source</th>
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 hidden sm:table-cell">Score</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Building2 size={40} className="text-gray-200" />
                                            <p className="font-medium">No results found matching your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                profiles.map((p: BusinessProfile) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 hidden md:table-cell text-[10px] font-mono text-gray-400 capitalize whitespace-nowrap">
                                            {p.id.split('_').pop()?.substring(0, 6)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-text-main text-sm">{p.businessName}</div>
                                            <div className="text-xs text-gray-400 md:hidden">{p.location}</div>
                                            <div className="text-xs text-gray-400 hidden md:block">{p.contactPerson}</div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin size={12} />
                                                {p.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            {p.createdBy ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700">{p.createdBy.firstName} {p.createdBy.lastName}</span>
                                                    <span className="text-[10px] text-gray-400">Agent</span>
                                                </div>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest border border-blue-100 italic">Public Lead</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                p.priority === 'High' ? 'bg-red-50 text-red-600' :
                                                p.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                                {p.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select 
                                                className={`text-[10px] font-black uppercase px-2 py-1 rounded border-0 focus:ring-0 cursor-pointer ${
                                                    p.status === 'Closed' ? 'bg-green-50 text-green-700' :
                                                    p.status === 'Interested' ? 'bg-blue-50 text-blue-700' :
                                                    p.status === 'Contacted' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'
                                                }`}
                                                value={p.status}
                                                onChange={(e) => onUpdateStatus(p.id, e.target.value)}
                                            >
                                                <option value="Not Contacted">Not Contacted</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="Interested">Interested</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-black text-primary border border-primary/10">
                                                    {p.score}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button 
                                                    onClick={() => onView(p.id)}
                                                    className="px-3 md:px-4 py-1.5 bg-gray-50 text-text-main text-xs font-black uppercase tracking-wider rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                                                >
                                                    View
                                                </button>
                                                <button 
                                                    onClick={() => onDelete(p.id, p.businessName)}
                                                    className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100 hidden sm:block"
                                                    title="Delete profile"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
            </div>
        </div>
    );
};


// --- Profile Detail / Insights Sub-page ---

const SectionHeader = ({ icon: Icon, title }: any) => (
    <h3 className="font-black text-text-main text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
        <Icon size={14} className="text-primary" strokeWidth={3} />
        {title}
    </h3>
);

const InfoRow = ({ label, value }: { label: string, value: any }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-mono">{label}</p>
        <p className="text-sm font-black text-text-main">{value || 'N/A'}</p>
    </div>
);

const Tag = ({ children, color = 'blue' }: any) => {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100'
    };
    return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${colors[color]}`}>{children}</span>;
};

const ProfileDetail = ({ profileId, onBack }: { profileId: string, onBack: () => void }) => {
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [activeTab, setActiveTab] = useState('insights');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const loadProfile = async () => {
        const data = await businessProfilingApi.getById(profileId);
        setProfile(data);
    };

    useEffect(() => {
        loadProfile();
    }, [profileId]);

    const handleStatusUpdate = async (newStatus: BusinessProfile['status']) => {
        if (!profile) return;
        setUpdatingStatus(true);
        try {
            await businessProfilingApi.updateStatus(profile.id, newStatus);
            await loadProfile();
            notify.success(`Status updated to ${newStatus}`);
            setShowStatusModal(false);
        } catch {
            notify.error('Failed to update status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (!profile) return <div className="p-20 text-center animate-pulse font-black text-gray-300 uppercase tracking-widest text-xs">Loading Live Data Store...</div>;



    return (
        <div className="space-y-8 animate-in zoom-in-95 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-3 bg-white rounded-2xl border border-gray-100 text-gray-500 hover:bg-gray-50 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-text-main capitalize tracking-tight">{profile.businessName}</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Business Profiling - Active File</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 print:hidden">
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-100 text-text-main text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Download size={16} /> DOWNLOAD PDF
                    </button>
                    <button 
                        onClick={() => setShowStatusModal(true)}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95"
                    >
                         Update Status
                    </button>
                </div>
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 space-y-8 animate-in zoom-in-95">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-text-main text-xl tracking-tight">Set Status</h3>
                            <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {(['Not Contacted', 'Contacted', 'Interested', 'Closed'] as const).map((s) => (
                                <button
                                    key={s}
                                    disabled={updatingStatus || s === profile.status}
                                    onClick={() => handleStatusUpdate(s)}
                                    className={`w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                                        s === profile.status
                                            ? 'bg-primary text-white border-primary shadow-lg cursor-default'
                                            : 'bg-gray-50 text-gray-400 border-gray-50 hover:bg-white hover:border-primary/20 hover:text-primary active:scale-[0.98]'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* High Level Metrics Overlay */}
            <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    <div className="space-y-4 border-b md:border-b-0 md:border-r border-white/5 pb-8 md:pb-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Quest Mastery</p>
                        <div className="flex flex-col gap-1">
                             <div className="flex items-baseline gap-2">
                                <h2 className="text-3xl font-black text-primary tracking-tighter">{profile.xpEarned || 0}</h2>
                                <span className="text-white/20 font-black text-xs uppercase">XP</span>
                             </div>
                             <div className="flex flex-wrap gap-1 mt-1">
                                {(profile.achievements || []).map((a, i) => (
                                    <div key={i} title={a} className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px]" role="img" aria-label={a}>
                                        {a.includes('Complete') ? '✅' : a.includes('High') ? '🔥' : '⭐'}
                                    </div>
                                ))}
                                {(!profile.achievements || profile.achievements.length === 0) && <span className="text-[8px] text-white/20 font-black uppercase">No Badges Yet</span>}
                             </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-center md:items-end">
                         <div className="bg-white text-gray-900 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 border border-white/10 text-center w-full md:min-w-[200px] shadow-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Package Offer</p>
                            <span className="text-xl md:text-2xl font-black">{profile.suggestedPackage}</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-gray-200/50 p-1.5 rounded-[1.5rem] w-full md:w-fit overflow-x-auto no-scrollbar scroll-smooth">
                {[
                    { id: 'insights', label: 'Insights', icon: TrendingUp },
                    { id: 'details', label: 'Data Registry', icon: Files },
                    { id: 'scoring', label: 'Scoring Calc', icon: Zap }
                ].map((t) => (
                    <button 
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-3 px-6 md:px-8 py-3 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap print:hidden ${
                            activeTab === t.id ? 'bg-white text-primary shadow-xl shadow-gray-200' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <t.icon size={16} strokeWidth={3} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content Logic */}
            <div className="min-h-[600px]">
                {activeTab === 'insights' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in slide-in-from-top-6 duration-500">
                         {/* Approach Card */}
                         <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-xl p-6 md:p-10 space-y-10">
                            <SectionHeader icon={Clock} title="7. Sales Approach" />
                            <div className="space-y-6">
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Persona</p>
                                    <p className="text-base font-black text-text-main flex items-center gap-2">
                                        <User size={16} className="text-primary" /> {profile.whoToSpeakTo}
                                    </p>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ideal Timing</p>
                                    <p className="text-base font-black text-text-main flex items-center gap-2">
                                        <Clock size={16} className="text-primary" /> {profile.bestTimeToApproach}
                                    </p>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pitching Style</p>
                                    <p className="text-base font-black text-text-main flex items-center gap-2">
                                        <Zap size={16} className="text-primary" /> {profile.approachStyle}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Problems & Expert Tips */}
                        <div className="md:col-span-2 space-y-8">
                             <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-xl p-6 md:p-10 space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
                                        <Zap size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-text-main text-lg tracking-tight">Vemtap Strategic Analysis</h3>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                                                profile.insights?.aiSource === 'ai' 
                                                ? 'bg-green-50 text-green-600 border-green-100' 
                                                : 'bg-primary/5 text-primary border-primary/20'
                                            }`}>
                                                {profile.insights?.aiSource === 'ai' ? 'LIVE INTELLIGENCE' : 'EXPERT SYSTEM'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logic-Based Strategic Engine</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-8 bg-gradient-to-br from-blue-50/40 to-purple-50/20 rounded-[2rem] border border-blue-100/50">
                                        <div className="max-w-none text-gray-700 leading-relaxed font-medium space-y-4">
                                            {profile.insights?.aiAnalysis ? (
                                                profile.insights?.aiAnalysis.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => {
                                                    const trimmed = line.trim();
                                                    const isHeader = trimmed.startsWith('###') || 
                                                                     trimmed.startsWith('VEMTAP AI') || 
                                                                     trimmed.startsWith('TOP 3') || 
                                                                     trimmed.startsWith('VEMTAP POWER') ||
                                                                     trimmed.includes('POWER PITCH');
                                                    
                                                    const cleaned = line.replace(/^###\s*/, '').replace(/\*\*/g, '');
                                                    
                                                    return (
                                                        <div key={i} className={isHeader 
                                                            ? 'text-base font-black text-primary mt-8 mb-4 uppercase tracking-wide border-b border-primary/10 pb-1' 
                                                            : 'text-sm leading-relaxed mb-4 text-gray-700'
                                                        }>
                                                            {cleaned}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="italic text-gray-400">AI analysis will generate when a profile is finalized.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] px-2">Top Action Items</p>
                                        {(profile.insights?.recommendations || []).map((rec: string, i: number) => (
                                            <div key={i} className="flex gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-primary/20 transition-all group">
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-black text-gray-400 group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm font-bold text-gray-600 leading-relaxed">{rec}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Dedicated Power Pitch Card */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] px-2">Vemtap Power Pitch</p>
                                        <div className="p-8 bg-primary rounded-[2rem] shadow-xl shadow-primary/20 relative overflow-hidden group">
                                             <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:scale-110 transition-transform">
                                                <Megaphone size={120} strokeWidth={1} />
                                             </div>
                                             <div className="relative z-10 space-y-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                    <Megaphone size={18} className="text-white" />
                                                </div>
                                                <p className="text-lg md:text-xl font-black text-white leading-relaxed whitespace-pre-wrap">
                                                    {profile.insights?.pitchSummary || 'Analysis in progress...'}
                                                </p>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-12 animate-in fade-in slide-in-from-top-6 duration-700 space-y-16">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                             {/* Section 1 */}
                             <section className="space-y-8">
                                <SectionHeader icon={Building2} title="1. Identity & Context" />
                                <div className="space-y-6">
                                    <InfoRow label="Total Locations" value={profile.numberOfBranches} />
                                    <InfoRow label="Contact Person" value={profile.contactPerson || 'Not Specified'} />
                                    <InfoRow label="Contact Email" value={profile.contactEmail} />
                                    <InfoRow label="Contact Phone" value={profile.contactPhone} />
                                    <InfoRow label="Store Concept" value={profile.businessType} />
                                    <InfoRow label="Market Niche" value={profile.niche} />
                                    <InfoRow label="Traffic Reality" value={profile.customerTraffic} />
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Primary Demographics</p>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.targetCustomers?.map((t, i) => (
                                                <Tag key={i} color="blue">{t}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             </section>

                             {/* Section 2 */}
                             <section className="space-y-8">
                                <SectionHeader icon={MapPin} title="2. Infrastructure" />
                                <div className="grid grid-cols-2 gap-8">
                                    <InfoRow label="Glass Assets" value={profile.hasGlassDoor ? 'YES' : 'NO'} />
                                    <InfoRow label="Outside Pop." value={profile.outsideFootTraffic} />
                                    <InfoRow label="Wait Zones" value={profile.hasWaitingArea ? 'YES' : 'NO'} />
                                    <InfoRow label="Table Density" value={profile.hasTables ? 'HIGH' : 'NONE'} />
                                    <InfoRow label="Counter Ops" value={profile.hasCounterOrdering ? 'YES' : 'NO'} />
                                    <InfoRow label="Queue Health" value={profile.queueSystem} />
                                    <div className="col-span-2">
                                        <InfoRow label="Model style" value={profile.serviceStyle} />
                                    </div>
                                </div>
                             </section>

                             {/* Section 3 & Notes */}
                             <section className="space-y-8">
                                <SectionHeader icon={TrendingUp} title="3. QR Distribution" />
                                <div className="space-y-6">
                                    <div className="p-5 bg-primary/5 rounded-[2rem] border border-primary/20 space-y-1">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Outdoor Plan</p>
                                        <p className="text-base font-black text-text-main">{profile.useWindowQR ? `Deploying ${profile.windowQRType}` : 'No External QR'}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Internal Anchor Points</p>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.indoorPlacement?.map((p, i) => (
                                                <Tag key={i} color="purple">{p}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Usage Contexts</p>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.specialUse?.map((s, i) => (
                                                <Tag key={i} color="orange">{s}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             </section>
                         </div>

                         <div className="h-px bg-gray-100"></div>

                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                             <section className="space-y-8">
                                <SectionHeader icon={Zap} title="8. Technical Demo" />
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                         <p className="text-[10px] font-black uppercase text-gray-400">Interaction Focus</p>
                                         <div className="space-y-2">
                                            {profile.demoItems?.map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 text-sm font-black text-text-main">
                                                    <div className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                                                    {item}
                                                </div>
                                            ))}
                                         </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-4 rounded-2xl border text-center ${profile.isDeviceReady ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                            <p className="text-[8px] font-black uppercase">Device</p>
                                            <p className="text-xs font-black">{profile.isDeviceReady ? 'READY' : 'NEED FIX'}</p>
                                        </div>
                                        <div className={`p-4 rounded-2xl border text-center ${profile.isInternetReady ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                            <p className="text-[8px] font-black uppercase">Internet</p>
                                            <p className="text-xs font-black">{profile.isInternetReady ? 'READY' : 'OFFLINE'}</p>
                                        </div>
                                    </div>
                                </div>
                             </section>

                             <section className="space-y-8">
                                <SectionHeader icon={CheckCircle2} title="9. Negotiation Ops" />
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Incentives</p>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.offers?.map((o, i) => (
                                                <Tag key={i} color="green">{o}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-gray-400">Strategic Closing</p>
                                        <p className="text-sm font-bold text-text-main leading-relaxed">{profile.closingPlan || 'Standard closing procedure.'}</p>
                                    </div>
                                </div>
                             </section>

                             <section className="space-y-8">
                                <SectionHeader icon={Files} title="Customer Narrative" />
                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner">
                                    <p className="text-sm text-gray-500 font-bold leading-relaxed italic">
                                        "{profile.customerFlowNote || 'No specific behavioral narrative recorded.'}"
                                    </p>
                                </div>
                             </section>
                         </div>
                    </div>
                )}

                {activeTab === 'scoring' && (
                    <div className="animate-in slide-in-from-bottom-8 duration-700 flex justify-center">
                         <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl p-16 max-w-2xl w-full">
                            <SectionHeader icon={Zap} title="10. Manual Profiling Score" />
                            
                            <div className="space-y-12 py-6">
                                {[
                                    { label: 'Foot Traffic Power', value: profile.rateFootTraffic },
                                    { label: 'Demand Intensity', value: profile.rateNeed },
                                    { label: 'Liquidity / Pay Ability', value: profile.rateAbilityToPay },
                                    { label: 'Adoption Speed', value: profile.rateEaseOfAdoption },
                                ].map((item, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-gray-700 uppercase tracking-[0.2em]">{item.label}</span>
                                            <span className="text-3xl font-black text-primary tracking-tighter">{item.value}<span className="text-sm text-gray-200">/5</span></span>
                                        </div>
                                        <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden p-1 shadow-inner">
                                            <div 
                                                className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-[1500ms] ease-out-expo shadow-lg"
                                                style={{ width: `${(item.value / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}

                                <div className="bg-[#0f172a] p-12 rounded-[3.5rem] flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <p className="text-[12px] font-black text-primary uppercase tracking-[0.4em]">Final Conversion Propensity</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
                                            {profile.score}
                                        </h2>
                                        <span className="text-4xl text-white/10 font-black">/ 20</span>
                                    </div>
                                    <div className="mt-4">
                                         <Tag color={profile.priority === 'High' ? 'red' : 'orange'}>{profile.priority.toUpperCase()} PRIORITY TARGET</Tag>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Admin Dashboard Component ---
export default function BusinessProfilingPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
    const [stats, setStats] = useState<any>({ total: 0, high: 0, medium: 0, low: 0, notContacted: 0, contacted: 0, interested: 0, closed: 0 });
    const [filters, setFilters] = useState({ search: '', priority: '', status: '' });
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
    const router = useRouter();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await businessProfilingApi.getAll(filters);
            const statsData = await businessProfilingApi.getStats();
            setProfiles(data.data);
            setStats(statsData);
        } catch (error) {
            notify.error('Failed to load profiling data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters, activeTab]);

    const handleSave = async (data: BusinessProfileFormData) => {
        setIsSaving(true);
        try {
            const newProfile = await businessProfilingApi.create(data);
            notify.success('Business Profile created & scored!');
            router.push(`/admin/business-profiling/${newProfile.id}/result`);
        } catch (error) {
            console.error('Save error:', error);
            notify.error('Failed to create profile. Please check your connection or system logs.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: any) => {
        await businessProfilingApi.updateStatus(id, status);
        fetchData();
        notify.success(`Status updated to ${status}`);
    };

    const handleDeleteRequest = (id: string, name: string) => {
        setDeleteConfirm({ id, name });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        try {
            await businessProfilingApi.delete(deleteConfirm.id);
            notify.success(`"${deleteConfirm.name}" deleted successfully`);
            setDeleteConfirm(null);
            fetchData();
        } catch {
            notify.error('Failed to delete profile');
        }
    };

    const handleView = (id: string) => {
        router.push(`/admin/business-profiling/${id}/result`);
    };

    if (activeTab === 'detail' && selectedProfileId) {
        return (
            <div className="p-4 md:p-10 bg-gray-50/50 min-h-screen">
                <ProfileDetail profileId={selectedProfileId} onBack={() => setActiveTab('all')} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-10 bg-gray-50/50 min-h-screen space-y-8 pb-32">
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 space-y-8 animate-in zoom-in-95">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-red-50 flex items-center justify-center mx-auto shadow-sm">
                            <Trash2 size={32} className="text-red-500" />
                        </div>
                        <div className="text-center space-y-3">
                            <h3 className="font-black text-text-main text-2xl tracking-tight">Delete Profile?</h3>
                            <p className="text-sm text-gray-400 font-bold leading-relaxed">This will permanently delete <span className="font-black text-text-main">&ldquo;{deleteConfirm.name}&rdquo;</span>. This action cannot be undone.</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-4 bg-gray-100 text-text-main font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-200 transition-all font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all font-bold"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">Business Profiling</h1>
                    <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Strategic Merchant Acquisitions Dashboard</p>
                </div>
                <div className="flex overflow-x-auto no-scrollbar pb-2 md:pb-0 gap-2 w-full md:w-auto">
                    <button 
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === 'all' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white text-gray-500 border border-gray-100'
                        }`}
                    >
                        <LayoutGrid size={14} /> All Profiles
                    </button>
                    <button 
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === 'new' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white text-primary border border-primary/20 hover:bg-primary/5'
                        }`}
                    >
                        <PlusCircle size={14} /> New Profile
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && <OverviewTab stats={stats} recentProfiles={profiles.slice(0, 5)} onView={handleView} />}
            {activeTab === 'all' && (
                <ListTab 
                    profiles={profiles} 
                    filters={filters} 
                    setFilters={setFilters} 
                    onView={handleView}
                    onDelete={handleDeleteRequest}
                    onUpdateStatus={handleUpdateStatus}
                    isLoading={isLoading}
                />
            )}
            {activeTab === 'new' && <GamifiedNewProfile onSave={handleSave} isSaving={isSaving} />}
        </div>
    );
}
