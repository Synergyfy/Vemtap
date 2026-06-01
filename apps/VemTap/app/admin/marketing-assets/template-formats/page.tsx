"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplateFormats, useCreateTemplateFormat, useUpdateTemplateFormat, useDeleteTemplateFormat } from '@/services/marketing-assets/hooks';
import { Crop, Plus, Trash2, Edit, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminTemplateFormatsPage() {
  const { data: formats, isLoading } = useTemplateFormats(true);
  const createMutation = useCreateTemplateFormat();
  const updateMutation = useUpdateTemplateFormat();
  const deleteMutation = useDeleteTemplateFormat();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [widthMm, setWidthMm] = useState(210);
  const [heightMm, setHeightMm] = useState(297);
  const [bleedMm, setBleedMm] = useState(3);
  const [printMarginMm, setPrintMarginMm] = useState(5);
  const [resolution, setResolution] = useState(300);

  const resetForm = () => {
    setName('');
    setSlug('');
    setWidthMm(210);
    setHeightMm(297);
    setBleedMm(3);
    setPrintMarginMm(5);
    setResolution(300);
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (f: any) => {
    setName(f.name);
    setSlug(f.slug || '');
    setWidthMm(f.widthMm);
    setHeightMm(f.heightMm);
    setBleedMm(f.bleedMm ?? 3);
    setPrintMarginMm(f.printMarginMm ?? 5);
    setResolution(f.resolution ?? 300);
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Format name is required');
      return;
    }
    if (widthMm <= 0 || heightMm <= 0) {
      toast.error('Dimensions must be greater than zero');
      return;
    }
    const payload: any = {
      name: name.trim(),
      widthMm, heightMm,
      bleedMm, printMarginMm, resolution,
    };
    if (slug.trim()) payload.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: payload });
        toast.success('Format updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Format created');
      }
      resetForm();
    } catch {
      toast.error(editingId ? 'Failed to update format' : 'Failed to create format');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this format? This cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Format deleted');
    } catch {
      toast.error('Failed to delete format');
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { isActive: !current } });
      toast.success(`Format ${!current ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Crop className="text-primary size-5" />
            Template Formats
          </h3>
          <Button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
            className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2">
            {showForm ? <X size={16} /> : <Plus size={16} className="stroke-[3px]" />}
            {showForm ? 'Cancel' : 'Add Format'}
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6 space-y-4 overflow-hidden"
            >
              <h4 className="font-extrabold text-gray-800 text-sm">
                {editingId ? 'Edit Format' : 'New Format'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Name *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="A4 Poster" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Slug</label>
                    <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="poster_a4" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Width (mm) *</label>
                    <input type="number" value={widthMm} onChange={(e) => setWidthMm(Number(e.target.value))} min={1} className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Height (mm) *</label>
                    <input type="number" value={heightMm} onChange={(e) => setHeightMm(Number(e.target.value))} min={1} className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Bleed (mm)</label>
                    <input type="number" value={bleedMm} onChange={(e) => setBleedMm(Number(e.target.value))} min={0} step={0.5} className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Print Margin (mm)</label>
                    <input type="number" value={printMarginMm} onChange={(e) => setPrintMarginMm(Number(e.target.value))} min={0} step={0.5} className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Resolution (DPI)</label>
                    <input type="number" value={resolution} onChange={(e) => setResolution(Number(e.target.value))} min={72} step={1} className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/50">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-white rounded-xl text-xs font-bold gap-2">
                    <Save size={12} />
                    {editingId ? 'Save Changes' : 'Create Format'}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : !formats || formats.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex size-14 bg-gray-50 text-gray-400 rounded-full items-center justify-center">
              <Crop size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900">No formats yet</h4>
              <p className="text-xs text-gray-500">Create your first print format preset.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-extrabold uppercase text-gray-400">
                  <th className="pb-3 pl-2">Format</th>
                  <th className="pb-3">Slug</th>
                  <th className="pb-3">Dimensions</th>
                  <th className="pb-3">Bleed</th>
                  <th className="pb-3">Margin</th>
                  <th className="pb-3">DPI</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                {formats.map((f) => (
                  <tr key={f.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-2 font-bold text-gray-900">{f.name}</td>
                    <td className="py-4 text-xs font-mono text-gray-400">{f.slug || '-'}</td>
                    <td className="py-4 text-xs text-gray-700 font-mono">{f.widthMm} x {f.heightMm} mm</td>
                    <td className="py-4 text-xs text-gray-500">{f.bleedMm} mm</td>
                    <td className="py-4 text-xs text-gray-500">{f.printMarginMm} mm</td>
                    <td className="py-4 text-xs font-mono text-gray-500">{f.resolution}</td>
                    <td className="py-4">
                      <button onClick={() => handleToggleActive(f.id, f.isActive)} className="focus:outline-none hover:scale-[1.05] transition-transform text-left">
                        {f.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400 border border-gray-200">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-4 pr-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button onClick={() => openEdit(f)} variant="outline" className="rounded-xl border-gray-100 text-gray-700 hover:bg-gray-50 font-bold text-xs gap-1 h-9">
                          <Edit size={12} /> Edit
                        </Button>
                        <Button onClick={() => handleDelete(f.id)} variant="outline" className="rounded-xl border-rose-50 text-rose-600 hover:bg-rose-50/50 font-bold text-xs gap-1.5 h-9">
                          <Trash2 size={12} /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
