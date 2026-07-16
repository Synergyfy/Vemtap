'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    Shield, FileText, CheckCircle2, XCircle, AlertTriangle,
    Search, Plus, Download, Eye, Edit3, Clock, Ban,
    ChevronLeft, ChevronRight, Scale, BookOpen, Gavel
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type TemplateStatus = 'active' | 'inactive' | 'draft';
type CheckStatus = 'passed' | 'flagged' | 'failed' | 'pending';

interface AgreementTemplate {
    id: string;
    name: string;
    description: string;
    version: string;
    status: TemplateStatus;
    updatedAt: string;
    usedCount: number;
}

interface ComplianceCheck {
    id: string;
    businessName: string;
    businessId: string;
    checkType: string;
    status: CheckStatus;
    checkedAt: string;
    notes?: string;
}

const MOCK_TEMPLATES: AgreementTemplate[] = [
    { id: 'TMP-001', name: 'Standard Partnership Agreement', description: 'Default agreement for Bronze and Silver tier partners with standard commission terms', version: 'v2.4', status: 'active', updatedAt: '2026-06-15', usedCount: 42 },
    { id: 'TMP-002', name: 'Premium Partnership Agreement', description: 'Enhanced terms for Gold and Elite partners including bonus structures and priority support', version: 'v1.8', status: 'active', updatedAt: '2026-06-10', usedCount: 18 },
    { id: 'TMP-003', name: 'Short-Term Pilot Agreement', description: '30–60 day trial agreement for testing partnership fit before committing to full terms', version: 'v1.0', status: 'draft', updatedAt: '2026-07-01', usedCount: 0 },
    { id: 'TMP-004', name: 'Enterprise Partnership Agreement', description: 'Custom agreement for large-scale enterprise partnerships with custom commission rates', version: 'v3.1', status: 'active', updatedAt: '2026-05-20', usedCount: 7 },
    { id: 'TMP-005', name: 'Legacy Agreement (2025)', description: 'Deprecated agreement template from the previous program version — no longer issued', version: 'v1.0', status: 'inactive', updatedAt: '2025-12-31', usedCount: 15 },
];

const MOCK_CHECKS: ComplianceCheck[] = [
    { id: 'CC-001', businessName: 'Fashion Hub', businessId: 'BIZ-001', checkType: 'Business Registration', status: 'passed', checkedAt: '2026-07-01' },
    { id: 'CC-002', businessName: 'Tech Solutions', businessId: 'BIZ-003', checkType: 'Tax Compliance', status: 'passed', checkedAt: '2026-07-01' },
    { id: 'CC-003', businessName: 'AutoCare', businessId: 'BIZ-007', checkType: 'Business Registration', status: 'passed', checkedAt: '2026-07-01' },
    { id: 'CC-004', businessName: 'The Grill House', businessId: 'BIZ-002', checkType: 'Tax Compliance', status: 'pending', checkedAt: '2026-07-01', notes: 'Awaiting tax ID verification from internal team' },
    { id: 'CC-005', businessName: 'Green Grocers', businessId: 'BIZ-009', checkType: 'Business Registration', status: 'flagged', checkedAt: '2026-07-01', notes: 'Registration document expired — renew requested' },
    { id: 'CC-006', businessName: 'PrintMaster', businessId: 'BIZ-008', checkType: 'Tax Compliance', status: 'passed', checkedAt: '2026-07-01' },
    { id: 'CC-007', businessName: 'Juice Paradise', businessId: 'BIZ-006', checkType: 'Business Registration', status: 'failed', checkedAt: '2026-07-01', notes: 'Business registration number does not match CAC database' },
    { id: 'CC-008', businessName: 'Fresh Dairy', businessId: 'BIZ-009', checkType: 'Tax Compliance', status: 'pending', checkedAt: '2026-07-01' },
];

const templateStatusStyles: Record<TemplateStatus, { bg: string; text: string }> = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-500' },
    draft: { bg: 'bg-blue-50', text: 'text-blue-600' },
};

