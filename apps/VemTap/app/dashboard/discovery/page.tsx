'use client';

import React, { useState } from 'react';
import { 
    Activity, Users, MapPin, Store, Tag, Plus, Target, CheckCircle2, ArrowRight,
    Settings, Search, Handshake, TrendingUp, RefreshCw, X, Image as ImageIcon,
    ChevronRight, CreditCard, Heart, Eye
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

type TabId = 'overview' | 'promotions' | 'partners' | 'customers' | 'results' | 'settings';

export default function DiscoveryPage() {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [isCreatingPromo, setIsCreatingPromo] = useState(false);
    
    return (
        <div className="p-4 md:p-8 pb-32 max-w-7xl mx-auto font-sans">
            <PageHeader 
                title="Discovery Network" 
                description="Get more customers from nearby businesses."
                isSticky={false}
            />
            
            {!isCreatingPromo ? (
                <>
                    {/* Navigation */}
                    <div className="mt-4 md:mt-8 flex overflow-x-auto no-scrollbar mb-6 md:mb-8 sticky top-0 z-10 bg-white/90 backdrop-blur-md py-3 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent md:py-0 md:border-b md:border-gray-200 space-x-2 md:space-x-6">
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'promotions', label: 'Promotions' },
                            { id: 'partners', label: 'Partners' },
                            { id: 'customers', label: 'Customers' },
                            { id: 'results', label: 'Results' },
                            { id: 'settings', label: 'Settings' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabId)}
                                className={cn(
                                    "px-4 py-2 md:px-0 md:pb-4 md:py-0 text-[13px] md:text-sm font-bold whitespace-nowrap transition-all relative rounded-full md:rounded-none shrink-0",
                                    activeTab === tab.id 
                                        ? "bg-primary text-white md:bg-transparent md:text-primary shadow-md shadow-primary/20 md:shadow-none" 
                                        : "bg-gray-50 text-gray-500 md:bg-transparent hover:text-gray-800"
                                )}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <span className="hidden md:block absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content Views */}
                    {activeTab === 'overview' && <OverviewTab onNavigate={setActiveTab} onCreatePromo={() => setIsCreatingPromo(true)} />}
                    {activeTab === 'promotions' && <PromotionsTab onCreatePromo={() => setIsCreatingPromo(true)} />}
                    {activeTab === 'partners' && <PartnersTab />}
                    {activeTab === 'customers' && <CustomersTab />}
                    {activeTab === 'results' && <ResultsTab />}
                    {activeTab === 'settings' && <SettingsTab />}
                </>
            ) : (
                <CreatePromotionFlow onCancel={() => setIsCreatingPromo(false)} />
            )}
        </div>
    );
}

// ==========================================
// TABS
// ==========================================

