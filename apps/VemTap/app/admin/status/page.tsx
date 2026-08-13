'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import Modal from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';
import {
    Plus, Pencil, Trash2, Server, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';
import {
    useAdminComponents,
    useAdminIncidents,
    useCreateComponent,
    useUpdateComponent,
    useDeleteComponent,
    useCreateIncident,
    useUpdateIncident,
    useDeleteIncident,
    SystemComponent,
    Incident,
    SystemComponentStatus,
    IncidentSeverity,
    IncidentStatus,
} from '@/services/status/hooks';

type Tab = 'components' | 'incidents';

const COMPONENT_STATUS_OPTIONS: SystemComponentStatus[] = ['operational', 'degraded', 'outage'];
const INCIDENT_SEVERITY_OPTIONS: IncidentSeverity[] = ['minor', 'major', 'critical'];
const INCIDENT_STATUS_OPTIONS: IncidentStatus[] = ['investigating', 'identified', 'monitoring', 'resolved'];

const STATUS_BADGE: Record<string, string> = {
    operational: 'bg-emerald-50 text-emerald-600',
    degraded: 'bg-amber-50 text-amber-600',
    outage: 'bg-red-50 text-red-600',
    investigating: 'bg-orange-50 text-orange-600',
    identified: 'bg-blue-50 text-blue-600',
    monitoring: 'bg-purple-50 text-purple-600',
    resolved: 'bg-emerald-50 text-emerald-600',
    minor: 'bg-emerald-50 text-emerald-600',
    major: 'bg-amber-50 text-amber-600',
    critical: 'bg-red-50 text-red-600',
};

export default function AdminStatusPage() {
    const [tab, setTab] = useState<Tab>('components');
    const [editingComponent, setEditingComponent] = useState<SystemComponent | null>(null);
    const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
    const [showComponentModal, setShowComponentModal] = useState(false);
    const [showIncidentModal, setShowIncidentModal] = useState(false);

    const { data: components = [], isLoading: loadingComponents, refetch: refetchComponents } = useAdminComponents();
    const { data: incidents = [], isLoading: loadingIncidents, refetch: refetchIncidents } = useAdminIncidents();

    const createComponent = useCreateComponent();
    const updateComponent = useUpdateComponent(editingComponent?.id || '');
    const deleteComponent = useDeleteComponent();

    const createIncident = useCreateIncident();
    const updateIncident = useUpdateIncident(editingIncident?.id || '');
    const deleteIncident = useDeleteIncident();

    const handleComponentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const payload: Partial<SystemComponent> = {
            slug: String(form.get('slug') || ''),
            name: String(form.get('name') || ''),
            status: form.get('status') as SystemComponentStatus,
            latencyMs: form.get('latencyMs') ? Number(form.get('latencyMs')) : null,
            uptime90d: String(form.get('uptime90d') || '99.98%'),
            sortOrder: Number(form.get('sortOrder') || 0),
            isActive: form.get('isActive') === 'on' || form.get('isActive') === 'true',
        };
        try {
            if (editingComponent) {
                await updateComponent.mutateAsync(payload);
                toast.success('Component updated');
            } else {
                await createComponent.mutateAsync(payload);
                toast.success('Component created');
            }
            setShowComponentModal(false);
            setEditingComponent(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save component');
        }
    };

    const handleIncidentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const payload: Partial<Incident> = {
            title: String(form.get('title') || ''),
            description: String(form.get('description') || ''),
            componentSlug: String(form.get('componentSlug') || '') || undefined,
            severity: form.get('severity') as IncidentSeverity,
            status: form.get('status') as IncidentStatus,
            occurredAt: String(form.get('occurredAt') || new Date().toISOString()),
            resolvedAt: String(form.get('resolvedAt') || '') || undefined,
        };
        try {
            if (editingIncident) {
                await updateIncident.mutateAsync(payload);
                toast.success('Incident updated');
            } else {
                await createIncident.mutateAsync(payload);
                toast.success('Incident created');
            }
            setShowIncidentModal(false);
            setEditingIncident(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save incident');
        }
    };

    const confirmDeleteComponent = (component: SystemComponent) => {
        if (!window.confirm(`Delete component "${component.name}"?`)) return;
        deleteComponent.mutateAsync(component.id).then(() => {
            toast.success('Component deleted');
        }).catch(() => toast.error('Failed to delete component'));
    };

    const confirmDeleteIncident = (incident: Incident) => {
        if (!window.confirm(`Delete incident "${incident.title}"?`)) return;
        deleteIncident.mutateAsync(incident.id).then(() => {
            toast.success('Incident deleted');
        }).catch(() => toast.error('Failed to delete incident'));
    };

    const toDatetimeLocal = (value?: string | null) => {
        if (!value) return '';
        const d = new Date(value);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    return (
        <div className="p-8">
            <PageHeader
                title="Status Page Management"
                description="Manage the public status page components and incidents"
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { tab === 'components' ? refetchComponents() : refetchIncidents(); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                        <button
                            onClick={() => {
                                if (tab === 'components') {
                                    setEditingComponent(null);
                                    setShowComponentModal(true);
                                } else {
                                    setEditingIncident(null);
                                    setShowIncidentModal(true);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-sm"
                        >
                            <Plus size={16} />
                            {tab === 'components' ? 'Add Component' : 'Add Incident'}
                        </button>
                    </div>
                }
            />

            {/* Tabs */}
            <div className="mt-8 flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
                <button
                    onClick={() => setTab('components')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'components' ? 'bg-white text-text-main shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
                >
                    Components
                </button>
                <button
                    onClick={() => setTab('incidents')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'incidents' ? 'bg-white text-text-main shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
                >
                    Incidents
                </button>
            </div>

            {/* Components Table */}
            {tab === 'components' && (
                <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {loadingComponents ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                    ) : components.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Server size={32} className="text-gray-300 mb-4" />
                            <p className="text-text-secondary font-medium">No components yet. Add your first status component.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Slug</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Latency</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Uptime 90d</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Sort</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Active</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {components.map((component) => (
                                    <tr key={component.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-text-main">{component.name}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-text-secondary">{component.slug}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[component.status] || 'bg-gray-50 text-gray-500'}`}>
                                                {component.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary font-medium">{component.latencyMs != null ? `${component.latencyMs}ms` : '—'}</td>
                                        <td className="px-6 py-4 text-text-secondary font-medium">{component.uptime90d}</td>
                                        <td className="px-6 py-4 text-text-secondary font-medium">{component.sortOrder}</td>
                                        <td className="px-6 py-4">
                                            <span className={`size-2.5 rounded-full inline-block ${component.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingComponent(component); setShowComponentModal(true); }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-text-secondary hover:text-primary transition-colors"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => confirmDeleteComponent(component)}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-text-secondary hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Incidents Table */}
            {tab === 'incidents' && (
                <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {loadingIncidents ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                    ) : incidents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <AlertTriangle size={32} className="text-gray-300 mb-4" />
                            <p className="text-text-secondary font-medium">No incidents recorded.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Title</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Severity</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Component</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Occurred</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {incidents.map((incident) => (
                                    <tr key={incident.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-text-main">{incident.title}</p>
                                            <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{incident.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[incident.severity] || 'bg-gray-50 text-gray-500'}`}>
                                                {incident.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[incident.status] || 'bg-gray-50 text-gray-500'}`}>
                                                {incident.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-text-secondary">{incident.componentSlug || '—'}</td>
                                        <td className="px-6 py-4 text-text-secondary font-medium">{new Date(incident.occurredAt).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingIncident(incident); setShowIncidentModal(true); }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-text-secondary hover:text-primary transition-colors"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => confirmDeleteIncident(incident)}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-text-secondary hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Component Modal */}
            <Modal
                isOpen={showComponentModal}
                onClose={() => { setShowComponentModal(false); setEditingComponent(null); }}
                title={editingComponent ? 'Edit Component' : 'Add Component'}
                description="Shown on the public /status page as a system component."
                size="lg"
            >
                <form onSubmit={handleComponentSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Name</label>
                            <input name="name" required defaultValue={editingComponent?.name || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium" placeholder="NFC Response API" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Slug</label>
                            <input name="slug" required disabled={!!editingComponent} defaultValue={editingComponent?.slug || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium disabled:opacity-50" placeholder="nfc-response-api" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Status</label>
                            <select name="status" defaultValue={editingComponent?.status || 'operational'} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium">
                                {COMPONENT_STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Latency (ms)</label>
                            <input name="latencyMs" type="number" min="0" defaultValue={editingComponent?.latencyMs != null ? String(editingComponent.latencyMs) : ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium" placeholder="12" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Uptime 90d</label>
                            <input name="uptime90d" defaultValue={editingComponent?.uptime90d || '99.98%'} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Sort Order</label>
                            <input name="sortOrder" type="number" defaultValue={editingComponent?.sortOrder || 0} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium" />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input name="isActive" type="checkbox" defaultChecked={editingComponent ? editingComponent.isActive : true} className="size-4 accent-primary" />
                                <span className="text-sm font-bold text-gray-600">Active</span>
                            </label>
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                        <button type="submit" disabled={createComponent.isPending || updateComponent.isPending} className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50">
                            {createComponent.isPending || updateComponent.isPending ? 'Saving...' : 'Save Component'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Incident Modal */}
            <Modal
                isOpen={showIncidentModal}
                onClose={() => { setShowIncidentModal(false); setEditingIncident(null); }}
                title={editingIncident ? 'Edit Incident' : 'Add Incident'}
                description="Incidents are listed in the Past Incidents section of the public status page."
                size="lg"
            >
                <form onSubmit={handleIncidentSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Title</label>
                        <input name="title" required defaultValue={editingIncident?.title || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium" placeholder="Increased Latency in EU-West Region" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description</label>
                        <textarea name="description" required rows={3} defaultValue={editingIncident?.description || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none" placeholder="What happened and how it was resolved..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Severity</label>
                            <select name="severity" defaultValue={editingIncident?.severity || 'minor'} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium">
                                {INCIDENT_SEVERITY_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Status</label>
                            <select name="status" defaultValue={editingIncident?.status || 'investigating'} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium">
                                {INCIDENT_STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Affected Component Slug</label>
                        <input name="componentSlug" defaultValue={editingIncident?.componentSlug || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium" placeholder="nfc-response-api" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div onClick={(e) => (e.currentTarget.querySelector<HTMLInputElement>('input[type="datetime-local"]')?.showPicker())}>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Occurred At</label>
                            <input name="occurredAt" type="datetime-local" defaultValue={toDatetimeLocal(editingIncident?.occurredAt) || toDatetimeLocal(new Date().toISOString())} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium cursor-pointer" />
                        </div>
                        <div onClick={(e) => (e.currentTarget.querySelector<HTMLInputElement>('input[type="datetime-local"]')?.showPicker())}>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Resolved At</label>
                            <input name="resolvedAt" type="datetime-local" defaultValue={toDatetimeLocal(editingIncident?.resolvedAt) || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium cursor-pointer" />
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                        <button type="submit" disabled={createIncident.isPending || updateIncident.isPending} className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50">
                            {createIncident.isPending || updateIncident.isPending ? 'Saving...' : 'Save Incident'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
