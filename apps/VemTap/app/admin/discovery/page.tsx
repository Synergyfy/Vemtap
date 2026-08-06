'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
    Store, Tag, Users, Activity, TrendingUp, Bell, ShieldAlert,
    FileText, Settings, Search, Filter, MoreVertical, ArrowRight,
    CheckCircle2, XCircle, Eye, Pause, Trash2,
    Download, X, Plus, RefreshCw, FileDown, LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import Link from 'next/link';

type TabId = 'overview' | 'businesses' | 'promotions' | 'partners' | 'referrals' | 'revenue' | 'notifications' | 'fraud' | 'reports' | 'settings';

export default function AdminDiscoveryDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">Discovery Network</h1>
                <p className="text-gray-500 font-medium mt-2">Executive oversight and network management.</p>
            </div>

            <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200 mb-8 pb-px gap-1">
                {([
                    { id: 'overview', label: 'Overview', icon: Activity },
                    { id: 'businesses', label: 'Businesses', icon: Store },
                    { id: 'promotions', label: 'Promotions', icon: Tag },
                    { id: 'partners', label: 'Partners', icon: Users },
                    { id: 'referrals', label: 'Referrals', icon: ArrowRight },
                    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'fraud', label: 'Fraud Monitoring', icon: ShieldAlert },
                    { id: 'reports', label: 'Reports', icon: FileText },
                    { id: 'settings', label: 'Settings', icon: Settings }
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-xl transition-colors border-b-2",
                            activeTab === tab.id 
                                ? "border-primary text-primary bg-blue-50/50" 
                                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm min-h-[600px]">
                {activeTab === 'overview' && <OverviewTab onNavigate={setActiveTab} />}
                {activeTab === 'businesses' && <BusinessesTab />}
                {activeTab === 'promotions' && <PromotionsTab />}
                {activeTab === 'partners' && <PartnersTab />}
                {activeTab === 'referrals' && <ReferralsTab />}
                {activeTab === 'revenue' && <RevenueTab />}
                {activeTab === 'notifications' && <NotificationsTab />}
                {activeTab === 'fraud' && <FraudTab />}
                {activeTab === 'reports' && <ReportsTab />}
                {activeTab === 'settings' && <SettingsTab />}
            </div>
        </div>
    );
}

// ============== SHARED COMPONENTS ==============

function ActionMenu({ options }: { options: { label: string; icon: React.ReactNode; onClick: () => void; variant?: 'default' | 'danger' }[] }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    return (
        <div ref={ref} className="relative inline-block">
            <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <MoreVertical size={16} className="text-gray-400" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5">
                    {options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => { opt.onClick(); setOpen(false); }}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors text-left",
                                opt.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                            )}
                        >
                            {opt.icon}
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ============== OVERVIEW TAB ==============

