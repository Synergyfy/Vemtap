'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, Save, Wand2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { useFlowTemplatesStore, FlowTemplateRecord } from '@/store/flowTemplatesStore';
import { notify } from '@/lib/notify';

function validateFlowJson(raw: string) {
    try {
        const parsed = JSON.parse(raw) as { nodes?: Array<{ id?: string; type?: string; next?: string }> };
        const nodes = parsed.nodes || [];

        if (!nodes.length) return { ok: false, message: 'nodes[] is required.' };

        const ids = nodes.map((n) => n.id).filter(Boolean) as string[];
        const unique = new Set(ids);
        if (unique.size !== ids.length) return { ok: false, message: 'Node IDs must be unique.' };

        const hasEnd = nodes.some((n) => n.type === 'end');
        if (!hasEnd) return { ok: false, message: 'Flow must include at least one end node.' };

        const missingRef = nodes.find((n) => n.next && !unique.has(n.next));
        if (missingRef?.next) return { ok: false, message: `Broken next reference: ${missingRef.next}` };

        return { ok: true, message: 'JSON validated successfully.' };
    } catch {
        return { ok: false, message: 'Invalid JSON format.' };
    }
}

export default function FlowTemplatesPage() {
    const queryClient = useQueryClient();
    const hydrateIfEmpty = useFlowTemplatesStore((state) => state.hydrateIfEmpty);

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['flow-templates'],
        queryFn: async () => {
            hydrateIfEmpty();
            return useFlowTemplatesStore.getState().templates;
        },
        initialData: useFlowTemplatesStore.getState().templates,
    });

    const [jsonDraft, setJsonDraft] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        templateName: '',
        description: '',
        triggerType: 'new_customer' as FlowTemplateRecord['triggerType'],
    });

    const selectedTemplate = useMemo(
        () => templates.find((t) => t.id === selectedTemplateId) || templates[0],
        [templates, selectedTemplateId],
    );

    useEffect(() => {
        if (!templates.length) return;
        if (!selectedTemplateId || !templates.some((t) => t.id === selectedTemplateId)) {
            setSelectedTemplateId(templates[0].id);
            setJsonDraft(templates[0].definition);
        }
    }, [templates, selectedTemplateId]);

    const validation = useMemo(() => validateFlowJson(jsonDraft), [jsonDraft]);

    const createMutation = useMutation({
        mutationFn: async () => {
            const trimmedName = createForm.templateName.trim();
            if (!trimmedName) throw new Error('Template name is required.');
            const trimmedDesc = createForm.description.trim();
            return useFlowTemplatesStore.getState().addTemplate({
                templateName: trimmedName,
                description: trimmedDesc || 'New flow template',
                triggerType: createForm.triggerType,
            });
        },
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: ['flow-templates'] });
            setSelectedTemplateId(created.id);
            setJsonDraft(created.definition);
            setIsCreateOpen(false);
            setCreateForm({ templateName: '', description: '', triggerType: 'new_customer' });
            notify.success('Template created.');
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : 'Failed to create template.');
        },
    });

    const saveDraftMutation = useMutation({
        mutationFn: async () => {
            if (!selectedTemplate) throw new Error('Select a template first.');
            if (!validation.ok) throw new Error('Fix validation errors before saving.');
            return useFlowTemplatesStore.getState().updateTemplate(selectedTemplate.id, {
                definition: jsonDraft,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flow-templates'] });
            notify.success('Draft saved.');
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : 'Failed to save draft.');
        },
    });

    const cloneMutation = useMutation({
        mutationFn: async () => {
            if (!selectedTemplate) throw new Error('Select a template first.');
            return useFlowTemplatesStore.getState().cloneTemplate(selectedTemplate.id);
        },
        onSuccess: (cloned) => {
            if (!cloned) return;
            queryClient.invalidateQueries({ queryKey: ['flow-templates'] });
            setSelectedTemplateId(cloned.id);
            setJsonDraft(cloned.definition);
            notify.success('Template cloned.');
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : 'Failed to clone template.');
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async () => {
            if (!selectedTemplate) throw new Error('Select a template first.');
            return useFlowTemplatesStore.getState().toggleStatus(selectedTemplate.id);
        },
        onSuccess: (updated) => {
            if (!updated) return;
            queryClient.invalidateQueries({ queryKey: ['flow-templates'] });
            notify.success(`Template ${updated.status === 'active' ? 'activated' : 'deactivated'}.`);
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : 'Failed to update status.');
        },
    });

    const handleSelectTemplate = (id: string) => {
        const next = templates.find((t) => t.id === id);
        if (!next) return;
        setSelectedTemplateId(id);
        setJsonDraft(next.definition);
    };

    return (
        <>
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/templates" />

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-text-main">Template Library</h2>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="h-9 px-3 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest"
                        >
                            New Template
                        </button>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs font-bold uppercase tracking-widest text-text-secondary">
                                Loading templates...
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs font-bold uppercase tracking-widest text-text-secondary">
                                No templates yet.
                            </div>
                        ) : (
                            templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleSelectTemplate(template.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                                        selectedTemplateId === template.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-100 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-bold text-text-main">{template.templateName}</p>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            template.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {template.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-secondary font-medium mt-1 leading-relaxed">{template.description}</p>
                                    <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                        <span>{template.triggerType}</span>
                                        <span>{template.version}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Editing Template</p>
                                <h3 className="text-xl font-display font-bold text-text-main">{selectedTemplate?.templateName || 'Select a template'}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => cloneMutation.mutate()}
                                    disabled={!selectedTemplate || cloneMutation.isPending}
                                    className="h-9 px-3 rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Clone Version
                                </button>
                                <button
                                    onClick={() => toggleStatusMutation.mutate()}
                                    disabled={!selectedTemplate || toggleStatusMutation.isPending}
                                    className="h-9 px-3 rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {selectedTemplate?.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => saveDraftMutation.mutate()}
                                    disabled={!selectedTemplate || saveDraftMutation.isPending}
                                    className="h-9 px-3 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Save size={12} /> {saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
                                </button>
                            </div>
                        </div>

                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">JSON Definition</label>
                        <textarea
                            value={jsonDraft}
                            onChange={(e) => setJsonDraft(e.target.value)}
                            rows={16}
                            disabled={!selectedTemplate}
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                        />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Validation Center</h3>
                            <button
                                onClick={() => {
                                    if (!selectedTemplate) {
                                        notify.warning('Select a template first.');
                                        return;
                                    }
                                    if (validation.ok) notify.success('Validation passed.');
                                    else notify.error(validation.message);
                                }}
                                className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-gray-50 flex items-center gap-1"
                            >
                                <Wand2 size={12} /> Run Full Validation
                            </button>
                        </div>

                        <div className={`mt-4 rounded-xl border p-4 ${validation.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                            <p className={`text-xs font-bold flex items-center gap-2 ${validation.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {validation.ok ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
                                {validation.message}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                            {[
                                { label: 'JSON Format', ok: validation.ok || jsonDraft.trim().startsWith('{') },
                                { label: 'Unique Node IDs', ok: validation.ok },
                                { label: 'Valid Next Refs', ok: validation.ok },
                                { label: 'Contains End Node', ok: validation.ok },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{item.label}</p>
                                    <p className={`text-xs font-bold mt-1 ${item.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{item.ok ? 'Pass' : 'Fail'}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                            <p className="text-xs font-medium text-blue-900 leading-relaxed">
                                Mocked actions are now stored locally and synced via TanStack + Zustand. Data persists in local storage for this browser.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsCreateOpen(false)} />
                <div className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center justify-between mb-7">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-text-main">New Flow Template</h2>
                            <p className="text-sm text-text-secondary font-medium mt-1">Create a new flow definition</p>
                        </div>
                        <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <span className="material-icons-round text-gray-400">close</span>
                        </button>
                    </div>
                    <div className="space-y-5">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Template Name</label>
                            <input
                                value={createForm.templateName}
                                onChange={(e) => setCreateForm((prev) => ({ ...prev, templateName: e.target.value }))}
                                placeholder="e.g. Welcome + Offer"
                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Description</label>
                            <input
                                value={createForm.description}
                                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Short description"
                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Trigger Type</label>
                            <select
                                value={createForm.triggerType}
                                onChange={(e) => setCreateForm((prev) => ({ ...prev, triggerType: e.target.value as FlowTemplateRecord['triggerType'] }))}
                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                            >
                                <option value="new_customer">New Customer</option>
                                <option value="repeat_visit">Repeat Visit</option>
                                <option value="inactive_customer">Inactive Customer</option>
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => createMutation.mutate()}
                                disabled={createMutation.isPending}
                                className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-70"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Template'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
