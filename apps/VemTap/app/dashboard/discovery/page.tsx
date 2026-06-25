'use client';

import React, { useState } from 'react';
import { 
    Activity, Users, MapPin, Store, Tag, Plus, Target, CheckCircle2, ArrowRight,
    Settings, Search, Handshake, TrendingUp, RefreshCw, X, Image as ImageIcon,
    ChevronRight, CreditCard, Heart, Eye, AlertCircle, Loader2
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { 
    useDiscoveryOverview,
    useDiscoveryResults,
    useDiscoverySettings,
    useUpdateDiscoverySettings,
    useActivePartners,
    useNearbyPartners,
    useDiscoveryCustomers,
    useRecommendBusiness,
} from '@/services/discovery/hooks';
import { useCatalogueOffersAdmin, useUpdateCatalogueOffer, useDeleteCatalogueOffer, useCreateCatalogueOffer } from '@/services/catalogue/hooks';
import type { CatalogueOffer } from '@/services/catalogue/hooks';
import type { DiscoveryCustomer, ActivePartner, NearbyPartner, UpdateDiscoverySettingsDto } from '@/services/discovery/types';

type TabId = 'overview' | 'promotions' | 'partners' | 'customers' | 'results' | 'settings';

function formatCurrency(value: number): string {
    return '₦' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatCompactNumber(value: number): string {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
}

function formatTimeAgo(isoString: string): string {
    const now = new Date();
    const date = new Date(isoString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
}

function KpiSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-pulse">
                    <div className="size-10 rounded-2xl bg-gray-100 mb-4"></div>
                    <div className="h-3 bg-gray-100 rounded w-24 mb-2"></div>
                    <div className="h-7 bg-gray-100 rounded w-20"></div>
                </div>
            ))}
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="size-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertCircle size={32} />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">Something went wrong</h3>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" className="rounded-full font-bold gap-2">
                    <RefreshCw size={16} /> Try Again
                </Button>
            )}
        </div>
    );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Icon size={32} />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">{title}</h3>
            <p className="text-gray-500 text-sm">{description}</p>
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
        </div>
    );
}

export default function DiscoveryPage() {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [isCreatingPromo, setIsCreatingPromo] = useState(false);
    const { activeBranchId, isAllBranches } = useActiveBranch();
    
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

                    {isAllBranches && (
                        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-6 flex items-center gap-4">
                            <div className="size-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-amber-800">Select a branch to view discovery network data</p>
                                <p className="text-sm text-amber-600">Use the branch filter at the top of the page to choose a specific branch.</p>
                            </div>
                        </div>
                    )}

                    {!isAllBranches && (
                        <>
                            {activeTab === 'overview' && <OverviewTab branchId={activeBranchId!} onNavigate={setActiveTab} onCreatePromo={() => setIsCreatingPromo(true)} />}
                            {activeTab === 'promotions' && <PromotionsTab branchId={activeBranchId!} onCreatePromo={() => setIsCreatingPromo(true)} />}
                            {activeTab === 'partners' && <PartnersTab branchId={activeBranchId!} />}
                            {activeTab === 'customers' && <CustomersTab branchId={activeBranchId!} />}
                            {activeTab === 'results' && <ResultsTab branchId={activeBranchId!} />}
                            {activeTab === 'settings' && <SettingsTab branchId={activeBranchId!} />}
                        </>
                    )}
                </>
            ) : (
                <CreatePromotionFlow branchId={activeBranchId!} onCancel={() => setIsCreatingPromo(false)} />
            )}
        </div>
    );
}

// ==========================================
// TABS
// ==========================================

