'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    UserPlus, Search, CheckCircle2, XCircle, Clock,
    ChevronLeft, ChevronRight, Eye, Building2, MapPin,
    Mail, Phone, Calendar, FileText, Star, AlertTriangle,
    MessageSquare, Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type ApplicationStatus = 'Pending Review' | 'Shortlisted' | 'Approved' | 'Rejected';

interface Application {
    id: string;
    businessName: string;
    email: string;
    phone: string;
    category: string;
    location: string;
    size: string;
    website: string;
    status: ApplicationStatus;
    submittedAt: string;
    reason: string;
    goals: string;
    targetReferrals: number;
    reviewedBy?: string;
    reviewedAt?: string;
    rejectionReason?: string;
    assignedTier?: string;
}

const MOCK_APPLICATIONS: Application[] = [
    {
        id: 'APP-001', businessName: 'Fashion Hub', email: 'hello@fashionhub.ng', phone: '+234 801 234 5678',
        category: 'Fashion', location: 'Ikeja, Lagos', size: 'Medium (11–50)', website: 'fashionhub.ng',
        status: 'Approved', submittedAt: '2026-03-01', reason: 'Cross-promotion opportunities with complementary brands',
        goals: 'Refer 15+ customers per month and drive ₦300K in shared revenue', targetReferrals: 20,
        reviewedBy: 'Tolu A.', reviewedAt: '2026-03-05', assignedTier: 'Silver',
    },
    {
        id: 'APP-002', businessName: 'Tech Solutions', email: 'info@techsolutions.com', phone: '+234 802 345 6789',
        category: 'Technology', location: 'Yaba, Lagos', size: 'Large (51–200)', website: 'techsolutions.com',
        status: 'Approved', submittedAt: '2026-01-02', reason: 'Strategic B2B referral network for SaaS products',
        goals: 'Build a partner ecosystem to drive software adoption', targetReferrals: 30,
        reviewedBy: 'Tolu A.', reviewedAt: '2026-01-08', assignedTier: 'Gold',
    },
    {
        id: 'APP-003', businessName: 'The Grill House', email: 'hello@grillhouse.ng', phone: '+234 803 456 7890',
        category: 'Restaurant', location: 'Ikeja, Lagos', size: 'Small (1–10)', website: 'grillhouse.ng',
        status: 'Approved', submittedAt: '2026-03-20', reason: 'Partner with complementary food & event businesses',
        goals: 'Increase lunchtime traffic through cross-referrals', targetReferrals: 10,
        reviewedBy: 'Sade B.', reviewedAt: '2026-03-25', assignedTier: 'Bronze',
    },
    {
        id: 'APP-004', businessName: 'PrintMaster', email: 'hello@printmaster.ng', phone: '+234 804 567 8901',
        category: 'Services', location: 'Yaba, Lagos', size: 'Small (1–10)', website: 'printmaster.ng',
        status: 'Approved', submittedAt: '2025-12-10', reason: 'Referral partnership with tech & creative agencies',
        goals: 'Secure 5 recurring B2B clients per quarter', targetReferrals: 8,
        reviewedBy: 'Tolu A.', reviewedAt: '2025-12-18', assignedTier: 'Silver',
    },
    {
        id: 'APP-005', businessName: 'Green Grocers', email: 'hello@greengrocers.ng', phone: '+234 805 678 9012',
        category: 'Retail', location: 'Lekki, Lagos', size: 'Small (1–10)', website: 'greengrocers.ng',
        status: 'Approved', submittedAt: '2026-02-01', reason: 'Partner with restaurants and cafes for fresh produce supply',
        goals: 'Acquire 12+ wholesale accounts through referrals', targetReferrals: 15,
        reviewedBy: 'Sade B.', reviewedAt: '2026-02-10', assignedTier: 'Silver',
    },
    {
        id: 'APP-006', businessName: 'Juice Paradise', email: 'info@juiceparadise.ng', phone: '+234 806 789 0123',
        category: 'Restaurant', location: 'Victoria Island, Lagos', size: 'Small (1–10)', website: 'juiceparadise.ng',
        status: 'Pending Review', submittedAt: '2026-07-08', reason: 'Cross-promote with fitness & wellness businesses',
        goals: 'Drive 200+ new customers through partner referrals', targetReferrals: 25,
    },
    {
        id: 'APP-007', businessName: 'AutoCare Pro', email: 'info@autocarepro.com', phone: '+234 807 890 1234',
        category: 'Automotive', location: 'Port Harcourt', size: 'Medium (11–50)', website: 'autocarepro.com',
        status: 'Pending Review', submittedAt: '2026-07-10', reason: 'Build a network of auto service referrals across PH',
        goals: 'Generate ₦500K monthly through partner referrals', targetReferrals: 40,
    },
    {
        id: 'APP-008', businessName: 'Décor Studio', email: 'hello@decorstudio.ng', phone: '+234 808 901 2345',
        category: 'Home', location: 'Lekki, Lagos', size: 'Small (1–10)', website: 'decorstudio.ng',
        status: 'Shortlisted', submittedAt: '2026-06-25', reason: 'Partner with real estate agents and event planners',
        goals: 'Secure 8 interior design projects through referrals', targetReferrals: 12,
    },
    {
        id: 'APP-009', businessName: 'Fresh Dairy', email: 'info@freshdairy.ng', phone: '+234 809 012 3456',
        category: 'Retail', location: 'Abeokuta', size: 'Medium (11–50)', website: 'freshdairy.ng',
        status: 'Rejected', submittedAt: '2026-06-10', reason: 'Distribution partnership for retail outlets',
        goals: 'Expand retail distribution network', targetReferrals: 20,
        reviewedBy: 'Tolu A.', reviewedAt: '2026-06-18', rejectionReason: 'Business does not meet minimum revenue requirements for partnership program.',
    },
    {
        id: 'APP-010', businessName: 'QuickFix Repairs', email: 'hello@quickfix.ng', phone: '+234 810 123 4567',
        category: 'Services', location: 'Surulere, Lagos', size: 'Small (1–10)', website: 'quickfix.ng',
        status: 'Shortlisted', submittedAt: '2026-07-05', reason: 'Offer exclusive repair discounts to partner business customers',
        goals: 'Handle 50+ service requests monthly from partner referrals', targetReferrals: 18,
    },
    {
        id: 'APP-011', businessName: 'MediLab Diagnostics', email: 'info@medilab.ng', phone: '+234 811 234 5678',
        category: 'Health', location: 'Abuja', size: 'Medium (11–50)', website: 'medilab.ng',
        status: 'Pending Review', submittedAt: '2026-07-12', reason: 'Clinical referral partnership with health & wellness businesses',
        goals: 'Process 100+ diagnostic referrals per month', targetReferrals: 35,
    },
    {
        id: 'APP-012', businessName: 'Brew & Bean', email: 'hello@brewandbean.ng', phone: '+234 812 345 6789',
        category: 'Restaurant', location: 'Ibadan', size: 'Small (1–10)', website: 'brewandbean.ng',
        status: 'Rejected', submittedAt: '2026-06-05', reason: 'Partner with co-working spaces and bookstores',
        goals: 'Increase foot traffic by 30% through referrals', targetReferrals: 10,
        reviewedBy: 'Sade B.', reviewedAt: '2026-06-12', rejectionReason: 'Application incomplete — missing business registration documents.',
    },
];

