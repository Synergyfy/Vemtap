'use client';

import React, { useState } from 'react';
import {
    useReminderTemplates,
    useReminderPlaceholders,
    useUpdateReminderTemplate,
    useResetReminderTemplate,
    usePreviewReminderTemplate,
    useRunRemindersNow,
} from '@/services/notifications/hooks';
import {
    SubscriptionReminderTemplate,
    ReminderPlaceholder,
} from '@/services/notifications/types';
import {
    FileText,
    Play,
    RotateCcw,
    Edit3,
    Eye,
    Save,
    X,
    Smartphone,
    Bell,
    Mail,
    AlertTriangle,
    AlertCircle,
    Info,
    Sparkles,
    Check,
    Link as LinkIcon,
    Layers,
    Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReminderTemplatesList() {
    const { data: templates = [], isLoading, refetch } = useReminderTemplates();
    const { data: placeholders = [] } = useReminderPlaceholders();

    const [editingTemplate, setEditingTemplate] = useState<SubscriptionReminderTemplate | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editMessage, setEditMessage] = useState('');
    const [editActionUrl, setEditActionUrl] = useState('');
    const [editType, setEditType] = useState('warning');
    const [editIsEnabled, setEditIsEnabled] = useState(true);
    const [editSendPush, setEditSendPush] = useState(true);
    const [editSendInApp, setEditSendInApp] = useState(true);
    const [editSendEmail, setEditSendEmail] = useState(false);
    const [focusedField, setFocusedField] = useState<'title' | 'message'>('message');

    const [previewResult, setPreviewResult] = useState<{ title: string; message: string } | null>(null);

    const updateMutation = useUpdateReminderTemplate();
    const resetMutation = useResetReminderTemplate();
    const previewMutation = usePreviewReminderTemplate();
    const runNowMutation = useRunRemindersNow();

    const openEditModal = (template: SubscriptionReminderTemplate) => {
        setEditingTemplate(template);
        setEditName(template.name);
        setEditDescription(template.description || '');
        setEditTitle(template.titleTemplate);
        setEditMessage(template.messageTemplate);
        setEditActionUrl(template.actionUrl || '/dashboard/settings/subscription');
        setEditType(template.type || 'warning');
        setEditIsEnabled(template.isEnabled !== false);
        setEditSendPush(template.sendPush !== false);
        setEditSendInApp(template.sendInApp !== false);
        setEditSendEmail(template.sendEmail === true);
        setPreviewResult(null);
    };

    const closeEditModal = () => {
        setEditingTemplate(null);
        setPreviewResult(null);
    };

    const handleInsertPlaceholder = (placeholder: string) => {
        if (focusedField === 'title') {
            setEditTitle((prev) => `${prev} ${placeholder}`.trim());
        } else {
            setEditMessage((prev) => `${prev} ${placeholder}`.trim());
        }
    };

    const handleSaveTemplate = () => {
        if (!editingTemplate) return;
        if (!editTitle.trim()) {
            toast.error('Title template is required');
            return;
        }
        if (!editMessage.trim()) {
            toast.error('Message template is required');
            return;
        }

        updateMutation.mutate(
            {
                id: editingTemplate.id,
                data: {
                    name: editName.trim(),
                    description: editDescription.trim() || undefined,
                    titleTemplate: editTitle.trim(),
                    messageTemplate: editMessage.trim(),
                    actionUrl: editActionUrl.trim(),
                    type: editType,
                    isEnabled: editIsEnabled,
                    sendPush: editSendPush,
                    sendInApp: editSendInApp,
                    sendEmail: editSendEmail,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Template updated successfully');
                    closeEditModal();
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || 'Failed to update template');
                },
            },
        );
    };

    const handleReset = (id: string) => {
        if (confirm('Reset this template back to standard system default copy?')) {
            resetMutation.mutate(id, {
                onSuccess: () => {
                    toast.success('Template reset to default');
                    if (editingTemplate?.id === id) {
                        closeEditModal();
                    }
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || 'Failed to reset template');
                },
            });
        }
    };

    const handlePreview = () => {
        if (!editTitle || !editMessage) return;
        previewMutation.mutate(
            {
                titleTemplate: editTitle,
                messageTemplate: editMessage,
            },
            {
                onSuccess: (res) => {
                    setPreviewResult({ title: res.title, message: res.message });
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || 'Failed to generate preview');
                },
            },
        );
    };

    const handleRunNow = () => {
        if (
            confirm(
                'Run automated subscription reminders right now? This will evaluate active/lapsed businesses against their renewal stages and dispatch notifications.',
            )
        ) {
            runNowMutation.mutate(undefined, {
                onSuccess: (res) => {
                    toast.success(
                        `Renewal reminders run complete! (${res.result?.sentInApp ?? 0} in-app, ${res.result?.sentPush ?? 0} push, ${res.result?.sentEmail ?? 0} email)`,
                        { duration: 6000 },
                    );
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || 'Failed to trigger reminder run');
                },
            });
        }
    };

    const getStageBadge = (stage: number) => {
        if (stage === 0) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    <AlertCircle size={13} /> Lapsed / Inactive Plan
                </span>
            );
        }
        if (stage <= 3) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle size={13} /> {stage} Days Before Expiry (Urgent)
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Clock size={13} /> {stage} Days Before Expiry
            </span>
        );
    };

    return (
        <div className="space-y-8">
            {/* Top Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                        <FileText className="text-primary" size={20} />
                        Subscription Renewal Reminder Templates
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5 max-w-xl leading-relaxed">
                        Businesses with expiring or lapsed subscriptions receive customized nudges based on these templates. The cron job runs daily at 08:00 AM server time.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRunNow}
                        disabled={runNowMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50"
                    >
                        {runNowMutation.isPending ? (
                            <>
                                <div className="animate-spin size-3.5 border-2 border-white border-t-transparent rounded-full" />
                                Processing Run...
                            </>
                        ) : (
                            <>
                                <Play size={14} />
                                Trigger Reminders Now
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Template Cards Grid */}
            {isLoading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-gray-200">
                    <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent"></div>
                    <p className="text-xs text-text-secondary font-medium">Loading reminder templates...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className={`bg-white rounded-2xl border transition-all p-6 flex flex-col justify-between gap-5 shadow-sm hover:shadow-md ${
                                template.isEnabled ? 'border-gray-200' : 'border-gray-200 bg-gray-50/60 opacity-70'
                            }`}
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    {getStageBadge(template.stage)}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                template.isEnabled
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                            {template.isEnabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-base font-bold text-text-main">{template.name}</h4>
                                    {template.description && (
                                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                                            {template.description}
                                        </p>
                                    )}
                                </div>

                                {/* Content Preview */}
                                <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-gray-400">
                                            Title Template
                                        </span>
                                        <p className="text-xs font-bold text-text-main mt-0.5">
                                            {template.titleTemplate}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-gray-400">
                                            Body Template
                                        </span>
                                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-3 leading-relaxed">
                                            {template.messageTemplate}
                                        </p>
                                    </div>
                                </div>

                                {/* Channels Active */}
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-[11px] font-bold text-gray-400">Channels:</span>
                                    {template.sendInApp && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                                            <Bell size={11} /> In-App
                                        </span>
                                    )}
                                    {template.sendPush && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                                            <Smartphone size={11} /> Push
                                        </span>
                                    )}
                                    {template.sendEmail && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700">
                                            <Mail size={11} /> Email
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                                <button
                                    onClick={() => handleReset(template.id)}
                                    disabled={resetMutation.isPending}
                                    className="text-xs font-semibold text-text-secondary hover:text-text-main flex items-center gap-1.5 transition-all"
                                >
                                    <RotateCcw size={13} /> Reset Default
                                </button>

                                <button
                                    onClick={() => openEditModal(template)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/15 font-bold rounded-xl text-xs transition-all"
                                >
                                    <Edit3 size={13} /> Customize Template
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Template Modal */}
            {editingTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-text-main">
                                        Customize Template: {editingTemplate.name}
                                    </h3>
                                    {getStageBadge(editingTemplate.stage)}
                                </div>
                                <p className="text-xs text-text-secondary">
                                    Edit the notification copy and configure live dynamic variables.
                                </p>
                            </div>
                            <button
                                onClick={closeEditModal}
                                className="p-2 text-gray-400 hover:text-text-main rounded-xl hover:bg-gray-100 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Template Name & Status Switch */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-text-main mb-1.5">
                                        Template Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-text-main font-semibold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-text-main mb-1.5">
                                        Status
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setEditIsEnabled(!editIsEnabled)}
                                        className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                            editIsEnabled
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                : 'bg-gray-100 border-gray-200 text-gray-500'
                                        }`}
                                    >
                                        <Check size={14} className={editIsEnabled ? 'opacity-100' : 'opacity-0'} />
                                        {editIsEnabled ? 'Active / Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            </div>

                            {/* Available Dynamic Placeholders Chips */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                                    Click to Insert Placeholder Tags
                                </label>
                                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200">
                                    {placeholders.map((p) => (
                                        <button
                                            key={p.placeholder}
                                            type="button"
                                            onClick={() => handleInsertPlaceholder(p.placeholder)}
                                            className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-primary hover:bg-primary/5 hover:border-primary text-xs font-bold transition-all shadow-2xs"
                                            title={p.description}
                                        >
                                            {p.placeholder}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title Template */}
                            <div>
                                <label className="block text-xs font-bold text-text-main mb-1.5">
                                    Title Template
                                </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onFocus={() => setFocusedField('title')}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="Your deals in {{clusterName}} expire in {{daysLeft}} days"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                />
                            </div>

                            {/* Message Body Template */}
                            <div>
                                <label className="block text-xs font-bold text-text-main mb-1.5">
                                    Message Body Template
                                </label>
                                <textarea
                                    rows={4}
                                    value={editMessage}
                                    onFocus={() => setFocusedField('message')}
                                    onChange={(e) => setEditMessage(e.target.value)}
                                    placeholder="Write template body with dynamic tags..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Channels & Action URL */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-main mb-1.5 flex items-center gap-1.5">
                                        <LinkIcon size={12} className="text-gray-400" />
                                        Renewal Link (actionUrl)
                                    </label>
                                    <input
                                        type="text"
                                        value={editActionUrl}
                                        onChange={(e) => setEditActionUrl(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-text-main mb-2">
                                        Delivery Channels
                                    </label>
                                    <div className="flex items-center gap-4 text-xs font-bold text-text-main">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editSendInApp}
                                                onChange={(e) => setEditSendInApp(e.target.checked)}
                                                className="accent-primary size-4"
                                            />
                                            In-App
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editSendPush}
                                                onChange={(e) => setEditSendPush(e.target.checked)}
                                                className="accent-primary size-4"
                                            />
                                            Push
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editSendEmail}
                                                onChange={(e) => setEditSendEmail(e.target.checked)}
                                                className="accent-primary size-4"
                                            />
                                            Email
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Test Box */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                                        <Eye size={14} className="text-primary" />
                                        Live Template Interpolation Preview
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handlePreview}
                                        disabled={previewMutation.isPending}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Sparkles size={12} /> Refresh Preview
                                    </button>
                                </div>

                                {previewResult ? (
                                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-1">
                                        <p className="text-xs font-bold text-text-main">{previewResult.title}</p>
                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            {previewResult.message}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 text-xs text-text-secondary text-center">
                                        Click &ldquo;Refresh Preview&rdquo; to test how sample merchant data is rendered.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/80">
                            <button
                                type="button"
                                onClick={() => handleReset(editingTemplate.id)}
                                className="text-xs font-semibold text-text-secondary hover:text-text-main flex items-center gap-1.5"
                            >
                                <RotateCcw size={13} /> Reset Default Copy
                            </button>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2.5 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 text-xs transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveTemplate}
                                    disabled={updateMutation.isPending}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 text-xs transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                                >
                                    {updateMutation.isPending ? (
                                        <>
                                            <div className="animate-spin size-3.5 border-2 border-white border-t-transparent rounded-full" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            Save Template Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
