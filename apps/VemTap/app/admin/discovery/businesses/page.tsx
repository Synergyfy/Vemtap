'use client';

import React from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { useDiscoveryBusinesses } from '@/services/discovery/hooks';
import BusinessActionModal from '@/components/admin/discovery/BusinessActionModal';
import { 
    Search, Filter, Download, MoreHorizontal, 
    Eye, Ban, CheckCircle2, XCircle, MapPin, 
    TrendingUp, MousePointerClick, Tag
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DiscoveryBusinessesPage() {
    const { data: businesses, isLoading } = useDiscoveryBusinesses();
    const [actionModal, setActionModal] = React.useState<{ isOpen: boolean, type: 'suspend' | 'approve' | 'reject' | 'investigate', businessName: string } | null>(null);

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/businesses" />

            {actionModal && (
                <BusinessActionModal 
                    isOpen={actionModal.isOpen}
                    onClose={() => setActionModal(null)}
                    type={actionModal.type}
                    businessName={actionModal.businessName}
                    onConfirm={() => {
                        console.log('Action confirmed');
                        setActionModal(null);
                    }}
                />
            )}

            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search businesses by name, location or category..."
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={16} /> Filters
                    </button>
                </div>
                <button className="h-12 px-6 rounded-2xl bg-text-main text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                    <Download size={16} /> Export Network List
                </button>
            </div>

            {/* Businesses Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Business Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Category & Plan</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Location</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Active Offers</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Sent / Recv</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Revenue Generated</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-6 py-4 bg-gray-50/50 h-16"></td>
                                    </tr>
                                ))
                            ) : (businesses?.data || []).map((biz: any) => (
                                <tr key={biz.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-bold">
                                                {biz.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-main group-hover:text-primary transition-colors">{biz.name}</p>
                                                <p className="text-[10px] font-medium text-text-secondary mt-0.5">Joined {new Date(biz.dateJoined).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-text-main">{biz.category}</p>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{biz.plan} Plan</span>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary font-medium italic">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={12} className="text-gray-400" />
                                            {biz.location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} className="text-emerald-500" />
                                            <span className="font-bold text-text-main">{biz.activeOffers}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[11px] font-bold">
                                            <span className="text-blue-600">{biz.referralsSent}</span>
                                            <span className="text-gray-300">/</span>
                                            <span className="text-purple-600">{biz.referralsReceived}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <TrendingUp size={14} className="text-emerald-500" />
                                            <span className="font-bold text-text-main">₦{biz.revenueGenerated.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            biz.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            <span className={`size-1.5 rounded-full ${biz.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                                            {biz.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/discovery/businesses/${biz.id}`} title="View Details" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all">
                                                <Eye size={16} />
                                            </Link>
                                            <button 
                                                onClick={() => setActionModal({ isOpen: true, type: 'suspend', businessName: biz.name })}
                                                title="Suspend" 
                                                className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-rose-100 hover:text-rose-600 transition-all"
                                            >
                                                <Ban size={16} />
                                            </button>
                                            <button className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-gray-100 transition-all">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-medium text-text-secondary">Showing <span className="text-text-main font-bold">1 - {businesses?.data?.length || 0}</span> of {businesses?.meta?.total || 0} businesses</p>
                    <div className="flex items-center gap-2">
                        <button disabled className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-text-secondary disabled:opacity-50 transition-all">Previous</button>
                        <button disabled={(businesses?.data?.length ?? 0) < 10} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-text-main hover:bg-gray-50 transition-all">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