function OverviewTab({ branchId, onNavigate, onCreatePromo }: { branchId: string; onNavigate: (t: TabId) => void; onCreatePromo: () => void }) {
    const { data, isLoading, isError, error, refetch } = useDiscoveryOverview(branchId);

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <KpiSkeleton />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-50 rounded-3xl animate-pulse"></div>)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2].map(i => <div key={i} className="h-64 bg-gray-50 rounded-3xl animate-pulse"></div>)}
                </div>
            </div>
        );
    }

    if (isError) {
        return <ErrorState message={error?.message || 'Failed to load overview'} onRetry={() => refetch()} />;
    }

    if (!data) return <LoadingSpinner />;

    const { stats, highlights, recentVisits } = data;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'People Reached', value: formatCompactNumber(stats.peopleReached), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Customers Visited', value: formatCompactNumber(stats.customersVisited), icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Offers Redeemed', value: formatCompactNumber(stats.offersRedeemed), icon: Tag, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Revenue Generated', value: formatCurrency(stats.revenueGenerated), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' }
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
                                        <div className="font-bold text-gray-800">{highlights.bestPromotion.name}</div>
                                        <div className="text-sm text-gray-500">{highlights.bestPromotion.visits} Redemptions</div>
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
                                        <div className="font-bold text-gray-800">{highlights.topPartner.name}</div>
                                        <div className="text-sm text-gray-500">Sent {highlights.topPartner.visits} Customers</div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => onNavigate('partners')} className="text-primary font-bold">View</Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Recent Customer Visits</h3>
                        <Button variant="ghost" size="sm" onClick={() => onNavigate('customers')} className="text-primary font-bold">See All</Button>
                    </div>
                    
                    <div className="space-y-4">
                        {recentVisits.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">No recent visits</div>
                        ) : (
                            recentVisits.slice(0, 4).map((visit, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                                            {visit.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800">{visit.name}</div>
                                            <div className="text-xs text-gray-500">{formatTimeAgo(visit.time)}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                        {visit.promo}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PromotionsTab({ branchId, onCreatePromo }: { branchId: string; onCreatePromo: () => void }) {
    const { data: promotions, isLoading, isError, error, refetch } = useCatalogueOffersAdmin({ branchId });
    const updateOffer = useUpdateCatalogueOffer();
    const deleteOffer = useDeleteCatalogueOffer();

    const handleToggleStatus = (promo: CatalogueOffer) => {
        updateOffer.mutate({
            id: promo.id,
            data: { status: promo.status === 'active' ? 'inactive' : 'active' },
        });
    };

    const handleDelete = (promo: CatalogueOffer) => {
        if (window.confirm(`Delete "${promo.name}"?`)) {
            deleteOffer.mutate(promo.id);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                    <div className="h-7 w-40 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-10 w-44 bg-gray-100 rounded-full animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-56 bg-gray-50 rounded-3xl animate-pulse"></div>)}
                </div>
            </div>
        );
    }

    if (isError) {
        return <ErrorState message={error?.message || 'Failed to load promotions'} onRetry={() => refetch()} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">My Promotions</h3>
                <Button onClick={onCreatePromo} className="rounded-full font-bold gap-2">
                    <Plus size={16} /> Create Promotion
                </Button>
            </div>

            {!promotions || promotions.length === 0 ? (
                <EmptyState icon={Tag} title="No promotions yet" description="Create your first promotion to get started." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {promotions.map((promo) => (
                        <div key={promo.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-lg text-gray-800">{promo.name}</h4>
                                <span className={cn("px-3 py-1 rounded-full text-xs font-bold", promo.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600")}>
                                    {promo.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
                                <div>
                                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Views</div>
                                    <div className="font-bold text-gray-800">{(promo as any).views ?? '—'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Visits</div>
                                    <div className="font-bold text-gray-800">{(promo as any).visits ?? '—'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Revenue</div>
                                    <div className="font-bold text-emerald-600">{formatCurrency((promo as any).revenue ?? 0)}</div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 rounded-xl font-bold" disabled>Edit</Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 rounded-xl font-bold"
                                    onClick={() => handleToggleStatus(promo)}
                                    disabled={updateOffer.isPending}
                                >
                                    {promo.status === 'active' ? 'Pause' : 'Resume'}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl px-4"
                                    onClick={() => handleDelete(promo)}
                                    disabled={deleteOffer.isPending}
                                >
                                    <X size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PartnersTab({ branchId }: { branchId: string }) {
    const [view, setView] = useState<'active' | 'find' | 'recommend' | 'incoming'>('active');
    const [connected, setConnected] = useState<string[]>([]);
    
    const { data: activePartners, isLoading: loadingActive, isError: errorActive, refetch: refetchActive } = useActivePartners(branchId);
    const { data: nearbyPartners, isLoading: loadingNearby } = useNearbyPartners(branchId);
    const recommendMutation = useRecommendBusiness();

    // Connect Prompt State
    const [connectingTo, setConnectingTo] = useState<string | null>(null);
    const [connectReason, setConnectReason] = useState('');

    // Incoming Requests State (mock until endpoint available)
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
                <>
                    {loadingActive ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2].map(i => <div key={i} className="h-24 bg-gray-50 rounded-3xl animate-pulse"></div>)}
                        </div>
                    ) : errorActive ? (
                        <ErrorState message="Failed to load partners" onRetry={() => refetchActive()} />
                    ) : !activePartners || activePartners.length === 0 ? (
                        <EmptyState icon={Handshake} title="No active partners" description="Connect with nearby businesses to start sharing customers." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activePartners.map((partner) => (
                                <div key={partner.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center">
                                            <Store size={24} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800">{partner.businessName}</div>
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
                </>
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
                                    {nearbyPartners && nearbyPartners.length > 0 ? (
                                        nearbyPartners.slice(0, 3).map((partner, i) => {
                                            const positions = [
                                                { top: '20%', left: '30%' },
                                                { top: '60%', left: '70%' },
                                                { top: '40%', left: '10%' },
                                            ];
                                            const pos = positions[i] || { top: '50%', left: '50%' };
                                            return (
                                                <div key={partner.id} className="absolute animate-in fade-in" style={{ top: pos.top, left: pos.left }}>
                                                    <div className="bg-white p-2 rounded-xl shadow-lg flex items-center gap-2 border border-gray-100">
                                                        <div className={cn("size-6 rounded-md flex items-center justify-center text-white", i === 0 ? "bg-primary" : i === 1 ? "bg-orange-500" : "bg-emerald-500")}>
                                                            <Store size={14} />
                                                        </div>
                                                        <span className="font-bold text-xs whitespace-nowrap">{partner.name}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <>
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
                                        </>
                                    )}
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
                            {loadingNearby ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="size-10 bg-gray-100 rounded-xl"></div>
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-100 rounded w-28 mb-1"></div>
                                                <div className="h-3 bg-gray-100 rounded w-36"></div>
                                            </div>
                                        </div>
                                        <div className="h-9 bg-gray-100 rounded-xl w-full"></div>
                                    </div>
                                ))
                            ) : !nearbyPartners || nearbyPartners.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Store size={32} className="mx-auto mb-3" />
                                    <p className="text-sm font-medium">No nearby partners found</p>
                                    <p className="text-xs mt-1">Try expanding your search area.</p>
                                </div>
                            ) : (
                                nearbyPartners.map((partner) => (
                                    <div key={partner.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
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
                                ))
                            )}
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
                        <>
                            {/* TODO: Integrate with partnerships API when available */}
                            <div className="text-xs text-gray-400 bg-gray-50 rounded-2xl px-4 py-2 text-center">Partnership request management coming soon</div>
                            {incomingRequests.map(req => (
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
                            ))}
                        </>
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

                    <form className="space-y-5" onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const formData = new FormData(form);
                        
                        recommendMutation.mutate({
                            businessName: formData.get('businessName') as string,
                            ownerName: formData.get('ownerName') as string,
                            phone: formData.get('phone') as string,
                            email: formData.get('email') as string,
                            address: (formData.get('address') as string) || undefined,
                            reason: (formData.get('reason') as string) || undefined,
                        }, {
                            onSuccess: (res) => {
                                alert(res.message || 'Recommendation submitted successfully!');
                                form.reset();
                                setView('active');
                            },
                            onError: (err) => {
                                alert(err.message || 'Failed to submit recommendation');
                            },
                        });
                    }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name <span className="text-red-500">*</span></label>
                                <input required name="businessName" type="text" placeholder="e.g. Joe's Barbershop" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Owner's Name <span className="text-red-500">*</span></label>
                                <input required name="ownerName" type="text" placeholder="e.g. Joe Smith" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                                <input required name="phone" type="tel" placeholder="e.g. +234 800 000 0000" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                                <input required name="email" type="email" placeholder="joe@example.com" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Address <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <input name="address" type="text" placeholder="e.g. 123 Main Street" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Why would they be a good partner? <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <textarea name="reason" rows={3} placeholder="Tell us why..." className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
                            </div>
                        </div>
                        <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg mt-4" disabled={recommendMutation.isPending}>
                            {recommendMutation.isPending ? 'Submitting...' : 'Submit Recommendation'}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}

function CustomersTab({ branchId }: { branchId: string }) {
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading, isError, error, refetch } = useDiscoveryCustomers({ branchId, page, limit, filter });

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        setPage(1);
    };

    const filterOptions = ['all', 'from_partners', 'sent_to_partners', 'direct'];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="hidden md:flex bg-gray-100 p-1 rounded-full w-fit">
                {filterOptions.map(f => (
                    <button 
                        key={f}
                        onClick={() => handleFilterChange(f)} 
                        className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all capitalize", filter === f ? "bg-white text-gray-800 shadow-sm" : "text-gray-500")}
                    >
                        {f.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>
            <div className="md:hidden block">
                <select 
                    value={filter} 
                    onChange={e => handleFilterChange(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 capitalize focus:ring-2 focus:ring-primary outline-none"
                >
                    {filterOptions.map(f => (
                        <option key={f} value={f} className="capitalize">{f.replace(/_/g, ' ')}</option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="bg-white md:rounded-3xl border-y md:border border-gray-100 shadow-sm overflow-hidden -mx-4 md:mx-0">
                    <div className="animate-pulse p-6 space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-16 bg-gray-50 rounded-2xl"></div>
                        ))}
                    </div>
                </div>
            ) : isError ? (
                <ErrorState message={error?.message || 'Failed to load customers'} onRetry={() => refetch()} />
            ) : !data || data.data.length === 0 ? (
                <EmptyState icon={Users} title="No customers found" description="No customer visits match the current filter." />
            ) : (
                <>
                    <div className="bg-white md:rounded-3xl border-y md:border border-gray-100 shadow-sm overflow-hidden -mx-4 md:mx-0">
                        {/* Mobile Cards View */}
                        <div className="md:hidden divide-y divide-gray-200">
                            {data.data.map((row) => (
                                <div key={row.id} className="py-5 px-4 hover:bg-gray-50/50">
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
                                        <div className="text-[11px] font-semibold text-gray-400">{new Date(row.date).toLocaleDateString()}</div>
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
                                    {data.data.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
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
                                                <div className="text-sm font-medium text-gray-600">{new Date(row.date).toLocaleDateString()}</div>
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

                    {/* Pagination */}
                    {data.total > limit && (
                        <div className="flex items-center justify-between pt-4">
                            <div className="text-sm text-gray-500">
                                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total}
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-full font-bold"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Previous
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-full font-bold"
                                    disabled={page * limit >= data.total}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ResultsTab({ branchId }: { branchId: string }) {
    const [timeFilter, setTimeFilter] = useState('7days');
    const { data, isLoading, isError, error, refetch } = useDiscoveryResults(timeFilter, branchId);

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
                            onClick={() => { setTimeFilter(f.id); }} 
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

            {isLoading ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-pulse">
                                <div className="h-3 bg-gray-100 rounded w-20 mb-2"></div>
                                <div className="h-6 bg-gray-100 rounded w-16"></div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-pulse">
                        <div className="h-6 bg-gray-100 rounded w-48 mb-8"></div>
                        <div className="h-[300px] bg-gray-50 rounded-2xl"></div>
                    </div>
                </>
            ) : isError ? (
                <ErrorState message={error?.message || 'Failed to load results'} onRetry={() => refetch()} />
            ) : !data ? (
                <LoadingSpinner />
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'People Reached', value: formatCompactNumber(data.stats.peopleReached) },
                            { label: 'Interested', value: formatCompactNumber(data.stats.interested) },
                            { label: 'Visits', value: formatCompactNumber(data.stats.visits) },
                            { label: 'Redeemed', value: formatCompactNumber(data.stats.redeemed) },
                            { label: 'Revenue', value: formatCurrency(data.stats.revenue) }
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
                            {data.timeline.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                    No timeline data available for this period.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.timeline} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} />
                                        <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="views" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="visits" fill="#066CF4" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#066CF4', fontSize: 10, fontWeight: 700 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function SettingsTab({ branchId }: { branchId: string }) {
    const { data: settings, isLoading, isError, error, refetch } = useDiscoverySettings(branchId);
    const updateSettings = useUpdateDiscoverySettings();

    const handleToggle = (key: keyof UpdateDiscoverySettingsDto) => {
        if (!settings) return;
        updateSettings.mutate({ [key]: !settings[key] });
    };

    if (isLoading) {
        return (
            <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex-1">
                                <div className="h-5 bg-gray-100 rounded w-48 mb-2"></div>
                                <div className="h-4 bg-gray-100 rounded w-72"></div>
                            </div>
                            <div className="w-14 h-8 bg-gray-100 rounded-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return <ErrorState message={error?.message || 'Failed to load settings'} onRetry={() => refetch()} />;
    }

    if (!settings) return <LoadingSpinner />;

    const toggles: { key: keyof UpdateDiscoverySettingsDto; title: string; description: string }[] = [
        { key: 'joinDiscoveryNetwork', title: 'Join Discovery Network', description: 'Allow your business to be discovered by locals.' },
        { key: 'receivePartnerRequests', title: 'Receive Partner Requests', description: 'Allow other businesses to request partnerships.' },
        { key: 'allowPromotions', title: 'Allow Promotions', description: 'Show your active promotions on the network.' },
    ];

    const notifications: { key: keyof UpdateDiscoverySettingsDto; title: string }[] = [
        { key: 'pushNotifications', title: 'Push Notifications' },
        { key: 'smsAlerts', title: 'SMS Alerts' },
        { key: 'emailSummary', title: 'Email Summary' },
    ];

    return (
        <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {toggles.map(({ key, title, description }) => (
                    <div key={key} className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-gray-800 text-lg">{title}</div>
                            <div className="text-sm text-gray-500 mt-1">{description}</div>
                        </div>
                        <button
                            onClick={() => handleToggle(key)}
                            disabled={updateSettings.isPending}
                            className={cn(
                                "w-14 h-8 rounded-full relative cursor-pointer transition-colors shrink-0",
                                settings[key] ? "bg-emerald-500" : "bg-gray-300"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 size-6 bg-white rounded-full shadow-sm transition-transform",
                                settings[key] ? "right-1" : "left-1"
                            )}></div>
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 text-lg mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                    {notifications.map(({ key, title }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={settings[key] as boolean}
                                onChange={() => handleToggle(key)}
                                className="size-5 rounded border-gray-300 text-primary focus:ring-primary" 
                            />
                            <span className="font-bold text-gray-700">{title}</span>
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

function CreatePromotionFlow({ branchId, onCancel }: { branchId: string; onCancel: () => void }) {
    const [step, setStep] = useState(1);
    const [offerType, setOfferType] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [audience, setAudience] = useState('');
    const createOffer = useCreateCatalogueOffer();

    const handlePublish = () => {
        createOffer.mutate({
            name: title,
            description,
            branchId,
            itemIds: [],
            pricingType: 'sum',
            offerType: offerType.toLowerCase().replace(/\s+/g, '_'),
            audience: audience?.toLowerCase().replace(/\s+/g, '_'),
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
        }, {
            onSuccess: () => {
                alert('Promotion published successfully!');
                onCancel();
            },
            onError: (err) => {
                alert(err.message || 'Failed to create promotion');
            },
        });
    };

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
                            {[
                                { label: 'Discount', value: 'discount' },
                                { label: 'Free Item', value: 'free_item' },
                                { label: 'Special Deal', value: 'special_deal' },
                                { label: 'Free Delivery', value: 'free_delivery' },
                                { label: 'Custom Offer', value: 'custom' }
                            ].map((offer, i) => (
                                <button key={i} onClick={() => { setOfferType(offer.value); setStep(2); }} className="w-full p-6 text-left border-2 border-gray-100 rounded-2xl hover:border-primary hover:bg-blue-50 transition-all group flex items-center justify-between">
                                    <span className="font-semibold text-gray-700 group-hover:text-primary text-lg">{offer.label}</span>
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
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. 15% Lunch Discount" 
                                    className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3} 
                                    placeholder="Describe your offer..." 
                                    className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-medium focus:ring-2 focus:ring-primary resize-none outline-none"
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                    <input 
                                        type="date" 
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" 
                                    />
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
                            <Button onClick={() => setStep(3)} disabled={!title} className="rounded-full px-8 font-bold">Next</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-gray-800 text-center mb-8">Show this promotion to:</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { label: 'Nearby Customers', value: 'nearby_customers' },
                                { label: 'Nearby Businesses', value: 'nearby_businesses' },
                                { label: 'Everyone Nearby', value: 'everyone_nearby' }
                            ].map((item, i) => (
                                <button key={i} onClick={() => { setAudience(item.value); setStep(4); }} className="w-full p-6 text-left border-2 border-gray-100 rounded-2xl hover:border-primary hover:bg-blue-50 transition-all group flex items-center justify-between">
                                    <span className="font-semibold text-gray-700 group-hover:text-primary text-lg">{item.label}</span>
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
                                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                                    {offerType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </div>
                                <h4 className="text-xl font-semibold text-gray-800 mb-2">{title || 'Your Promotion Title'}</h4>
                                <p className="text-sm text-gray-500 mb-6">{description || 'Promotion description goes here.'}</p>
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
                        <Button 
                            onClick={handlePublish} 
                            className="rounded-full px-12 py-6 text-lg font-bold bg-primary hover:bg-primary/90"
                            disabled={createOffer.isPending}
                        >
                            {createOffer.isPending ? 'Publishing...' : 'Publish Promotion'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
