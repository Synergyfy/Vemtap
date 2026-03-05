'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminMessagingApi } from '@/lib/api/admin';
import { format } from 'date-fns';
import {
    MessageSquare,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    Search,
    Check,
    X,
    AlertCircle,
    Trash2,
    Plus,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';

type TemplateStatus = 'pending' | 'approved' | 'rejected';

export default function TemplateApprovalPage() {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'approvals' | 'live'>('approvals');
    const [filter, setFilter] = useState<'all' | TemplateStatus>('pending');
    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        channel: 'WHATSAPP' as 'WHATSAPP' | 'SMS' | 'EMAIL',
        content: '',
        category: 'MARKETING' as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
        language: 'English (US)',
        isSystem: true
    });

    // Fetch all templates
    const { data: templatesResponse, isLoading: isApprovalsLoading } = useQuery({
        queryKey: ['admin-templates'],
        queryFn: () => adminMessagingApi.getAllTemplates(),
        enabled: view === 'approvals',
    });

    // Fetch live templates (System + Business specific)
    const { data: liveResponse, isLoading: isLiveLoading } = useQuery({
        queryKey: ['live-templates'],
        queryFn: () => adminMessagingApi.getAvailableTemplates(),
        enabled: view === 'live',
    });

    const isLoading = view === 'approvals' ? isApprovalsLoading : isLiveLoading;
    const rawTemplates = view === 'approvals'
        ? (templatesResponse?.data || templatesResponse || [])
        : (liveResponse?.data || liveResponse || []);

    const allTemplates = rawTemplates as any[];

    // status mutation
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: TemplateStatus }) =>
            adminMessagingApi.updateTemplateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
            toast.success('Template status updated');
            setSelectedTemplate(null);
        },
        onError: () => toast.error('Failed to update status'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminMessagingApi.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
            toast.success('Template deleted');
            setSelectedTemplate(null);
        },
        onError: () => toast.error('Failed to delete template'),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => adminMessagingApi.createTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
            toast.success('Template created successfully');
            setIsCreateModalOpen(false);
            setTemplateForm({
                name: '',
                channel: 'WHATSAPP',
                content: '',
                category: 'MARKETING',
                language: 'English (US)',
                isSystem: true
            });
        },
        onError: (error: any) => toast.error(error.message || 'Failed to create template'),
    });

    const filteredTemplates = allTemplates.filter(t => {
        const matchesFilter = filter === 'all' || t.status === filter;
        const matchesSearch = (t.business?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleAction = (id: string, newStatus: TemplateStatus) => {
        statusMutation.mutate({ id, status: newStatus });
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <PageHeader
                    title="WhatsApp Template Approval"
                    description="Review and manage messaging templates submitted by businesses"
                />
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-95"
                >
                    <Plus size={16} />
                    Create Template
                </button>
            </div>

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
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-xl font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-px">
                <button
                    onClick={() => setView('approvals')}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${view === 'approvals'
                        ? 'text-primary'
                        : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Review Queue
                    {view === 'approvals' && <motion.div layoutId="view-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
                <button
                    onClick={() => setView('live')}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${view === 'live'
                        ? 'text-primary'
                        : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Live System Templates
                    {view === 'live' && <motion.div layoutId="view-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
            </div>

            {view === 'approvals' && (
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit mb-6">
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
            )}

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
                                        <span className="font-bold text-sm text-slate-900">{t.business?.name || 'Unknown Business'}</span>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-tight">{t.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{t.category}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{t.language}</td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                    {format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm')}
                                </td>
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
                                        <button
                                            onClick={() => deleteMutation.mutate(t.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Template"
                                        >
                                            <Trash2 size={18} />
                                        </button>
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
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{selectedTemplate.name}</p>
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
                                        <p className="text-sm font-bold text-slate-700">{selectedTemplate.business?.name || 'Unknown'}</p>
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
                                <button
                                    onClick={() => deleteMutation.mutate(selectedTemplate.id)}
                                    className="px-6 py-3 bg-white border border-red-200 text-red-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-50 transition-all shadow-sm"
                                >
                                    Delete Template
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Template Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                        <Plus size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-text-main text-sm uppercase tracking-tight">Create WhatsApp Template</h3>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Register a new messaging template</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(templateForm); }} className="p-8 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block ml-1">Template Name</label>
                                        <input
                                            type="text"
                                            value={templateForm.name}
                                            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                            placeholder="e.g. Welcome_Message"
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block ml-1">Channel</label>
                                        <select
                                            value={templateForm.channel}
                                            onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value as any })}
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white transition-all"
                                        >
                                            <option value="WHATSAPP">WhatsApp</option>
                                            <option value="SMS">SMS</option>
                                            <option value="EMAIL">Email</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block ml-1">Category</label>
                                        <select
                                            value={templateForm.category}
                                            onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as any })}
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white transition-all"
                                        >
                                            <option value="MARKETING">Marketing</option>
                                            <option value="UTILITY">Utility</option>
                                            <option value="AUTHENTICATION">Authentication</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block ml-1">Language</label>
                                        <input
                                            type="text"
                                            value={templateForm.language}
                                            onChange={(e) => setTemplateForm({ ...templateForm, language: e.target.value })}
                                            placeholder="English (US)"
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end pb-1.5">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={templateForm.isSystem}
                                                    onChange={(e) => setTemplateForm({ ...templateForm, isSystem: e.target.checked })}
                                                />
                                                <div className={`w-10 h-6 rounded-full transition-colors ${templateForm.isSystem ? 'bg-primary' : 'bg-gray-200'}`} />
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${templateForm.isSystem ? 'translate-x-4' : ''}`} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-primary transition-colors">Global System Template</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block ml-1">Content</label>
                                    <textarea
                                        value={templateForm.content}
                                        onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                                        rows={4}
                                        placeholder="Hello {{1}}, welcome to our service!"
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                                        required
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Use {'{{1}}'}, {'{{2}}'} for dynamic variables.</p>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 h-12 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending}
                                        className="flex-[2] h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        {createMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Register Template'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
