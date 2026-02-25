'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuoteStore } from '@/store/quoteStore';
import { Smartphone, Plus, QrCode, Copy, Download, Trash2, Link as LinkIcon, X, Save, ShieldAlert, CheckCircle2, Clock, Zap, BarChart3 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDevices, generateDevices, deleteDevice, updateDevice, fetchDeviceStats } from '@/lib/api/devices';
import { fetchMyOrders } from '@/lib/api/marketplace';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MarketplaceOrder } from '@/types/marketplace';
import { useBranches } from '@/services/branches/hooks';
import { Building2 } from 'lucide-react';

export default function NFCManagerPage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [selectedLink, setSelectedLink] = useState<any | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ name: '', location: '', branchId: '' });

    const { data: branches = [] } = useBranches();

    // API Data
    const { data: devices = [], isLoading: devicesLoading } = useQuery({
        queryKey: ['devices'],
        queryFn: fetchDevices
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['device-stats'],
        queryFn: fetchDeviceStats
    });

    const { data: orders = [], isLoading: ordersLoading } = useQuery<MarketplaceOrder[]>({
        queryKey: ['my-orders'],
        queryFn: fetchMyOrders
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
        mutationFn: generateDevices,
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
        mutationFn: deleteDevice,
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
        generateMutation.mutate();
    };

    const openEditModal = (device: any) => {
        setSelectedLink(device);
        setEditData({
            name: device.name,
            location: device.location || '',
            branchId: device.branchId || ''
        });
        setIsEditModalOpen(true);
    };

    const saveEdit = () => {
        if (!selectedLink) return;
        updateMutation.mutate({ id: selectedLink.id, data: editData });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Link copied to clipboard');
    };

    const downloadQRCode = (id: string, code: string, isModal = false) => {
        const canvasId = isModal ? `qr-modal-${id}` : `qr-${id}`;
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `QR-${code}.png`;
            link.href = url;
            link.click();
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <PageHeader
                title="NFC Asset Hub"
                description="Generate NFC links against your admin-approved hardware quotes."
            />

            {/* Approved Quota Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trial Allocation Card */}

                {readyOrders.length > 0 ? (
                    <div className="col-span-3 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h3 className="font-display font-bold text-text-main mb-1">Approved NFC Allocations</h3>
                                <p className="text-[10px] text-text-secondary font-medium uppercase tracking-widest">
                                    {totalRemainingQuota} units ready to generate across {readyOrders.length} order{readyOrders.length > 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={generateMutation.isPending || totalRemainingQuota <= 0}
                                className="h-14 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 whitespace-nowrap disabled:opacity-50"
                            >
                                {generateMutation.isPending ? (<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>) : <QrCode size={18} />}
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
                                    <div key={o.id} className="text-left p-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="text-xs font-black text-text-main">{o.product?.name || o.quote?.productName || 'NFC Product'}</p>
                                                <p className="text-[10px] text-text-secondary font-medium uppercase">Order {o.id.slice(0, 8)}</p>
                                            </div>
                                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase">
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
                    <div className="col-span-3 bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8 flex items-start gap-5">
                        <div className="size-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-amber-900 mb-1">No Ready Allocations</h3>
                            <p className="text-sm text-amber-700 font-medium max-w-xl">
                                You don't have any hardware orders ready for activation. Buy NFC hardware in the <strong>Marketplace</strong>. Once your order is ready, you can generate assets here.
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Fleet Analytics Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Fleet', value: stats?.totalDevices || 0, icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Now', value: stats?.activeNow || 0, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Total Scans', value: stats?.totalScans || 0, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Offline', value: stats?.offline || 0, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            <h4 className="text-2xl font-black text-text-main">{stat.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            {/* Links Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="font-display font-bold text-text-main">Connected NFC Hardware</h3>
                        <p className="text-[10px] text-text-secondary font-medium">Manage individual tag configurations and print-ready QR codes.</p>
                    </div>
                    <span className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        {devices.length} Assets Active
                    </span>
                </div>

                {devicesLoading ? (
                    <div className="p-20 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : devices.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="size-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto">
                            <Smartphone size={32} />
                        </div>
                        <p className="text-sm font-bold text-text-secondary">No assets generated yet. Your allocated hardware will appear here once activated.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/30 text-[10px] font-black uppercase tracking-widest text-slate-700 border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-4">Hardware ID</th>
                                    <th className="px-8 py-4">Configuration</th>
                                    <th className="px-8 py-4">Print Code</th>
                                    <th className="px-8 py-4">Status & Location</th>
                                    <th className="px-8 py-4 text-right">Utility</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <AnimatePresence mode="popLayout">
                                    {devices.map((device: any) => {
                                        const deviceUrl = `${window.location.origin}/tap/${device.code}`;
                                        const deviceBranch = branches.find((b: any) => b.id === device.branchId);
                                        return (
                                            <motion.tr
                                                key={device.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="group hover:bg-gray-50/50 transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-10 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl flex items-center justify-center font-black text-xs">
                                                            {device.code.slice(0, 2)}
                                                        </div>
                                                        <div>
                                                            <span className="font-mono font-bold text-sm text-text-main tracking-widest block">{device.code}</span>
                                                            <span className="text-[9px] text-text-secondary font-medium uppercase">{new Date(device.createdAt).toDateString()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl w-fit pr-4">
                                                        <div className="size-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                                                            <LinkIcon size={14} className="text-primary" />
                                                        </div>
                                                        <div className="min-w-0 max-w-[150px]">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase block leading-none mb-1">Target link</span>
                                                            <span className="text-xs font-bold text-text-main truncate block">{deviceUrl}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => copyToClipboard(deviceUrl)}
                                                            className="size-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-primary/5 hover:border-primary/20 transition-all shadow-sm"
                                                        >
                                                            <Copy size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4 p-2 bg-slate-50 border border-slate-100 rounded-xl w-fit pr-4">
                                                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                                            <QRCodeCanvas
                                                                id={`qr-${device.id}`}
                                                                value={deviceUrl}
                                                                size={1024}
                                                                level="H"
                                                                style={{ width: 32, height: 32 }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase block leading-none mb-1">Print Code</span>
                                                            <button
                                                                onClick={() => downloadQRCode(device.id, device.code)}
                                                                className="flex items-center gap-1.5 text-[10px] font-black text-primary hover:underline uppercase tracking-tighter"
                                                            >
                                                                <Download size={12} />
                                                                Download PNG
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${device.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                                            <span className="text-xs font-bold text-text-main uppercase tracking-tighter">{device.status}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[10px] text-text-secondary font-medium uppercase">{device.location || 'No location set'}</span>
                                                            {deviceBranch && (
                                                                <div className="flex items-center gap-1 text-[9px] text-primary font-bold uppercase">
                                                                    <Building2 size={10} />
                                                                    {deviceBranch.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditModal(device)}
                                                            className="px-4 py-2 bg-white border border-slate-200 text-[10px] font-black text-slate-800 rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm uppercase tracking-widest"
                                                        >
                                                            Details
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Decommission this asset?')) {
                                                                    deleteMutation.mutate(device.id);
                                                                }
                                                            }}
                                                            disabled={deleteMutation.isPending}
                                                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                                        >
                                                            {deleteMutation.isPending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div> : <Trash2 size={16} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit/Details Modal */}
            <AnimatePresence>
                {isEditModalOpen && selectedLink && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 bg-primary flex items-center justify-center rounded-2xl shadow-lg shadow-primary/20">
                                        <Smartphone className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-display font-black text-text-main uppercase tracking-tight leading-none mb-1">Asset Configuration</h3>
                                        <p className="text-[10px] text-text-secondary font-medium uppercase tracking-[0.2em]">ID: {selectedLink.code}</p>
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
                                    <div className="p-4 bg-white border-2 border-primary/10 rounded-3xl shadow-inner group relative">
                                        <QRCodeCanvas
                                            id={`qr-modal-${selectedLink.id}`}
                                            value={`${window.location.origin}/tap/${selectedLink.code}`}
                                            size={1024}
                                            level="H"
                                            includeMargin={true}
                                            style={{ width: 180, height: 180 }}
                                        />
                                        <div className="absolute inset-x-0 -bottom-3 flex justify-center">
                                            <span className="bg-primary text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">Cloud Static Link</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-text-secondary font-medium text-center max-w-[250px]">
                                        This static link redirects visitors to your target platform based on your cloud configuration.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700 ml-1">Asset Name</label>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full h-12 bg-gray-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none"
                                            placeholder="e.g. Reception Desk"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700 ml-1">Physical Location</label>
                                        <input
                                            type="text"
                                            value={editData.location}
                                            onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                            className="w-full h-12 bg-gray-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none"
                                            placeholder="e.g. Ground Floor, Lobby"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700 ml-1">Assign to Branch</label>
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
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Battery Level</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${selectedLink.batteryLevel}%` }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-800">{selectedLink.batteryLevel}%</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Scans</span>
                                        <span className="text-sm font-bold text-slate-800">{selectedLink.totalScans}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 h-14 bg-slate-50 text-slate-800 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-100 transition-all border border-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveEdit}
                                        className="flex-2 h-14 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 px-8"
                                    >
                                        <Save size={18} />
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