function OverviewTab({ onNavigate, onCreatePromo }: { onNavigate: (t: TabId) => void, onCreatePromo: () => void }) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'People Reached', value: '12,450', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Customers Visited', value: '342', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Offers Redeemed', value: '156', icon: Tag, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Revenue Generated', value: '₦1.2M', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className={cn("size-10 rounded-2xl flex items-center justify-center mb-4", kpi.bg, kpi.color)}>
                            <kpi.icon size={20} />
                        </div>
                        <div className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-1">{kpi.label}</div>
                        <div className="text-3xl font-semibold text-gray-800">{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={onCreatePromo} className="h-auto p-6 flex flex-col items-center justify-center gap-3 rounded-3xl bg-primary hover:bg-primary/90 text-white border-0">
                    <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold text-lg">Create Promotion</span>
                </Button>
                <Button onClick={() => onNavigate('partners')} variant="outline" className="h-auto p-6 flex flex-col items-center justify-center gap-3 rounded-3xl border-gray-200 hover:bg-gray-50">
                    <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-800">
                        <Handshake size={24} />
                    </div>
                    <span className="font-bold text-lg text-gray-800">Find Partners</span>
                </Button>
                <Button onClick={() => onNavigate('results')} variant="outline" className="h-auto p-6 flex flex-col items-center justify-center gap-3 rounded-3xl border-gray-200 hover:bg-gray-50">
                    <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-800">
                        <Activity size={24} />
                    </div>
                    <span className="font-bold text-lg text-gray-800">View Results</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Highlights */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Highlights</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Best Promotion</div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                        <Tag size={18} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">15% Lunch Discount</div>
                                        <div className="text-sm text-gray-500">84 Redemptions</div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => onNavigate('promotions')} className="text-primary font-bold">View</Button>
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Top Partner</div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                        <Store size={18} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">ABC Fashion Store</div>
                                        <div className="text-sm text-gray-500">Sent 42 Customers</div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => onNavigate('partners')} className="text-primary font-bold">View</Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Visits */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Recent Customer Visits</h3>
                        <Button variant="ghost" size="sm" onClick={() => onNavigate('customers')} className="text-primary font-bold">See All</Button>
                    </div>
                    
                    <div className="space-y-4">
                        {[
                            { name: 'Sarah Jenkins', time: '2 hours ago', promo: 'Free Coffee' },
                            { name: 'Michael Chen', time: '5 hours ago', promo: '15% Lunch Discount' },
                            { name: 'Emma Davis', time: 'Yesterday', promo: 'BOGO Offer' },
                            { name: 'James Wilson', time: 'Yesterday', promo: '15% Lunch Discount' }
                        ].map((visit, i) => (
                            <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                                        {visit.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">{visit.name}</div>
                                        <div className="text-xs text-gray-500">{visit.time}</div>
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                    {visit.promo}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PromotionsTab({ onCreatePromo }: { onCreatePromo: () => void }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">My Promotions</h3>
                <Button onClick={onCreatePromo} className="rounded-full font-bold gap-2">
                    <Plus size={16} /> Create Promotion
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { title: '15% Lunch Discount', status: 'Active', views: '2,400', visits: 84, revenue: '₦125,000', color: 'bg-emerald-50 text-emerald-600' },
                    { title: 'Free Coffee with Pastry', status: 'Active', views: '1,850', visits: 52, revenue: '₦45,000', color: 'bg-emerald-50 text-emerald-600' },
                    { title: 'Weekend Flash Sale', status: 'Paused', views: '5,200', visits: 120, revenue: '₦340,000', color: 'bg-gray-100 text-gray-600' }
                ].map((promo, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-lg text-gray-800">{promo.title}</h4>
                            <span className={cn("px-3 py-1 rounded-full text-xs font-bold", promo.color)}>{promo.status}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
                            <div>
                                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Views</div>
                                <div className="font-bold text-gray-800">{promo.views}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Visits</div>
                                <div className="font-bold text-gray-800">{promo.visits}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Revenue</div>
                                <div className="font-bold text-emerald-600">{promo.revenue}</div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 rounded-xl font-bold">Edit</Button>
                            <Button variant="outline" className="flex-1 rounded-xl font-bold">{promo.status === 'Active' ? 'Pause' : 'Resume'}</Button>
                            <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl px-4"><X size={16} /></Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PartnersTab() {
    const [view, setView] = useState<'active' | 'find' | 'recommend' | 'incoming'>('active');
    const [connected, setConnected] = useState<string[]>([]);
    
    // Connect Prompt State
    const [connectingTo, setConnectingTo] = useState<string | null>(null);
    const [connectReason, setConnectReason] = useState('');

    // Incoming Requests State
    const [incomingRequests, setIncomingRequests] = useState([
        { id: 1, name: 'Burger Joint', type: 'Restaurant', distance: '0.4 miles away', reason: 'Our customers always look for a nice place to eat after shopping.' }
    ]);
    const [handlingRequest, setHandlingRequest] = useState<{id: number, action: 'accept'|'reject'} | null>(null);
    const [handleReason, setHandleReason] = useState('');

    const handleConnectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (connectingTo) {
            setConnected(prev => [...prev, connectingTo]);
            setConnectingTo(null);
            setConnectReason('');
            alert('Partnership request sent successfully!');
        }
    };

    const handleIncomingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (handlingRequest) {
            setIncomingRequests(prev => prev.filter(r => r.id !== handlingRequest.id));
            setHandlingRequest(null);
            setHandleReason('');
            alert(`Partnership request ${handlingRequest.action}ed successfully!`);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex bg-gray-100 p-1 rounded-full overflow-x-auto no-scrollbar">
                    <button onClick={() => setView('active')} className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap", view === 'active' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500")}>Active Partners</button>
                    <button onClick={() => setView('find')} className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap", view === 'find' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500")}>Find Partners</button>
                    <button onClick={() => setView('incoming')} className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap", view === 'incoming' ? "bg-white text-gray-800 shadow-sm relative" : "text-gray-500")}>
                        Incoming Requests
                        {incomingRequests.length > 0 && <span className="absolute top-1 right-2 size-2 bg-red-500 rounded-full"></span>}
                    </button>
                    <button onClick={() => setView('recommend')} className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap", view === 'recommend' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500")}>Recommend Business</button>
                </div>
            </div>

            {view === 'active' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { name: 'ABC Fashion Store', sent: 42, received: 18, type: 'Retail' },
                        { name: 'Downtown Cafe', sent: 15, received: 34, type: 'Food & Beverage' },
                        { name: 'Glow Beauty Salon', sent: 8, received: 12, type: 'Service' }
                    ].map((partner, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center">
                                    <Store size={24} />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-800">{partner.name}</div>
                                    <div className="text-sm text-gray-500">{partner.type}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-gray-800"><span className="text-emerald-500">↑ {partner.received}</span> Received</div>
                                <div className="text-sm font-bold text-gray-500"><span className="text-blue-500">↓ {partner.sent}</span> Sent</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {view === 'find' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 flex flex-col md:flex-row gap-6 items-center">
                        <div className="size-16 bg-white rounded-2xl shadow-sm text-blue-500 flex items-center justify-center shrink-0">
                            <Handshake size={32} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 text-lg mb-2">How Partnerships Work</h3>
                            <p className="text-sm text-gray-600">
                                Partner with complimentary businesses in your area to share customers. For example, a <strong>Barbershop</strong> partnering with a <strong>Hair Product Store</strong>, or a <strong>Restaurant</strong> partnering with a nearby <strong>Dessert Shop</strong>. When customers visit your partner, they receive an offer to visit you, driving new traffic and revenue.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Map Area */}
                        <div className="lg:col-span-2 bg-gray-100 rounded-3xl border border-gray-200 relative overflow-hidden min-h-[400px]">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')] bg-blue-50/50 mix-blend-multiply"></div>
                            <div className="absolute inset-0 p-8">
                                <div className="relative w-full h-full">
                                    <div className="absolute top-[20%] left-[30%] animate-bounce">
                                        <div className="bg-white p-2 rounded-xl shadow-lg flex items-center gap-2 border border-gray-100">
                                            <div className="size-6 bg-primary rounded-md flex items-center justify-center text-white"><Store size={14} /></div>
                                            <span className="font-bold text-xs">Local Bookshop</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-[60%] left-[70%]">
                                        <div className="bg-white p-2 rounded-xl shadow-lg flex items-center gap-2 border border-gray-100">
                                            <div className="size-6 bg-orange-500 rounded-md flex items-center justify-center text-white"><Store size={14} /></div>
                                            <span className="font-bold text-xs">FitLife Gym</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-[40%] left-[50%]">
                                        <div className="size-4 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
                                        <div className="text-[10px] font-bold mt-1 text-center bg-white/80 px-1 rounded">You</div>
                                    </div>
                                </div>
                            </div>

                            {/* Connecting Overlay Modal */}
                            {connectingTo && (
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Request Partnership</h3>
                                    <p className="text-sm text-gray-600 mb-6">Why do you want to partner with <strong>{connectingTo}</strong>?</p>
                                    <form onSubmit={handleConnectSubmit} className="w-full max-w-sm">
                                        <textarea 
                                            required
                                            value={connectReason}
                                            onChange={e => setConnectReason(e.target.value)}
                                            rows={3} 
                                            placeholder="E.g. Our customers often look for services you provide..." 
                                            className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none resize-none mb-4 shadow-sm"
                                        ></textarea>
                                        <div className="flex gap-3">
                                            <Button type="button" variant="outline" onClick={() => setConnectingTo(null)} className="flex-1 rounded-xl font-bold">Cancel</Button>
                                            <Button type="submit" className="flex-1 rounded-xl font-bold bg-primary text-white">Send Request</Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* List Area */}
                        <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                            {[
                                { name: 'Local Bookshop', distance: '0.2 miles away', type: 'Retail' },
                                { name: 'FitLife Gym', distance: '0.5 miles away', type: 'Fitness' },
                                { name: 'Urban Burger', distance: '0.8 miles away', type: 'Restaurant' },
                                { name: 'Tech Repair Hub', distance: '1.2 miles away', type: 'Service' }
                            ].map((partner, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="size-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                                            <Store size={20} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800 text-sm">{partner.name}</div>
                                            <div className="text-xs text-gray-500">{partner.type} • {partner.distance}</div>
                                        </div>
                                    </div>
                                    {connected.includes(partner.name) ? (
                                        <Button disabled className="w-full rounded-xl font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-0 h-9">
                                            <CheckCircle2 size={16} className="mr-2" /> Request Sent
                                        </Button>
                                    ) : (
                                        <Button onClick={() => setConnectingTo(partner.name)} className="w-full rounded-xl font-bold h-9 bg-gray-900 text-white hover:bg-gray-800">
                                            Connect
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {view === 'incoming' && (
                <div className="max-w-2xl mx-auto space-y-6">
                    {incomingRequests.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                            <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Handshake size={32} />
                            </div>
                            <h3 className="font-semibold text-gray-800 text-lg mb-2">No pending requests</h3>
                            <p className="text-gray-500 text-sm">You've responded to all partnership requests.</p>
                        </div>
                    ) : (
                        incomingRequests.map(req => (
                            <div key={req.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                {handlingRequest?.id === req.id ? (
                                    <form onSubmit={handleIncomingSubmit} className="animate-in fade-in">
                                        <h4 className="font-semibold text-gray-800 mb-2">
                                            {handlingRequest.action === 'accept' ? 'Accepting' : 'Rejecting'} Partnership with {req.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-4">Please briefly explain why you are {handlingRequest.action}ing this request.</p>
                                        <textarea 
                                            required
                                            value={handleReason}
                                            onChange={e => setHandleReason(e.target.value)}
                                            rows={3} 
                                            placeholder={`Reason for ${handlingRequest.action}ing...`}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none resize-none mb-4"
                                        ></textarea>
                                        <div className="flex gap-3">
                                            <Button type="button" variant="outline" onClick={() => setHandlingRequest(null)} className="flex-1 rounded-xl font-bold">Cancel</Button>
                                            <Button type="submit" className={cn("flex-1 rounded-xl font-bold text-white", handlingRequest.action === 'accept' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
                                                Confirm {handlingRequest.action === 'accept' ? 'Acceptance' : 'Rejection'}
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="size-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center">
                                                <Store size={24} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-800">{req.name}</div>
                                                <div className="text-sm text-gray-500">{req.type} • {req.distance}</div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
                                            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Their message:</div>
                                            <p className="text-sm text-gray-700 italic">"{req.reason}"</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button onClick={() => setHandlingRequest({id: req.id, action: 'accept'})} className="flex-1 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800">Accept Request</Button>
                                            <Button onClick={() => setHandlingRequest({id: req.id, action: 'reject'})} variant="outline" className="flex-1 rounded-xl font-bold border-red-200 text-red-600 hover:bg-red-50">Reject</Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {view === 'recommend' && (
                <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="text-center mb-8">
                        <div className="size-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Store size={32} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Recommend a Business</h2>
                        <p className="text-sm text-gray-500">
                            Is there a business you'd love to partner with that isn't on VemTap yet? Recommend them below, and we'll reach out to invite them to the network.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert("Recommendation submitted successfully!"); setView('active'); }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name <span className="text-red-500">*</span></label>
                                <input required type="text" placeholder="e.g. Joe's Barbershop" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Owner's Name <span className="text-red-500">*</span></label>
                                <input required type="text" placeholder="e.g. Joe Smith" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                                <input required type="tel" placeholder="e.g. +234 800 000 0000" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                                <input required type="email" placeholder="joe@example.com" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Address <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <input type="text" placeholder="e.g. 123 Main Street" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Why would they be a good partner? <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <textarea rows={3} placeholder="Tell us why..." className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
                            </div>
                        </div>
                        <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg mt-4">
                            Submit Recommendation
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}

function CustomersTab() {
    const [filter, setFilter] = useState('all');

    const customersList = [
        { name: 'Sarah Jenkins', phone: '+234 800 123 4567', email: 'sarah@example.com', origin: 'From Partner: ABC Fashion', date: 'Oct 12, 2023', promo: 'Free Coffee', status: 'Purchased' },
        { name: 'Michael Chen', phone: '+234 800 987 6543', email: 'michael@example.com', origin: 'Sent To: FitLife Gym', date: 'Oct 12, 2023', promo: '15% Lunch Discount', status: 'Visited' },
        { name: 'Emma Davis', phone: '+234 800 555 1234', email: 'emma@example.com', origin: 'Direct Customer', date: 'Oct 11, 2023', promo: 'BOGO Offer', status: 'Purchased' },
        { name: 'James Wilson', phone: '+234 800 444 9876', email: 'james@example.com', origin: 'From Partner: Glow Salon', date: 'Oct 11, 2023', promo: '15% Lunch Discount', status: 'Visited' },
        { name: 'Olivia Martinez', phone: '+234 800 222 3333', email: 'olivia@example.com', origin: 'From Partner: ABC Fashion', date: 'Oct 10, 2023', promo: 'Free Coffee', status: 'Purchased' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="hidden md:flex bg-gray-100 p-1 rounded-full w-fit">
                {['all', 'from partners', 'sent to partners', 'direct'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f)} 
                        className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all capitalize", filter === f ? "bg-white text-gray-800 shadow-sm" : "text-gray-500")}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <div className="md:hidden block">
                <select 
                    value={filter} 
                    onChange={e => setFilter(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 capitalize focus:ring-2 focus:ring-primary outline-none"
                >
                    {['all', 'from partners', 'sent to partners', 'direct'].map(f => (
                        <option key={f} value={f} className="capitalize">{f}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white md:rounded-3xl border-y md:border border-gray-100 shadow-sm overflow-hidden -mx-4 md:mx-0">
                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-gray-200">
                    {customersList.map((row, i) => (
                        <div key={i} className="py-5 px-4 hover:bg-gray-50/50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-bold text-gray-800 text-[13px]">{row.name}</div>
                                    <div className="text-[11px] text-gray-500 mt-0.5">{row.phone} • {row.email}</div>
                                </div>
                                <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", row.status === 'Purchased' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600")}>
                                    {row.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-end mt-4">
                                <div className="space-y-1.5">
                                    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full block w-fit", row.origin.includes('From Partner') ? "bg-purple-50 text-purple-600" : row.origin.includes('Sent To') ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-600")}>
                                        {row.origin}
                                    </span>
                                    <div className="text-[11px] font-bold text-blue-600">{row.promo}</div>
                                </div>
                                <div className="text-[11px] font-semibold text-gray-400">{row.date}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Customer Name</th>
                                <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Contact Info</th>
                                <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Origin / Source</th>
                                <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Visit Date</th>
                                <th className="px-6 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {customersList.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-800 text-sm">{row.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-800">{row.phone}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{row.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn("text-xs font-bold px-3 py-1 rounded-full", row.origin.includes('From Partner') ? "bg-purple-50 text-purple-600" : row.origin.includes('Sent To') ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-600")}>
                                            {row.origin}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-600">{row.date}</div>
                                        <div className="text-[11px] font-bold text-blue-600 mt-1">{row.promo}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn("text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider", row.status === 'Purchased' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600")}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function ResultsTab() {
    const [timeFilter, setTimeFilter] = useState('7days');
    
    const data = [
      { name: 'Mon', views: 4000, visits: 240 },
      { name: 'Tue', views: 3000, visits: 139 },
      { name: 'Wed', views: 2000, visits: 980 },
      { name: 'Thu', views: 2780, visits: 390 },
      { name: 'Fri', views: 1890, visits: 480 },
      { name: 'Sat', views: 2390, visits: 380 },
      { name: 'Sun', views: 3490, visits: 430 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="hidden md:flex bg-gray-100 p-1 rounded-full w-fit">
                    {[
                        { id: '7days', label: 'Last 7 Days' },
                        { id: 'month', label: 'Last Month' },
                        { id: 'year', label: 'Last Year' }
                    ].map(f => (
                        <button 
                            key={f.id}
                            onClick={() => setTimeFilter(f.id)} 
                            className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all", timeFilter === f.id ? "bg-white text-gray-800 shadow-sm" : "text-gray-500")}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="md:hidden block w-full">
                    <select 
                        value={timeFilter} 
                        onChange={e => setTimeFilter(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                    >
                        <option value="7days">Last 7 Days</option>
                        <option value="month">Last Month</option>
                        <option value="year">Last Year</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'People Reached', value: '12.4K' },
                    { label: 'Interested', value: '4.2K' },
                    { label: 'Visits', value: '342' },
                    { label: 'Redeemed', value: '156' },
                    { label: 'Revenue', value: '₦1.2M' }
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{kpi.label}</div>
                        <div className="text-2xl font-semibold text-gray-800">{kpi.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Performance Over Time</h3>
                <p className="text-sm text-gray-600 mb-8 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <strong>What does this mean?</strong> This chart shows how many people <em>saw</em> your promotions (the light gray bars) compared to how many actually <em>visited</em> your store (the blue bars). A taller blue bar means your promotions are working well and driving real foot traffic!
                </p>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} />
                            <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="views" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="visits" fill="#066CF4" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#066CF4', fontSize: 10, fontWeight: 700 }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function SettingsTab() {
    return (
        <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <div className="font-semibold text-gray-800 text-lg">Join Discovery Network</div>
                        <div className="text-sm text-gray-500 mt-1">Allow your business to be discovered by locals.</div>
                    </div>
                    <div className="w-14 h-8 bg-emerald-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 size-6 bg-white rounded-full shadow-sm"></div>
                    </div>
                </div>
                
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <div className="font-semibold text-gray-800 text-lg">Receive Partner Requests</div>
                        <div className="text-sm text-gray-500 mt-1">Allow other businesses to request partnerships.</div>
                    </div>
                    <div className="w-14 h-8 bg-emerald-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 size-6 bg-white rounded-full shadow-sm"></div>
                    </div>
                </div>

                <div className="p-6 flex items-center justify-between">
                    <div>
                        <div className="font-semibold text-gray-800 text-lg">Allow Promotions</div>
                        <div className="text-sm text-gray-500 mt-1">Show your active promotions on the network.</div>
                    </div>
                    <div className="w-14 h-8 bg-emerald-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 size-6 bg-white rounded-full shadow-sm"></div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 text-lg mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                    {['Push Notifications', 'SMS Alerts', 'Email Summary'].map((notif, i) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" defaultChecked={i !== 1} className="size-5 rounded border-gray-300 text-primary focus:ring-primary" />
                            <span className="font-bold text-gray-700">{notif}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// CREATE PROMOTION FLOW (5 Steps)
// ==========================================

function CreatePromotionFlow({ onCancel }: { onCancel: () => void }) {
    const [step, setStep] = useState(1);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 min-h-[600px] animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Create Promotion</h2>
                    <div className="text-sm font-bold text-gray-400 mt-1">Step {step} of 5</div>
                </div>
                <Button variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-gray-800 rounded-full size-10 p-0"><X size={20} /></Button>
            </div>

            <div className="max-w-xl mx-auto pt-8">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-gray-800 text-center mb-8">What are you offering?</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {['Discount', 'Free Item', 'Special Deal', 'Free Delivery', 'Custom Offer'].map((offer, i) => (
                                <button key={i} onClick={() => setStep(2)} className="w-full p-6 text-left border-2 border-gray-100 rounded-2xl hover:border-primary hover:bg-blue-50 transition-all group flex items-center justify-between">
                                    <span className="font-semibold text-gray-700 group-hover:text-primary text-lg">{offer}</span>
                                    <ChevronRight className="text-gray-300 group-hover:text-primary" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6">Promotion Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                                <input type="text" placeholder="e.g. 15% Lunch Discount" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea rows={3} placeholder="Describe your offer..." className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-medium focus:ring-2 focus:ring-primary resize-none outline-none"></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                    <input type="date" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                    <input type="date" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
                                <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
                                    <ImageIcon size={24} className="mb-2" />
                                    <span className="font-bold text-sm">Upload Image</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between pt-6">
                            <Button variant="ghost" onClick={() => setStep(1)} className="font-bold">Back</Button>
                            <Button onClick={() => setStep(3)} className="rounded-full px-8 font-bold">Next</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-gray-800 text-center mb-8">Show this promotion to:</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {['Nearby Customers', 'Nearby Businesses', 'Everyone Nearby'].map((audience, i) => (
                                <button key={i} onClick={() => setStep(4)} className="w-full p-6 text-left border-2 border-gray-100 rounded-2xl hover:border-primary hover:bg-blue-50 transition-all group flex items-center justify-between">
                                    <span className="font-semibold text-gray-700 group-hover:text-primary text-lg">{audience}</span>
                                    <ChevronRight className="text-gray-300 group-hover:text-primary" />
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between pt-6">
                            <Button variant="ghost" onClick={() => setStep(2)} className="font-bold">Back</Button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Preview your Promotion</h3>
                        
                        <div className="max-w-sm mx-auto bg-gray-50 rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600"></div>
                            <div className="relative mt-16 bg-white rounded-2xl p-6 shadow-xl">
                                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Discount</div>
                                <h4 className="text-xl font-semibold text-gray-800 mb-2">15% Lunch Discount</h4>
                                <p className="text-sm text-gray-500 mb-6">Get 15% off your entire lunch order when you visit between 11 AM and 2 PM.</p>
                                <Button className="w-full rounded-full font-bold">Redeem Offer</Button>
                            </div>
                        </div>

                        <div className="flex justify-between pt-8">
                            <Button variant="ghost" onClick={() => setStep(3)} className="font-bold">Back</Button>
                            <Button onClick={() => setStep(5)} className="rounded-full px-8 font-bold">Looks Good</Button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6 animate-in fade-in text-center py-12">
                        <div className="size-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={48} />
                        </div>
                        <h3 className="text-3xl font-semibold text-gray-800 mb-4">Ready to Publish!</h3>
                        <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">Your promotion will immediately be visible to customers and businesses nearby.</p>
                        <Button onClick={onCancel} className="rounded-full px-12 py-6 text-lg font-bold bg-primary hover:bg-primary/90">Publish Promotion</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
