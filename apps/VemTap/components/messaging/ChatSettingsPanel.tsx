'use client';

import React, { useState } from 'react';
import { useChatStore } from '@/lib/store/useChatStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageSquare, Moon, HelpCircle, BookOpen, Plus, Trash2, Settings, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ChatSettingsPanel() {
    const automatedReplies = useChatStore(s => s.automatedReplies);
    const updateAutomatedReplies = useChatStore(s => s.updateAutomatedReplies);
    const templates = useChatStore(s => s.templates);
    const updateTemplate = useChatStore(s => s.updateTemplate);
    const deleteTemplate = useChatStore(s => s.deleteTemplate);
    const addTemplate = useChatStore(s => s.addTemplate);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const { data: business } = useMyBusiness(isAuthenticated);
    const user = useAuthStore(s => s.user);

    const businessName = business?.name || user?.businessName || 'Vemtap';
    const businessLogo = business?.logoUrl || user?.businessLogo;

    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

    const handleToggle = (field: 'welcomeEnabled' | 'offHoursEnabled' | 'faqEnabled') => {
        updateAutomatedReplies({ [field]: !automatedReplies[field] });
        toast.success(`${field.replace('Enabled', '')} ${automatedReplies[field] ? 'disabled' : 'enabled'}`);
    };

    const handleNewTemplate = () => {
        const id = `tmpl_${Date.now()}`;
        addTemplate({
            id,
            name: 'New Template',
            content: 'Hi {{Customer Name}}, ...',
            category: 'General',
            placeholders: ['Customer Name'],
            enabled: true,
            lastEditedAt: Date.now(),
        });
        setEditingTemplateId(id);
        toast.success('Template created');
    };

    return (
        <div className="min-h-full bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/messaging/chat"
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-3">
                        {businessLogo ? (
                            <img src={businessLogo} alt={businessName} className="w-9 h-9 rounded-lg object-cover" />
                        ) : (
                            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white">
                                <Settings size={18} />
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">Chat Settings</h2>
                            <p className="text-xs text-slate-500">{businessName} • Automation & Templates</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => toast.success('Settings saved!')}
                    className="px-5 py-2 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                >
                    Save Changes
                </button>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
                {/* Automated Replies */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <MessageSquare className="text-primary" size={20} />
                        <h3 className="text-xl font-bold text-slate-900">Automated Replies</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Welcome Message */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                        <MessageSquare size={24} />
                                    </div>
                                    <ToggleSwitch
                                        enabled={automatedReplies.welcomeEnabled}
                                        onToggle={() => handleToggle('welcomeEnabled')}
                                    />
                                </div>
                                <h4 className="text-base font-bold mb-2">First Reach Out</h4>
                                <p className="text-sm text-slate-500 mb-4">Automatically respond to new customer inquiries.</p>
                            </div>
                            <textarea
                                value={automatedReplies.welcomeMessage}
                                onChange={e => updateAutomatedReplies({ welcomeMessage: e.target.value })}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                                rows={3}
                            />
                        </div>

                        {/* Off-hours */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                                        <Moon size={24} />
                                    </div>
                                    <ToggleSwitch
                                        enabled={automatedReplies.offHoursEnabled}
                                        onToggle={() => handleToggle('offHoursEnabled')}
                                    />
                                </div>
                                <h4 className="text-base font-bold mb-2">Off-hours</h4>
                                <p className="text-sm text-slate-500 mb-4">Send a custom message when your team is away.</p>
                            </div>
                            <textarea
                                value={automatedReplies.offHoursMessage}
                                onChange={e => updateAutomatedReplies({ offHoursMessage: e.target.value })}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                                rows={3}
                            />
                        </div>

                        {/* FAQs */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                        <HelpCircle size={24} />
                                    </div>
                                    <ToggleSwitch
                                        enabled={automatedReplies.faqEnabled}
                                        onToggle={() => handleToggle('faqEnabled')}
                                    />
                                </div>
                                <h4 className="text-base font-bold mb-2">FAQs</h4>
                                <p className="text-sm text-slate-500 mb-4">Auto-reply to common keyword-based questions.</p>
                            </div>
                            <div className="space-y-2">
                                {automatedReplies.faqKeywords.map((faq, i) => (
                                    <div key={i} className={`p-2 bg-slate-50 rounded-lg border border-slate-100 ${!faq.enabled ? 'opacity-50' : ''}`}>
                                        <div className="flex flex-wrap gap-1 mb-1">
                                            {faq.keywords.map(kw => (
                                                <span key={kw} className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-medium">{kw}</span>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-500 line-clamp-1">{faq.response}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Message Templates */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <BookOpen className="text-primary" size={20} />
                            <h3 className="text-xl font-bold text-slate-900">Message Templates</h3>
                        </div>
                        <button
                            onClick={handleNewTemplate}
                            className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors"
                        >
                            <Plus size={16} /> New Template
                        </button>
                    </div>

                    <div className="space-y-3">
                        {templates.map(template => (
                            <div key={template.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-slate-900">{template.name}</h4>
                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                            {template.category}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {template.openRate && (
                                            <span className="text-[10px] font-bold text-green-600">{template.openRate}% open</span>
                                        )}
                                        <button
                                            onClick={() => setEditingTemplateId(editingTemplateId === template.id ? null : template.id)}
                                            className="text-xs text-primary font-bold hover:underline"
                                        >
                                            {editingTemplateId === template.id ? 'Close' : 'Edit'}
                                        </button>
                                        <button
                                            onClick={() => { deleteTemplate(template.id); toast.success('Template deleted'); }}
                                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {editingTemplateId === template.id ? (
                                    <div className="mt-3 space-y-3">
                                        <input
                                            type="text"
                                            value={template.name}
                                            onChange={e => updateTemplate(template.id, { name: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Placeholders</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {template.placeholders.map(p => (
                                                    <span key={p} className="px-2 py-1 bg-white border border-primary/30 rounded text-[10px] font-mono font-medium text-primary">
                                                        {`{{${p}}}`}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            value={template.content}
                                            onChange={e => updateTemplate(template.id, { content: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                            rows={4}
                                        />
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={template.enabled}
                                                    onChange={() => updateTemplate(template.id, { enabled: !template.enabled })}
                                                    className="rounded text-primary focus:ring-primary w-4 h-4"
                                                />
                                                <span className="text-xs font-medium text-slate-600">Enable template</span>
                                            </label>
                                            <button
                                                onClick={() => { setEditingTemplateId(null); toast.success('Template saved'); }}
                                                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600 line-clamp-2">{template.content}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-primary' : 'bg-slate-200'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${
                    enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
            />
        </button>
    );
}
