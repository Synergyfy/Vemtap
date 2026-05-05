'use client';

import React, { useState, useRef } from 'react';
import { Smartphone, QrCode, Plus, Copy, Download, Search, Loader2, CheckCircle2, ShieldAlert, Zap, BarChart3, Edit3, ArrowRight, Brush, ChevronDown, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDevices, generateDevices, updateDevice, fetchDeviceStats } from '@/lib/api/devices';
import { fetchMyOrders } from '@/lib/api/marketplace';
import { MarketplaceOrder } from '@/types/marketplace';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useBranches } from '@/services/branches/hooks';
import { toast } from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import UsageIndicator from '@/components/dashboard/UsageIndicator';

interface HardwareStepProps {
    businessLogo?: string;
}

const getColorFromType = (type: string) => {
    const map: Record<string, string> = {
        'NFC': 'blue', 'SMART': 'purple', 'STATIC': 'emerald', 'DYNAMIC': 'amber'
    };
    return map[type] || 'blue';
};

export function HardwareStep({ businessLogo }: HardwareStepProps) {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { capabilities } = useSubscriptionStore();
    const { activeBranchId: urlBranchId, isAllBranches } = useActiveBranch();
    const { data: branches = [] } = useBranches();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [origin, setOrigin] = useState('https://vemtap.com');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<any>(null);
    const [editData, setEditData] = useState({ name: '', targetUrl: '', status: 'active' });
    const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
    const [downloadTarget, setDownloadTarget] = useState<{ url: string, name: string } | null>(null);
    const qrRef = useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    const currentBranch = branches.find((b: any) => b.id === urlBranchId) || branches.find((b: any) => b.isMainBranch);
    const slug = (currentBranch as any)?.slug || (user as any)?.business?.slug || 'your-business';
    const publicUrl = `${origin}/${slug}`;

    const downloadQR = (format: 'png' | 'jpg' | 'svg') => {
        if (!downloadTarget) return;
        const { url, name } = downloadTarget;
        const qrCanvas = document.getElementById(`qr-${name}`) as HTMLCanvasElement;
        if (!qrCanvas) return;

        // Create a temporary high-res canvas for downloading
        const tempCanvas = document.createElement('canvas');
        const size = 1024;
        tempCanvas.width = size;
        tempCanvas.height = size;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;

        // We'll use a temporary hidden QRCodeCanvas for high-res generation
        // But for now, we can just scale the existing one if it's high enough quality,
        // or re-draw it. A better way in React is to have a hidden high-res one.
        // For simplicity and speed, let's use the dataURL from the existing one
        // and draw it onto the high-res temp canvas.
        
        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = '#white';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
            
            let dataUrl = '';
            let mimeType = 'image/png';
            
            if (format === 'jpg') {
                dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
                mimeType = 'image/jpeg';
            } else if (format === 'svg') {
                // SVG is harder from Canvas, usually needs an SVG QR generator
                // For now, let's stick to PNG/JPG or use a placeholder message
                dataUrl = tempCanvas.toDataURL('image/png');
            } else {
                dataUrl = tempCanvas.toDataURL('image/png');
            }

            const link = document.createElement('a');
            link.download = `${name}-qr.${format}`;
            link.href = dataUrl;
            link.click();
            toast.success(`QR Code downloaded as ${format.toUpperCase()}!`);
            setDownloadTarget(null);
        };
        img.src = qrCanvas.toDataURL('image/png');
    };

    // API Data
    const { data: devices = [], isLoading: devicesLoading } = useQuery({
        queryKey: ['devices', user?.businessId, urlBranchId, isAllBranches],
        queryFn: () => fetchDevices(urlBranchId || undefined, isAllBranches)
    });

    const { data: stats } = useQuery({
        queryKey: ['device-stats', user?.businessId, urlBranchId, isAllBranches],
        queryFn: () => fetchDeviceStats(urlBranchId || undefined, isAllBranches)
    });

    const { data: orders = [] } = useQuery<MarketplaceOrder[]>({
        queryKey: ['my-orders'],
        queryFn: () => fetchMyOrders()
    });

    const readyOrders = orders.filter((o: MarketplaceOrder) => o.status === 'Ready');
    const totalRemainingQuota = readyOrders.reduce((sum: number, order: MarketplaceOrder) => {
        const total = order.quantity || (order.quote?.quantity || 0);
        const used = (order as any).devices?.length || 0;
        return sum + Math.max(0, total - used);
    }, 0);

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
            toast.success('Asset updated successfully');
        },
        onError: (err: any) => toast.error(err.message || 'Failed to update asset')
    });

    const handleGenerate = () => {
        if (totalRemainingQuota <= 0) {
            toast.error('No pending allocations to generate.');
            return;
        }
        if (capabilities && capabilities.capabilities.tags.limit !== 'unlimited' &&
            capabilities.capabilities.tags.used >= (capabilities.capabilities.tags.limit as number)) {
            toast.error('NFC Tag limit reached. Please upgrade your plan.');
            return;
        }
        if (!urlBranchId && (user?.role === 'owner' || user?.role === 'admin')) {
            toast.error('Please select a specific branch before generating assets.');
            return;
        }
        generateMutation.mutate(urlBranchId || undefined);
    };

    const openEditModal = (device: any) => {
        const fallbackTapUrl = `${origin}/tap/${device.code}`;
        const currentTargetUrl = device.targetUrl || device.redirectUrl || device.url || fallbackTapUrl;
        setSelectedDevice(device);
        setEditData({
            name: device.name || '',
            targetUrl: currentTargetUrl,
            status: device.status || 'active'
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (!selectedDevice) return;
        const payload: any = {
            name: editData.name,
            status: editData.status
        };
        const rawUrl = editData.targetUrl.trim();
        if (rawUrl) {
            const normalizedTargetUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
            payload.targetUrl = normalizedTargetUrl;
            payload.redirectUrl = normalizedTargetUrl;
            payload.url = normalizedTargetUrl;
        }
        updateMutation.mutate({ id: selectedDevice.id, data: payload });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">


            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[
                    { label: 'Total Fleet', value: stats?.totalDevices || 0, icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Now', value: stats?.activeNow || 0, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Total Scans', value: stats?.totalScans || 0, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/5' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{stat.label}</p>
                            <h4 className="text-xl font-black text-text-main">{stat.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            {/* Allocation Panel */}
            {readyOrders.length > 0 && (
                 <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Approved Allocations</h3>
                            <p className="text-[10px] text-slate-500 font-medium">{totalRemainingQuota} units ready to generate</p>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={generateMutation.isPending}
                            className="h-10 px-6 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {generateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
                            Generate Assets
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {readyOrders.map((o: MarketplaceOrder) => {
                            const total = o.quantity || (o.quote?.quantity || 0);
                            const used = (o as any).devices?.length || 0;
                            const pct = Math.round((used / total) * 100);
                            return (
                                <div key={o.id} className="bg-white p-4 rounded-2xl border border-slate-200/50">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-[10px] font-black text-slate-800 truncate max-w-[120px]">{o.product?.name || 'NFC Product'}</span>
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">READY</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 </div>
            )}

            {/* Search & List */}
            <div className="space-y-4">
                <div className="flex items-center gap-4 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:ring-2 ring-primary/10 transition-all">
                    <Search size={18} className="text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search devices by ID or Name..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-sm font-bold text-gray-700 outline-none w-full"
                    />
                </div>

                {devicesLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-primary mb-4" size={32} />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading assets...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {devices
                            .filter((d: any) => !searchQuery || d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || d.code?.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((device: any) => {
                                const color = getColorFromType(device.type || 'NFC');
                                return (
                                    <div key={device.id} className="bg-white rounded-[2rem] border border-gray-100 p-5 flex flex-col gap-4 group hover:shadow-xl hover:shadow-gray-200/50 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("size-10 rounded-xl flex items-center justify-center", `bg-${color}-50 text-${color}-600`)}>
                                                    <Smartphone size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 leading-none mb-1">{device.code}</h4>
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{device.name || 'Untitled Asset'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className={cn("size-1.5 rounded-full", device.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300')} />
                                                <span className="text-[9px] font-black text-slate-400 uppercase">{device.status}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="shrink-0 bg-white p-1.5 rounded-lg border border-slate-100">
                                                <QRCodeCanvas
                                                    id={`qr-${device.code}`}
                                                    value={device.targetUrl || `${origin}/tap/${device.code}`}
                                                    size={60}
                                                    level={"M"}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Link</p>
                                                <p className="text-[10px] font-bold text-slate-600 truncate">
                                                    {device.targetUrl || `${origin}/tap/${device.code}`}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(device.targetUrl || `${origin}/tap/${device.code}`);
                                                        toast.success('Link copied to clipboard');
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-white rounded-md border border-transparent hover:border-slate-200"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                                <button 
                                                    onClick={() => setQrModalUrl(device.targetUrl || `${origin}/tap/${device.code}`)}
                                                    className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-white rounded-md border border-transparent hover:border-slate-200"
                                                    title="Open on phone"
                                                >
                                                    <Smartphone size={12} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <button onClick={() => openEditModal(device)} className="h-10 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                                <Edit3 size={14} /> Details
                                            </button>
                                            <a 
                                                href={device.targetUrl || `${origin}/tap/${device.code}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-10 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink size={14} /> Open
                                            </a>
                                            <button 
                                                onClick={() => setDownloadTarget({ url: device.targetUrl || `${origin}/tap/${device.code}`, name: device.code })}
                                                className="h-10 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Download size={14} /> Download
                                            </button>
                                            <button 
                                                onClick={() => setQrModalUrl(device.targetUrl || `${origin}/tap/${device.code}`)}
                                                className="h-10 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Smartphone size={14} /> On Phone
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && selectedDevice && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100"
                        >
                            <h3 className="text-xl font-black text-slate-900 mb-1">Asset Details</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Device: {selectedDevice.code}</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Asset Name</label>
                                    <input 
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                                        placeholder="e.g. Lobby Table 4"
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-primary/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Target Redirect URL</label>
                                    <input 
                                        type="url"
                                        value={editData.targetUrl}
                                        onChange={(e) => setEditData({...editData, targetUrl: e.target.value})}
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button 
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 h-12 bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveEdit}
                                        disabled={updateMutation.isPending}
                                        className="flex-1 h-12 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save Details'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QR Modal for Phone Scanning */}
            <AnimatePresence>
                {qrModalUrl && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setQrModalUrl(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[3rem] p-10 shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full"
                        >
                            <div className="text-center">
                                <h3 className="text-xl font-black text-slate-900 mb-2">Scan with Phone</h3>
                                <p className="text-xs text-slate-500 font-medium">Point your camera at this QR code to open the link on your mobile device.</p>
                            </div>
                            
                            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                <QRCodeCanvas
                                    value={qrModalUrl}
                                    size={240}
                                    level={"H"}
                                    includeMargin={false}
                                />
                            </div>

                            <button 
                                onClick={() => setQrModalUrl(null)}
                                className="w-full h-14 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                            >
                                Close Preview
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Download Format Modal */}
            <AnimatePresence>
                {downloadTarget && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setDownloadTarget(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2.5rem] p-8 shadow-2xl w-full max-w-sm"
                        >
                            <div className="text-center mb-6">
                                <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Download size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-1">Download QR Code</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select your preferred format</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'png', label: 'PNG Image', desc: 'High quality, transparent background' },
                                    { id: 'jpg', label: 'JPG Image', desc: 'Compressed, best for web use' },
                                    { id: 'svg', label: 'SVG Vector', desc: 'Scalable for print & design' }
                                ].map((format) => (
                                    <button
                                        key={format.id}
                                        onClick={() => downloadQR(format.id as any)}
                                        className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
                                    >
                                        <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-[10px] text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            {format.id.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 leading-tight">{format.label}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{format.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => setDownloadTarget(null)}
                                className="w-full mt-6 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
