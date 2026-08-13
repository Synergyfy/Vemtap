'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { QrCode, Link as LinkIcon, Download, Copy, ExternalLink, Plus, Trash2, Cpu } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface NFCLink {
    id: string;
    name: string;
    url: string;
    scans: number;
    createdAt: string;
}

export default function HardwarePage() {
    const { storeName } = useCustomerFlowStore();
    const [origin, setOrigin] = useState('https://vemtap.com');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    const [links, setLinks] = useState<NFCLink[]>([]);

    useEffect(() => {
        setLinks([
            { id: '1', name: 'Main Entrance Tag', url: `${origin}/${storeName.toLowerCase().replace(/\s+/g, '-')}/entrance`, scans: 142, createdAt: '2023-12-01' },
            { id: '2', name: 'Table 4 Tag', url: `${origin}/${storeName.toLowerCase().replace(/\s+/g, '-')}/table-4`, scans: 89, createdAt: '2023-12-05' },
        ]);
    }, [storeName, origin]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newLinkName, setNewLinkName] = useState('');

    const handleCreateLink = () => {
        if (!newLinkName) {
            toast.error('Please enter a link name');
            return;
        }

        const newLink: NFCLink = {
            id: Date.now().toString(),
            name: newLinkName,
            url: `${origin}/${storeName.toLowerCase().replace(/\s+/g, '-')}/${newLinkName.toLowerCase().replace(/\s+/g, '-')}`,
            scans: 0,
            createdAt: new Date().toISOString().split('T')[0]
        };

        setLinks([newLink, ...links]);
        setNewLinkName('');
        setIsCreateModalOpen(false);
        toast.success('NFC Link generated successfully!');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Link copied to clipboard');
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <PageHeader
                title="Hardware & NFC Links"
                description="Generate and manage links for your NFC cards and QR codes"
                actions={
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20"
                    >
                        <Plus size={18} />
                        Generate New Link
                    </button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
                {/* Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-linear-to-br from-primary to-primary-hover rounded-3xl p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="size-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                <Cpu size={32} />
                            </div>
                            <h3 className="text-2xl font-display font-bold mb-3">NFC Hardware</h3>
                            <p className="text-white/80 text-sm leading-relaxed mb-8">
                                Each generated link can be written to an NFC card or printed as a QR code. When customers tap or scan, they&apos;ll be directed to your business profile.
                            </p>
                            <Link
                                href="/marketplace"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                            >
                                Request Quote
                                <ExternalLink size={16} />
                            </Link>
                        </div>
                        {/* Abstract Decorations */}
                        <div className="absolute -bottom-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -top-10 -left-10 size-32 bg-white/5 rounded-full blur-2xl" />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h4 className="font-bold text-text-main mb-4 flex items-center gap-2">
                            <span className="material-icons-round text-primary text-xl">help_outline</span>
                            Quick Guide
                        </h4>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <span className="size-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-text-secondary shrink-0">1</span>
                                <p className="text-xs text-text-secondary leading-normal">Generate a unique link for each physical location or table.</p>
                            </li>
                            <li className="flex gap-3">
                                <span className="size-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-text-secondary shrink-0">2</span>
                                <p className="text-xs text-text-secondary leading-normal">Write the link to an NFC tag using a mobile NFC writer app.</p>
                            </li>
                            <li className="flex gap-3">
                                <span className="size-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-text-secondary shrink-0">3</span>
                                <p className="text-xs text-text-secondary leading-normal">Download the QR code for signage and physical menus.</p>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Links List */}
                <div className="lg:col-span-2 space-y-6">
                    {links.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-200 border-dashed p-20 text-center">
                            <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <LinkIcon size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-text-main mb-2">No Links Generated Yet</h3>
                            <p className="text-text-secondary mb-8 max-w-xs mx-auto text-sm">Create your first NFC link to start connecting with physical hardware.</p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm"
                            >
                                <Plus size={18} />
                                Create Link
                            </button>
                        </div>
                    ) : (
                        links.map((link) => (
                            <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 transition-colors shrink-0">
                                            <QrCode size={32} className="text-text-secondary group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="font-display font-bold text-text-main text-lg mb-1">{link.name}</h3>
                                            <div className="flex items-center gap-4 text-xs font-medium text-text-secondary">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="material-icons-round text-sm">schedule</span>
                                                    Created {link.createdAt}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-primary">
                                                    <span className="material-icons-round text-sm">analytics</span>
                                                    {link.scans} Scans
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => copyToClipboard(link.url)}
                                            className="h-11 px-4 bg-gray-50 text-text-main font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 text-xs"
                                        >
                                            <Copy size={16} />
                                            Copy Link
                                        </button>
                                        <button className="h-11 px-4 bg-primary/5 text-primary font-bold rounded-xl hover:bg-primary/10 transition-all flex items-center gap-2 text-xs">
                                            <Download size={16} />
                                            QR Code
                                        </button>
                                        <button
                                            onClick={() => setLinks(links.filter(l => l.id !== link.id))}
                                            className="size-11 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 overflow-hidden">
                                    <code className="text-[10px] font-mono text-text-secondary/60 break-all select-all hover:text-primary transition-colors cursor-pointer">
                                        {link.url}
                                    </code>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-text-main/40 backdrop-blur-sm"  />
                    <div className="relative bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-display font-bold text-text-main mb-2">Generate NFC Link</h3>
                        <p className="text-text-secondary text-sm mb-8 font-medium">Create a new unique identifier for your hardware.</p>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary ml-1">Internal Name</label>
                                <input
                                    type="text"
                                    value={newLinkName}
                                    onChange={(e) => setNewLinkName(e.target.value)}
                                    placeholder="e.g. Lobby Entrance, Table 12, VIP Lounge"
                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                />
                            </div>

                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="text-xs font-bold text-primary mb-1">Generated URL preview:</p>
                                <p className="text-[10px] font-mono text-text-secondary break-all">
                                    {origin}/{storeName.toLowerCase().replace(/\s+/g, '-')}/{newLinkName.toLowerCase().replace(/\s+/g, '-') || '...'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="h-12 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateLink}
                                    className="h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    Create Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