const checkStatusStyles: Record<CheckStatus, { bg: string; text: string; icon: React.FC<{ size?: number; className?: string }> }> = {
    passed: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
    flagged: { bg: 'bg-amber-50', text: 'text-amber-600', icon: AlertTriangle },
    failed: { bg: 'bg-red-50', text: 'text-red-500', icon: XCircle },
    pending: { bg: 'bg-gray-100', text: 'text-gray-500', icon: Clock },
};

export default function PartnershipCompliancePage() {
    const [activeTab, setActiveTab] = useState<'templates' | 'checks'>('templates');
    const [templates] = useState<AgreementTemplate[]>(MOCK_TEMPLATES);
    const [checks, setChecks] = useState<ComplianceCheck[]>(MOCK_CHECKS);

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />
            <Link href="/admin/discovery/partnerships" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Partnerships Hub
            </Link>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 mb-8">
                {([
                    { id: 'templates', label: 'Agreement Templates', icon: FileText },
                    { id: 'checks', label: 'Compliance Checks', icon: Shield },
                ] as const).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
                        'px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border',
                        activeTab === tab.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-text-secondary border-gray-100 hover:border-gray-300 hover:text-text-main'
                    )}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
                            <input type="text" placeholder="Search templates..." className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                        </div>
                        <button className="h-11 px-5 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
                            <Plus size={16} /> New Template
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {templates.map((tmpl) => (
                            <div key={tmpl.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="size-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                                        <FileText size={20} />
                                    </div>
                                    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', templateStatusStyles[tmpl.status].bg, templateStatusStyles[tmpl.status].text)}>
                                        {tmpl.status}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-text-main mb-1">{tmpl.name}</h3>
                                <p className="text-xs text-text-secondary mb-4 line-clamp-2">{tmpl.description}</p>
                                <div className="flex items-center justify-between text-[10px] font-medium text-text-secondary pt-4 border-t border-gray-50">
                                    <span className="font-mono font-bold">{tmpl.version}</span>
                                    <span>Updated {tmpl.updatedAt}</span>
                                    <span>Used {tmpl.usedCount}x</span>
                                </div>
                                <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="flex-1 h-9 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center justify-center gap-1">
                                        <Edit3 size={13} /> Edit
                                    </button>
                                    <button className="flex-1 h-9 rounded-xl bg-gray-50 text-text-secondary text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-1">
                                        <Download size={13} /> Export
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Compliance Checks Tab */}
            {activeTab === 'checks' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 pt-8 pb-6 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-display font-bold text-text-main flex items-center gap-2">
                                <Scale className="text-primary" size={24} />
                                Business Compliance Checks
                            </h2>
                            <p className="text-xs font-medium text-text-secondary mt-1">Monitor registration, tax, and legal compliance status for all partners</p>
                        </div>
                        <button className="h-11 px-5 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
                            <Shield size={16} /> Run All Checks
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Business</th>
                                    <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Check Type</th>
                                    <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                    <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Last Checked</th>
                                    <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Notes</th>
                                    <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {checks.map((check) => {
                                    const StatusIcon = checkStatusStyles[check.status].icon;
                                    return (
                                        <tr key={check.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="text-xs font-bold text-text-main">{check.businessName}</p>
                                                    <p className="text-[10px] font-medium text-text-secondary">{check.businessId}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-bold text-text-main">{check.checkType}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', checkStatusStyles[check.status].bg, checkStatusStyles[check.status].text)}>
                                                    <StatusIcon size={12} /> {check.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-text-secondary">{check.checkedAt}</span>
                                            </td>
                                            <td className="px-5 py-4 max-w-[200px]">
                                                <span className="text-xs text-text-secondary line-clamp-1">{check.notes || '—'}</span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100">
                                                    <Eye size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                        <span className="text-xs text-text-secondary font-medium">
                            {checks.filter(c => c.status === 'passed').length} passed &middot;{' '}
                            {checks.filter(c => c.status === 'flagged').length} flagged &middot;{' '}
                            {checks.filter(c => c.status === 'failed').length} failed &middot;{' '}
                            {checks.filter(c => c.status === 'pending').length} pending
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
