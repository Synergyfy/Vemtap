'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, FileJson2, Save, Wand2 } from 'lucide-react';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { flowTemplates, sampleTemplateJson } from '@/components/admin/flow-engine/mockData';

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
    const [jsonDraft, setJsonDraft] = useState(sampleTemplateJson);
    const [selectedTemplateId, setSelectedTemplateId] = useState(flowTemplates[0].id);

    const selectedTemplate = useMemo(
        () => flowTemplates.find((t) => t.id === selectedTemplateId) || flowTemplates[0],
        [selectedTemplateId],
    );

    const validation = useMemo(() => validateFlowJson(jsonDraft), [jsonDraft]);

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/templates" />

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-text-main">Template Library</h2>
                        <button className="h-9 px-3 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest">New Template</button>
                    </div>

                    <div className="space-y-3">
                        {flowTemplates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => setSelectedTemplateId(template.id)}
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
                        ))}
                    </div>
                </div>

                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Editing Template</p>
                                <h3 className="text-xl font-display font-bold text-text-main">{selectedTemplate.templateName}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="h-9 px-3 rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-gray-50">Clone Version</button>
                                <button className="h-9 px-3 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Save size={12} /> Save Draft</button>
                            </div>
                        </div>

                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">JSON Definition</label>
                        <textarea
                            value={jsonDraft}
                            onChange={(e) => setJsonDraft(e.target.value)}
                            rows={16}
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Validation Center</h3>
                            <button className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-gray-50 flex items-center gap-1">
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
                                This page is fully mocked. Save/activate/version actions are UI-only until API wiring starts.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
