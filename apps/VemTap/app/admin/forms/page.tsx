'use client';

import React, { useMemo, useState } from 'react';
import { useBusinessFormsStore } from '@/store/useBusinessFormsStore';
import { CheckCircle2, XCircle, Clock3, Plus, Trash2, FilePlus, Layout, Settings2, Pencil } from 'lucide-react';
import { notify } from '@/lib/notify';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminFormsPage() {
    const forms = useBusinessFormsStore((state) => state.forms);
    const fetchForms = useBusinessFormsStore((state) => state.fetchForms);
    const submissions = useBusinessFormsStore((state) => state.submissions);
    const fetchSubmissions = useBusinessFormsStore((state) => state.fetchSubmissions);
    const templates = useBusinessFormsStore((state) => state.templates);
    const fetchTemplates = useBusinessFormsStore((state) => state.fetchTemplates);
    const createTemplate = useBusinessFormsStore((state) => state.createTemplate);
    const updateTemplate = useBusinessFormsStore((state) => state.updateTemplate);
    const deleteTemplate = useBusinessFormsStore((state) => state.deleteTemplate);
    const setFormStatus = useBusinessFormsStore((state) => state.setFormStatus);
    const isLoading = useBusinessFormsStore((state) => state.isLoading);
    const isSubmitting = useBusinessFormsStore((state) => state.isSubmitting);
    const templateStats = useBusinessFormsStore((state) => state.templateStats);
    const fetchTemplateStats = useBusinessFormsStore((state) => state.fetchTemplateStats);
    
    // Admin Forms Management
    const adminForms = useBusinessFormsStore((state) => state.adminForms);
    const fetchAdminForms = useBusinessFormsStore((state) => state.fetchAdminForms);
    const disableForm = useBusinessFormsStore((state) => state.disableForm);
    const enableForm = useBusinessFormsStore((state) => state.enableForm);

    React.useEffect(() => {
        fetchTemplates();
        fetchForms(''); // Fetch all for admin
        fetchSubmissions('');
        fetchTemplateStats();
        fetchAdminForms();
    }, [fetchTemplates, fetchForms, fetchSubmissions, fetchTemplateStats, fetchAdminForms]);

    const pendingForms = useMemo(() => forms.filter((form) => form.status === 'pending'), [forms]);
    const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'responses' | 'templates' | 'business-forms'>('pending');

    const [viewingStatsId, setViewingStatsId] = useState<string | null>(null);
    const selectedStats = viewingStatsId ? templateStats[viewingStatsId] : null;

    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateForm, setTemplateForm] = useState({
        title: '',
        description: '',
        type: 'survey' as any,
        isSystem: true,
        fields: [] as any[]
    });

    const [newField, setNewField] = useState({ label: '', type: 'short_text' });

    const openCreateModal = () => {
        setEditingTemplateId(null);
        setTemplateForm({ title: '', description: '', type: 'survey', isSystem: true, fields: [] });
        setNewField({ label: '', type: 'short_text' });
        setIsTemplateModalOpen(true);
    };

    const openEditModal = (template: any) => {
        setEditingTemplateId(template.id);
        setTemplateForm({
            title: template.title,
            description: template.description || '',
            type: template.type || 'survey',
            isSystem: template.isSystem || false,
            fields: template.fields || []
        });
        setNewField({ label: '', type: 'short_text' });
        setIsTemplateModalOpen(true);
    };

    const scopedForms = activeTab === 'pending' ? pendingForms : forms;

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Auto-add pending field if exists
        const finalFields = [...templateForm.fields];
        if (newField.label.trim()) {
            finalFields.push({ id: Date.now().toString(), label: newField.label.trim(), type: newField.type as any });
        }

        if (!templateForm.title || finalFields.length === 0) {
            notify.error('Title and at least one field are required');
            return;
        }

        try {
            if (editingTemplateId) {
                await updateTemplate(editingTemplateId, {
                    ...templateForm,
                    fields: finalFields
                });
                notify.success('Template updated successfully');
            } else {
                await createTemplate({
                    ...templateForm,
                    fields: finalFields
                });
                notify.success('Template created successfully');
            }
            setIsTemplateModalOpen(false);
            setEditingTemplateId(null);
            setTemplateForm({ title: '', description: '', type: 'survey', isSystem: true, fields: [] });
            setNewField({ label: '', type: 'short_text' });
        } catch (err: any) {
            notify.error(err.message || 'Failed to save template');
        }
    };

    const addField = () => {
        if (!newField.label) return;
        setTemplateForm({
            ...templateForm,
            fields: [...templateForm.fields, { id: Date.now().toString(), ...newField }]
        });
        setNewField({ label: '', type: 'short_text' });
    };

    const removeField = (id: string) => {
        setTemplateForm({
            ...templateForm,
            fields: templateForm.fields.filter(f => f.id !== id)
        });
    };

    const approve = async (id: string) => {
        try {
            await setFormStatus(id, 'approved', 'Admin', 'Approved for business use');
            notify.success('Form approved');
        } catch (err: any) {
            notify.error(err.message || 'Failed to approve form');
        }
    };

    const reject = async (id: string) => {
        try {
            await setFormStatus(id, 'rejected', 'Admin', 'Please adjust configuration and resubmit');
            notify.success('Form rejected');
        } catch (err: any) {
            notify.error(err.message || 'Failed to reject form');
        }
    };

    const statusBadge = (status: string, adminDisabled?: boolean) => {
        if (adminDisabled) return 'bg-red-100 text-red-800 border-red-300';
        if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
        return 'bg-amber-50 text-amber-700 border-amber-200';
    };

    const statusIcon = (status: string, adminDisabled?: boolean) => {
        if (adminDisabled) return <XCircle size={14} className="text-red-600" />;
        if (status === 'approved') return <CheckCircle2 size={14} />;
        if (status === 'rejected') return <XCircle size={14} />;
        return <Clock3 size={14} />;
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Administration</p>
                    <h1 className="text-3xl font-display font-bold text-text-main">Business Forms & Templates</h1>
                    <p className="text-text-secondary font-medium mt-1">Approve business forms or create reusable templates.</p>
                </div>
                {activeTab === 'templates' && (
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-95"
                    >
                        <Plus size={16} />
                        Create Template
                    </button>
                )}
            </div>

            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                {(['pending', 'all', 'responses', 'templates', 'business-forms'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
                    >
                        {tab === 'templates' ? 'Form Templates' : 
                         tab === 'business-forms' ? 'Business Forms' :
                         tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'templates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center gap-4 text-gray-400 text-center">
                            <Clock3 size={48} className="animate-spin text-primary/20" />
                            <p className="font-display font-bold uppercase tracking-widest text-[10px]">Loading templates...</p>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center gap-4 text-gray-400 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                            <Layout size={48} className="opacity-20" />
                            <p className="font-display font-medium text-sm">No templates found. Create one to get started.</p>
                        </div>
                    ) : (
                        templates.map((template) => (
                            <div key={template.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="size-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                                        <Layout size={24} />
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => openEditModal(template)}
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to delete this template?')) {
                                                    try {
                                                        await deleteTemplate(template.id);
                                                        notify.success('Template deleted');
                                                    } catch (err: any) {
                                                        notify.error(err.message || 'Failed to delete template');
                                                    }
                                                }
                                            }}
                                            disabled={isSubmitting}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-text-main text-lg mb-1">{template.title}</h3>
                                <p className="text-sm text-text-secondary font-medium line-clamp-2 mb-4">{template.description}</p>
                                
                                {templateStats[template.id] && (
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Usage</p>
                                            <p className="text-sm font-bold text-primary">{templateStats[template.id].usageCount} Branches</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Responses</p>
                                            <p className="text-sm font-bold text-emerald-600">{templateStats[template.id].totalResponses}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                                            {template.type}
                                        </span>
                                        <button 
                                            onClick={() => setViewingStatsId(template.id)}
                                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                        >
                                            View Stats
                                        </button>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{template.fields?.length || 0} Fields</span>
                                </div>
                            </div>
                        ))
                    )}
                    <button
                        onClick={openCreateModal}
                        className="border-2 border-dashed border-gray-200 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                    >
                        <Plus size={32} />
                        <span className="font-bold text-sm">Add New Template</span>
                    </button>
                </div>
            )}

            {(activeTab === 'pending' || activeTab === 'all') && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                <th className="px-5 py-4">Business</th>
                                <th className="px-5 py-4">Form</th>
                                <th className="px-5 py-4">Type</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {scopedForms.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-text-secondary font-medium">No forms in this view.</td>
                                </tr>
                            )}
                            {scopedForms.map((form) => (
                                <tr key={form.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4 text-sm font-bold text-text-main">{form.businessName}</td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-bold text-text-main">{form.title}</p>
                                        <p className="text-xs text-text-secondary font-mono">{form.key}</p>
                                    </td>
                                    <td className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                        {form.typeLabel || form.type}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusBadge(form.status)}`}>
                                            {statusIcon(form.status)}
                                            {form.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => approve(form.id)}
                                                className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-40"
                                                disabled={form.status === 'approved'}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => reject(form.id)}
                                                className="h-9 px-4 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-40"
                                                disabled={form.status === 'rejected'}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'business-forms' && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                <th className="px-5 py-4">Title & Link</th>
                                <th className="px-5 py-4">Business / Branch</th>
                                <th className="px-5 py-4">Responses</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading && adminForms.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-text-secondary animate-pulse font-bold tracking-widest uppercase text-[10px]">Loading forms...</td>
                                </tr>
                            ) : adminForms.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-text-secondary font-medium">No business forms found.</td>
                                </tr>
                            ) : (
                                adminForms.map((form: any) => (
                                    <tr key={form.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-text-main">{form.title}</p>
                                            <a 
                                                href={`/forms/${form.key}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-primary font-black uppercase tracking-wider hover:underline"
                                            >
                                                View Form Link
                                            </a>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-text-main">{form.businessName || 'N/A'}</p>
                                            <p className="text-[10px] text-text-secondary font-black uppercase">{form.branchName || 'Main'}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                {form._count?.submissions || form.totalResponses || 0}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                                                form.adminDisabled ? 'bg-red-100 text-red-800 border-red-300' : 
                                                form.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {form.adminDisabled ? <XCircle size={12} /> : form.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {form.adminDisabled ? 'Admin Suspended' : form.isActive ? 'Active' : 'Merchant Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {!form.adminDisabled ? (
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Are you sure you want to suspend this form? It will no longer be accessible by customers.')) {
                                                                try {
                                                                    await disableForm(form.id);
                                                                    notify.success('Form suspended by admin');
                                                                } catch (err: any) {
                                                                    notify.error(err.message || 'Failed to suspend form');
                                                                }
                                                            }
                                                        }}
                                                        className="h-9 px-4 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md shadow-red-200 active:scale-95"
                                                    >
                                                        Admin Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await enableForm(form.id);
                                                                notify.success('Form reactivated by admin');
                                                            } catch (err: any) {
                                                                notify.error(err.message || 'Failed to reactivate form');
                                                            }
                                                        }}
                                                        className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 active:scale-95"
                                                    >
                                                        Admin Reactivate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'responses' && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                <th className="px-5 py-4">Business</th>
                                <th className="px-5 py-4">Customer</th>
                                <th className="px-5 py-4">Form</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Response</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {submissions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-text-secondary font-medium">No responses yet.</td>
                                </tr>
                            )}
                            {submissions.map((submission) => (
                                <tr key={submission.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4 text-sm font-bold text-text-main">{forms.find((f) => f.id === submission.formId)?.businessName || 'Business'}</td>
                                    <td className="px-5 py-4 text-sm font-medium text-text-main">{submission.customerName}</td>
                                    <td className="px-5 py-4 text-sm font-bold text-text-main">{submission.formTitle}</td>
                                    <td className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">{submission.status}</td>
                                    <td className="px-5 py-4 text-xs text-text-secondary font-medium">
                                        {submission.response ? `${submission.response.actor} via ${submission.response.channel}` : 'No response'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Template Creation Modal */}
            <AnimatePresence>
                {isTemplateModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsTemplateModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                        {editingTemplateId ? <Settings2 size={20} /> : <FilePlus size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-text-main text-sm uppercase tracking-tight">
                                            {editingTemplateId ? 'Edit Form Template' : 'Create Form Template'}
                                        </h3>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                                            {editingTemplateId ? 'Update your template details' : 'Global templates for businesses'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveTemplate} className="p-8 space-y-6 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Template Title</label>
                                        <input
                                            type="text"
                                            value={templateForm.title}
                                            onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                                            placeholder="e.g. Birthday Celebration"
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Form Type</label>
                                        <select
                                            value={templateForm.type}
                                            onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as any })}
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none transition-all"
                                        >
                                            <option value="survey">Survey</option>
                                            <option value="complaint">Complaint</option>
                                            <option value="social">Social / Community</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Description</label>
                                    <textarea
                                        value={templateForm.description}
                                        onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                                        placeholder="Briefly describe the purpose of this template..."
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                                        rows={2}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Template Fields</label>
                                        <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full">{templateForm.fields.length} Fields Added</span>
                                    </div>

                                    <div className="space-y-2">
                                        {templateForm.fields.map((field) => (
                                            <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                                        <Settings2 size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text-main">{field.label}</p>
                                                        <p className="text-[10px] font-black uppercase text-gray-400">{field.type.replace('_', ' ')}</p>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeField(field.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}

                                        <div className="p-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    value={newField.label}
                                                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addField();
                                                        }
                                                    }}
                                                    placeholder="Field Label (e.g. Your Rating)"
                                                    className="h-10 px-4 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                                                />
                                                <select
                                                    value={newField.type}
                                                    onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                                                    className="h-10 px-4 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                                                >
                                                    <option value="short_text">Short Text</option>
                                                    <option value="long_text">Long Text</option>
                                                    <option value="rating">Rating (1-5)</option>
                                                    <option value="choice">Multiple Choice</option>
                                                    <option value="email">Email Address</option>
                                                    <option value="phone">Phone Number</option>
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addField}
                                                className="w-full h-10 bg-white border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary hover:border-primary hover:text-primary transition-all rounded-xl"
                                            >
                                                Add Field to Template
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsTemplateModalOpen(false)}
                                        className="flex-1 h-12 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-2 h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isSubmitting ? <Clock3 size={16} className="animate-spin" /> : editingTemplateId ? 'Update Template' : 'Save Template'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Usage Stats Modal */}
            <AnimatePresence>
                {viewingStatsId && selectedStats && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingStatsId(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                        <FilePlus size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-text-main text-sm uppercase tracking-tight">
                                            {selectedStats.templateName} Usage
                                        </h3>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                                            Detailed tracking per branch
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingStatsId(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6 overflow-y-auto">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Branches</p>
                                        <p className="text-2xl font-black text-primary">{selectedStats.usageCount}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Responses</p>
                                        <p className="text-2xl font-black text-emerald-600">{selectedStats.totalResponses}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Unique Businesses</p>
                                        <p className="text-2xl font-black text-amber-600">{selectedStats.uniqueBusinessesCount}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-gray-500 ml-1">Branch Breakdown</h4>
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Business / Branch</th>
                                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Responses</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {selectedStats.usage.map((u, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <p className="font-bold text-slate-700">{u.branchName}</p>
                                                            <p className="text-[10px] text-slate-400">{u.businessName}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                                                {u.responseCount}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {selectedStats.usage.length === 0 && (
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-8 text-center text-slate-400 font-medium">No active usage tracked for this template.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
