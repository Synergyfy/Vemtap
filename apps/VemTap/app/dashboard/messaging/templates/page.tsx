'use client';

import React, { useMemo, useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useCreateTemplate, useMessagingTemplates } from '@/services/messaging/hooks';
import { Channel, Template } from '@/services/messaging/types';
import { Plus, Copy, Edit, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function TemplatesPage() {
    const { data: whatsappTemplates = [] } = useMessagingTemplates('WHATSAPP');
    const { data: smsTemplates = [] } = useMessagingTemplates('SMS');
    const { data: emailTemplates = [] } = useMessagingTemplates('EMAIL');
    const templates = useMemo(
        () => [...whatsappTemplates, ...smsTemplates, ...emailTemplates],
        [whatsappTemplates, smsTemplates, emailTemplates],
    );
    const createTemplateMutation = useCreateTemplate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);

    const filteredTemplates = templates.filter((t) =>
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
        if (!editingTemplate?.name || !editingTemplate?.content || !editingTemplate?.channel) {
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
                channel: editingTemplate.channel as Channel,
                content: editingTemplate.content,
            });
            toast.success('Template created');
            setIsModalOpen(false);
            setEditingTemplate(null);
        } catch {
            toast.error('Failed to save template to server');
        }
    };

    return (
        <div className="p-4 md:p-8">
            <PageHeader
                title="Message Templates"
                description="Manage pre-written messages for quick broadcasting"
                actions={
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} />
                        New Template
                    </button>
                }
            />

            <div className="mt-8 mb-6">
                <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md h-12 px-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                    <div key={template.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${template.channel === 'WHATSAPP' ? 'bg-green-100 text-green-700' :
                                    template.channel === 'SMS' ? 'bg-blue-100 text-blue-700' :
                                        'bg-purple-100 text-purple-700'
                                    }`}>
                                    {template.channel}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleCopy(template.content)}
                                        className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                                        title="Copy Content"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-text-main mb-2">{template.name}</h3>
                            <p className="text-sm text-text-secondary line-clamp-3 mb-4 leading-relaxed">
                                {template.content}
                            </p>
                        </div>
                        <button
                            onClick={() => handleOpenModal(template)}
                            className="w-full py-2.5 bg-gray-50 text-text-main font-bold rounded-xl hover:bg-gray-100 transition-colors text-xs flex items-center justify-center gap-2"
                        >
                            <Edit size={14} />
                            View Template
                        </button>
                    </div>
                ))}
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
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="text-xl font-display font-black text-slate-900 uppercase">
                                    {templates.some((t) => t.id === editingTemplate?.id) ? 'Template Details' : 'New Template'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Name</label>
                                        <input
                                            type="text"
                                            value={editingTemplate?.name || ''}
                                            onChange={(e) => setEditingTemplate((prev) => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g. Welcome Message"
                                            className="w-full h-12 px-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl transition-all font-bold outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Channel</label>
                                            <select
                                                value={editingTemplate?.channel || 'SMS'}
                                                onChange={(e) => setEditingTemplate((prev) => ({ ...prev, channel: e.target.value as Channel }))}
                                                className="w-full h-12 px-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl transition-all font-bold outline-none"
                                            >
                                                <option value="WHATSAPP">WhatsApp</option>
                                                <option value="SMS">SMS</option>
                                                <option value="EMAIL">Email</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Content</label>
                                            <div className="flex gap-1">
                                                {['{FirstName}', '{LastName}', '{BusinessName}', '{Points}', '{Link}'].map(v => (
                                                    <button
                                                        key={v}
                                                        type="button"
                                                        onClick={() => setEditingTemplate(prev => ({ ...prev, content: (prev?.content || '') + v }))}
                                                        className="text-[9px] font-bold text-primary hover:underline bg-primary/5 px-1.5 py-0.5 rounded"
                                                    >
                                                        + {v.replace(/{|}/g, '')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            value={editingTemplate?.content || ''}
                                            onChange={(e) => setEditingTemplate((prev) => ({ ...prev, content: e.target.value }))}
                                            placeholder="Write your message... use {FirstName}, {BusinessName}, {Points}, etc. for variables"
                                            className="w-full h-32 p-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl transition-all font-medium outline-none resize-none"
                                        />
                                        <p className="text-[9px] text-slate-400 mt-1 italic ml-1">
                                            Available variables: Name, FirstName, LastName, Email, Phone, BusinessName, BranchName, Points, Link, Website, ReviewLink
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-3"
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
