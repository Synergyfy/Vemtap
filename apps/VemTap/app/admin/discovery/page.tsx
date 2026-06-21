'use client';

import React, { useState } from 'react';
import { 
    BarChart3, Store, Tag, Users, Activity, TrendingUp, Bell, ShieldAlert,
    FileText, Settings, Search, Filter, MoreVertical, ArrowRight,
    CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type TabId = 'overview' | 'businesses' | 'promotions' | 'partners' | 'referrals' | 'revenue' | 'notifications' | 'fraud' | 'reports' | 'settings';

export default function AdminDiscoveryDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">Discovery Network</h1>
                <p className="text-gray-500 font-medium mt-2">Executive oversight and network management.</p>
            </div>

            {/* Admin Tabs */}
            <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200 mb-8 pb-px gap-1">
                {[
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
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabId)}
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

            {/* Tab Contents */}
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

// ==========================================
// TABS
// ==========================================

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
                {/* Recent Activity */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800 text-lg">System Health</h3>
                        <Button variant="ghost" className="text-primary font-bold">View All</Button>
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
                            <Button variant="outline" size="sm" onClick={() => onNavigate('fraud')} className="ml-auto font-bold">Review</Button>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
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
                    </div>
                </div>
            </div>
        </div>
    );
}

function BusinessesTab() {
    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Participating Businesses</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Search businesses..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <Button variant="outline" className="rounded-xl font-bold"><Filter size={16} className="mr-2"/> Filter</Button>
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
                    {[
                        { name: 'VemTap Café', loc: 'Downtown', promos: 3, rcvd: '1,240' },
                        { name: 'FitLife Gym', loc: 'Westside', promos: 1, rcvd: '450' },
                        { name: 'Tech Repair Hub', loc: 'North Mall', promos: 0, rcvd: '12' },
                    ].map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-bold text-gray-800">{row.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{row.loc}</td>
                            <td className="px-6 py-4">
                                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">{row.promos} Active</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-700">{row.rcvd}</td>
                            <td className="px-6 py-4 text-right">
                                <Button variant="ghost" size="sm" className="text-primary font-bold">View</Button>
                                <Button variant="ghost" size="sm" className="text-red-500 font-bold">Suspend</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PromotionsTab() {
    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Promotions</h2>
            
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
                    {[
                        { title: 'Free Coffee with Pastry', biz: 'VemTap Café', status: 'Pending Review', results: '--' },
                        { title: '10% Storewide', biz: 'ABC Fashion', status: 'Active', results: '2.4k Views' },
                    ].map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-bold text-gray-800">{row.title}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{row.biz}</td>
                            <td className="px-6 py-4">
                                <span className={cn("text-xs font-bold px-2 py-1 rounded-md", row.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600')}>{row.status}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{row.results}</td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                {row.status === 'Pending Review' && <Button variant="outline" size="sm" className="font-bold border-emerald-200 text-emerald-600 hover:bg-emerald-50">Approve</Button>}
                                {row.status === 'Active' && <Button variant="outline" size="sm" className="font-bold">Pause</Button>}
                                <Button variant="ghost" size="sm" className="text-red-500 font-bold">Remove</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PartnersTab() {
    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Partnerships</h2>
            
            <table className="w-full text-left">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider rounded-tl-xl">Business A</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Business B</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Customers Shared</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Revenue Generated</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {[
                        { b1: 'VemTap Café', b2: 'Downtown Books', shared: '142', rev: '₦450,000' },
                        { b1: 'FitLife Gym', b2: 'Healthy Bites', shared: '89', rev: '₦210,000' },
                    ].map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-bold text-gray-800">{row.b1}</td>
                            <td className="px-6 py-4 font-bold text-gray-800">{row.b2}</td>
                            <td className="px-6 py-4 text-sm font-bold text-primary">{row.shared}</td>
                            <td className="px-6 py-4 text-sm font-bold text-emerald-600">{row.rev}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ReferralsTab() {
    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Referrals Timeline</h2>
            
            <div className="space-y-4 max-w-4xl">
                {[
                    { cust: 'Sarah J.', src: 'FitLife Gym', dest: 'Healthy Bites', status: 'Completed' },
                    { cust: 'Michael C.', src: 'VemTap Café', dest: 'Downtown Books', status: 'Pending' },
                ].map((row, i) => (
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
                    </div>
                ))}
            </div>
        </div>
    );
}

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

function FraudTab() {
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
                    {[
                        { type: 'Suspicious Referrals', details: 'Multiple rapid referrals from same IP (192.168.1.4)', sev: 'High' },
                        { type: 'Coupon Abuse', details: 'User ID #4928 attempted 5 redemptions in 1 min', sev: 'Medium' },
                    ].map((row, i) => (
                        <tr key={i} className="hover:bg-red-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900">{row.type}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{row.details}</td>
                            <td className="px-6 py-4">
                                <span className={cn("text-xs font-bold px-2 py-1 rounded-md", row.sev === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700')}>{row.sev}</span>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                <Button variant="outline" size="sm" className="font-bold border-red-200 text-red-600 hover:bg-red-50">Reject & Block</Button>
                                <Button variant="ghost" size="sm" className="text-emerald-600 font-bold hover:bg-emerald-50">Approve</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ReportsTab() {
    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-black text-gray-900 mb-6">Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                {['Discovery Performance', 'Revenue Reports', 'Business Reports', 'Referral Reports'].map((rep, i) => (
                    <div key={i} className="p-6 border border-gray-200 rounded-2xl flex items-center justify-between">
                        <div className="font-bold text-gray-900 flex items-center gap-3">
                            <FileText className="text-gray-400" /> {rep}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="font-bold text-primary">PDF</Button>
                            <Button variant="ghost" size="sm" className="font-bold text-primary">Excel</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

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
