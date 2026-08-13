'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useCreateTemplate, useMessagingTemplates } from '@/services/messaging/hooks';
import { Template } from '@/services/messaging/types';
import { Plus, Copy, Edit, X, Save, Send, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function SMSTemplatesPage() {
    const { data: templates = [] } = useMessagingTemplates('SMS');
    const createTemplateMutation = useCreateTemplate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);

    const smsTemplates = templates
        .filter((t) => t.channel === 'SMS')
        .filter((t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.content.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success('Template copied to clipboard');
    };

    const handleOpenModal = (template?: Template) => {
        if (template) {
            setEditingTemplate(template);
        } else {
            setEditingTemplate({
                id: Math.random().toString(36).slice(2, 9),
                name: '',
                content: '',
                channel: 'SMS',
                status: 'pending',
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingTemplate?.name || !editingTemplate?.content) {
            toast.error('Please fill in all fields');
            return;
        }

        const existing = templates.find((t) => t.id === editingTemplate.id);
        if (existing) {
            toast.error('Template editing is managed by admin workflow');
            return;
        }

        try {
            await createTemplateMutation.mutateAsync({
                name: editingTemplate.name,
                channel: 'SMS',
                content: editingTemplate.content,
            });
            toast.success('Template created');
            setIsModalOpen(false);
            setEditingTemplate(null);
        } catch {
            toast.error('Failed to create template');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="SMS Templates"
                    description="Quick-send templates for your SMS messages."
                />
                <button
                    onClick={() => handleOpenModal()}
                    className="h-10 px-5 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Plus size={18} />
                    New Template
                </button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search SMS templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary/20 outline-none transition-all text-sm font-medium"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {smsTemplates.map((template) => (
                    <div key={template.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-700">
                                    {template.channel}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleCopy(template.content)}
                                        className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                                        title="Copy"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-text-main mb-2">{template.name}</h3>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-text-secondary leading-relaxed font-medium">
                                {template.content}
                            </div>
                        </div>
                        <button
                            onClick={() => handleOpenModal(template)}
                            className="w-full mt-4 py-2.5 bg-gray-50 text-text-main font-bold rounded-xl hover:bg-gray-100 transition-colors text-xs flex items-center justify-center gap-2"
                        >
                            <Edit size={14} />
                            View Template
                        </button>
                    </div>
                ))}
                {smsTemplates.length === 0 && (
                    <div className="col-span-full py-16 text-center">
                        <Send size={40} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-bold text-text-secondary">No SMS templates yet</p>
                        <p className="text-xs text-text-secondary mt-1">Click &quot;New Template&quot; to add one.</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 bg-blue-50/50 flex items-center justify-between">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                                    {templates.some((t) => t.id === editingTemplate?.id) ? 'Template Details' : 'New SMS Template'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider ml-1">Template Name</label>
                                    <input
                                        type="text"
                                        value={editingTemplate?.name || ''}
                                        onChange={(e) => setEditingTemplate((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Welcome Offer"
                                        className="w-full h-12 px-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl transition-all font-bold outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider ml-1">Content</label>
                                    <textarea
                                        value={editingTemplate?.content || ''}
                                        onChange={(e) => setEditingTemplate((prev) => ({ ...prev, content: e.target.value }))}
                                        placeholder="Write your SMS message... use {Name} for variables"
                                        className="w-full h-32 p-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl transition-all font-medium outline-none resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="w-full h-10 bg-primary text-white font-semibold uppercase tracking-wider text-xs rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-3"
                                >
                                    <Save size={18} />
                                    Save Template
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