function OverviewTab({ onNavigate }: { onNavigate: (t: TabId) => void }) {
    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Executive Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                {[
                    { label: 'Participating Businesses', value: '1,248', trend: '+12%' },
                    { label: 'Active Promotions', value: '4,592', trend: '+5%' },
                    { label: 'Customers Reached', value: '1.2M', trend: '+18%' },
                    { label: 'Visits Generated', value: '84.5K', trend: '+22%' },
                    { label: 'Revenue Generated', value: '₦450.2M', trend: '+15%' }
                ].map((kpi, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{kpi.label}</div>
                        <div className="flex items-end justify-between">
                            <div className="text-3xl font-semibold text-gray-800">{kpi.value}</div>
                            <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{kpi.trend}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800 text-lg">System Health</h3>
                        <Button variant="ghost" className="text-primary font-bold" onClick={() => toast.success('All systems operational')}>View All</Button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100">
                            <div className="size-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                                <Activity size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">Attribution Engine</div>
                                <div className="text-sm text-gray-500">Processing 1.2k events/sec normally</div>
                            </div>
                            <div className="ml-auto text-emerald-600 font-bold text-sm">Healthy</div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100">
                            <div className="size-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                                <Activity size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">Referral Tracking</div>
                                <div className="text-sm text-gray-500">100% accuracy in last 24h</div>
                            </div>
                            <div className="ml-auto text-emerald-600 font-bold text-sm">Healthy</div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-orange-100">
                            <div className="size-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">Fraud Detection</div>
                                <div className="text-sm text-gray-500">12 suspicious activities flagged</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onNavigate('fraud')} className="ml-auto font-bold text-primary border-primary/30">Review</Button>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100">
                            <div className="size-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                <LayoutDashboard size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">Business Applications</div>
                                <div className="text-sm text-gray-500">8 pending applications awaiting review</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onNavigate('businesses')} className="ml-auto font-bold text-primary border-primary/30">Review</Button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 text-lg mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onNavigate('businesses')} className="p-6 text-left rounded-2xl border border-gray-100 hover:border-primary hover:bg-blue-50 transition-all group">
                            <Store className="text-gray-400 group-hover:text-primary mb-4" size={24} />
                            <div className="font-bold text-gray-800">Manage Businesses</div>
                            <div className="text-sm text-gray-500 mt-1">View & approve accounts</div>
                        </button>
                        <button onClick={() => onNavigate('promotions')} className="p-6 text-left rounded-2xl border border-gray-100 hover:border-primary hover:bg-blue-50 transition-all group">
                            <Tag className="text-gray-400 group-hover:text-primary mb-4" size={24} />
                            <div className="font-bold text-gray-800">Review Promotions</div>
                            <div className="text-sm text-gray-500 mt-1">Approve pending offers</div>
                        </button>
                        <button onClick={() => onNavigate('partners')} className="p-6 text-left rounded-2xl border border-gray-100 hover:border-primary hover:bg-blue-50 transition-all group">
                            <Users className="text-gray-400 group-hover:text-primary mb-4" size={24} />
                            <div className="font-bold text-gray-800">View Partnerships</div>
                            <div className="text-sm text-gray-500 mt-1">Monitor B2B agreements</div>
                        </button>
                        <button onClick={() => onNavigate('reports')} className="p-6 text-left rounded-2xl border border-gray-100 hover:border-primary hover:bg-blue-50 transition-all group">
                            <FileText className="text-gray-400 group-hover:text-primary mb-4" size={24} />
                            <div className="font-bold text-gray-800">Generate Reports</div>
                            <div className="text-sm text-gray-500 mt-1">Export performance data</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============== BUSINESSES TAB ==============

function BusinessesTab() {
    const [suspendTarget, setSuspendTarget] = useState<string | null>(null);
    const [suspendReason, setSuspendReason] = useState('');

    const handleSuspend = () => {
        if (!suspendReason.trim()) {
            toast.error('Please provide a suspension reason');
            return;
        }
        toast.success(`${suspendTarget} has been suspended`);
        setSuspendTarget(null);
        setSuspendReason('');
    };

    const businesses = [
        { name: 'VemTap Café', loc: 'Downtown', promos: 3, rcvd: '1,240' },
        { name: 'FitLife Gym', loc: 'Westside', promos: 1, rcvd: '450' },
        { name: 'Tech Repair Hub', loc: 'North Mall', promos: 0, rcvd: '12' },
    ];

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Participating Businesses</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Search businesses..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <Button variant="outline" className="rounded-xl font-bold text-gray-800 border-gray-300"><Filter size={16} className="mr-2"/> Filter</Button>
                    <Button variant="outline" className="rounded-xl font-bold text-gray-800 border-gray-300" onClick={() => toast.success('Exporting network list...')}>
                        <Download size={16} className="mr-2"/> Export
                    </Button>
                </div>
            </div>

            <table className="w-full text-left">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider rounded-tl-xl">Business Name</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Location</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Promotions</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Customers Rcvd</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider rounded-tr-xl text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {businesses.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-bold text-gray-800">{row.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{row.loc}</td>
                            <td className="px-6 py-4">
                                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">{row.promos} Active</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-700">{row.rcvd}</td>
                            <td className="px-6 py-4 text-right">
                                <ActionMenu options={[
                                    { label: 'View Details', icon: <Eye size={15} />, onClick: () => toast.success(`Viewing ${row.name}`) },
                                    { label: 'Suspend', icon: <XCircle size={15} />, onClick: () => setSuspendTarget(row.name), variant: 'danger' },
                                ]} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal open={!!suspendTarget} onClose={() => { setSuspendTarget(null); setSuspendReason(''); }} title={`Suspend ${suspendTarget || ''}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for suspension</label>
                        <textarea
                            value={suspendReason}
                            onChange={e => setSuspendReason(e.target.value)}
                            rows={3}
                            placeholder="Enter reason..."
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 font-bold text-gray-700 border-gray-300" onClick={() => { setSuspendTarget(null); setSuspendReason(''); }}>Cancel</Button>
                        <Button className="flex-1 font-bold bg-red-600 hover:bg-red-700 text-white" onClick={handleSuspend}>Confirm Suspension</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// ============== PROMOTIONS TAB ==============

function PromotionsTab() {
    const [showCategories, setShowCategories] = useState(false);
    const categories = ['Food & Dining', 'Retail', 'Fitness', 'Entertainment', 'Health & Beauty', 'Technology'];

    const promotions = [
        { title: 'Free Coffee with Pastry', biz: 'VemTap Café', status: 'Pending Review' as const, results: '--' },
        { title: '10% Storewide', biz: 'ABC Fashion', status: 'Active' as const, results: '2.4k Views' },
    ];

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Promotions</h2>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl font-bold text-gray-800 border-gray-300" onClick={() => setShowCategories(!showCategories)}>
                        <Tag size={16} className="mr-2"/> Offer Categories
                    </Button>
                    <Button className="rounded-xl font-bold" onClick={() => toast.success('Opening offer creator...')}>
                        <Plus size={16} className="mr-2"/> Create Global Offer
                    </Button>
                </div>
            </div>

            {showCategories && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 text-sm">Offer Categories</h4>
                        <button onClick={() => setShowCategories(false)} className="p-1 hover:bg-blue-100 rounded-lg"><X size={16} /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <span key={cat} className="text-xs font-bold bg-white text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">{cat}</span>
                        ))}
                    </div>
                </div>
            )}

            <table className="w-full text-left">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider rounded-tl-xl">Promotion</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Business</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Status</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Results</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider rounded-tr-xl text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {promotions.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-bold text-gray-800">{row.title}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{row.biz}</td>
                            <td className="px-6 py-4">
                                <span className={cn("text-xs font-bold px-2 py-1 rounded-md", row.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600')}>{row.status}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{row.results}</td>
                            <td className="px-6 py-4 text-right">
                                <ActionMenu options={[
                                    ...(row.status === 'Pending Review' ? [{ label: 'Approve', icon: <CheckCircle2 size={15} />, onClick: () => toast.success(`Approved: ${row.title}`) }] : []),
                                    ...(row.status === 'Active' ? [{ label: 'Pause', icon: <Pause size={15} />, onClick: () => toast.success(`Paused: ${row.title}`) }] : []),
                                    { label: 'Preview', icon: <Eye size={15} />, onClick: () => toast.success(`Previewing: ${row.title}`) },
                                    { label: 'Remove', icon: <Trash2 size={15} />, onClick: () => toast.success(`Removed: ${row.title}`), variant: 'danger' },
                                ]} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============== PARTNERS TAB ==============

function PartnersTab() {
    const partners = [
        { b1: 'VemTap Café', b2: 'Downtown Books', shared: '142', rev: '₦450,000' },
        { b1: 'FitLife Gym', b2: 'Healthy Bites', shared: '89', rev: '₦210,000' },
    ];

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Partnerships</h2>
                <Link href="/admin/discovery/partnerships">
                    <Button variant="outline" className="rounded-xl font-bold text-gray-800 border-gray-300">View Agreements</Button>
                </Link>
            </div>
            
            <table className="w-full text-left">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider rounded-tl-xl">Business A</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Business B</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Customers Shared</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Revenue Generated</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider rounded-tr-xl text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {partners.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-bold text-gray-800">{row.b1}</td>
                            <td className="px-6 py-4 font-bold text-gray-800">{row.b2}</td>
                            <td className="px-6 py-4 text-sm font-bold text-primary">{row.shared}</td>
                            <td className="px-6 py-4 text-sm font-bold text-emerald-600">{row.rev}</td>
                            <td className="px-6 py-4 text-right">
                                <ActionMenu options={[
                                    { label: 'View Details', icon: <Eye size={15} />, onClick: () => toast.success(`Viewing partnership: ${row.b1} & ${row.b2}`) },
                                    { label: 'View Agreement', icon: <FileText size={15} />, onClick: () => toast.success('Opening agreement...') },
                                ]} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============== REFERRALS TAB ==============

function ReferralsTab() {
    const referrals = [
        { cust: 'Sarah J.', src: 'FitLife Gym', dest: 'Healthy Bites', status: 'Completed' as const },
        { cust: 'Michael C.', src: 'VemTap Café', dest: 'Downtown Books', status: 'Pending' as const },
    ];

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Referrals Timeline</h2>
                <Button variant="outline" className="rounded-xl font-bold text-gray-800 border-gray-300" onClick={() => toast.success('Exporting referral logs...')}>
                    <Download size={16} className="mr-2"/> Export Logs
                </Button>
            </div>
            
            <div className="space-y-4 max-w-5xl">
                {referrals.map((row, i) => (
                    <div key={i} className="flex items-center gap-6 p-6 rounded-2xl border border-gray-100 bg-white">
                        <div className="flex-1">
                            <div className="text-sm font-bold text-gray-500 mb-1">Customer</div>
                            <div className="font-semibold text-gray-800">{row.cust}</div>
                        </div>
                        <ArrowRight className="text-gray-300 shrink-0" />
                        <div className="flex-1">
                            <div className="text-sm font-bold text-gray-500 mb-1">Source</div>
                            <div className="font-semibold text-gray-800">{row.src}</div>
                        </div>
                        <ArrowRight className="text-gray-300 shrink-0" />
                        <div className="flex-1">
                            <div className="text-sm font-bold text-gray-500 mb-1">Destination</div>
                            <div className="font-black text-gray-900">{row.dest}</div>
                        </div>
                        <div className="flex-shrink-0 w-32 text-right">
                            <span className={cn("text-xs font-bold px-3 py-1.5 rounded-full", row.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600')}>{row.status}</span>
                        </div>
                        <div className="flex-shrink-0">
                            <ActionMenu options={[
                                { label: 'View Details', icon: <Eye size={15} />, onClick: () => toast.success(`Viewing referral: ${row.cust}`) },
                                { label: row.status === 'Pending' ? 'Mark Completed' : 'Reopen', icon: row.status === 'Pending' ? <CheckCircle2 size={15} /> : <RefreshCw size={15} />, onClick: () => toast.success(`Updated: ${row.cust}`) },
                            ]} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============== REVENUE TAB ==============

function RevenueTab() {
    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-black text-gray-900 mb-6">Revenue</h2>
            <p className="text-gray-500 mb-8">Revenue attribution from discovery and referrals.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg">
                    <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Total Revenue Generated</div>
                    <div className="text-4xl font-black">₦450.2M</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-black text-gray-900 mb-4">Top Businesses</h3>
                    <div className="space-y-3">
                        {['VemTap Café', 'ABC Fashion Store', 'FitLife Gym'].map((biz, i) => (
                            <div key={i} className="p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                                <span className="font-bold text-gray-900">{i+1}. {biz}</span>
                                <span className="text-sm font-bold text-emerald-600">+₦1.2M</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-black text-gray-900 mb-4">Top Promotions</h3>
                    <div className="space-y-3">
                        {['Weekend Flash Sale', '15% Lunch Discount', 'BOGO Offer'].map((promo, i) => (
                            <div key={i} className="p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                                <span className="font-bold text-gray-900">{i+1}. {promo}</span>
                                <span className="text-sm font-bold text-emerald-600">+₦840k</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============== NOTIFICATIONS TAB ==============

function NotificationsTab() {
    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-black text-gray-900 mb-6">Notifications Sent</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-2xl bg-blue-50 text-blue-900 border border-blue-100">
                    <div className="font-black text-2xl mb-1">14.2k</div>
                    <div className="text-sm font-bold text-blue-600">Push Sent</div>
                </div>
                <div className="p-6 rounded-2xl bg-purple-50 text-purple-900 border border-purple-100">
                    <div className="font-black text-2xl mb-1">8.4k</div>
                    <div className="text-sm font-bold text-purple-600">SMS Sent</div>
                </div>
                <div className="p-6 rounded-2xl bg-orange-50 text-orange-900 border border-orange-100">
                    <div className="font-black text-2xl mb-1">45.1k</div>
                    <div className="text-sm font-bold text-orange-600">Emails Sent</div>
                </div>
            </div>
        </div>
    );
}

// ============== FRAUD TAB ==============

function FraudTab() {
    const fraudCases = [
        { type: 'Suspicious Referrals', details: 'Multiple rapid referrals from same IP (192.168.1.4)', sev: 'High' as const },
        { type: 'Coupon Abuse', details: 'User ID #4928 attempted 5 redemptions in 1 min', sev: 'Medium' as const },
    ];

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="text-red-500" /> Fraud Monitoring
                </h2>
            </div>
            
            <table className="w-full text-left">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-400 tracking-wider rounded-tl-xl">Type</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-400 tracking-wider">Details</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-400 tracking-wider">Severity</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-400 tracking-wider rounded-tr-xl text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {fraudCases.map((row, i) => (
                        <tr key={i} className="hover:bg-red-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900">{row.type}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{row.details}</td>
                            <td className="px-6 py-4">
                                <span className={cn("text-xs font-bold px-2 py-1 rounded-md", row.sev === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700')}>{row.sev}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <ActionMenu options={[
                                    { label: 'Reject & Block', icon: <XCircle size={15} />, onClick: () => toast.error(`Blocked: ${row.type}`), variant: 'danger' },
                                    { label: 'Approve & Clear', icon: <CheckCircle2 size={15} />, onClick: () => toast.success(`Cleared: ${row.type}`) },
                                ]} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============== REPORTS TAB ==============

function ReportsTab() {
    const [compiling, setCompiling] = useState<string | null>(null);

    const reports = [
        { name: 'Discovery Performance', desc: 'Network-wide metrics and KPI summary' },
        { name: 'Revenue Reports', desc: 'Revenue attribution by source and period' },
        { name: 'Business Reports', desc: 'Per-business activity and growth data' },
        { name: 'Referral Reports', desc: 'Conversion funnel and referral path analysis' },
    ];

    const handleCompile = (name: string) => {
        setCompiling(name);
        setTimeout(() => {
            setCompiling(null);
            toast.success(`${name} compiled successfully`);
        }, 2000);
    };

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-black text-gray-900 mb-6">Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                {reports.map((rep, i) => (
                    <div key={i} className="p-6 border border-gray-200 rounded-2xl flex items-center justify-between">
                        <div>
                            <div className="font-bold text-gray-900 flex items-center gap-3">
                                <FileText className="text-gray-400 shrink-0" /> {rep.name}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">{rep.desc}</div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="sm" className="font-bold text-gray-800 border-gray-300" onClick={() => toast.success(`Downloading ${rep.name} as PDF`)}>
                                <FileDown size={14} className="mr-1.5"/> PDF
                            </Button>
                            <Button variant="outline" size="sm" className="font-bold text-gray-800 border-gray-300" onClick={() => toast.success(`Downloading ${rep.name} as Excel`)}>
                                <FileDown size={14} className="mr-1.5"/> Excel
                            </Button>
                            <Button 
                                size="sm" 
                                className="font-bold" 
                                onClick={() => handleCompile(rep.name)}
                                disabled={compiling === rep.name}
                            >
                                {compiling === rep.name ? 'Compiling...' : 'Compile & Generate'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============== SETTINGS TAB ==============

function SettingsTab() {
    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-black text-gray-900 mb-6">Global Settings</h2>
            <div className="max-w-2xl bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center">
                <Settings size={32} className="text-gray-400 mx-auto mb-4" />
                <div className="font-bold text-gray-900">System Preferences</div>
                <div className="text-sm text-gray-500">Configure global attribution logic, network fees, and routing configurations here.</div>
            </div>
        </div>
    );
}
