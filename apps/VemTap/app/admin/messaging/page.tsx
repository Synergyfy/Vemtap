'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import {
    MessageSquare,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    Search,
    Filter,
    Check,
    X,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Template {
    id: string;
    businessName: string;
    templateName: string;
    category: string;
    language: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
}

const MOCK_TEMPLATES: Template[] = [
    {
        id: '1',
        businessName: 'Green Terrace Cafe',
        templateName: 'welcome_discount_v1',
        category: 'MARKETING',
        language: 'English (US)',
        content: 'Hi {{1}}, thanks for visiting Green Terrace! Enjoy 10% off your next meal with code: WELCOME10.',
        status: 'pending',
        submittedAt: '2024-03-21 14:30'
    },
    {
        id: '2',
        businessName: 'Lagos Tech Hub',
        templateName: 'event_reminder',
        category: 'UTILITY',
        language: 'English (UK)',
        content: 'Hello {{1}}, just a reminder for the {{2}} event starting at {{3}}. See you there!',
        status: 'pending',
        submittedAt: '2024-03-21 15:45'
    },
    {
        id: '3',
        businessName: 'Fashion Boutique',
        templateName: 'order_confirmed',
        category: 'AUTHENTICATION',
        language: 'English (US)',
        content: 'Your order {{1}} has been confirmed and is being prepared for shipping.',
        status: 'approved',
        submittedAt: '2024-03-20 09:12'
    }
];

export default function TemplateApprovalPage() {
    const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTemplates = templates.filter(t => {
        const matchesFilter = filter === 'all' || t.status === filter;
        const matchesSearch = t.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.templateName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleAction = (id: string, newStatus: 'approved' | 'rejected') => {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        toast.success(`Template ${newStatus === 'approved' ? 'Approved' : 'Rejected'} successfully`);
        setSelectedTemplate(null);
    };

    return (
        <div className="p-8">
            <PageHeader
                title="WhatsApp Template Approval"
                description="Review and manage messaging templates submitted by businesses"
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${filter === s
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by business or template name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-xl font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Business & Template</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Language</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Submitted</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredTemplates.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-slate-900">{t.businessName}</span>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-tight">{t.templateName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{t.category}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{t.language}</td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{t.submittedAt}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${t.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            t.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-orange-100 text-orange-700'
                                        }`}>
                                        {t.status === 'approved' ? <CheckCircle size={14} /> :
                                            t.status === 'rejected' ? <XCircle size={14} /> :
                                                <Clock size={14} />}
                                        {t.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setSelectedTemplate(t)}
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {t.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleAction(t.id, 'approved')}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                    title="Approve"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(t.id, 'rejected')}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Reject"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Template Preview Modal */}
            <AnimatePresence>
                {selectedTemplate && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTemplate(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-text-main text-sm uppercase tracking-tight">Template Review</h3>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{selectedTemplate.templateName}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTemplate(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl relative">
                                    <div className="absolute -top-3 left-4 px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400">Content Preview</div>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {selectedTemplate.content}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Business</p>
                                        <p className="text-sm font-bold text-slate-700">{selectedTemplate.businessName}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</p>
                                        <p className="text-sm font-bold text-slate-700">{selectedTemplate.category}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                    <AlertCircle className="text-amber-600 shrink-0" size={20} />
                                    <p className="text-xs font-medium text-amber-700 leading-normal">
                                        Ensure the content follows Meta's Business Messaging Policy before approval. Check for placeholder formatting like <span className="font-bold underline">{'{'}{'{'}1{'}'}{'}'}</span>.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
                                <button
                                    onClick={() => setSelectedTemplate(null)}
                                    className="px-6 py-3 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>

                                {selectedTemplate.status === 'pending' && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleAction(selectedTemplate.id, 'rejected')}
                                            className="px-6 py-3 bg-white border border-red-200 text-red-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-50 transition-all shadow-sm"
                                        >
                                            Reject Content
                                        </button>
                                        <button
                                            onClick={() => handleAction(selectedTemplate.id, 'approved')}
                                            className="px-8 py-3 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                                        >
                                            Approve Template
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
