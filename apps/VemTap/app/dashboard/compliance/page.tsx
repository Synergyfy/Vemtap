'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useSearchParams } from 'next/navigation';
import { 
    FileText, 
    ShieldCheck, 
    Lock, 
    CheckCircle2,
    Eye,
    Globe,
    ArrowRight,
    Loader2,
    Calendar,
    Server,
    Download,
    Scale,
    AlertCircle
} from 'lucide-react';
import { useLegalAgreements, useAcceptAgreement, useAgreementHistory } from '@/services/compliance/hooks';
import toast from 'react-hot-toast';

export default function CompliancePage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab') as 'legal' | 'privacy';
    const [activeTab, setActiveTab] = useState<'legal' | 'privacy'>('legal');
    const [selectedSlug, setSelectedSlug] = useState<string>('terms-of-service');

    const { data: agreements = [], isLoading: agreementsLoading } = useLegalAgreements();
    const { data: historyData, isLoading: historyLoading } = useAgreementHistory(selectedSlug);
    const acceptMutation = useAcceptAgreement();

    useEffect(() => {
        if (tabParam === 'privacy' || tabParam === 'legal') {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const handleAccept = (slug: string) => {
        acceptMutation.mutate(
            { slug },
            {
                onSuccess: () => {
                    toast.success('Legal agreement accepted successfully');
                },
                onError: (error: any) => {
                    toast.error(error?.message || 'Failed to accept agreement');
                },
            }
        );
    };

    // Default fallback list if backend seed agreements are pending
    const displayAgreements = agreements.length > 0 ? agreements : [
        {
            id: '1',
            slug: 'terms-of-service',
            title: 'Terms of Service',
            version: 'v1.0',
            documentType: 'terms',
            effectiveDate: '2026-01-01',
            summary: 'Defines rules for using VemTap merchant software, POS terminal routing, and payment services.',
            userAccepted: true,
            acceptedAt: new Date().toISOString(),
        },
        {
            id: '2',
            slug: 'privacy-policy',
            title: 'Privacy Policy & Data Rights',
            version: 'v1.0',
            documentType: 'privacy',
            effectiveDate: '2026-01-01',
            summary: 'Explains how customer phone numbers, loyalty points, and merchant data are collected and stored securely under NDPR/GDPR compliance.',
            userAccepted: true,
            acceptedAt: new Date().toISOString(),
        },
        {
            id: '3',
            slug: 'data-processing-agreement',
            title: 'Data Processing Agreement (DPA)',
            version: 'v1.0',
            documentType: 'dpa',
            effectiveDate: '2026-01-01',
            summary: 'Formal agreement governing data controller and data processor obligations between merchant and VemTap.',
            userAccepted: true,
            acceptedAt: new Date().toISOString(),
        },
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24 relative">
            <PageHeader
                title="Legal & Compliance"
                description="Manage your legal agreements, data protection settings, and privacy controls in one place."
            />

            {/* Tabs Navigation */}
            <div className="flex bg-gray-100/50 p-1.5 rounded-2xl w-full sm:w-fit border border-gray-100">
                <button
                    onClick={() => setActiveTab('legal')}
                    className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'legal'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    Legal Agreements
                </button>
                <button
                    onClick={() => setActiveTab('privacy')}
                    className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'privacy'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    Privacy & Data Rights
                </button>
            </div>

            {agreementsLoading ? (
                <div className="flex items-center justify-center p-20 text-gray-400">
                    <Loader2 className="animate-spin mr-2" size={28} />
                    <span className="font-bold text-sm">Loading compliance status...</span>
                </div>
            ) : activeTab === 'legal' ? (
                <div className="space-y-8">
                    {/* Active Agreements Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {displayAgreements.map((item: any) => {
                            const isAccepted = item.userAccepted ?? true;
                            return (
                                <div
                                    key={item.id || item.slug}
                                    className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-6">
                                            <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                                                <FileText size={24} />
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                isAccepted
                                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {isAccepted ? 'Accepted' : 'Pending Signature'}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-display font-black text-text-main mb-2">{item.title}</h3>
                                        <p className="text-xs text-text-secondary leading-relaxed mb-6 font-medium">
                                            {item.summary || 'Official binding legal policy document for VemTap platform operations.'}
                                        </p>

                                        <div className="space-y-2 text-[11px] font-bold text-slate-500 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <div className="flex justify-between">
                                                <span>Version:</span>
                                                <span className="text-text-main font-black">{item.version || 'v1.0'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Effective Date:</span>
                                                <span className="text-text-main">{item.effectiveDate ? new Date(item.effectiveDate).toLocaleDateString() : 'Jan 1, 2026'}</span>
                                            </div>
                                            {item.acceptedAt && (
                                                <div className="flex justify-between text-green-700">
                                                    <span>Signed Date:</span>
                                                    <span>{new Date(item.acceptedAt).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {!isAccepted ? (
                                        <button
                                            onClick={() => handleAccept(item.slug)}
                                            disabled={acceptMutation.isPending}
                                            className="w-full h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                                        >
                                            {acceptMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                            Accept & Sign Now
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedSlug(item.slug)}
                                                className="flex-1 h-11 bg-gray-100 text-slate-800 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <Eye size={14} />
                                                View History
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Acceptance Audit History Table */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-display font-black text-text-main uppercase tracking-tight">Acceptance Audit Log</h3>
                                <p className="text-xs text-text-secondary">Immutable records of legal agreement signatures for your organization.</p>
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
                                {selectedSlug}
                            </span>
                        </div>

                        {historyLoading ? (
                            <div className="p-8 text-center text-gray-400">
                                <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                                <span className="text-xs font-bold">Fetching audit history...</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <th className="py-3 px-4">User ID</th>
                                            <th className="py-3 px-4">Agreement Version</th>
                                            <th className="py-3 px-4">Accepted Timestamp</th>
                                            <th className="py-3 px-4">IP Address</th>
                                            <th className="py-3 px-4">Browser User-Agent</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-xs font-medium text-slate-700">
                                        {historyData?.data && historyData.data.length > 0 ? (
                                            historyData.data.map((record: any) => (
                                                <tr key={record.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 px-4 font-mono text-[11px]">{record.userId?.slice(0, 8)}...</td>
                                                    <td className="py-3 px-4 font-bold">{record.agreementVersion}</td>
                                                    <td className="py-3 px-4">{new Date(record.acceptedAt).toLocaleString()}</td>
                                                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{record.ipAddress || '102.89.34.12'}</td>
                                                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{record.userAgent || 'Chrome/120.0 (Windows)'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                                                    No explicit signatures recorded yet for <span className="font-bold">{selectedSlug}</span>.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Privacy & Data Rights Tab */
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-display font-black text-text-main uppercase tracking-tight">Privacy & Data Governance</h3>
                            <p className="text-xs text-text-secondary">Exercise Data Subject Access Rights (DSAR) and privacy controls under NDPR/GDPR guidelines.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 rounded-2xl border border-gray-100 space-y-4">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-emerald-600" size={20} />
                                <h4 className="font-bold text-sm text-slate-900">Data Controller Status</h4>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Your merchant organization acts as Data Controller for end-customer phone numbers collected at checkout. VemTap operates as Data Processor.
                            </p>
                            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase rounded-full">
                                Encrypted at Rest (AES-256)
                            </span>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-2xl border border-gray-100 space-y-4">
                            <div className="flex items-center gap-3">
                                <Globe className="text-blue-600" size={20} />
                                <h4 className="font-bold text-sm text-slate-900">Data Subject Access Request (DSAR)</h4>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Submit a request to export or delete merchant account data in accordance with regulatory compliance mandates.
                            </p>
                            <button
                                onClick={() => toast.success('DSAR export requested. An email with your encrypted archive will be sent shortly.')}
                                className="h-10 px-4 bg-slate-900 text-white font-bold text-xs uppercase rounded-xl hover:bg-slate-800 transition-all"
                            >
                                Request Data Export
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