const ITEMS_PER_PAGE = 6;

const statusStyles: Record<ApplicationStatus, { bg: string; text: string; dot: string }> = {
    'Pending Review': { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    'Shortlisted': { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
    'Approved': { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
    'Rejected': { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400' },
};

const tierOptions = ['Bronze', 'Silver', 'Gold', 'Elite'];

const sizeOptions = ['Small (1–10)', 'Medium (11–50)', 'Large (51–200)', 'Enterprise (200+)'];

export default function PartnershipApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
    const [search, setSearch] = useState('');
    const [statusTab, setStatusTab] = useState<'all' | ApplicationStatus>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [reviewApp, setReviewApp] = useState<Application | null>(null);
    const [reviewState, setReviewState] = useState<'view' | 'approve' | 'reject'>('view');
    const [selectedTier, setSelectedTier] = useState('Silver');
    const [rejectionReason, setRejectionReason] = useState('');
    const [reviewNote, setReviewNote] = useState('');

    const filtered = useMemo(() => {
        return applications.filter((a) => {
            const matchesSearch = !search ||
                a.businessName.toLowerCase().includes(search.toLowerCase()) ||
                a.id.toLowerCase().includes(search.toLowerCase()) ||
                a.email.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusTab === 'all' || a.status === statusTab;
            return matchesSearch && matchesStatus;
        });
    }, [applications, search, statusTab]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const stats = useMemo(() => ({
        total: applications.length,
        pending: applications.filter(a => a.status === 'Pending Review').length,
        shortlisted: applications.filter(a => a.status === 'Shortlisted').length,
        approvedThisMonth: applications.filter(a => a.status === 'Approved' && a.reviewedAt && a.reviewedAt >= '2026-07-01').length,
        rejectionRate: Math.round((applications.filter(a => a.status === 'Rejected').length / applications.length) * 100),
    }), [applications]);

    const openReview = (app: Application) => {
        setReviewApp(app);
        setReviewState('view');
        setSelectedTier(app.assignedTier || 'Silver');
        setRejectionReason('');
        setReviewNote('');
    };

    const handleApprove = () => {
        if (!reviewApp) return;
        setApplications(prev => prev.map(a =>
            a.id === reviewApp.id ? {
                ...a,
                status: 'Approved' as ApplicationStatus,
                assignedTier: selectedTier,
                reviewedBy: 'Admin',
                reviewedAt: new Date().toISOString().slice(0, 10),
                rejectionReason: undefined,
                ...(reviewNote ? { goals: reviewNote } : {}),
            } : a
        ));
        toast.success(`${reviewApp.businessName} approved as ${selectedTier} partner`);
        setReviewApp(null);
    };

    const handleReject = () => {
        if (!reviewApp || !rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        setApplications(prev => prev.map(a =>
            a.id === reviewApp.id ? {
                ...a,
                status: 'Rejected' as ApplicationStatus,
                reviewedBy: 'Admin',
                reviewedAt: new Date().toISOString().slice(0, 10),
                rejectionReason: rejectionReason.trim(),
            } : a
        ));
        toast.success(`${reviewApp.businessName} application rejected`);
        setReviewApp(null);
    };

    const handleShortlist = (id: string) => {
        setApplications(prev => prev.map(a =>
            a.id === id && a.status === 'Pending Review' ? { ...a, status: 'Shortlisted' as ApplicationStatus } : a
        ));
        toast.success('Application shortlisted');
    };

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />
            <Link href="/admin/discovery/partnerships" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Partnerships Hub
            </Link>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Total Applications', value: stats.total, icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Shortlisted', value: stats.shortlisted, icon: Star, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Approved (This Month)', value: stats.approvedThisMonth, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Rejection Rate', value: `${stats.rejectionRate}%`, icon: Ban, color: 'text-rose-500', bg: 'bg-rose-50' },
                ].map((stat, idx) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                        <div className={`size-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                            <p className="text-2xl font-display font-bold text-text-main mt-0.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
                    <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search by business, email, or application ID..." className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                </div>
                {(['all', 'Pending Review', 'Shortlisted', 'Approved', 'Rejected'] as const).map(tab => (
                    <button key={tab} onClick={() => { setStatusTab(tab); setCurrentPage(1); }} className={cn(
                        'h-11 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border shadow-sm',
                        statusTab === tab ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-text-secondary border-gray-100 hover:border-gray-300 hover:text-text-main'
                    )}>
                        {tab === 'all' ? 'All' : tab}
                    </button>
                ))}
            </div>

            {/* Application Cards */}
            <div className="space-y-4">
                {paginated.map((app) => (
                    <div key={app.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="size-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    {app.businessName.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="text-sm font-bold text-text-main">{app.businessName}</h3>
                                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest', statusStyles[app.status].bg, statusStyles[app.status].text)}>
                                            <span className={cn('size-1.5 rounded-full', statusStyles[app.status].dot)} />
                                            {app.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-text-secondary">
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {app.location}</span>
                                        <span className="flex items-center gap-1"><Building2 size={12} /> {app.category}</span>
                                        <span className="flex items-center gap-1">{app.size}</span>
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {app.submittedAt}</span>
                                    </div>
                                    {app.rejectionReason && (
                                        <p className="text-[11px] text-red-500 mt-2 flex items-center gap-1">
                                            <XCircle size={12} /> {app.rejectionReason}
                                        </p>
                                    )}
                                    {app.assignedTier && (
                                        <p className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Approved as {app.assignedTier} partner
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4 shrink-0">
                                {app.status === 'Pending Review' && (
                                    <>
                                        <button onClick={() => handleShortlist(app.id)} className="p-2.5 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all" title="Shortlist"><Star size={15} /></button>
                                        <button onClick={() => openReview(app)} className="h-10 px-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-1.5">
                                            <Eye size={14} /> Review
                                        </button>
                                    </>
                                )}
                                {(app.status === 'Shortlisted' || app.status === 'Approved' || app.status === 'Rejected') && (
                                    <button onClick={() => openReview(app)} className="p-2.5 rounded-xl bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all" title="View Details"><Eye size={15} /></button>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <p className="text-xs text-text-secondary">
                                <span className="font-bold text-text-main">Reason:</span> {app.reason}
                            </p>
                        </div>
                    </div>
                ))}
                {paginated.length === 0 && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                        <UserPlus size={32} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-text-secondary">No applications found</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <span className="text-xs text-text-secondary font-medium">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft size={14} /></button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setCurrentPage(page)} className={cn('size-8 rounded-lg text-xs font-bold transition-all', currentPage === page ? 'bg-gray-900 text-white' : 'text-text-secondary hover:bg-gray-50')}>{page}</button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight size={14} /></button>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {reviewApp && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReviewApp(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between rounded-t-3xl z-10">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                                    {reviewApp.businessName.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-text-main">{reviewApp.businessName}</h2>
                                    <p className="text-[10px] font-medium text-text-secondary">{reviewApp.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {reviewState === 'view' && reviewApp.status === 'Pending Review' && (
                                    <>
                                        <button onClick={() => setReviewState('reject')} className="h-9 px-4 rounded-xl border border-red-200 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">Reject</button>
                                        <button onClick={() => setReviewState('approve')} className="h-9 px-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all">Approve</button>
                                    </>
                                )}
                                {(reviewState === 'approve' || reviewState === 'reject') && (
                                    <button onClick={() => setReviewState('view')} className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-main transition-all">Back</button>
                                )}
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Business Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Category', value: reviewApp.category },
                                    { label: 'Location', value: reviewApp.location },
                                    { label: 'Size', value: reviewApp.size },
                                    { label: 'Submitted', value: reviewApp.submittedAt },
                                ].map((info) => (
                                    <div key={info.label} className="p-3 rounded-2xl bg-gray-50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{info.label}</p>
                                        <p className="text-xs font-bold text-text-main mt-1">{info.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Contact */}
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Contact Information</h4>
                                <div className="flex flex-wrap gap-4">
                                    <span className="text-xs text-text-secondary flex items-center gap-1.5"><Mail size={13} /> {reviewApp.email}</span>
                                    <span className="text-xs text-text-secondary flex items-center gap-1.5"><Phone size={13} /> {reviewApp.phone}</span>
                                    <span className="text-xs text-primary flex items-center gap-1.5"><FileText size={13} /> {reviewApp.website}</span>
                                </div>
                            </div>

                            {/* Application Details */}
                            <div className="p-5 rounded-2xl bg-gray-50 space-y-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Reason for Applying</p>
                                    <p className="text-sm font-medium text-text-main mt-1">{reviewApp.reason}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Goals & Expectations</p>
                                    <p className="text-sm font-medium text-text-main mt-1">{reviewApp.goals}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Target Monthly Referrals</p>
                                    <p className="text-sm font-bold text-text-main mt-1">{reviewApp.targetReferrals}</p>
                                </div>
                            </div>

                            {/* Review History */}
                            {(reviewApp.reviewedBy || reviewApp.rejectionReason) && (
                                <div className="p-5 rounded-2xl border border-gray-100 space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Review History</h4>
                                    {reviewApp.reviewedBy && (
                                        <p className="text-xs text-text-secondary">
                                            <span className="font-bold text-text-main">Reviewed by:</span> {reviewApp.reviewedBy}
                                            {reviewApp.reviewedAt && <> &middot; {reviewApp.reviewedAt}</>}
                                        </p>
                                    )}
                                    {reviewApp.rejectionReason && (
                                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50">
                                            <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-700">{reviewApp.rejectionReason}</p>
                                        </div>
                                    )}
                                    {reviewApp.assignedTier && (
                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50">
                                            <CheckCircle2 size={14} className="text-emerald-600" />
                                            <p className="text-xs text-emerald-700">Approved as <span className="font-bold">{reviewApp.assignedTier}</span> partner</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Approve Form */}
                            {reviewState === 'approve' && (
                                <div className="p-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 space-y-5">
                                    <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                        Approve Application
                                    </h4>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Assign Tier</label>
                                        <div className="flex gap-2">
                                            {tierOptions.map(tier => (
                                                <button key={tier} onClick={() => setSelectedTier(tier)} className={cn(
                                                    'flex-1 h-11 rounded-2xl border text-xs font-bold transition-all',
                                                    selectedTier === tier
                                                        ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                                                        : 'bg-white text-text-secondary border-gray-200 hover:border-gray-300'
                                                )}>
                                                    {tier}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Admin Note (optional)</label>
                                        <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Add a note about this application..." rows={2} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none" />
                                    </div>
                                    <button onClick={handleApprove} className="w-full h-12 rounded-2xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                                        Approve as {selectedTier} Partner
                                    </button>
                                </div>
                            )}

                            {/* Reject Form */}
                            {reviewState === 'reject' && (
                                <div className="p-5 rounded-2xl border-2 border-red-100 bg-red-50/30 space-y-5">
                                    <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                                        <XCircle size={18} className="text-red-500" />
                                        Reject Application
                                    </h4>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Reason for Rejection <span className="text-red-400">*</span></label>
                                        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Explain why this application is being rejected..." rows={3} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-text-main focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all resize-none" />
                                    </div>
                                    <button onClick={handleReject} className="w-full h-12 rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95">
                                        Reject Application
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
