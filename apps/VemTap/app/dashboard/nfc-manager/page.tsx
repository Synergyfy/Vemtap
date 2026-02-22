'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuoteStore } from '@/store/quoteStore';
import { Smartphone, Plus, QrCode, Copy, Download, Trash2, Link as LinkIcon, X, Save, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

import { useNfcStore, NFCLink } from '@/store/nfcStore';

export default function NFCManagerPage() {
    const { user } = useAuthStore();
    const { businessId: customerFlowStoreId } = useCustomerFlowStore();
    const { quotes, consumeNfcQuota, getRemainingNfcQuota } = useQuoteStore();
    const businessId = user?.businessId || customerFlowStoreId;

    const { links, addLinks, updateLink, removeLink: storeRemoveLink, getLinksByBusiness } = useNfcStore();
    const [quantity, setQuantity] = useState<number>(1);
    const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
    const generatedLinks = getLinksByBusiness(businessId || '');
    const trialUsed = generatedLinks.some(l => l.quoteId === 'TRIAL');
    const [selectedLink, setSelectedLink] = useState<NFCLink | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editUrl, setEditUrl] = useState('');

    // Only show approved quotes to the business
    const approvedNfcQuotes = quotes.filter(q => q.status === 'Approved');
    const selectedQuote = approvedNfcQuotes.find(q => q.id === selectedQuoteId);
    const remainingQuota = selectedQuoteId ? getRemainingNfcQuota(selectedQuoteId) : 0;
    const totalApprovedQuota = approvedNfcQuotes.reduce((sum, q) => sum + Math.max(0, q.quantity - (q.nfcLinksGenerated || 0)), 0);

    const generateLinks = (isTrial: boolean = false) => {
        if (!businessId) {
            toast.error('Business ID not found. Please complete setup first.');
            return;
        }

        if (isTrial) {
            if (trialUsed) {
                toast.error('You have already used your demo allocation.');
                return;
            }
        } else {
            if (!selectedQuoteId) {
                toast.error('Please select an approved quote to generate against.');
                return;
            }
            if (quantity > remainingQuota) {
                toast.error(`You only have ${remainingQuota} NFC units remaining in this quote.`);
                return;
            }
        }

        const newLinks: any[] = [];
        const timestamp = new Date().toISOString();
        const baseUrl = window.location.origin;

        const genCount = isTrial ? 1 : quantity;

        for (let i = 0; i < genCount; i++) {
            const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
            const url = `${baseUrl}/${businessId}/${uniqueId}`;
            newLinks.push({
                id: `NFC-${Date.now()}-${i}`,
                businessId: businessId!,
                quoteId: isTrial ? 'TRIAL' : selectedQuoteId,
                url,
                label: `NFC Asset ${uniqueId}`,
                createdAt: timestamp,
                status: 'active' as const,
                uniqueId: uniqueId
            });
        }

        if (!isTrial) {
            consumeNfcQuota(selectedQuoteId, quantity);
        }

        addLinks(newLinks);
        toast.success(isTrial ? 'Generated your Demo asset!' : `Generated ${quantity} unique NFC asset${quantity > 1 ? 's' : ''}`);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Link copied to clipboard');
    };

    const downloadQRCode = (id: string, uniqueId: string) => {
        const canvas = document.getElementById(`qr-${id}`) as HTMLCanvasElement;
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `QR-${uniqueId}.png`;
            link.href = url;
            link.click();
        }
    };

    const removeLink = (id: string) => {
        if (confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
            storeRemoveLink(id);
            toast.success('Asset removed');
        }
    };

    const openEditModal = (link: NFCLink) => {
        setSelectedLink(link);
        setEditUrl(link.url);
        setIsEditModalOpen(true);
    };

    const saveEdit = () => {
        if (!selectedLink) return;
        updateLink(selectedLink.id, { url: editUrl });
        setIsEditModalOpen(false);
        setSelectedLink(null);
        toast.success('Link updated and assets synchronized');
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
                {!trialUsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-emerald-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden border border-white/10 shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full -mr-16 -mt-16" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-black mb-1">Demo Allocation</h3>
                                    <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Free Initial Unit</p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <Smartphone className="text-emerald-400" size={20} />
                                </div>
                            </div>
                            <p className="text-xs font-medium text-white/70 mb-8 leading-relaxed">
                                Get started immediately! We've allocated one free NFC slot for your business to test the VemTap experience.
                            </p>
                            <button
                                onClick={() => generateLinks(true)}
                                className="w-full h-14 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Generate Demo Asset
                            </button>
                        </div>
                    </motion.div>
                )}

                {approvedNfcQuotes.length === 0 ? (
                    <div className={`${trialUsed ? 'col-span-3' : 'col-span-2'} bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8 flex items-start gap-5`}>
                        <div className="size-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-amber-900 mb-1">No Approved Quotes</h3>
                            <p className="text-sm text-amber-700 font-medium max-w-xl">
                                You don't have any admin-approved NFC hardware quotes yet. Visit the <strong>Marketplace</strong> to request a quote. Once approved, you'll be able to generate bulk NFC links here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={`${trialUsed ? 'col-span-3' : 'col-span-2'} bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm`}>
                        <div className="mb-6">
                            <h3 className="font-display font-bold text-text-main mb-1">Approved NFC Allocations</h3>
                            <p className="text-[10px] text-text-secondary font-medium uppercase tracking-widest">
                                {totalApprovedQuota} units remaining across {approvedNfcQuotes.length} approved quote{approvedNfcQuotes.length > 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {approvedNfcQuotes.map(q => {
                                const remaining = Math.max(0, q.quantity - (q.nfcLinksGenerated || 0));
                                const used = q.nfcLinksGenerated || 0;
                                const pct = Math.round((used / q.quantity) * 100);
                                const isSelected = selectedQuoteId === q.id;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setSelectedQuoteId(isSelected ? '' : q.id)}
                                        className={`text-left p-4 rounded-2xl border-2 transition-all ${isSelected
                                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                            : 'border-gray-100 bg-gray-50/50 hover:border-primary/30'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="text-xs font-black text-text-main">{q.productName}</p>
                                                <p className="text-[10px] text-text-secondary font-medium">{q.id}</p>
                                            </div>
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase ${remaining > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                <CheckCircle2 size={10} />
                                                Approved
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold text-text-secondary">
                                                <span>{used} used</span>
                                                <span>{remaining} remaining / {q.quantity} total</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-400' : pct > 60 ? 'bg-amber-400' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Generator */}
                        <div className={`flex flex-col md:flex-row items-end gap-6 ${!selectedQuoteId ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex-1 space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-700 ml-1">
                                    Quantity to Generate
                                    {selectedQuoteId && (
                                        <span className="ml-2 text-primary">
                                            (max: {remainingQuota})
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <Plus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        max={remainingQuota}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, remainingQuota))}
                                        className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => generateLinks(false)}
                                disabled={!selectedQuoteId || remainingQuota === 0 || quantity > remainingQuota}
                                className="h-14 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <QrCode size={18} />
                                Generate Assets
                            </button>
                        </div>
                        {!selectedQuoteId && (
                            <p className="text-[10px] text-text-secondary font-medium mt-3 flex items-center gap-1.5">
                                <Clock size={12} />
                                Select an approved quote above to enable generation
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Links Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="font-display font-bold text-text-main">Connected NFC Hardware</h3>
                        <p className="text-[10px] text-text-secondary font-medium">Manage individual tag configurations and print-ready QR codes.</p>
                    </div>
                    <span className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        {generatedLinks.length} Assets Active
                    </span>
                </div>

                {generatedLinks.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="size-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto">
                            <Smartphone size={32} />
                        </div>
                        <p className="text-sm font-bold text-text-secondary">No assets generated yet. Select an approved quote and generate links above.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/30 text-[10px] font-black uppercase tracking-widest text-slate-700 border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-4">Hardware ID</th>
                                    <th className="px-8 py-4">Configuration</th>
                                    <th className="px-8 py-4">Asset Preview</th>
                                    <th className="px-8 py-4 text-right">Utility</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <AnimatePresence mode="popLayout">
                                    {generatedLinks.map((link) => (
                                        <motion.tr
                                            key={link.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl flex items-center justify-center font-black text-xs">
                                                        {link.uniqueId.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <span className="font-mono font-bold text-sm text-text-main tracking-widest block">{link.uniqueId}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] text-text-secondary font-medium uppercase">{new Date(link.createdAt).toDateString()}</span>
                                                            {link.quoteId === 'TRIAL' && (
                                                                <span className="text-[8px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Demo</span>
                                                            )}
                                                        </div>
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
                                                        <span className="text-xs font-bold text-text-main truncate block">{link.url}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => copyToClipboard(link.url)}
                                                        className="size-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-primary/5 hover:border-primary/20 transition-all shadow-sm"
                                                    >
                                                        <Copy size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4 p-2 bg-slate-50 border border-slate-100 rounded-xl w-fit pr-4">
                                                    <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                        <QRCodeCanvas
                                                            id={`qr-${link.id}`}
                                                            value={link.url}
                                                            size={32}
                                                            level="H"
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase block leading-none mb-1">Print Code</span>
                                                        <button
                                                            onClick={() => downloadQRCode(link.id, link.uniqueId)}
                                                            className="flex items-center gap-1.5 text-[10px] font-black text-primary hover:underline uppercase tracking-tighter"
                                                        >
                                                            <Download size={12} />
                                                            Download PNG
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(link)}
                                                        className="px-4 py-2 bg-white border border-slate-200 text-[10px] font-black text-slate-800 rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm uppercase tracking-widest"
                                                    >
                                                        Details
                                                    </button>
                                                    <button
                                                        onClick={() => removeLink(link.id)}
                                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
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
                                        <p className="text-[10px] text-text-secondary font-medium uppercase tracking-[0.2em]">ID: {selectedLink.uniqueId}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="size-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-white border-2 border-primary/10 rounded-3xl shadow-inner group relative">
                                        <QRCodeCanvas
                                            id={`qr-modal-${selectedLink.id}`}
                                            value={editUrl}
                                            size={180}
                                            level="H"
                                            includeMargin={true}
                                        />
                                        <div className="absolute inset-x-0 -bottom-3 flex justify-center">
                                            <span className="bg-primary text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">Live Preview</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-text-secondary font-medium text-center max-w-[250px]">
                                        QR Code updates in real-time as you modify the destination URL.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Destination URL</label>
                                        <button
                                            onClick={() => selectedLink && setEditUrl(`${window.location.origin}/${businessId}/${selectedLink.uniqueId}`)}
                                            className="text-[10px] font-black text-primary hover:underline uppercase"
                                        >
                                            Reset to Default
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                                        <input
                                            type="text"
                                            value={editUrl}
                                            onChange={(e) => setEditUrl(e.target.value)}
                                            className="w-full h-14 bg-gray-50 border border-slate-200 rounded-2xl pl-12 pr-4 text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                            placeholder="Enter redirect URL..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Setup Date</span>
                                        <span className="text-xs font-bold text-slate-800">{new Date(selectedLink.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Asset Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xs font-bold text-slate-800 uppercase tracking-tighter">Connected</span>
                                        </div>
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
