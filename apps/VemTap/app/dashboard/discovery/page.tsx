'use client';

import React, { useState, useRef } from 'react';
import { 
    Activity, Users, MapPin, Store, Tag, Plus, Target, CheckCircle2, ArrowRight,
    Settings, Search, Handshake, TrendingUp, RefreshCw, X, Image as ImageIcon,
    ChevronRight, CreditCard, Heart, Eye, AlertCircle, Loader2, Navigation, Crosshair,
    Trash2, Clock, Sparkles
} from 'lucide-react';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useActiveBranch } from '@/hooks/useActiveBranch';

const NearbyMap = dynamic(() => import('@/components/dashboard/discovery/NearbyMap'), { ssr: false });
const LocationSetupModal = dynamic(() => import('@/components/dashboard/branches/LocationSetupModal'), { ssr: false });
const DeliveryRadiusMap = dynamic(() => import('@/components/dashboard/discovery/DeliveryRadiusMap'), { ssr: false });
import { uploadToCloudinary } from '@/lib/cloudinary';
import { 
    useDiscoveryOverview,
    useDiscoveryResults,
    useDiscoverySettings,
    useUpdateDiscoverySettings,
    useActivePartners,
    useNearbyPartners,
    useDiscoveryCustomers,
    useRecommendBusiness,
    usePartnershipInvitations,
    useInvitePartner,
    useRespondToInvitation,
} from '@/services/discovery/hooks';
import { useCatalogueOffersAdmin, useUpdateCatalogueOffer, useDeleteCatalogueOffer, useCreateCatalogueOffer, useCatalogueItems } from '@/services/catalogue/hooks';
import { useGenerateDealTerms } from '@/services/deals/hooks';
import type { CatalogueOffer } from '@/services/catalogue/hooks';
import type { DiscoveryCustomer, ActivePartner, NearbyPartner, UpdateDiscoverySettingsDto } from '@/services/discovery/types';
import { useUpdateBranch, useBranches } from '@/services/branches/hooks';
import { getBrowserLocation } from '@/lib/geolocation';

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
        <div className="relative p-4 md:p-8 pb-32 max-w-7xl mx-auto font-sans">
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
                            { id: 'promotions', label: 'Deals' },
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
                    <span className="font-bold text-lg">Create Deal</span>
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
                            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Best Deal</div>
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

    const isExpired = (promo: CatalogueOffer) => {
        if (!promo.endDate) return false;
        return new Date(promo.endDate) < new Date();
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
        return <ErrorState message={error?.message || 'Failed to load deals'} onRetry={() => refetch()} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">My Deals</h3>
                <Button onClick={onCreatePromo} className="rounded-full font-bold gap-2">
                    <Plus size={16} /> Create Deal
                </Button>
            </div>

            {!promotions || promotions.length === 0 ? (
                <EmptyState icon={Tag} title="Your first deal is ready to launch" description="Create a deal to attract new customers and bring them back again." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {promotions.map((promo) => {
                        const expired = isExpired(promo);
                        return (
                        <div key={promo.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
                            {expired && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-2xl">
                                    Expired
                                </div>
                            )}
                            {promo.status === 'inactive' && !expired && (
                                <div className="absolute top-0 right-0 bg-gray-400 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-2xl">
                                    Paused
                                </div>
                            )}
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-lg text-gray-800">{promo.name}</h4>
                                <span className={cn("px-3 py-1 rounded-full text-xs font-bold", promo.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600")}>
                                    {promo.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-2xl">
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

                            {(promo as any).quantity != null && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-gray-600">Remaining claims</span>
                                        <span className="font-bold text-blue-600">{Math.max(0, ((promo as any).quantity || 0) - ((promo as any).claimedCount || 0))} / {(promo as any).quantity}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 rounded-xl font-bold" disabled>Edit</Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 rounded-xl font-bold"
                                    onClick={() => handleToggleStatus(promo)}
                                    disabled={updateOffer.isPending || expired}
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
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PartnersTab({ branchId }: { branchId: string }) {
    const [view, setView] = useState<'active' | 'find' | 'recommend' | 'incoming'>('active');
    const [connected, setConnected] = useState<string[]>([]);
    
    const { data: activePartners, isLoading: loadingActive, isError: errorActive, refetch: refetchActive } = useActivePartners(branchId);
    const [radius, setRadius] = useState(500);
    const { data: nearbyPartners, isLoading: loadingNearby, isError: nearbyError, error: nearbyErrorObj, refetch: refetchNearby } = useNearbyPartners(branchId, radius);
    const nearbyPartnersList = nearbyPartners?.data || [];
    const recommendMutation = useRecommendBusiness();
    const updateBranchMutation = useUpdateBranch();
    const { data: branches = [] } = useBranches();

    // Browser live location for accurate map pin (continuous GPS watch)
    const [liveLocation, setLiveLocation] = React.useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = React.useState<string | null>(null);
    const [gpsLoading, setGpsLoading] = React.useState(false);
    const watchIdRef = React.useRef<number | null>(null);

    const startGpsWatch = React.useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported');
            return;
        }
        setGpsLoading(true);
        setLocationError(null);
        // Clear any existing watch
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                setLiveLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGpsLoading(false);
                setLocationError(null);
            },
            (err) => {
                const msg = err.code === err.PERMISSION_DENIED
                    ? 'Location permission denied. Enable GPS in your browser settings.'
                    : err.code === err.TIMEOUT
                        ? 'GPS timeout. Try again in an open area.'
                        : 'Could not get GPS location.';
                setLocationError(msg);
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    }, []);

    // Start GPS when "Find Partners" tab opens; stop on unmount or when leaving tab
    React.useEffect(() => {
        if (view !== 'find') return;
        startGpsWatch();
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [view, startGpsWatch]);

    // Fallback to stored branch coordinates if browser location unavailable
    const currentBranch = React.useMemo(() => {
        return branches.find((b: any) => b.id === branchId);
    }, [branches, branchId]);

    const branchLocation = React.useMemo(() => {
        if (liveLocation) return liveLocation;
        if (currentBranch?.latitude && currentBranch?.longitude) {
            return { lat: Number(currentBranch.latitude), lng: Number(currentBranch.longitude) };
        }
        return undefined;
    }, [liveLocation, currentBranch]);

    React.useEffect(() => {
        if (currentBranch) {
            console.log('📌 Branch DB coordinates:', { lat: currentBranch.latitude, lng: currentBranch.longitude, name: currentBranch.name, id: currentBranch.id });
        }
        if (branchLocation) {
            console.log('📍 Resolved map location (used for map):', branchLocation);
            console.log('🔗 https://www.google.com/maps?q=' + branchLocation.lat + ',' + branchLocation.lng);
        }
    }, [currentBranch, branchLocation]);

    // Detect "no location coordinates" error
    const isNoLocationError = nearbyError && 
        nearbyErrorObj?.message === 'Source branch has no location coordinates';
    const [isSettingLocation, setIsSettingLocation] = useState(false);
    const [showLocationSetup, setShowLocationSetup] = useState(false);
    const [locationMessage, setLocationMessage] = useState('');

    const handleLocationYes = async () => {
        setIsSettingLocation(true);
        setLocationMessage('Getting your current location...');
        try {
            const pos = await getBrowserLocation();
            await updateBranchMutation.mutateAsync({
                id: branchId,
                updates: { latitude: pos.lat, longitude: pos.lng },
            });
            setLocationMessage('Location found!');
            setTimeout(() => {
                setIsSettingLocation(false);
                setLocationMessage('');
                refetchNearby();
            }, 1000);
        } catch (err: any) {
            setLocationMessage(err.message || 'Could not get your location');
            setTimeout(() => {
                setIsSettingLocation(false);
                setLocationMessage('');
            }, 2000);
        }
    };

    // Partnership invitations (received, pending)
    const { data: invitationsData, isLoading: loadingInvitations, refetch: refetchInvitations } = usePartnershipInvitations({ branchId, type: 'received', status: 'Pending' });
    const inviteMutation = useInvitePartner();
    const respondMutation = useRespondToInvitation();

    // Connect Prompt State
    const [connectingTo, setConnectingTo] = useState<{ id: string; name: string } | null>(null);
    const [connectReason, setConnectReason] = useState('');

    // Incoming Requests State
    const [handlingRequest, setHandlingRequest] = useState<{id: string, partnershipId: string, action: 'accept'|'reject'} | null>(null);
    const [handleReason, setHandleReason] = useState('');

    const handleConnectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (connectingTo) {
            try {
                await inviteMutation.mutateAsync({
                    initiatorBranchId: branchId,
                    recipientBranchId: connectingTo.id,
                });
                setConnected(prev => [...prev, connectingTo.id]);
                setConnectingTo(null);
                setConnectReason('');
            } catch (error: any) {
                alert(error?.message || 'Failed to send partnership request');
            }
        }
    };

    const handleIncomingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (handlingRequest) {
            try {
                await respondMutation.mutateAsync({
                    id: handlingRequest.partnershipId,
                    status: handlingRequest.action === 'accept' ? 'Accepted' : 'Declined',
                });
                setHandlingRequest(null);
                setHandleReason('');
                refetchInvitations();
            } catch (error: any) {
                alert(error?.message || 'Failed to respond to partnership request');
            }
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
                        {(invitationsData?.data?.length ?? 0) > 0 && <span className="absolute top-1 right-2 size-2 bg-red-500 rounded-full"></span>}
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
                        <EmptyState icon={Handshake} title="Grow together with nearby businesses" description="Partner with other businesses to share customers and grow your reach." />
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
                    {/* Location Required Banner */}
                    {isNoLocationError && !isSettingLocation && (
                        <div className="bg-amber-50 rounded-3xl p-8 border border-amber-200 text-center space-y-6">
                            <div className="size-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                                <MapPin size={36} className="text-amber-600" />
                            </div>
                            <div className="space-y-2 max-w-md mx-auto">
                                <h3 className="font-bold text-xl text-amber-900">Set Up Your Location</h3>
                                <p className="text-amber-700 text-sm font-medium">
                                    We need your branch's location to find nearby partners. Are you currently at this location?
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                                <Button
                                    onClick={handleLocationYes}
                                    className="flex-1 rounded-xl font-bold h-12 bg-amber-800 text-white hover:bg-amber-900 shadow-lg shadow-amber-200"
                                >
                                    <Navigation size={16} className="mr-2" />
                                    Yes, Find My Location
                                </Button>
                                <Button
                                    onClick={() => setShowLocationSetup(true)}
                                    variant="outline"
                                    className="flex-1 rounded-xl font-bold h-12 border-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                                >
                                    <Crosshair size={16} className="mr-2" />
                                    No, Set Up Manually
                                </Button>
                            </div>
                            <p className="text-[10px] font-medium text-amber-500">
                                Your device's location will only be used once and is not stored.
                            </p>
                        </div>
                    )}

                    {/* Location Loading State */}
                    {isSettingLocation && (
                        <div className="bg-blue-50 rounded-3xl p-12 border border-blue-100 text-center space-y-5">
                            <div className="size-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <Loader2 size={36} className="text-blue-600 animate-spin" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-lg text-blue-900">{locationMessage}</p>
                                {locationMessage === 'Getting your current location...' && (
                                    <p className="text-sm text-blue-700 font-medium">
                                        Please allow location access when prompted by your browser
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {!isNoLocationError && !isSettingLocation && (<>
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
                        <div className="lg:col-span-2 relative overflow-hidden min-h-[400px]">
                            <NearbyMap
                                partners={nearbyPartnersList}
                                center={branchLocation}
                                radius={radius}
                                onSelectPartner={(partner) => setConnectingTo({ id: partner.id, name: partner.name })}
                            />

                            {/* Connecting Overlay Modal */}
                            {connectingTo && (
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Request Partnership</h3>
                                    <p className="text-sm text-gray-600 mb-6">Why do you want to partner with <strong>{connectingTo.name}</strong>?</p>
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
                                            <Button type="submit" disabled={inviteMutation.isPending} className="flex-1 rounded-xl font-bold bg-primary text-white">
                                                {inviteMutation.isPending ? 'Sending...' : 'Send Request'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* List Area */}
                        <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                            {/* Radius Control */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Search radius</span>
                                    <span className="text-sm font-bold text-primary">{radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}</span>
                                </div>
                                <input
                                    type="range"
                                    min={100}
                                    max={10000}
                                    step={100}
                                    value={radius}
                                    onChange={e => setRadius(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-1">
                                    <span>100m</span>
                                    <span>10km</span>
                                </div>
                            </div>

                            {/* GPS Status */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    {gpsLoading ? (
                                        <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />
                                    ) : liveLocation ? (
                                        <span className="size-2.5 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-200" />
                                    ) : (
                                        <span className="size-2.5 rounded-full bg-red-400 shrink-0" />
                                    )}
                                    <span className="text-[10px] font-bold text-gray-500 truncate">
                                        {gpsLoading ? 'Getting GPS...' : locationError ? locationError : liveLocation ? `${liveLocation.lat.toFixed(6)}, ${liveLocation.lng.toFixed(6)}` : 'No GPS signal'}
                                    </span>
                                </div>
                                <button
                                    onClick={startGpsWatch}
                                    className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline shrink-0 ml-2"
                                >
                                    Refresh
                                </button>
                            </div>
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
                            ) : !nearbyPartnersList || nearbyPartnersList.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Store size={32} className="mx-auto mb-3" />
                                    <p className="text-sm font-medium">No nearby partners found</p>
                                    <p className="text-xs mt-1">Try expanding your search area.</p>
                                </div>
                            ) : (
                                nearbyPartnersList.map((partner) => (
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
                                        {connected.includes(partner.id) ? (
                                            <Button disabled className="w-full rounded-xl font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-0 h-9">
                                                <CheckCircle2 size={16} className="mr-2" /> Request Sent
                                            </Button>
                                        ) : (
                                            <Button onClick={() => setConnectingTo({ id: partner.id, name: partner.name })} className="w-full rounded-xl font-bold h-9 bg-gray-900 text-white hover:bg-gray-800">
                                                Connect
                                            </Button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    </>
                    )}
                </div>
            )}

            {view === 'incoming' && (
                <div className="max-w-2xl mx-auto space-y-6">
                    {loadingInvitations ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-pulse">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="size-12 bg-gray-100 rounded-2xl"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-100 rounded w-32 mb-2"></div>
                                            <div className="h-3 bg-gray-100 rounded w-48"></div>
                                        </div>
                                    </div>
                                    <div className="h-16 bg-gray-50 rounded-2xl mb-4"></div>
                                    <div className="flex gap-3">
                                        <div className="h-10 bg-gray-100 rounded-xl flex-1"></div>
                                        <div className="h-10 bg-gray-100 rounded-xl flex-1"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !invitationsData?.data || invitationsData.data.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                            <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Handshake size={32} />
                            </div>
                            <h3 className="font-semibold text-gray-800 text-lg mb-2">No pending requests</h3>
                            <p className="text-gray-500 text-sm">You've responded to all partnership requests.</p>
                        </div>
                    ) : (
                        invitationsData.data.map(partnership => {
                            const partner = partnership.initiatorBranch;
                            const partnerName = partner?.business?.name || partner?.name || 'Unknown Business';
                            const partnerType = partner?.business?.category || 'Business';

                            return (
                                <div key={partnership.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                    {handlingRequest?.partnershipId === partnership.id ? (
                                        <form onSubmit={handleIncomingSubmit} className="animate-in fade-in">
                                            <h4 className="font-semibold text-gray-800 mb-2">
                                                {handlingRequest.action === 'accept' ? 'Accepting' : 'Rejecting'} Partnership with {partnerName}
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
                                                <Button type="submit" disabled={respondMutation.isPending} className={cn("flex-1 rounded-xl font-bold text-white", handlingRequest.action === 'accept' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
                                                    {respondMutation.isPending ? 'Processing...' : `Confirm ${handlingRequest.action === 'accept' ? 'Acceptance' : 'Rejection'}`}
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
                                                    <div className="font-semibold text-gray-800">{partnerName}</div>
                                                    <div className="text-sm text-gray-500">{partnerType}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button 
                                                    onClick={() => setHandlingRequest({ id: partnership.id, partnershipId: partnership.id, action: 'accept' })} 
                                                    className="flex-1 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800"
                                                >
                                                    Accept Request
                                                </Button>
                                                <Button 
                                                    onClick={() => setHandlingRequest({ id: partnership.id, partnershipId: partnership.id, action: 'reject' })} 
                                                    variant="outline" 
                                                    className="flex-1 rounded-xl font-bold border-red-200 text-red-600 hover:bg-red-50"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })
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

            <LocationSetupModal
                isOpen={showLocationSetup}
                onClose={() => setShowLocationSetup(false)}
                addressHint=""
                onLocationSet={async (lat, lng) => {
                    try {
                        await updateBranchMutation.mutateAsync({
                            id: branchId,
                            updates: { latitude: lat, longitude: lng },
                        });
                        setShowLocationSetup(false);
                        refetchNearby();
                    } catch {}
                }}
            />
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
                <EmptyState icon={Users} title="Your next customer is out there" description="Adjust your filters to find customers who have visited your business." />
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
                            <strong>What does this mean?</strong> This chart shows how many people <em>saw</em> your deals (the light gray bars) compared to how many actually <em>visited</em> your store (the blue bars). A taller blue bar means your deals are working well and driving real foot traffic!
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
        { key: 'allowPromotions', title: 'Allow Deals', description: 'Show your active deals on the network.' },
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
// CREATE DEAL FLOW (5 Steps)
// ==========================================

function CreatePromotionFlow({ branchId, onCancel }: { branchId: string; onCancel: () => void }) {
    const [step, setStep] = useState(1);
    const [offerType, setOfferType] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [audience, setAudience] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const startTimeRef = useRef<HTMLInputElement>(null);
    const endTimeRef = useRef<HTMLInputElement>(null);
    const createOffer = useCreateCatalogueOffer();
    const { data: catalogueItems = [] } = useCatalogueItems({ branchId }, { enabled: !!branchId });

    // Type-specific fields
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
    const [dealPrice, setDealPrice] = useState('');
    const [freeItemName, setFreeItemName] = useState('');
    const [freeItemValue, setFreeItemValue] = useState('');
    const [minOrderAmount, setMinOrderAmount] = useState('');

    // Advanced settings
    const [dealQuantity, setDealQuantity] = useState('');
    const [audienceTarget, setAudienceTarget] = useState<'all' | 'new_customers' | 'returning_customers'>('all');
    const [maxClaimsPerCustomer, setMaxClaimsPerCustomer] = useState('1');
    const [claimCodePrefix, setClaimCodePrefix] = useState('');
    const DEFAULT_TERMS = [
        'Valid during business hours',
        'Cannot be combined with other offers',
        'Valid for 7 days after claiming',
    ];
    const [dealTerms, setDealTerms] = useState<string[]>(DEFAULT_TERMS);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const generateTerms = useGenerateDealTerms();

    React.useEffect(() => {
        if (generateTerms.data?.terms) {
            setDealTerms(generateTerms.data.terms);
        }
    }, [generateTerms.data]);

    // Delivery Scope (free_delivery)
    const [deliveryScope, setDeliveryScope] = useState<'same_area' | 'city_wide' | 'state_wide' | 'nation_wide' | 'custom_distance'>('same_area');
    const [deliveryRegion, setDeliveryRegion] = useState('');
    const [deliveryRadius, setDeliveryRadius] = useState(10);
    const [deliveryUnit, setDeliveryUnit] = useState<'km' | 'mi'>('km');

    // Branch lookup for delivery scope auto-fill
    const { data: branches = [] } = useBranches();
    const currentBranch = React.useMemo(
        () => branches.find((b: any) => b.id === branchId),
        [branches, branchId]
    );

    // Auto-fill delivery region based on scope and branch data
    React.useEffect(() => {
        if (!currentBranch) return;
        switch (deliveryScope) {
            case 'same_area':
                setDeliveryRegion(currentBranch.address || currentBranch.city || '');
                break;
            case 'city_wide':
                setDeliveryRegion(currentBranch.city || '');
                break;
            case 'state_wide':
                setDeliveryRegion(currentBranch.state || '');
                break;
            case 'nation_wide':
                setDeliveryRegion('Nigeria');
                break;
        }
    }, [deliveryScope, currentBranch]);

    // Auto-close time pickers on native change commit
    React.useEffect(() => {
        const start = startTimeRef.current;
        const end = endTimeRef.current;
        const onStartChange = () => start?.blur();
        const onEndChange = () => end?.blur();
        start?.addEventListener('change', onStartChange);
        end?.addEventListener('change', onEndChange);
        return () => {
            start?.removeEventListener('change', onStartChange);
            end?.removeEventListener('change', onEndChange);
        };
    }, []);

    // Special/Bundle Deal sub-type
    const [specialDealType, setSpecialDealType] = useState<'bundle' | 'custom'>('bundle');

    // Common product selection for all deal types
    const [productSource, setProductSource] = useState<'all' | 'select' | 'custom'>('all');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState('');

    const resetTypeFields = () => {
        setDiscountType('percentage');
        setDiscountValue('');
        setOriginalPrice('');
        setDealPrice('');
        setFreeItemName('');
        setFreeItemValue('');
        setMinOrderAmount('');
        setSpecialDealType('bundle');
        setProductSource('all');
        setSelectedProductIds([]);
        setProductSearch('');
        setDealQuantity('');
        setAudienceTarget('all');
        setMaxClaimsPerCustomer('1');
        setClaimCodePrefix('');
        setDealTerms(DEFAULT_TERMS);
    };

    const filteredCatalogueItems = catalogueItems.filter((item: any) =>
        item.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    const toggleSelectedProduct = (itemId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const selectedItemsTotal = catalogueItems
        .filter((item: any) => selectedProductIds.includes(item.id))
        .reduce((sum: number, item: any) => sum + (item.price || 0), 0);

    const resolvedItemIds = productSource === 'all'
        ? catalogueItems.map((item: any) => item.id)
        : productSource === 'select' ? selectedProductIds : [];
    
    const resolvedItemCount = productSource === 'all'
        ? catalogueItems.length
        : productSource === 'select' ? selectedProductIds.length : 0;

    const handlePublish = () => {
        const payload: any = {
            name: title,
            description,
            mainImage: imageUrl || undefined,
            branchId,
            itemIds: resolvedItemIds,
            offerType: offerType.toLowerCase().replace(/\s+/g, '_'),
            audience: audience?.toLowerCase().replace(/\s+/g, '_'),
            startDate: startDate ? new Date(`${startDate}T${startTime || '00:00'}`).toISOString() : undefined,
            endDate: endDate ? new Date(`${endDate}T${endTime || '23:59'}`).toISOString() : undefined,
            quantity: dealQuantity ? Number(dealQuantity) : undefined,
            maxClaimsPerCustomer: maxClaimsPerCustomer ? Number(maxClaimsPerCustomer) : undefined,
            audienceTarget: audienceTarget,
            claimCodePrefix: claimCodePrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || undefined,
            terms: dealTerms.length > 0 ? dealTerms : undefined,
        };

        switch (offerType) {
            case 'discount':
                payload.pricingType = discountType === 'percentage' ? 'percentage_discount' : 'fixed_discount_price';
                payload.discountValue = Number(discountValue) || 0;
                break;
            case 'free_item':
                payload.pricingType = 'sum';
                payload.discountValue = Number(freeItemValue) || 0;
                if (freeItemName) payload.description = `${freeItemName} - ${description}`.trim();
                break;
            case 'special_deal':
                if (specialDealType === 'bundle') {
                    payload.pricingType = 'fixed_discount_price';
                    payload.discountValue = (selectedItemsTotal - Number(dealPrice)) || 0;
                    payload.fixedPrice = Number(dealPrice) || 0;
                } else {
                    payload.pricingType = 'fixed_discount_price';
                    payload.discountValue = (Number(originalPrice) - Number(dealPrice)) || 0;
                    payload.fixedPrice = Number(dealPrice) || 0;
                }
                break;
            case 'free_delivery':
                payload.pricingType = 'sum';
                if (minOrderAmount) payload.description = `Free delivery on orders above ₦${Number(minOrderAmount).toLocaleString()}. ${description}`.trim();
                payload.deliveryScope = deliveryScope;
                if (deliveryScope === 'custom_distance') {
                    payload.deliveryRadius = deliveryRadius;
                    payload.deliveryUnit = deliveryUnit;
                } else {
                    payload.deliveryRegion = deliveryRegion;
                }
                break;
            default:
                payload.pricingType = 'sum';
        }

        createOffer.mutate(payload, {
            onSuccess: () => {
                alert('Deal published successfully!');
                onCancel();
            },
            onError: (err) => {
                alert(err.message || 'Failed to create deal');
            },
        });
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            setImageUrl(url);
        } catch {
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setImageUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 min-h-[600px] animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Create Deal</h2>
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
                                { label: 'Discount', value: 'discount', description: 'Offer a percentage or fixed amount off your products' },
                                { label: 'Free Item', value: 'free_item', description: 'Give away a free item with purchase to attract new customers' },
                                { label: 'Special Deal', value: 'special_deal', description: 'Set an original price and a discounted deal price' },
                                { label: 'Free Delivery', value: 'free_delivery', description: 'Offer free delivery on orders above a minimum amount' },
                                { label: 'Custom Offer', value: 'custom', description: 'Create a custom offer with your own terms' }
                            ].map((offer, i) => (
                                <button key={i} onClick={() => { setOfferType(offer.value); setStep(2); }} className="w-full p-6 text-left border-2 border-gray-100 rounded-2xl hover:border-primary hover:bg-blue-50 transition-all group flex items-center justify-between">
                                    <div>
                                        <span className="font-semibold text-gray-700 group-hover:text-primary text-lg">{offer.label}</span>
                                        <p className="text-sm text-gray-400 mt-1">{offer.description}</p>
                                    </div>
                                    <ChevronRight className="text-gray-300 group-hover:text-primary shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6">Deal Details</h3>
                        <div className="space-y-4">
                            <div className="mb-2">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
                                    {offerType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </span>
                            </div>

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

                            {/* Product Source — common for all deal types */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Products Included</label>
                                <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                                    {[
                                        { label: 'All Products', value: 'all' as const },
                                        { label: 'Select Products', value: 'select' as const },
                                        { label: 'Custom', value: 'custom' as const }
                                    ].map(opt => (
                                        <button key={opt.value} type="button" onClick={() => setProductSource(opt.value)}
                                            className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", productSource === opt.value ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-800")}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                {productSource === 'all' && catalogueItems.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-1.5 font-medium">Applied to all {catalogueItems.length} catalogue item{catalogueItems.length !== 1 ? 's' : ''}</p>
                                )}
                                {productSource === 'custom' && (
                                    <p className="text-xs text-gray-400 mt-1.5 font-medium">Not linked to any catalogue product</p>
                                )}
                            </div>

                            {productSource === 'select' && (
                                <div>
                                    <div className="relative mb-3">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search your catalogue..." className="w-full p-3 pl-10 bg-gray-50 border-0 rounded-2xl font-medium focus:ring-2 focus:ring-primary outline-none text-sm" />
                                    </div>

                                    {catalogueItems.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">No catalogue items found. Add products to your catalogue first.</p>
                                    ) : filteredCatalogueItems.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-4">No items match your search.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {filteredCatalogueItems.map((item: any) => (
                                                <div key={item.id} onClick={() => toggleSelectedProduct(item.id)}
                                                    className={cn("flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all", selectedProductIds.includes(item.id) ? "border-primary bg-blue-50" : "border-gray-100 hover:border-gray-200")}>
                                                    <div className={cn("size-5 rounded-full border-2 flex items-center justify-center shrink-0", selectedProductIds.includes(item.id) ? "border-primary bg-primary text-white" : "border-gray-300")}>
                                                        {selectedProductIds.includes(item.id) && <CheckCircle2 size={12} />}
                                                    </div>
                                                    {item.mainImage && <img src={item.mainImage} alt={item.name} className="size-10 rounded-lg object-cover" />}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm text-gray-800 truncate">{item.name}</div>
                                                        <div className="text-xs text-gray-400">₦{Number(item.price).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedProductIds.length > 0 && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="flex justify-between text-sm font-semibold">
                                                <span className="text-gray-600">{selectedProductIds.length} product{selectedProductIds.length > 1 ? 's' : ''} selected</span>
                                                <span className="text-primary">Total: ₦{selectedItemsTotal.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {offerType === 'discount' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Type</label>
                                        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                                            {(['percentage', 'fixed'] as const).map(t => (
                                                <button key={t} type="button" onClick={() => setDiscountType(t)}
                                                    className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", discountType === t ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-800")}>
                                                    {t === 'percentage' ? 'Percentage %' : 'Fixed Amount ₦'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Discount {discountType === 'percentage' ? 'Percentage' : 'Amount'} *</label>
                                        <div className="relative">
                                            <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === 'percentage' ? 'e.g. 15' : 'e.g. 2000'} className="w-full p-4 pl-10 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{discountType === 'percentage' ? '%' : '₦'}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {offerType === 'free_item' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Free Item Name *</label>
                                        <input type="text" value={freeItemName} onChange={e => setFreeItemName(e.target.value)} placeholder="e.g. Small Chips" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Item Value (₦) *</label>
                                        <input type="number" value={freeItemValue} onChange={e => setFreeItemValue(e.target.value)} placeholder="e.g. 1500" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                        <p className="text-xs text-gray-400 mt-1.5 font-medium">The price the customer would normally pay for this item</p>
                                    </div>
                                </>
                            )}

                            {offerType === 'special_deal' && (
                                <>
                                    <div className="mb-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Deal Type</label>
                                        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                                            {(['bundle', 'custom'] as const).map(t => (
                                                <button key={t} type="button" onClick={() => setSpecialDealType(t)}
                                                    className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", specialDealType === t ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-800")}>
                                                    {t === 'bundle' ? 'Bundle Deal' : 'Custom Deal'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {specialDealType === 'bundle' && (
                                        <div>
                                            {resolvedItemCount > 0 && (
                                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                                                    <div className="flex justify-between text-sm font-semibold">
                                                        <span className="text-gray-600">{resolvedItemCount} product{resolvedItemCount > 1 ? 's' : ''}</span>
                                                        <span className="text-primary">Total: ₦{selectedItemsTotal.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bundle Deal Price (₦) *</label>
                                                <input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} placeholder="e.g. 3500" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                                {selectedItemsTotal > 0 && dealPrice && (
                                                    <p className="text-xs text-emerald-600 font-medium mt-1.5">Customers save ₦{(selectedItemsTotal - Number(dealPrice)).toLocaleString()}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {specialDealType === 'custom' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Original Price (₦) *</label>
                                                <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="e.g. 5000" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Price (₦) *</label>
                                                <input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} placeholder="e.g. 3500" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                                {originalPrice && dealPrice && (
                                                    <p className="text-xs text-emerald-600 font-medium mt-1.5">Customers save ₦{(Number(originalPrice) - Number(dealPrice)).toLocaleString()}</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {offerType === 'free_delivery' && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Order Amount (₦)</label>
                                        <input type="number" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} placeholder="e.g. 3000 (leave empty for no minimum)" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                        <p className="text-xs text-gray-400 mt-1.5 font-medium">Orders above this amount qualify for free delivery</p>
                                    </div>

                                    {/* Delivery Scope */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Delivery Scope</label>

                                        {/* Segmented Control */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-gray-100 rounded-2xl">
                                            {[
                                                { key: 'same_area', label: 'Same Area', distance: '~2 km' },
                                                { key: 'city_wide', label: 'City Wide', distance: '~15 km' },
                                                { key: 'state_wide', label: 'State Wide', distance: '~50 km' },
                                                { key: 'custom_distance', label: 'Custom', distance: '' },
                                            ].map(({ key, label, distance }) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setDeliveryScope(key as typeof deliveryScope)}
                                                    className={cn(
                                                        'px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200',
                                                        deliveryScope === key
                                                            ? 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    )}
                                                >
                                                    <div className="leading-tight">{label}</div>
                                                    {distance && <div className="text-[10px] font-medium text-gray-400">{distance}</div>}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Nation Wide quick button */}
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryScope('nation_wide')}
                                            className={cn(
                                                'mt-2 w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 border',
                                                deliveryScope === 'nation_wide'
                                                    ? 'bg-white text-gray-900 shadow-sm border-primary'
                                                    : 'bg-gray-50 text-gray-500 hover:text-gray-700 border-gray-100'
                                            )}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <span>🌍</span>
                                                <span>Nation Wide — covers all of Nigeria</span>
                                            </div>
                                        </button>

                                        {/* View A: Region + distance summary for preset scopes */}
                                        {(deliveryScope === 'same_area' || deliveryScope === 'city_wide' || deliveryScope === 'state_wide' || deliveryScope === 'nation_wide') && (
                                            <div className="mt-4 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Region</label>
                                                    <input
                                                        type="text"
                                                        value={deliveryRegion}
                                                        onChange={e => setDeliveryRegion(e.target.value)}
                                                        placeholder="Auto-filled from your business address"
                                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                                    />
                                                </div>

                                                {/* Distance coverage card */}
                                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-gray-500">Coverage Distance</span>
                                                        <span className="text-sm font-black text-primary">
                                                            {deliveryScope === 'same_area' && '~2 km from your branch'}
                                                            {deliveryScope === 'city_wide' && '~15 km from your branch'}
                                                            {deliveryScope === 'state_wide' && '~50 km from your branch'}
                                                            {deliveryScope === 'nation_wide' && 'Entire country (Nigeria)'}
                                                        </span>
                                                    </div>
                                                    {deliveryScope !== 'nation_wide' && currentBranch?.latitude && currentBranch?.longitude && (
                                                        <div className="overflow-hidden rounded-xl border border-gray-100">
                                                            <DeliveryRadiusMap
                                                                center={{ lat: Number(currentBranch.latitude), lng: Number(currentBranch.longitude) }}
                                                                radiusMeters={
                                                                    deliveryScope === 'same_area' ? 2000 :
                                                                    deliveryScope === 'city_wide' ? 15000 :
                                                                    deliveryScope === 'state_wide' ? 50000 : 0
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-xs text-gray-400 font-medium">
                                                    {deliveryScope === 'same_area' && 'Deliveries within your immediate neighborhood — walking distance from your branch'}
                                                    {deliveryScope === 'city_wide' && 'Deliveries across your entire city — a wider reach than just your immediate area'}
                                                    {deliveryScope === 'state_wide' && 'Deliveries across your entire state — maximum regional coverage'}
                                                    {deliveryScope === 'nation_wide' && 'Deliveries anywhere in Nigeria — the broadest possible coverage'}
                                                </p>
                                            </div>
                                        )}

                                        {/* View B: Custom Distance with slider and map */}
                                        {deliveryScope === 'custom_distance' && (
                                            <div className="mt-4 space-y-4">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Delivery Radius</label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="50"
                                                        value={deliveryRadius}
                                                        onChange={e => setDeliveryRadius(Number(e.target.value))}
                                                        className="flex-1 accent-primary h-2"
                                                    />
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <input
                                                            type="number"
                                                            value={deliveryRadius}
                                                            onChange={e => setDeliveryRadius(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                                                            min="1"
                                                            max="50"
                                                            className="w-20 p-3 bg-gray-50 border-0 rounded-xl font-bold text-center focus:ring-2 focus:ring-primary outline-none"
                                                        />
                                                        <select
                                                            value={deliveryUnit}
                                                            onChange={e => setDeliveryUnit(e.target.value as 'km' | 'mi')}
                                                            className="p-3 bg-gray-50 border-0 rounded-xl font-semibold text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                                                        >
                                                            <option value="km">km</option>
                                                            <option value="mi">mi</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Map preview */}
                                                {currentBranch?.latitude && currentBranch?.longitude && (
                                                    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                                                        <DeliveryRadiusMap
                                                            center={{ lat: Number(currentBranch.latitude), lng: Number(currentBranch.longitude) }}
                                                            radiusMeters={deliveryUnit === 'km' ? deliveryRadius * 1000 : deliveryRadius * 1609.34}
                                                        />
                                                    </div>
                                                )}
                                                {(!currentBranch?.latitude || !currentBranch?.longitude) && (
                                                    <div className="mt-4 h-[300px] rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                                                        Set your branch location in settings to see the map preview
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Dynamic Summary */}
                                        <p className="text-sm text-gray-500 font-medium mt-4">
                                            {deliveryScope === 'same_area' && deliveryRegion && `Your deal will be visible to users within ~2 km of your branch in ${deliveryRegion}.`}
                                            {deliveryScope === 'city_wide' && deliveryRegion && `Your deal will be visible to users within ~15 km across ${deliveryRegion}.`}
                                            {deliveryScope === 'state_wide' && deliveryRegion && `Your deal will be visible to users within ~50 km across ${deliveryRegion} State.`}
                                            {deliveryScope === 'nation_wide' && `Your deal will be visible to users across the entire country (Nigeria).`}
                                            {deliveryScope === 'custom_distance' && `Your deal will be visible to users within a ${deliveryRadius} ${deliveryUnit} radius of your storefront.`}
                                            {(deliveryScope === 'same_area' || deliveryScope === 'city_wide' || deliveryScope === 'state_wide') && !deliveryRegion && 'Select a delivery scope to see the coverage summary.'}
                                        </p>
                                    </div>
                                </div>
                            )}

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
                                <div onClick={e => (e.currentTarget.querySelector<HTMLInputElement>('input[type="date"]')?.showPicker())}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" 
                                    />
                                </div>
                                <div onClick={e => (e.currentTarget.querySelector<HTMLInputElement>('input[type="time"]')?.showPicker())}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                                    <input 
                                        ref={startTimeRef}
                                        type="time" 
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        min={startDate === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0, 5) : undefined}
                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" 
                                    />
                                </div>
                                <div onClick={e => (e.currentTarget.querySelector<HTMLInputElement>('input[type="date"]')?.showPicker())}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                    <input 
                                        type="date" 
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        min={startDate || new Date().toISOString().split('T')[0]}
                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" 
                                    />
                                </div>
                                <div onClick={e => (e.currentTarget.querySelector<HTMLInputElement>('input[type="time"]')?.showPicker())}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                                    <input 
                                        ref={endTimeRef}
                                        type="time" 
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        min={endDate === startDate && startTime ? startTime : endDate === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0, 5) : undefined}
                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                    accept="image/*"
                                    className="hidden"
                                />
                                {imageUrl ? (
                                    <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-gray-200 group">
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="bg-white/90 text-red-500 p-2 rounded-full hover:bg-white transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-primary/30 cursor-pointer transition-colors"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 size={24} className="animate-spin mb-2 text-primary" />
                                                <span className="font-bold text-sm">Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon size={24} className="mb-2" />
                                                <span className="font-bold text-sm">Upload Image</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── Advanced Settings (Collapsible) ── */}
                            <div className="border-t border-gray-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="w-full flex items-center justify-between text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <span>Advanced Settings</span>
                                    <ChevronRight size={16} className={cn("transition-transform", showAdvanced && "rotate-90")} />
                                </button>

                                {showAdvanced && (
                                    <div className="mt-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* Quantity */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Total Quantity Available</label>
                                            <input
                                                type="number"
                                                value={dealQuantity}
                                                onChange={e => setDealQuantity(e.target.value)}
                                                placeholder="Leave empty for unlimited"
                                                min="0"
                                                className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                            />
                                            <p className="text-xs text-gray-400 mt-1.5 font-medium">Once this many people claim the deal, it automatically closes.</p>
                                        </div>

                                        {/* Audience Target */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">Who can claim this deal?</label>
                                            <div className="flex gap-1 p-1 bg-gray-50 rounded-2xl">
                                                {[
                                                    { label: 'Everyone', value: 'all' as const },
                                                    { label: 'New', value: 'new_customers' as const },
                                                    { label: 'Returning', value: 'returning_customers' as const },
                                                ].map(opt => (
                                                    <button key={opt.value} type="button" onClick={() => setAudienceTarget(opt.value)}
                                                        className={cn("flex-1 py-2.5 px-1 rounded-xl text-[11px] md:text-sm font-bold transition-all leading-tight text-center", audienceTarget === opt.value ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-800")}>
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1.5 font-medium">
                                                {audienceTarget === 'all' && 'Anyone can claim this deal.'}
                                                {audienceTarget === 'new_customers' && 'Only customers who have never claimed a deal from your business can claim.'}
                                                {audienceTarget === 'returning_customers' && 'Only customers who have previously claimed a deal from your business can claim.'}
                                            </p>
                                        </div>

                                        {/* Max Claims Per Customer */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Claims Per Customer</label>
                                            <input
                                                type="number"
                                                value={maxClaimsPerCustomer}
                                                onChange={e => setMaxClaimsPerCustomer(e.target.value)}
                                                placeholder="1"
                                                min="0"
                                                className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                            />
                                            <p className="text-xs text-gray-400 mt-1.5 font-medium">How many times the same customer can claim this deal (0 = unlimited).</p>
                                        </div>

                                        {/* Claim Code Prefix */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Claim Code Prefix (Optional)</label>
                                            <input
                                                type="text"
                                                value={claimCodePrefix}
                                                onChange={e => setClaimCodePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                                placeholder="VEM (Default)"
                                                maxLength={20}
                                                className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none uppercase tracking-wider font-mono"
                                            />
                                            <p className="text-xs text-gray-400 mt-1.5 font-medium">
                                                Custom prefix for claim codes (e.g. EASTER50). Leave empty for default &quot;VEM&quot;. Final code: <strong>{claimCodePrefix || 'VEM'}-BRANCH-XXXX</strong>
                                            </p>
                                        </div>

                                        {/* Terms & Conditions */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</label>
                                            <p className="text-xs text-gray-400 mb-3 font-medium">Add, edit, or remove terms for this deal. These will be shown to customers when they view the deal.</p>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!title && !description) {
                                                        alert('Please enter a deal title and description first so AI can generate relevant terms.');
                                                        return;
                                                    }
                                                    generateTerms.mutate({
                                                        description: `${title}. ${description}`,
                                                        offerType: offerType,
                                                    });
                                                }}
                                                disabled={generateTerms.isPending}
                                                className="mb-3 w-full h-10 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                                            >
                                                {generateTerms.isPending ? (
                                                    <><Loader2 size={14} className="animate-spin" /> Generating Terms...</>
                                                ) : (
                                                    <><Sparkles size={14} /> Generate with AI</>
                                                )}
                                            </button>

                                            {generateTerms.isError && (
                                                <p className="text-xs text-red-500 font-medium mb-2">Failed to generate terms. {generateTerms.error?.message || 'Please try again or add terms manually.'}</p>
                                            )}

                                            <div className="space-y-2">
                                                {dealTerms.map((term, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={term}
                                                            onChange={e => {
                                                                const updated = [...dealTerms];
                                                                updated[i] = e.target.value;
                                                                setDealTerms(updated);
                                                            }}
                                                            className="flex-1 p-3 bg-gray-50 border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setDealTerms(dealTerms.filter((_, idx) => idx !== i))}
                                                            className="size-9 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors shrink-0"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setDealTerms([...dealTerms, ''])}
                                                className="mt-2 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                            >
                                                <Plus size={12} /> Add term
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between pt-6">
                            <Button variant="ghost" onClick={() => { setStep(1); resetTypeFields(); }} className="font-bold">Back</Button>
                            <Button onClick={() => setStep(3)} disabled={!title} className="rounded-full px-8 font-bold">Next</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-gray-800 text-center mb-8">Show this deal to:</h3>
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
                        <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Preview your Deal</h3>

                        {/* Card matching public PromotionCard design */}
                        <div className="max-w-sm mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            {/* Image */}
                            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                                {imageUrl && (
                                    <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Discount badge */}
                                {offerType === 'discount' && discountType === 'percentage' && discountValue && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg">
                                        {discountValue}% OFF
                                    </div>
                                )}
                                {offerType === 'discount' && discountType === 'fixed' && discountValue && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg">
                                        SAVE ₦{Number(discountValue).toLocaleString()}
                                    </div>
                                )}
                                {offerType === 'special_deal' && specialDealType === 'bundle' && dealPrice && selectedItemsTotal > 0 && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg">
                                        SAVE ₦{(selectedItemsTotal - Number(dealPrice)).toLocaleString()}
                                    </div>
                                )}
                                {offerType === 'special_deal' && specialDealType === 'custom' && originalPrice && dealPrice && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg">
                                        SAVE ₦{(Number(originalPrice) - Number(dealPrice)).toLocaleString()}
                                    </div>
                                )}
                                {offerType === 'free_item' && freeItemName && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg">
                                        FREE
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    {offerType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </p>

                                <h3 className="font-headline font-bold text-gray-900 text-base leading-tight line-clamp-1">
                                    {title || 'Your Deal Title'}
                                </h3>

                                <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                                    {description || 'Deal description goes here.'}
                                </p>

                                {/* Price */}
                                {(offerType === 'special_deal' || offerType === 'discount' || offerType === 'free_item') && (
                                    <div className="flex items-baseline gap-2 pt-1">
                                        {offerType === 'special_deal' && specialDealType === 'bundle' && dealPrice && (
                                            <>
                                                <span className="text-lg font-black text-primary font-display tracking-tight">
                                                    ₦{Number(dealPrice).toLocaleString()}
                                                </span>
                                                {selectedItemsTotal > 0 && (
                                                    <span className="text-xs text-gray-400 line-through font-bold">
                                                        ₦{selectedItemsTotal.toLocaleString()}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {offerType === 'special_deal' && specialDealType === 'custom' && dealPrice && (
                                            <>
                                                <span className="text-lg font-black text-primary font-display tracking-tight">
                                                    ₦{Number(dealPrice).toLocaleString()}
                                                </span>
                                                {originalPrice && (
                                                    <span className="text-xs text-gray-400 line-through font-bold">
                                                        ₦{Number(originalPrice).toLocaleString()}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {offerType === 'discount' && (
                                            <>
                                                <span className="text-xs text-gray-400 font-medium">Discount applied at checkout</span>
                                            </>
                                        )}
                                        {offerType === 'free_item' && freeItemName && (
                                            <span className="text-lg font-black text-primary font-display tracking-tight">
                                                Free
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Date range */}
                                {(startDate || endDate) && (
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                        <Clock size={10} className="text-gray-400" />
                                        <span className="text-[10px] text-gray-400 font-bold">
                                            {startDate ? `${new Date(startDate).toLocaleDateString()} ${startTime || ''}` : 'Start'} — {endDate ? `${new Date(endDate).toLocaleDateString()} ${endTime || ''}` : 'End'}
                                        </span>
                                    </div>
                                )}

                                {/* Audience */}
                                {audience && (
                                    <div className="flex items-center gap-1">
                                        <Users size={10} className="text-primary" />
                                        <span className="text-[10px] font-bold text-primary">
                                            For: {audience.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] text-gray-400 font-bold">Preview</span>
                                    <span className="flex items-center gap-1 text-xs font-black text-primary">
                                        View Offer <ArrowRight size={12} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-8">
                            <Button variant="ghost" onClick={() => setStep(3)} className="font-bold">Back</Button>
                            <Button onClick={() => setStep(5)} className="rounded-full px-8 font-bold">Looks Good</Button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6 animate-in fade-in text-center">
                        <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Ready to Publish!</h3>
                        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Your deal will immediately be visible to customers and businesses nearby.</p>

                        {/* Mini preview card */}
                        <div className="max-w-xs mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 text-left">
                            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                                {imageUrl && (
                                    <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                {offerType === 'discount' && discountType === 'percentage' && discountValue && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg">
                                        {discountValue}% OFF
                                    </div>
                                )}
                                {offerType === 'special_deal' && specialDealType === 'bundle' && dealPrice && selectedItemsTotal > 0 && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg">
                                        SAVE ₦{(selectedItemsTotal - Number(dealPrice)).toLocaleString()}
                                    </div>
                                )}
                                {offerType === 'special_deal' && specialDealType === 'custom' && originalPrice && dealPrice && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg">
                                        SAVE ₦{(Number(originalPrice) - Number(dealPrice)).toLocaleString()}
                                    </div>
                                )}
                            </div>
                            <div className="p-3 space-y-1.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    {offerType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </p>
                                <h3 className="font-headline font-bold text-gray-900 text-sm leading-tight line-clamp-1">
                                    {title || 'Your Deal Title'}
                                </h3>
                                {offerType === 'special_deal' && specialDealType === 'bundle' && dealPrice && (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base font-black text-primary">₦{Number(dealPrice).toLocaleString()}</span>
                                        {selectedItemsTotal > 0 && <span className="text-xs text-gray-400 line-through font-bold">₦{selectedItemsTotal.toLocaleString()}</span>}
                                    </div>
                                )}
                                {offerType === 'special_deal' && specialDealType === 'custom' && dealPrice && (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base font-black text-primary">₦{Number(dealPrice).toLocaleString()}</span>
                                        {originalPrice && <span className="text-xs text-gray-400 line-through font-bold">₦{Number(originalPrice).toLocaleString()}</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 mt-6">
                            <Button variant="ghost" onClick={() => setStep(4)} className="font-bold">Back</Button>
                            <Button 
                                onClick={handlePublish} 
                                className="rounded-full px-12 py-6 text-lg font-bold bg-primary hover:bg-primary/90"
                                disabled={createOffer.isPending}
                            >
                                {createOffer.isPending ? 'Publishing...' : 'Publish Deal'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
