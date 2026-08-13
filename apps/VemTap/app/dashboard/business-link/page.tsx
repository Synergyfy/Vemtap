'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuoteStore } from '@/store/quoteStore';
import { Smartphone, Plus, QrCode, Copy, Download, Trash2, Link as LinkIcon, X, Save, ShieldAlert, CheckCircle2, Clock, Zap, BarChart3, Loader2, Brush, ExternalLink, MoreVertical, Search, Calendar, ChevronDown, ChevronRight, Edit3, ArrowRight, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDevices, generateDevices, deleteDevice, updateDevice, fetchDeviceStats } from '@/lib/api/devices';
import { fetchMyOrders } from '@/lib/api/marketplace';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MarketplaceOrder } from '@/types/marketplace';
import { useBranches } from '@/services/branches/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { cn } from '@/lib/utils';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import UsageIndicator from '@/components/dashboard/UsageIndicator';
const defaultLogo = '/VEMTAP_PNG.png';
 
const getFullLogoUrl = (url?: string) => {
    if (!url) return defaultLogo;
    if (url.startsWith('http')) return url;
    const serverUrl = 'http://localhost:3001'; // Fallback to common dev port
    return `${serverUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getColorFromType = (type: string) => {
    const map: Record<string, string> = {
        'NFC': 'blue', 'SMART': 'purple', 'STATIC': 'emerald', 'DYNAMIC': 'amber'
    };
    return map[type] || 'blue';
};

export default function BusinessLinkPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { capabilities } = useSubscriptionStore();
    const { activeBranchId: urlBranchId, isAllBranches } = useActiveBranch();
    const [selectedLink, setSelectedLink] = useState<any | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ name: '', location: '', branchId: '', targetUrl: '', status: 'active', isMain: false });
    const [searchQuery, setSearchQuery] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);


    const { data: myBusiness } = useMyBusiness();
    const { data: branches = [] } = useBranches();
    
    const mainBranch = myBusiness?.branches?.find((b: any) => b.isMainBranch);
    const businessLogo = getFullLogoUrl(myBusiness?.logoUrl || mainBranch?.logoUrl || user?.businessLogo);

    // API Data
    const { data: devices = [], isLoading: devicesLoading } = useQuery({
        queryKey: ['devices', user?.businessId, urlBranchId, isAllBranches],
        queryFn: () => fetchDevices(urlBranchId || undefined, isAllBranches)
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['device-stats', user?.businessId, urlBranchId, isAllBranches],
        queryFn: () => fetchDeviceStats(urlBranchId || undefined, isAllBranches)
    });

    const { data: orders = [], isLoading: ordersLoading } = useQuery<MarketplaceOrder[]>({
        queryKey: ['my-orders'],
        queryFn: () => fetchMyOrders()
    });

    // Filtering for ready-to-generate orders (Allocations)
    // In our backend, devices are generated for orders with status 'Ready'
    const readyOrders = orders.filter((o: MarketplaceOrder) => o.status === 'Ready');

    // Calculate total remaining quota
    const totalRemainingQuota = readyOrders.reduce((sum: number, order: MarketplaceOrder) => {
        const total = order.quantity || (order.quote?.quantity || 0);
        const used = (order as any).devices?.length || 0;
        return sum + Math.max(0, total - used);
    }, 0);

    // Mutations
    const generateMutation = useMutation({
        mutationFn: (branchId?: string) => generateDevices(branchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            queryClient.invalidateQueries({ queryKey: ['my-orders'] });
            queryClient.invalidateQueries({ queryKey: ['device-stats'] });
            toast.success('Successfully generated new NFC assets!');
        },
        onError: (err: any) => toast.error(err.message || 'Failed to generate assets')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => updateDevice(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            setIsEditModalOpen(false);
            toast.success('Device configuration updated');
        },
        onError: (err: any) => toast.error(err.message || 'Update failed')
    });

    const deleteMutation = useMutation({
        mutationFn: ({ id, branchId }: { id: string, branchId?: string }) => deleteDevice(id, branchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            queryClient.invalidateQueries({ queryKey: ['device-stats'] });
            toast.success('Asset removed');
        },
        onError: (err: any) => toast.error(err.message || 'Delete failed')
    });

    const handleGenerate = () => {
        if (totalRemainingQuota <= 0) {
            toast.error('No pending allocations to generate.');
            return;
        }

        // Check subscription limits
        if (capabilities && capabilities.capabilities.tags.limit !== 'unlimited' &&
            capabilities.capabilities.tags.used >= (capabilities.capabilities.tags.limit as number)) {
            toast.error('NFC Tag limit reached. Please upgrade your plan.');
            return;
        }

        // For Owners and Admins, a branchId is required for write operations
        if (!urlBranchId && (user?.role === 'owner' || user?.role === 'admin')) {
            toast.error('Please select a specific branch before generating assets.');
            return;
        }

        generateMutation.mutate(urlBranchId || undefined);
    };

    const openEditModal = (device: any) => {
        const fallbackTapUrl = `${window.location.origin}/tap/${device.code}`;
        const currentTargetUrl = device.targetUrl || device.redirectUrl || device.url || fallbackTapUrl;
        setSelectedLink(device);
        setEditData({
            name: device.name,
            location: device.location || '',
            branchId: device.branchId || '',
            targetUrl: currentTargetUrl,
            status: device.status || 'active',
            isMain: device.isMain || false
        });
        setIsEditModalOpen(true);
    };

    const normalizeUrl = (raw: string) => {
        const value = raw.trim();
        if (!value) return '';
        return /^https?:\/\//i.test(value) ? value : `https://${value}`;
    };

    const saveEdit = () => {
        if (!selectedLink) return;
        const normalizedTargetUrl = normalizeUrl(editData.targetUrl);
        if (normalizedTargetUrl) {
            try {
                new URL(normalizedTargetUrl);
            } catch {
                toast.error('Please enter a valid destination URL');
                return;
            }
        }

        const payload: any = {
            name: editData.name,
            location: editData.location,
            branchId: editData.branchId,
            status: editData.status,
            isMain: editData.isMain
        };

        if (normalizedTargetUrl) {
            payload.targetUrl = normalizedTargetUrl;
            payload.redirectUrl = normalizedTargetUrl;
            payload.url = normalizedTargetUrl;
        }

        updateMutation.mutate({ id: selectedLink.id, data: payload });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Link copied to clipboard');
    };

    const downloadQRCode = (id: string, code: string, isModal = false, format = 'PNG') => {
        const canvasId = isModal ? `qr-modal-${id}` : `qr-${id}`;
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        
        if (canvas) {
            try {
                const mimeType = format === 'JPG' ? 'image/jpeg' : 'image/png';
                const extension = format.toLowerCase();
                const url = canvas.toDataURL(mimeType);
                const link = document.createElement('a');
                link.download = `QR-${code}.${extension}`;
                link.href = url;
                link.click();
                toast.success(`QR Code downloaded as ${format}!`);
            } catch (err) {
                console.error('QR Download failed:', err);
                toast.error('Download failed. Try right-clicking to save.');
            }
        }
    };

    const getConfiguredTargetUrl = (device: any) => {
        return device?.targetUrl || device?.redirectUrl || device?.url || '';
    };

    const handleEditDesign = (device: any) => {
        const deviceUrl = `${window.location.origin}/tap/${device.code}`;
        const params = new URLSearchParams();
        params.append('prefill_url', encodeURIComponent(deviceUrl));
        params.append('prefill_name', encodeURIComponent(`${device.name || 'Hardware'} QR`));
        params.append('device_id', device.id);
        router.push(`/dashboard/explore-qrthrive?${params.toString()}`);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="bg-linear-to-br from-indigo-600 to-primary rounded-2xl p-7 text-white relative overflow-hidden shadow-lg shadow-primary/20 group">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full w-fit">
                            <Zap size={12} className="fill-white" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">New Experience</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">Unified Customer Dashboard</h2>
                        <p className="text-sm font-medium text-white/80 max-w-xl">
                            We&apos;ve consolidated hardware management and engagement sequences into a single powerful workflow. Try the new Customer Experience dashboard for a better setup journey.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/customer-experience')}
                        className="h-11 px-6 bg-white text-primary font-semibold uppercase tracking-wider text-xs rounded-xl shadow-md shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 whitespace-nowrap group-hover:bg-primary-dark group-hover:text-white"
                    >
                        Switch to New View
                        <ArrowRight size={16} />
                    </button>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-20 -right-20 size-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 left-1/4 size-40 bg-indigo-400/20 rounded-full blur-2xl" />
            </div>

            <PageHeader
                title="Business Link (Legacy)"
                description="Manage your physical business touchpoints and generate smart marketing tools."
            />

            {/* Approved Quota Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {readyOrders.length > 0 ? (
                    <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h3 className="text-base md:text-lg font-bold text-text-main mb-1">Approved Business Links</h3>
                                <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                                    {totalRemainingQuota} units ready to generate across {readyOrders.length} order{readyOrders.length > 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={generateMutation.isPending || totalRemainingQuota <= 0}
                                className="h-10 px-5 bg-primary text-white font-semibold uppercase tracking-wider text-xs rounded-xl shadow-sm shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 whitespace-nowrap disabled:opacity-50"
                            >
                                {generateMutation.isPending ? (<Loader2 className="animate-spin text-white" size={16} />) : <QrCode size={16} />}
                                {generateMutation.isPending ? 'Generating...' : 'Generate All Assets'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {readyOrders.map((o: MarketplaceOrder) => {
                                const total = o.quantity || (o.quote?.quantity || 0);
                                const used = (o as any).devices?.length || 0;
                                const remaining = Math.max(0, total - used);
                                const pct = Math.round((used / total) * 100);
                                return (
                                    <div key={o.id} className="text-left p-4 rounded-xl border-2 border-gray-100 bg-gray-50/50">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="text-xs font-bold text-text-main">{o.product?.name || o.quote?.productName || 'NFC Product'}</p>
                                                <p className="text-[10px] text-text-secondary font-medium uppercase">Order {o.id.slice(0, 8)}</p>
                                            </div>
                                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-[9px] font-semibold uppercase">
                                                <CheckCircle2 size={10} />
                                                Ready
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold text-text-secondary">
                                                <span>{used} activated</span>
                                                <span>{remaining} pending</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all"
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : devices.length === 0 && !devicesLoading ? (
                    <div className="col-span-3 bg-amber-50 border border-amber-200 rounded-2xl p-5 md:p-6 flex items-start gap-5">
                        <div className="size-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <ShieldAlert size={22} />
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-bold text-amber-900 mb-1">No Ready Allocations</h3>
                            <p className="text-sm text-amber-700 font-medium max-w-xl">
                                You don&apos;t have any hardware orders ready for activation. Buy NFC hardware in the <strong>Marketplace</strong>. Once your order is ready, you can generate assets here.
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <UsageIndicator 
                    label="NFC Assets (Tags)" 
                    usage={capabilities?.capabilities.tags} 
                    icon={<Smartphone size={20} />} 
                />
            </div>

            {/* Fleet Analytics Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { label: 'Total Fleet', value: stats?.totalDevices || 0, icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Now', value: stats?.activeNow || 0, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Total Scans', value: stats?.totalScans || 0, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/5' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 ${stat.bg} ${stat.color} rounded-lg`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">{stat.label}</p>
                            <h4 className="text-2xl md:text-3xl font-bold text-text-main">{stat.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            {/* List Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-bold text-text-main tracking-tight flex items-center gap-3">
                        Business Link Hardware
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-semibold rounded-lg">
                            {devices.length} TOTAL
                        </span>
                    </h2>
                    <p className="text-sm text-text-secondary font-medium">Manage and brand your physical assets.</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-xl border border-gray-100 shadow-sm focus-within:ring-2 ring-primary/10 transition-all w-full md:max-w-xs">
                    <Search size={18} className="text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search devices..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-sm font-bold text-gray-700 outline-none w-full placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Grid View */}
            {devicesLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                        <Loader2 className="animate-spin text-primary" size={48} strokeWidth={3} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <QrCode size={18} className="text-primary" />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-text-secondary animate-pulse uppercase tracking-wider">Loading assets...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {devices
                            .filter((d: any) => !searchQuery || d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || d.code?.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((device: any) => {
                                const deviceUrl = `${window.location.origin}/tap/${device.code}`;
                                const configuredTargetUrl = getConfiguredTargetUrl(device);
                                const displayedTargetUrl = configuredTargetUrl || deviceUrl;
                                // Using branches data from hook
                                const deviceBranch = branches.find((b: any) => b.id === device.branchId);
                                const color = getColorFromType(device.type || 'NFC');
                                
                                return (
                                    <motion.div
                                        key={device.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group flex flex-col relative overflow-hidden"
                                    >
                                        {/* Status Badge Top Right */}
                                        <div className="absolute top-6 right-8 flex items-center gap-1.5">
                                            {device.isMain && (
                                                <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-semibold rounded-md uppercase tracking-wider shadow-sm mr-1">
                                                    ★ MAIN
                                                </span>
                                            )}
                                            <div className={`w-2 h-2 rounded-full ${device.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{device.status}</span>
                                        </div>

                                        <div className="p-8 pb-0">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-100 text-${color}-600 shadow-sm border border-${color}-200/50`}>
                                                    <Smartphone size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none mb-1">Hardware ID</p>
                                                    <h3 className="text-lg font-bold text-text-main tracking-tight font-mono">{device.code}</h3>
                                                </div>
                                            </div>

                                            {/* Preview Area */}
                                            <div className="relative aspect-square bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 p-8 flex items-center justify-center group/qr mb-8">
                                                <div className="relative">
                                                    <QRCodeCanvas
                                                        id={`qr-${device.id}`}
                                                        value={deviceUrl}
                                                        size={1024}
                                                        level="H"
                                                        includeMargin={false}
                                                        imageSettings={businessLogo ? {
                                                            src: businessLogo,
                                                            height: 256,
                                                            width: 256,
                                                            excavate: true,
                                                            crossOrigin: 'anonymous',
                                                        } : undefined}
                                                        style={{ width: 140, height: 140 }}
                                                        className="relative z-10"
                                                    />
                                                    <div className="absolute inset-0 bg-white blur-2xl opacity-0 group-hover/qr:opacity-30 transition-opacity" />
                                                </div>
                                                
                                                {/* Hover Overlay for Quick Actions */}
                                                <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-all duration-400 rounded-[32px] flex flex-col items-center justify-center gap-4 z-20">
                                                    <button 
                                                        onClick={() => handleEditDesign(device)}
                                                        className="px-6 py-3 bg-white text-primary rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transform -translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75 shadow-lg flex items-center gap-2"
                                                    >
                                                        <Brush size={14} /> Full Design Tools
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Info Fields */}
                                            <div className="space-y-4 mb-8">
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group/link">
                                                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Active Path</label>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-text-main truncate max-w-[150px]">{displayedTargetUrl}</span>
                                                        <button 
                                                            onClick={() => copyToClipboard(displayedTargetUrl)}
                                                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm"
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1 py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Scans</label>
                                                        <span className="text-lg font-bold text-text-main">{device.totalScans}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="mt-auto p-4 bg-slate-50/50 border-t border-gray-100 grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => openEditModal(device)}
                                                className="h-10 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl text-[10px] font-semibold text-slate-700 uppercase tracking-wider hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95"
                                            >
                                                <Edit3 size={14} /> Details
                                            </button>
                                            
                                            <div className="relative flex-1 flex">
                                                <button 
                                                    onClick={() => setOpenDropdownId(openDropdownId === device.id ? null : device.id)}
                                                    className="flex-1 h-10 flex items-center justify-center gap-2 bg-primary text-white border border-primary rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95"
                                                >
                                                    <Download size={14} /> Download <ChevronDown size={14} className={cn("transition-transform duration-300", openDropdownId === device.id && "rotate-180")} />
                                                </button>

                                                <AnimatePresence>
                                                    {openDropdownId === device.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                                                            <motion.div 
                                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                className="absolute bottom-full right-0 mb-3 w-48 bg-white rounded-2xl border border-gray-100 shadow-xl p-2 z-50 overflow-hidden"
                                                            >
                                                                {['PNG', 'JPG'].map(format => (
                                                                    <button
                                                                        key={format}
                                                                        onClick={() => {
                                                                            downloadQRCode(device.id, device.code, false, format);
                                                                            setOpenDropdownId(null);
                                                                        }}
                                                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-[10px] font-semibold text-slate-700 uppercase tracking-wider group/item"
                                                                    >
                                                                        {format}
                                                                        <ArrowRight size={12} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                    </AnimatePresence>
                </div>
            )}

            {/* Edit/Details Modal */}
            <AnimatePresence>
                {isEditModalOpen && selectedLink && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                                        <Smartphone className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base md:text-lg font-bold text-text-main leading-none mb-1">Asset Configuration</h3>
                                        <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">ID: {selectedLink.code}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="size-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-white border-2 border-primary/10 rounded-2xl shadow-inner group relative">
                                        <QRCodeCanvas
                                            id={`qr-modal-${selectedLink.id}`}
                                            value={`${window.location.origin}/tap/${selectedLink.code}`}
                                            size={1024}
                                            level="H"
                                            includeMargin={true}
                                            imageSettings={businessLogo ? {
                                                src: businessLogo,
                                                height: 256,
                                                width: 256,
                                                excavate: true,
                                                crossOrigin: 'anonymous',
                                            } : undefined}
                                            style={{ width: 180, height: 180 }}
                                        />
                                        <div className="absolute inset-x-0 -bottom-3 flex justify-center">
                                            <span className="bg-primary text-white text-[8px] font-semibold uppercase px-3 py-1 rounded-full shadow-lg">Cloud Static Link</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-text-secondary font-medium text-center max-w-[250px]">
                                        This static link redirects visitors to your target platform based on your cloud configuration.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 ml-1">Destination URL</label>
                                        <input
                                            type="url"
                                            value={editData.targetUrl}
                                            onChange={(e) => setEditData({ ...editData, targetUrl: e.target.value })}
                                            className="w-full h-12 bg-gray-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none"
                                            placeholder="e.g. https://example.com/menu"
                                        />
                                        <p className="text-[10px] text-text-secondary font-medium px-1">
                                            Update where this NFC asset redirects visitors.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 ml-1">Asset Name</label>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full h-12 bg-gray-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none"
                                            placeholder="e.g. Reception Desk"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 ml-1">Physical Location</label>
                                            <input
                                                type="text"
                                                value={editData.location}
                                                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                                className="w-full h-12 bg-gray-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none"
                                                placeholder="e.g. Ground Floor, Lobby"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 ml-1">Device Status</label>
                                            <select
                                                value={editData.status}
                                                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                                className="w-full h-12 bg-gray-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none appearance-none"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 ml-1">Assign to Branch</label>
                                        <select
                                            value={editData.branchId}
                                            onChange={(e) => setEditData({ ...editData, branchId: e.target.value })}
                                            className="w-full h-12 bg-gray-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none appearance-none"
                                        >
                                            <option value="">Unassigned (Main Business)</option>
                                            {branches.map((branch: any) => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {editData.branchId && (
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/60 mt-4 transition-all hover:bg-slate-100/50">
                                            <div>
                                                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 block mb-0.5">Designate as Main Device</label>
                                                <p className="text-[9px] text-text-secondary font-medium max-w-[280px]">
                                                    Makes this the main touchpoint for customer experience QR code scans. Any other main device on this branch will be unmarked.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={editData.isMain} 
                                                    onChange={(e) => setEditData({ ...editData, isMain: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary animate-all duration-300"></div>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Scans</span>
                                        <span className="text-sm font-bold text-slate-800">{selectedLink.totalScans}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 h-10 bg-slate-50 text-slate-800 font-semibold uppercase tracking-wider text-xs rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveEdit}
                                        className="flex-[2] h-10 bg-primary text-white font-semibold uppercase tracking-wider text-xs rounded-xl shadow-sm shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 px-8"
                                    >
                                        <Save size={16} />
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
