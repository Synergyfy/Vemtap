import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { flowTemplates as seedTemplates, sampleTemplateJson } from '@/components/admin/flow-engine/mockData';

export type FlowTemplateRecord = {
    id: string;
    templateName: string;
    description: string;
    triggerType: 'new_customer' | 'repeat_visit' | 'inactive_customer';
    version: string;
    status: 'active' | 'inactive';
    sessions: number;
    lastUpdated: string;
    definition: string;
};

type CreateTemplateInput = {
    templateName: string;
    description: string;
    triggerType: FlowTemplateRecord['triggerType'];
    definition?: string;
};

interface FlowTemplatesState {
    templates: FlowTemplateRecord[];
    hydrateIfEmpty: () => void;
    setTemplates: (templates: FlowTemplateRecord[]) => void;
    addTemplate: (input: CreateTemplateInput) => FlowTemplateRecord;
    updateTemplate: (id: string, data: Partial<Omit<FlowTemplateRecord, 'id'>>) => FlowTemplateRecord | null;
    cloneTemplate: (id: string) => FlowTemplateRecord | null;
    toggleStatus: (id: string) => FlowTemplateRecord | null;
    deleteTemplate: (id: string) => boolean;
}

const formatTimestamp = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);
    return `${date} ${time}`;
};

const createId = () => `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const bumpVersion = (version: string) => {
    const match = version.match(/v(\d+)/i);
    const num = match ? Number(match[1]) : 0;
    return `v${num + 1}`;
};

export const useFlowTemplatesStore = create<FlowTemplatesState>()(
    persist(
        (set, get) => ({
            templates: [],
            hydrateIfEmpty: () => {
                const current = get().templates;
                if (current.length > 0) return;
                const seeded = seedTemplates.map((t) => ({
                    ...t,
                    definition: sampleTemplateJson,
                }));
                set({ templates: seeded });
            },
            setTemplates: (templates) => set({ templates }),
            addTemplate: (input) => {
                const next: FlowTemplateRecord = {
                    id: createId(),
                    templateName: input.templateName,
                    description: input.description,
                    triggerType: input.triggerType,
                    version: 'v1',
                    status: 'inactive',
                    sessions: 0,
                    lastUpdated: formatTimestamp(),
                    definition: input.definition || sampleTemplateJson,
                };
                set((state) => ({ templates: [next, ...state.templates] }));
                return next;
            },
            updateTemplate: (id, data) => {
                let updated: FlowTemplateRecord | null = null;
                set((state) => ({
                    templates: state.templates.map((t) => {
                        if (t.id !== id) return t;
                        updated = {
                            ...t,
                            ...data,
                            lastUpdated: formatTimestamp(),
                        };
                        return updated;
                    }),
                }));
                return updated;
            },
            cloneTemplate: (id) => {
                const source = get().templates.find((t) => t.id === id);
                if (!source) return null;
                const clone: FlowTemplateRecord = {
                    ...source,
                    id: createId(),
                    templateName: `${source.templateName} Copy`,
                    version: bumpVersion(source.version),
                    status: 'inactive',
                    sessions: 0,
                    lastUpdated: formatTimestamp(),
                };
                set((state) => ({ templates: [clone, ...state.templates] }));
                return clone;
            },
            toggleStatus: (id) => {
                let updated: FlowTemplateRecord | null = null;
                set((state) => ({
                    templates: state.templates.map((t) => {
                        if (t.id !== id) return t;
                        updated = {
                            ...t,
                            status: t.status === 'active' ? 'inactive' : 'active',
                            lastUpdated: formatTimestamp(),
                        };
                        return updated;
                    }),
                }));
                return updated;
            },
            deleteTemplate: (id) => {
                const exists = get().templates.some((template) => template.id === id);
                if (!exists) return false;
                set((state) => ({
                    templates: state.templates.filter((template) => template.id !== id),
                }));
                return true;
            },
        }),
        {
            name: 'vemtap-flow-templates',
        }
    )
);
