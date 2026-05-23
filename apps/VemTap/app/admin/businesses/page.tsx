'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/notify';
import { adminBusinessesApi, adminCreditsApi, adminSubscriptionsApi } from '@/lib/api/admin';
import { CheckCircle, XCircle, Search, Trash2, Edit, MoreVertical, Plus, Download, Filter, Eye, EyeOff, CreditCard, Ban, RotateCcw, Loader2, Check, RefreshCw, Copy, Layers, UserPlus, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PasswordValidation from '@/components/shared/PasswordValidation';
import { fetchPricingPlans } from '@/lib/api/pricing';
import { PricingPlan } from '@/types/pricing';

const PAGE_SIZE = 10;


interface Business {
    id: string;
    name: string;
    email: string;
    officialEmail?: string;
    phone?: string;
    whatsappNumber?: string;
    address?: string;
    status: string;
    planId?: string;
    createdAt: string;
    owner?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
    branches?: any[];
    devices?: any[];
    category?: string;
    subcategory?: string;
    monthlyVisitors?: string;
    goal?: string;
    totalBranches?: number;
    // New registration fields
    isRegistered?: boolean;
    registrationNumber?: string;
    state?: string;
    city?: string;
    businessWebsite?: string;
}

const normalizeBusinessStatus = (status?: string) => (status || '').toLowerCase();

const toNumber = (value: any): number | undefined => {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
};

const extractBusinesses = (payload: any): { items: Business[]; total?: number; stats?: any } => {
    const roots = [payload, payload?.data, payload?.data?.data, payload?.result, payload?.payload];
    const total =
        toNumber(payload?.meta?.total) ??
        toNumber(payload?.data?.meta?.total) ??
        toNumber(payload?.pagination?.total) ??
        toNumber(payload?.data?.pagination?.total) ??
        toNumber(payload?.total) ??
        toNumber(payload?.data?.total);
    const stats = payload?.stats || payload?.data?.stats;

    for (const root of roots) {
        if (Array.isArray(root)) return { items: root, total, stats };
        if (!root) continue;
        const listKeys = ['businesses', 'items', 'rows', 'results', 'list', 'data'];
        for (const key of listKeys) {
            if (Array.isArray(root[key])) return { items: root[key], total, stats };
        }
    }
    return { items: [], total, stats };
};

const DetailItem = ({ label, value, icon, link }: { label: string, value?: string | number | null, icon: string, link?: boolean }) => {
    if (!value && value !== 0) value = 'Not provided';
    const displayValue = (typeof value === 'object' && value !== null && 'name' in (value as any)) 
        ? (value as any).name 
        : value;

    return (
        <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100">
                <span className="material-icons-round text-lg">{icon}</span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-0.5">{label}</p>
                {link && displayValue !== 'Not provided' ? (
                    <a href={String(displayValue).startsWith('http') ? String(displayValue) : `https://${displayValue}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline break-all truncate block">
                        {displayValue}
                    </a>
                ) : (
                    <p className="text-sm font-bold text-text-main break-all">{displayValue}</p>
                )}
            </div>
        </div>
    );
};

export default function AdminBusinessesPage() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [metaTotal, setMetaTotal] = useState<number | null>(null);
    const [apiStats, setApiStats] = useState<{ active?: number; pending?: number; suspended?: number } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Confirmation Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'suspend' | 'reactivate' | 'delete' | null>(null);
    const [confirmReason, setConfirmReason] = useState('');

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailBusiness, setDetailBusiness] = useState<Business | null>(null);
    const [passwordValue, setPasswordValue] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordValidation, setShowPasswordValidation] = useState(false);

    // Affiliate Manual Attachment State
    const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
    const [attachBusinessTarget, setAttachBusinessTarget] = useState<Business | null>(null);
    const [affiliateSearchQuery, setAffiliateSearchQuery] = useState('');
    const [affiliatesList, setAffiliatesList] = useState<any[]>([]);
    const [isAffiliatesLoading, setIsAffiliatesLoading] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);
    const [isAttaching, setIsAttaching] = useState(false);
    const [isConfirmAttachOpen, setIsConfirmAttachOpen] = useState(false);

    // Optional Affiliate referral on creation state
    const [registerSelectedAffiliate, setRegisterSelectedAffiliate] = useState<any | null>(null);
    const [registerAffiliateSearchQuery, setRegisterAffiliateSearchQuery] = useState('');
    const [registerAffiliatesList, setRegisterAffiliatesList] = useState<any[]>([]);
    const [isRegisterAffiliatesLoading, setIsRegisterAffiliatesLoading] = useState(false);

    // Fetch active affiliates for existing business manual attachment modal
    useEffect(() => {
        if (!isAttachModalOpen) return;
        const fetchAffiliates = async () => {
            setIsAffiliatesLoading(true);
            try {
                const q = new URLSearchParams();
                if (affiliateSearchQuery) q.set('search', affiliateSearchQuery);
                q.set('status', 'ACTIVE');
                const res = await fetch(`http://localhost:4005/api/external/affiliates?${q.toString()}`, {
                    headers: {
                        'x-api-key': process.env.NEXT_PUBLIC_VEMTAP_AFFILIATE_KEY ?? ''
                    }
                });
                if (!res.ok) throw new Error('Failed to fetch affiliates');
                const result = await res.json();
                setAffiliatesList(result.data || []);
            } catch (err: any) {
                console.error(err);
            } finally {
                setIsAffiliatesLoading(false);
            }
        };

        const t = setTimeout(() => {
            fetchAffiliates();
        }, 300);

        return () => clearTimeout(t);
    }, [affiliateSearchQuery, isAttachModalOpen]);

    // Fetch active affiliates for new business registration modal
    useEffect(() => {
        if (!isModalOpen) return;
        const fetchRegisterAffiliates = async () => {
            setIsRegisterAffiliatesLoading(true);
            try {
                const q = new URLSearchParams();
                if (registerAffiliateSearchQuery) q.set('search', registerAffiliateSearchQuery);
                q.set('status', 'ACTIVE');
                const res = await fetch(`http://localhost:4005/api/external/affiliates?${q.toString()}`, {
                    headers: {
                        'x-api-key': process.env.NEXT_PUBLIC_VEMTAP_AFFILIATE_KEY ?? ''
                    }
                });
                if (!res.ok) throw new Error('Failed to fetch affiliates');
                const result = await res.json();
                setRegisterAffiliatesList(result.data || []);
            } catch (err: any) {
                console.error(err);
            } finally {
                setIsRegisterAffiliatesLoading(false);
            }
        };

        const t = setTimeout(() => {
            fetchRegisterAffiliates();
        }, 300);

        return () => clearTimeout(t);
    }, [registerAffiliateSearchQuery, isModalOpen]);

    const handleManualAttach = async () => {
        if (!attachBusinessTarget || !selectedAffiliate) return;
        setIsAttaching(true);
        try {
            const payload = {
                affiliateId: selectedAffiliate.id,
                businessName: attachBusinessTarget.name,
                ownerName: attachBusinessTarget.owner ? `${attachBusinessTarget.owner.firstName} ${attachBusinessTarget.owner.lastName}` : 'N/A',
                email: attachBusinessTarget.officialEmail || attachBusinessTarget.email,
                phone: attachBusinessTarget.phone || 'N/A',
                planType: 'BASIC',
                address: attachBusinessTarget.address || 'N/A',
                businessType: 'Retail'
            };
            const res = await fetch('http://localhost:4005/api/external/businesses/attach', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.NEXT_PUBLIC_VEMTAP_AFFILIATE_KEY ?? ''
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Attachment failed');
            }

            notify.success('Business successfully attached to affiliate!');
            setIsAttachModalOpen(false);
            setAttachBusinessTarget(null);
            setSelectedAffiliate(null);
            setAffiliateSearchQuery('');
            setIsConfirmAttachOpen(false);
            fetchBusinesses();
        } catch (err: any) {
            notify.error(err.message || 'Failed to attach business');
        } finally {
            setIsAttaching(false);
        }
    };


    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ 
        top: number; 
        left: number; 
        isFlipped: boolean; 
        rectTop: number; 
        rectBottom: number 
    } | null>(null);
    const menuTriggerRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [creditBusiness, setCreditBusiness] = useState<Business | null>(null);
    const [creditBalances, setCreditBalances] = useState<any>(null);
    const [isCreditLoading, setIsCreditLoading] = useState(false);
    const [adjustForm, setAdjustForm] = useState({ channel: 'SMS', amount: '', action: 'add' });

    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [planBusiness, setPlanBusiness] = useState<Business | null>(null);
    const [availablePlans, setAvailablePlans] = useState<PricingPlan[]>([]);
    const [isPlansLoading, setIsPlansLoading] = useState(false);
    const [planForm, setPlanForm] = useState({ planId: '', billingPeriod: 'monthly' as 'monthly' | 'quarterly' | 'yearly', customEndDate: '' });

    const fetchCredits = async (businessId: string) => {
        setIsCreditLoading(true);
        try {
            const data = await adminCreditsApi.getBusinessBalance(businessId);
            setCreditBalances(data);
        } catch (err: any) {
            notify.error('Failed to fetch credits');
        } finally {
            setIsCreditLoading(false);
        }
    };

    const handleAdjustCredits = async () => {
        if (!creditBusiness || !adjustForm.amount) return;
        setIsSubmitting(true);
        try {
            await adminCreditsApi.adjustCredits({
                businessId: creditBusiness.id,
                channel: adjustForm.channel as any,
                amount: parseInt(adjustForm.amount),
                action: adjustForm.action as any
            });
            notify.success('Credits adjusted successfully');
            fetchCredits(creditBusiness.id);
            setAdjustForm({ ...adjustForm, amount: '' });
        } catch (err: any) {
            notify.error(err.message || 'Failed to adjust credits');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchPlans = async () => {
        setIsPlansLoading(true);
        try {
            const data = await fetchPricingPlans();
            setAvailablePlans(data);
        } catch (err: any) {
            notify.error('Failed to fetch pricing plans');
        } finally {
            setIsPlansLoading(false);
        }
    };

    const handleChangePlan = async () => {
        if (!planBusiness || !planForm.planId) return;
        setIsSubmitting(true);
        try {
            await adminSubscriptionsApi.subscribe({
                businessId: planBusiness.id,
                planId: planForm.planId,
                billingPeriod: planForm.billingPeriod,
                isAdminOverride: true,
                customEndDate: planForm.customEndDate || undefined
            });
            notify.success('Plan changed successfully');
            setIsPlanModalOpen(false);
            fetchBusinesses();
        } catch (err: any) {
            notify.error(err.message || 'Failed to change plan');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus]);

    const fetchBusinesses = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminBusinessesApi.getAll({
                search: searchQuery || undefined,
                status: filterStatus ? filterStatus.toLowerCase() : undefined,
                page: currentPage,
                limit: PAGE_SIZE,
            });
            const parsed = extractBusinesses(data);
            setBusinesses(parsed.items);
            setMetaTotal(parsed.total ?? null);
            setApiStats(parsed.stats || null);
            setTotalPages(Math.max(1, Math.ceil((parsed.total ?? parsed.items.length) / PAGE_SIZE)));
        } catch (err: any) {
            notify.error(err.message || 'Failed to load businesses');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, filterStatus, currentPage]);

    useEffect(() => {
        const t = setTimeout(() => fetchBusinesses(), 400);
        return () => clearTimeout(t);
    }, [fetchBusinesses]);

    // Close menu on click outside
    useEffect(() => {
        if (!activeMenuId) return;
        const handleClick = () => setActiveMenuId(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [activeMenuId]);

    const stats = [
        { label: 'Total', value: metaTotal ?? businesses.length, icon: 'store', color: 'blue' },
        { label: 'Verified', value: apiStats?.active ?? businesses.filter(b => normalizeBusinessStatus(b.status) === 'active' || (b as any).isVerified).length, icon: 'check_circle', color: 'green' },
        { label: 'Unverified', value: apiStats?.pending ?? businesses.filter(b => normalizeBusinessStatus(b.status) === 'pending' || !(b as any).isVerified).length, icon: 'pending', color: 'yellow' },
    ];

    const handleAction = (action: 'suspend' | 'reactivate' | 'delete', business: Business) => {
        setSelectedBusiness(business);
        setConfirmAction(action);
        setConfirmReason('');
        setIsConfirmModalOpen(true);
    };

    const executeAction = async () => {
        if (!selectedBusiness || !confirmAction) return;

        setIsSubmitting(true);
        const labels = { suspend: 'Suspend', reactivate: 'Reactivate', delete: 'Delete' };

        try {
            if (confirmAction === 'suspend') await adminBusinessesApi.suspend(selectedBusiness.id, confirmReason);
            else if (confirmAction === 'reactivate') await adminBusinessesApi.reactivate(selectedBusiness.id);
            else if (confirmAction === 'delete') await adminBusinessesApi.delete(selectedBusiness.id);

            notify.success(`Business ${labels[confirmAction].toLowerCase()}d successfully`);
            setIsConfirmModalOpen(false);
            fetchBusinesses();
        } catch (err: any) {
            notify.error(err.message || 'Action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnverifiedClick = (biz: Business) => {
        // Since `documents` isn't fully typed on Business in this page yet, 
        // fallback to checking `isRegistered` or just `biz.documents` directly.
        const docs = (biz as any).documents;
        if (!docs || (!Array.isArray(docs) && Object.keys(docs).length === 0) || (Array.isArray(docs) && docs.length === 0)) {
            notify.error('No documents uploaded');
            return;
        }
        router.push('/admin/businesses/pending');
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const fd = new FormData(e.currentTarget);
        const ownerPassword = fd.get('ownerPassword') as string;

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(ownerPassword)) {
            notify.error('Password must meet all security requirements');
            setIsSubmitting(false);
            return;
        }

        const payload = {
            name: fd.get('name') as string,
            ownerEmail: fd.get('ownerEmail') as string,
            ownerFirstName: fd.get('ownerFirstName') as string,
            ownerLastName: fd.get('ownerLastName') as string,
            ownerPassword: ownerPassword,
            ownerPhone: fd.get('phone') as string,
            businessNumber: fd.get('phone') as string,
            address: fd.get('address') as string,
        };
        try {
            await adminBusinessesApi.create(payload);
            notify.success('Business registered successfully');

            if (registerSelectedAffiliate) {
                try {
                    const attachPayload = {
                        affiliateId: registerSelectedAffiliate.id,
                        businessName: payload.name,
                        ownerName: `${payload.ownerFirstName} ${payload.ownerLastName}`,
                        email: payload.ownerEmail,
                        phone: payload.ownerPhone,
                        planType: 'BASIC',
                        address: payload.address || 'N/A',
                        businessType: 'Retail'
                    };
                    const attachRes = await fetch('http://localhost:4005/api/external/businesses/attach', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': process.env.NEXT_PUBLIC_VEMTAP_AFFILIATE_KEY ?? ''
                        },
                        body: JSON.stringify(attachPayload)
                    });
                    if (!attachRes.ok) {
                        const errorData = await attachRes.json();
                        notify.error(`Affiliate attachment failed: ${errorData.message}`);
                    } else {
                        notify.success('Affiliate successfully attached to this business!');
                    }
                } catch (attachErr: any) {
                    notify.error(`Affiliate attachment failed: ${attachErr.message}`);
                }
            }

            setIsModalOpen(false);
            setRegisterSelectedAffiliate(null);
            setRegisterAffiliateSearchQuery('');
            fetchBusinesses();
        } catch (err: any) {
            notify.error(err.message || 'Failed to create business');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (biz: Business) => {
        const normalized = normalizeBusinessStatus(biz.status);
        const isVerified = (biz as any).isVerified;

        if (isVerified || normalized === 'active') {
            return { label: 'Verified', classes: 'bg-green-50 text-green-600', icon: <CheckCircle size={12} /> };
        }
        if (normalized === 'suspended') {
            return { label: 'Suspended', classes: 'bg-red-50 text-red-600', icon: <XCircle size={12} /> };
        }
        return { label: 'Unverified', classes: 'bg-yellow-50 text-yellow-700', icon: <Search size={12} /> };
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            // Fetch ALL businesses regardless of current page/filter
            const data = await adminBusinessesApi.getAll({
                search: searchQuery || undefined,
                status: filterStatus ? filterStatus.toLowerCase() : undefined,
                limit: 100000,
                page: 1,
            });
            const parsed = extractBusinesses(data);
            const allBusinesses = parsed.items;

            if (allBusinesses.length === 0) {
                notify.error('No businesses to export');
                return;
            }

            const headers = ['ID', 'Name', 'Owner', 'Owner Email', 'Business Email', 'Phone', 'WhatsApp', 'Address', 'Status', 'Joined'];
            const rows = allBusinesses.map((biz: any) => [
                biz.id,
                biz.name,
                biz.owner ? `${biz.owner.firstName} ${biz.owner.lastName}` : 'N/A',
                biz.owner?.email || 'N/A',
                biz.officialEmail || biz.email || 'N/A',
                biz.phone || 'N/A',
                biz.whatsappNumber || 'N/A',
                biz.address || 'N/A',
                biz.status,
                new Date(biz.createdAt).toLocaleDateString()
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row: any[]) => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `businesses-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            notify.success(`Exported ${allBusinesses.length} businesses successfully`);
        } catch (err: any) {
            notify.error(err.message || 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-text-main mb-1">Business Management</h1>
                    <p className="text-text-secondary font-medium text-sm">Manage all registered businesses on the platform</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        disabled={isExporting}
                        className="flex-1 md:flex-none px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-bold text-text-secondary active:scale-95 disabled:opacity-50 text-sm"
                        title="Export CSV"
                    >
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {isExporting ? 'Exporting...' : 'Export'}
                    </button>
                    <button onClick={fetchBusinesses} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" title="Refresh">
                        <RefreshCw size={18} className="text-text-secondary" />
                    </button>
                    <button
                        onClick={() => { setSelectedBusiness(null); setIsModalOpen(true); }}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 text-sm"
                    >
                        <Plus size={18} />
                        Add Business
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color === 'green' ? 'bg-green-50 text-green-600' : stat.color === 'yellow' ? 'bg-yellow-50 text-yellow-700' : stat.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                <span className="material-icons-round text-lg">{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary">{stat.label}</p>
                                <p className="text-2xl font-display font-bold text-text-main">{isLoading ? '—' : stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, owner or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
                            >
                                <XCircle size={16} />
                            </button>
                        )}
                    </div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="">All Status</option>
                        <option value="active">Verified Only</option>
                        <option value="pending">Unverified Only</option>
                        <option value="suspended">Suspended Only</option>
                    </select>
                </div>
                <p className="mt-3 text-xs text-text-secondary font-medium">Tip: click any business row to open business analytics.</p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Owner</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Contact Info</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Location</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business Locations</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Status</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Joined</th>
                                <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={32} /><p className="text-text-secondary text-sm mt-3 font-bold">Loading businesses...</p></td></tr>
                            ) : businesses.length === 0 ? (
                                <tr><td colSpan={6} className="py-16 text-center text-text-secondary text-sm font-medium">No businesses found.</td></tr>
                            ) : (
                                businesses.map((biz) => (
                                    <React.Fragment key={biz.id}>
                                        <tr
                                            className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                            onClick={() => router.push(`/admin/businesses/${biz.id}/analytics?name=${encodeURIComponent(biz.name)}`)}
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                                        <span className="material-icons-round text-primary text-sm group-hover:text-white">store</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-sm text-text-main">{biz.name}</p>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(biz.id);
                                                                    notify.success('Business ID copied');
                                                                }}
                                                                className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-primary"
                                                                title="Copy Business ID"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-text-secondary font-medium">View analytics</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {biz.owner ? (
                                                    <div>
                                                        <p className="font-bold text-sm text-text-main">{biz.owner.firstName} {biz.owner.lastName}</p>
                                                        <p className="text-xs text-text-secondary">{biz.owner.email}</p>
                                                    </div>
                                                ) : <span className="text-sm text-text-secondary">—</span>}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs">
                                                    <p className="font-bold text-text-main">{biz.officialEmail || biz.email || '—'}</p>
                                                    <p className="text-text-secondary">{biz.whatsappNumber || biz.phone || '—'}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-xs font-medium text-text-secondary line-clamp-2 max-w-[150px]">
                                                    {biz.address || '—'}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6 text-sm font-bold text-text-main">{biz.branches?.length ?? 0}</td>
                                            <td className="py-4 px-6">
                                                {(() => {
                                                    const badge = getStatusBadge(biz);
                                                    return (
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badge.classes}`}>
                                                            {badge.icon}
                                                            {badge.label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-text-secondary font-bold">
                                                {new Date(biz.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        ref={(el) => { menuTriggerRefs.current[biz.id] = el; }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (activeMenuId === biz.id) {
                                                                setActiveMenuId(null);
                                                                setMenuPosition(null);
                                                            } else {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                const menuHeight = 350; // Max estimated height
                                                                const windowHeight = window.innerHeight;
                                                                const spaceBelow = windowHeight - rect.bottom;
                                                                
                                                                const isFlipped = spaceBelow < menuHeight && rect.top > menuHeight;
                                                                
                                                                let left = rect.right + window.scrollX - 208; // 208 is w-52
                                                                if (left < 10) left = 10 + window.scrollX;
                                                                if (left + 208 > window.innerWidth + window.scrollX) {
                                                                    left = window.innerWidth + window.scrollX - 218;
                                                                }

                                                                setMenuPosition({
                                                                    top: rect.bottom + window.scrollY,
                                                                    left: left,
                                                                    isFlipped,
                                                                    rectTop: rect.top + window.scrollY,
                                                                    rectBottom: rect.bottom + window.scrollY
                                                                });
                                                                setActiveMenuId(biz.id);
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-text-main"
                                                    >
                                                        <MoreVertical size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-xs text-text-secondary font-black uppercase tracking-widest">
                        {isLoading ? 'Loading...' : `${metaTotal ?? businesses.length} business${(metaTotal ?? businesses.length) !== 1 ? 'es' : ''} found`}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="text-xs font-bold text-text-secondary">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-text-main">Register Business</h2>
                                <p className="text-sm text-text-secondary font-medium mt-1">Add a new business to the platform</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><span className="material-icons-round text-gray-400">close</span></button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Business Name</label>
                                    <input name="name" required placeholder="e.g. Skyline Lounge" className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Owner Email</label>
                                    <input name="ownerEmail" type="email" required placeholder="owner@example.com" className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Owner First Name</label>
                                    <input name="ownerFirstName" required placeholder="John" className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Owner Last Name</label>
                                    <input name="ownerLastName" required placeholder="Doe" className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Owner Password</label>
                                <div className="relative">
                                    <input 
                                        name="ownerPassword" 
                                        type={showPassword ? "text" : "password"} 
                                        required 
                                        placeholder="••••••••" 
                                        className="w-full h-11 pl-4 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" 
                                        onChange={(e) => setPasswordValue(e.target.value)}
                                        onFocus={() => setShowPasswordValidation(true)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-main transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <div className="mt-2">
                                    <PasswordValidation 
                                        password={passwordValue}
                                        onSuggest={(p) => setPasswordValue(p)}
                                        showAlways={showPasswordValidation}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Phone</label>
                                    <input name="phone" type="tel" placeholder="+234..." className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Location (Optional)</label>
                                    <input name="address" placeholder="City, State" className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                                </div>
                            </div>

                            {/* Affiliate Referral Section */}
                            <div className="border-t border-gray-100 pt-4 mt-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Referred by Affiliate (Optional)</label>
                                {registerSelectedAffiliate ? (
                                    <div className="flex items-center justify-between p-3 bg-violet-50 border border-violet-100 rounded-xl">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-xs text-violet-800">{registerSelectedAffiliate.fullName}</p>
                                            <p className="text-[10px] text-violet-600 font-bold uppercase tracking-wider mt-0.5">{registerSelectedAffiliate.referralCode} • {registerSelectedAffiliate.email}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRegisterSelectedAffiliate(null);
                                                setRegisterAffiliateSearchQuery('');
                                            }}
                                            className="p-1 hover:bg-violet-100 rounded-full text-violet-500 hover:text-violet-700 transition-colors"
                                        >
                                            <span className="material-icons-round text-base">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="Search affiliate name, email or code..." 
                                            value={registerAffiliateSearchQuery}
                                            onChange={(e) => setRegisterAffiliateSearchQuery(e.target.value)}
                                            className="w-full h-11 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                        />
                                        {isRegisterAffiliatesLoading && (
                                            <Loader2 size={14} className="animate-spin text-primary absolute right-3 top-1/2 -translate-y-1/2" />
                                        )}
                                        {registerAffiliateSearchQuery && (
                                            <div className="absolute top-12 left-0 right-0 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-20 divide-y divide-gray-50">
                                                {registerAffiliatesList.length === 0 ? (
                                                    <div className="p-4 text-center text-[11px] text-text-secondary font-medium">
                                                        No active affiliates found.
                                                    </div>
                                                ) : (
                                                    registerAffiliatesList.map(aff => (
                                                        <button
                                                            key={aff.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setRegisterSelectedAffiliate(aff);
                                                                setRegisterAffiliateSearchQuery('');
                                                            }}
                                                            className="w-full p-2.5 text-left text-xs font-bold text-text-main hover:bg-violet-50 hover:text-violet-700 flex items-center justify-between transition-colors"
                                                        >
                                                            <div className="min-w-0 flex-1 pr-2">
                                                                <p className="truncate">{aff.fullName}</p>
                                                                <p className="text-[10px] text-text-secondary truncate font-normal mt-0.5">{aff.referralCode} • {aff.email}</p>
                                                            </div>
                                                            <span className="material-icons-round text-xs text-gray-300">chevron_right</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-sm">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-70">
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    Create Business
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isSubmitting && setIsConfirmModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${confirmAction === 'delete' ? 'bg-red-50 text-red-600' :
                                confirmAction === 'suspend' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                }`}>
                                {confirmAction === 'delete' ? <Trash2 size={24} /> :
                                    confirmAction === 'suspend' ? <Ban size={24} /> :
                                        <RotateCcw size={24} />}
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-text-main capitalize">{confirmAction} Business</h2>
                                <p className="text-sm text-text-secondary font-medium">Please confirm this action</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Are you sure you want to <span className="font-bold text-text-main italic">{confirmAction}</span> <strong>"{selectedBusiness?.name}"</strong>?
                                {confirmAction === 'delete' && " This action cannot be undone."}
                            </p>

                            {(confirmAction === 'suspend' || confirmAction === 'delete') && (
                                <div className="mt-6">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">
                                        Reason for {confirmAction}ing
                                    </label>
                                    <textarea
                                        value={confirmReason}
                                        onChange={(e) => setConfirmReason(e.target.value)}
                                        placeholder={`Please state why you are ${confirmAction}ing this business...`}
                                        className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all resize-none"
                                        required={confirmAction === 'suspend'}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                disabled={isSubmitting}
                                className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAction}
                                disabled={isSubmitting || ((confirmAction === 'suspend' || confirmAction === 'delete') && !confirmReason.trim())}
                                className={`flex-1 h-12 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-70 ${confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                                    confirmAction === 'suspend' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-primary hover:bg-primary-hover shadow-primary/20'
                                    }`}
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                Confirm {confirmAction}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Business Detail Modal */}
            {isDetailModalOpen && detailBusiness && (
                <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsDetailModalOpen(false)} />
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl p-0 shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-icons-round text-2xl">storefront</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-display font-bold text-text-main">{detailBusiness.name}</h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {(() => {
                                            const badge = getStatusBadge(detailBusiness);
                                            return (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badge.classes}`}>
                                                    {badge.label}
                                                </span>
                                            );
                                        })()}
                                        <span className="text-[11px] text-text-secondary font-medium">• Joined {new Date(detailBusiness.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <span className="material-icons-round text-gray-400">close</span>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Onboarding Details</h3>
                                        <div className="space-y-4">
                                            <DetailItem label="Business Category" value={detailBusiness.category} icon="category" />
                                            <DetailItem label="Subcategory" value={detailBusiness.subcategory} icon="subdirectory_arrow_right" />
                                            <DetailItem label="Monthly Visitors" value={detailBusiness.monthlyVisitors} icon="groups" />
                                            <DetailItem label="Business Goals" value={detailBusiness.goal} icon="flag" />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Registration Status</h3>
                                        <div className="space-y-4">
                                            <DetailItem
                                                label="Registered Business"
                                                value={detailBusiness.isRegistered !== undefined ? (detailBusiness.isRegistered ? 'Yes - Registered' : 'No - Not Registered') : undefined}
                                                icon="verified"
                                            />
                                            {detailBusiness.isRegistered && (
                                                <DetailItem label="Registration Number" value={detailBusiness.registrationNumber} icon="badge" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Owner Information</h3>
                                        <div className="space-y-4">
                                            <DetailItem
                                                label="Full Name"
                                                value={detailBusiness.owner ? `${detailBusiness.owner.firstName} ${detailBusiness.owner.lastName}` : undefined}
                                                icon="person"
                                            />
                                            <DetailItem label="Account Email" value={detailBusiness.owner?.email} icon="alternate_email" />
                                            <DetailItem label="Owner Phone" value={detailBusiness.owner?.phone} icon="phone" />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Public Contact</h3>
                                        <div className="space-y-4">
                                            <DetailItem label="Official Email" value={detailBusiness.officialEmail} icon="mail" />
                                            <DetailItem label="Business Phone" value={detailBusiness.phone} icon="call" />
                                            <DetailItem label="WhatsApp Number" value={detailBusiness.branches?.[0]?.whatsappNumber || detailBusiness.whatsappNumber} icon="chat" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-8 mt-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Location & Digital Presence</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <DetailItem label="Full Address" value={detailBusiness.branches?.[0]?.address || detailBusiness.address} icon="location_on" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <DetailItem label="State" value={detailBusiness.state} icon="map" />
                                            <DetailItem label="City" value={detailBusiness.city} icon="apartment" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <DetailItem label="Website URL" value={detailBusiness.branches?.[0]?.website || detailBusiness.businessWebsite} icon="language" link />
                                        <DetailItem label="Total Business Locations" value={detailBusiness.totalBranches !== undefined ? detailBusiness.totalBranches : detailBusiness.branches?.length} icon="account_tree" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-8 mt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Linked Devices</h3>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold">
                                        {detailBusiness.devices?.length ?? 0} Devices
                                    </span>
                                </div>
                                {detailBusiness.devices && detailBusiness.devices.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {detailBusiness.devices.map((dev: any) => (
                                            <div key={dev.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-4 group hover:border-primary/20 transition-all">
                                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                                                    <span className="material-icons-round">smartphone</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-black text-text-main truncate">{dev.name || dev.serialNumber || 'NFC Device'}</p>
                                                        <span className={`size-1.5 rounded-full ${dev.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-0.5">{dev.type || 'Standard'}</p>
                                                </div>
                                                <p className="text-[9px] font-black text-primary/40 group-hover:text-primary transition-colors">#{dev.id.slice(-6)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center">
                                        <p className="text-xs font-bold text-text-secondary italic">No devices linked to this business yet.</p>
                                    </div>
                                )}
                            </div>

                            {(detailBusiness as any).documents && (detailBusiness as any).documents.length > 0 && (
                                <div className="border-t border-gray-100 pt-8 mt-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Verification Documents</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {(detailBusiness as any).documents.map((doc: any, i: number) => {
                                            const docUrl = typeof doc === 'string' ? doc : doc.url;
                                            const docName = typeof doc === 'string' ? `Document ${i + 1}` : (doc.name || `Document ${i + 1}`);
                                            return (
                                                <a
                                                    key={i}
                                                    href={docUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col items-center gap-3 hover:border-primary/30 transition-all group"
                                                >
                                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                                                        <span className="material-icons-round">description</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-text-secondary text-center truncate w-full">{docName}</p>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-50 transition-all"
                            >
                                Close Details
                            </button>
                            <button
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    router.push(`/admin/businesses/${detailBusiness.id}/analytics?name=${encodeURIComponent(detailBusiness.name)}`);
                                }}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center gap-2"
                            >
                                <span className="material-icons-round text-sm">analytics</span>
                                View Full Analytics
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Credit Management Modal */}
            {isCreditModalOpen && creditBusiness && (
                <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsCreditModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-text-main">Manage Credits</h2>
                                <p className="text-sm text-text-secondary font-medium mt-1">Adjust messaging credits for {creditBusiness.name}</p>
                            </div>
                            <button onClick={() => setIsCreditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><span className="material-icons-round text-gray-400">close</span></button>
                        </div>

                        {isCreditLoading ? (
                            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-[10px] font-black uppercase text-blue-600 mb-1">SMS</p>
                                        <p className="text-xl font-bold text-slate-900">{creditBalances?.smsCredits?.toLocaleString() || 0}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <p className="text-[10px] font-black uppercase text-green-600 mb-1">WhatsApp</p>
                                        <p className="text-xl font-bold text-slate-900">{creditBalances?.whatsappCredits?.toLocaleString() || 0}</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                        <p className="text-[10px] font-black uppercase text-purple-600 mb-1">Email</p>
                                        <p className="text-xl font-bold text-slate-900">{creditBalances?.emailCredits?.toLocaleString() || 0}</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900">Manual Adjustment</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Channel</label>
                                            <select 
                                                value={adjustForm.channel} 
                                                onChange={(e) => setAdjustForm({ ...adjustForm, channel: e.target.value })}
                                                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
                                            >
                                                <option value="SMS">SMS</option>
                                                <option value="WHATSAPP">WhatsApp</option>
                                                <option value="EMAIL">Email</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Action</label>
                                            <select 
                                                value={adjustForm.action} 
                                                onChange={(e) => setAdjustForm({ ...adjustForm, action: e.target.value })}
                                                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
                                            >
                                                <option value="add">Add Credits</option>
                                                <option value="remove">Remove Credits</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Amount</label>
                                        <input 
                                            type="number" 
                                            value={adjustForm.amount}
                                            onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                                            placeholder="Enter credit amount" 
                                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10" 
                                        />
                                    </div>
                                    <button 
                                        onClick={handleAdjustCredits}
                                        disabled={isSubmitting || !adjustForm.amount}
                                        className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                        Apply Adjustment
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Change Plan Modal */}
            {isPlanModalOpen && planBusiness && (
                <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isSubmitting && setIsPlanModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-text-main">Change Plan</h2>
                                <p className="text-sm text-text-secondary font-medium mt-1">Override plan for {planBusiness.name}</p>
                            </div>
                            <button onClick={() => setIsPlanModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><span className="material-icons-round text-gray-400">close</span></button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Select New Plan</label>
                                <select 
                                    value={planForm.planId} 
                                    onChange={(e) => setPlanForm({ ...planForm, planId: e.target.value })}
                                    className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                    disabled={isPlansLoading}
                                >
                                    <option value="">Select a plan...</option>
                                    {availablePlans.map(plan => (
                                        <option key={plan.id} value={plan.id}>{plan.name} {plan.isFree ? '(Free)' : ''}</option>
                                    ))}
                                </select>
                                {isPlansLoading && <p className="text-[10px] text-primary font-bold mt-1 ml-1 animate-pulse">Loading plans...</p>}
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Billing Cycle</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['monthly', 'quarterly', 'yearly'] as const).map((period) => (
                                        <button
                                            key={period}
                                            onClick={() => setPlanForm({ ...planForm, billingPeriod: period })}
                                            className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                                planForm.billingPeriod === period 
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                                : 'bg-gray-50 border-gray-100 text-text-secondary hover:bg-white hover:border-gray-200'
                                            }`}
                                        >
                                            {period.charAt(0).toUpperCase() + period.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-3 text-[11px] text-orange-600 font-medium bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <strong>Note:</strong> This is an admin override. No payment will be required, and the next billing cycle will be set based on the selected period.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block">Custom Expiration Date (Optional)</label>
                                <input 
                                    type="date"
                                    value={planForm.customEndDate}
                                    onChange={(e) => setPlanForm({ ...planForm, customEndDate: e.target.value })}
                                    className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                                />
                                <p className="mt-1 text-[9px] text-text-secondary ml-1 uppercase font-bold tracking-tight">Leave blank to calculate automatically based on billing period</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsPlanModalOpen(false)} 
                                    className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleChangePlan}
                                    disabled={isSubmitting || !planForm.planId} 
                                    className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-70"
                                >
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    Confirm Change
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Affiliate Attachment Modal */}
            {isAttachModalOpen && attachBusinessTarget && (
                <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isAttaching && setIsAttachModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-display font-bold text-text-main">Attribute Affiliate</h2>
                                    <p className="text-xs text-text-secondary font-medium mt-0.5">Manually attach a business referral</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => !isAttaching && setIsAttachModalOpen(false)} 
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-text-main"
                            >
                                <span className="material-icons-round text-lg">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            
                            {/* Business Card Summary */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                                <div className="min-w-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Target Business</span>
                                    <h3 className="font-bold text-text-main text-sm truncate mt-0.5">{attachBusinessTarget.name}</h3>
                                    <p className="text-xs text-text-secondary truncate mt-0.5">{attachBusinessTarget.officialEmail || attachBusinessTarget.email}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                                    <span className="material-icons-round text-lg">store</span>
                                </div>
                            </div>

                            {!selectedAffiliate ? (
                                /* STEP 1: Search and Select Affiliate */
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Search Active Affiliate</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input 
                                                type="text" 
                                                placeholder="Search by name, email, or referral code..." 
                                                value={affiliateSearchQuery}
                                                onChange={(e) => setAffiliateSearchQuery(e.target.value)}
                                                className="w-full h-11 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                            />
                                            {isAffiliatesLoading && (
                                                <Loader2 size={16} className="animate-spin text-primary absolute right-3 top-1/2 -translate-y-1/2" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Affiliate List Results */}
                                    <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 bg-gray-50/50">
                                        {isAffiliatesLoading && affiliatesList.length === 0 ? (
                                            <div className="p-8 text-center text-xs text-text-secondary font-bold">
                                                Searching active affiliates...
                                            </div>
                                        ) : affiliatesList.length === 0 ? (
                                            <div className="p-8 text-center text-xs text-text-secondary font-medium">
                                                {affiliateSearchQuery ? "No active affiliates found." : "Type above to search active affiliate users."}
                                            </div>
                                        ) : (
                                            affiliatesList.map((affiliate) => (
                                                <button
                                                    key={affiliate.id}
                                                    onClick={() => setSelectedAffiliate(affiliate)}
                                                    className="w-full p-3.5 text-left hover:bg-violet-50/50 flex items-center justify-between transition-colors group"
                                                >
                                                    <div className="min-w-0 flex-1 pr-3">
                                                        <p className="font-bold text-sm text-text-main group-hover:text-violet-600 transition-colors truncate">{affiliate.fullName}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{affiliate.referralCode}</span>
                                                            <span className="text-xs text-text-secondary truncate">{affiliate.email}</span>
                                                        </div>
                                                    </div>
                                                    <span className="material-icons-round text-gray-300 group-hover:text-violet-500 transition-all text-lg transform group-hover:translate-x-1">chevron_right</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* STEP 2: Connection Visual & Confirmation */
                                <div className="space-y-6">
                                    
                                    {/* Visual Connector Card */}
                                    <div className="relative py-4 flex items-center justify-between px-3 bg-violet-50/20 border border-violet-100/50 rounded-2xl overflow-hidden">
                                        
                                        {/* Business Card */}
                                        <div className="w-[42%] text-center z-10">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow mx-auto border border-gray-100">
                                                <span className="material-icons-round text-lg">store</span>
                                            </div>
                                            <h4 className="font-bold text-xs text-text-main truncate mt-2">{attachBusinessTarget.name}</h4>
                                            <p className="text-[10px] text-text-secondary truncate mt-0.5">Business</p>
                                        </div>

                                        {/* Animated Link Line */}
                                        <div className="flex-1 flex flex-col items-center justify-center relative px-2">
                                            <div className="w-full h-0.5 bg-gradient-to-r from-primary to-violet-500 relative">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 border border-violet-100 rounded-full shadow-sm">
                                                    <Link size={10} className="text-violet-500 animate-pulse" />
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-bold text-violet-600 uppercase tracking-widest mt-2 bg-violet-100 px-1.5 py-0.5 rounded">Referral Link</span>
                                        </div>

                                        {/* Affiliate Card */}
                                        <div className="w-[42%] text-center z-10">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-violet-600 shadow mx-auto border border-gray-100">
                                                <span className="material-icons-round text-lg">person</span>
                                            </div>
                                            <h4 className="font-bold text-xs text-text-main truncate mt-2">{selectedAffiliate.fullName}</h4>
                                            <p className="text-[10px] text-violet-600 font-bold uppercase tracking-wider mt-0.5">{selectedAffiliate.referralCode}</p>
                                        </div>
                                    </div>

                                    {/* Action Alert */}
                                    <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 flex gap-3 text-xs leading-relaxed text-orange-800">
                                        <span className="material-icons-round text-lg text-orange-500 shrink-0 select-none">warning</span>
                                        <div>
                                            <strong className="font-bold block mb-0.5">Please confirm manual attachment</strong>
                                            By confirming, this business will be permanently attributed to affiliate <strong>{selectedAffiliate.fullName}</strong>. This will:
                                            <ul className="list-disc pl-4 mt-1.5 space-y-1">
                                                <li>Increment the affiliate's referred count.</li>
                                                <li>Instantly trigger and post direct commission ledgers in the Affiliate System.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Confirmation Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedAffiliate(null)}
                                            disabled={isAttaching}
                                            className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-xs disabled:opacity-50"
                                        >
                                            Change Affiliate
                                        </button>
                                        <button 
                                            onClick={handleManualAttach}
                                            disabled={isAttaching} 
                                            className="flex-1 h-12 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2 text-xs active:scale-95 disabled:opacity-75"
                                        >
                                            {isAttaching && <Loader2 size={14} className="animate-spin" />}
                                            Confirm Attachment
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer Cancel (only if no affiliate selected) */}
                        {!selectedAffiliate && (
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAttachModalOpen(false)}
                                    className="w-full h-11 bg-white border border-gray-200 text-text-secondary font-bold rounded-xl hover:bg-gray-50 transition-all text-xs"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}
            
            {/* Action Menu Portal */}
            {activeMenuId && menuPosition && typeof document !== 'undefined' && createPortal(
                <div 
                    className="fixed inset-0 z-[100]" 
                    onClick={() => {
                        setActiveMenuId(null);
                        setMenuPosition(null);
                    }}
                >
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: menuPosition.isFlipped ? 10 : -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: menuPosition.isFlipped ? 10 : -10 }}
                            style={{ 
                                top: menuPosition.isFlipped ? 'auto' : (menuPosition.rectBottom - (typeof window !== 'undefined' ? window.scrollY : 0) + 8),
                                bottom: menuPosition.isFlipped ? ((typeof window !== 'undefined' ? window.innerHeight : 0) - (menuPosition.rectTop - (typeof window !== 'undefined' ? window.scrollY : 0)) + 8) : 'auto',
                                left: menuPosition.left - (typeof window !== 'undefined' ? window.scrollX : 0),
                                position: 'fixed',
                                transformOrigin: menuPosition.isFlipped ? 'bottom right' : 'top right',
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[101]"
                        >
                            {(() => {
                                const biz = businesses.find(b => b.id === activeMenuId);
                                if (!biz) return null;
                                return (
                                    <>
                                        <button
                                            onClick={() => {
                                                setCreditBusiness(biz);
                                                setIsCreditModalOpen(true);
                                                fetchCredits(biz.id);
                                                setActiveMenuId(null);
                                            }}
                                            className="w-full px-4 py-2.5 text-left text-sm font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                                        >
                                            <CreditCard size={16} />
                                            Manage Credits
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDetailBusiness(biz);
                                                setIsDetailModalOpen(true);
                                                setActiveMenuId(null);
                                            }}
                                            className="w-full px-4 py-2.5 text-left text-sm font-bold text-primary hover:bg-primary/5 flex items-center gap-3 transition-colors"
                                        >
                                            <Eye size={16} />
                                            View Details
                                        </button>

                                        <button
                                            onClick={() => {
                                                setAttachBusinessTarget(biz);
                                                setIsAttachModalOpen(true);
                                                setSelectedAffiliate(null);
                                                setAffiliateSearchQuery('');
                                                setIsConfirmAttachOpen(false);
                                                setActiveMenuId(null);
                                            }}
                                            className="w-full px-4 py-2.5 text-left text-sm font-bold text-violet-600 hover:bg-violet-50 flex items-center gap-3 transition-colors border-t border-gray-50"
                                        >
                                            <UserPlus size={16} />
                                            Attach to Affiliate
                                        </button>

                                        {normalizeBusinessStatus(biz.status) === 'pending' && (
                                            <button
                                                onClick={() => { handleUnverifiedClick(biz); setActiveMenuId(null); }}
                                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-3 transition-colors border-t border-gray-50"
                                            >
                                                <CheckCircle size={16} />
                                                Review Documents
                                            </button>
                                        )}

                                        <div className="border-t border-gray-50 my-1" />

                                        {normalizeBusinessStatus(biz.status) === 'active' && (
                                            <button
                                                onClick={() => { handleAction('suspend', biz); setActiveMenuId(null); }}
                                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-orange-500 hover:bg-orange-50 flex items-center gap-3 transition-colors"
                                            >
                                                <Ban size={16} />
                                                Suspend
                                            </button>
                                        )}
                                        {normalizeBusinessStatus(biz.status) === 'suspended' && (
                                            <button
                                                onClick={() => { handleAction('reactivate', biz); setActiveMenuId(null); }}
                                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-green-500 hover:bg-green-50 flex items-center gap-3 transition-colors"
                                            >
                                                <RotateCcw size={16} />
                                                Reactivate
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setPlanBusiness(biz);
                                                setPlanForm({ planId: biz.planId || '', billingPeriod: 'monthly', customEndDate: '' });
                                                setIsPlanModalOpen(true);
                                                fetchPlans();
                                                setActiveMenuId(null);
                                            }}
                                            className="w-full px-4 py-2.5 text-left text-sm font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors border-t border-gray-50"
                                        >
                                            <Layers size={16} />
                                            Change Plan
                                        </button>
                                        <button
                                            onClick={() => { handleAction('delete', biz); setActiveMenuId(null); }}
                                            className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                            Delete Business
                                        </button>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </div>
    );
}
