"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMarketingSettings, useUpsertMarketingSetting, useDeleteMarketingSetting } from '@/services/marketing-assets/hooks';
import { Settings, Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useMarketingSettings();
  const upsertMutation = useUpsertMarketingSetting();
  const deleteMutation = useDeleteMarketingSetting();

  const [showForm, setShowForm] = useState(false);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setKey('');
    setValue('');
    setType('');
    setDescription('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) {
      toast.error('Key and value are required');
      return;
    }
    try {
      await upsertMutation.mutateAsync({ key: key.trim(), value: value.trim(), type: type || undefined, description: description.trim() || undefined });
      toast.success('Setting saved');
      resetForm();
    } catch {
      toast.error('Failed to save setting');
    }
  };

  const handleDelete = async (k: string) => {
    if (!confirm(`Delete setting "${k}"?`)) return;
    try {
      await deleteMutation.mutateAsync(k);
      toast.success('Setting deleted');
    } catch {
      toast.error('Failed to delete setting');
    }
  };

  const predefinedKeys = [
    { key: 'ai_daily_limit', value: '50', type: 'number', description: 'Daily AI generation limit per business' },
    { key: 'ai_tone_options', value: '["Friendly","Professional","Luxury","Bold","Minimal"]', type: 'json', description: 'Available AI tone options' },
    { key: 'max_formats_per_template', value: '10', type: 'number', description: 'Maximum format options per template' },
    { key: 'asset_retention_days', value: '30', type: 'number', description: 'Days before soft-deleted assets are permanently removed' },
    { key: 'max_brand_overrides', value: '1', type: 'number', description: 'Maximum brand override profiles per business' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-primary size-5" />
            System Settings
          </h3>
          <Button
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
            className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2"
          >
            {showForm ? <X size={16} /> : <Plus size={16} className="stroke-[3px]" />}
            {showForm ? 'Cancel' : 'Add Setting'}
          </Button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6 space-y-4 overflow-hidden"
          >
            <h4 className="font-extrabold text-gray-800 text-sm">New Setting</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold">Key *</label>
                  <input type="text" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ai_daily_limit" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {predefinedKeys.filter(pk => !settings?.find(s => s.key === pk.key)).map(pk => (
                      <button key={pk.key} type="button" onClick={() => { setKey(pk.key); setValue(pk.value); setType(pk.type); setDescription(pk.description); }} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary font-bold transition-colors">
                        {pk.key}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold">Value *</label>
                  <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="50" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-gray-700 cursor-pointer">
                    <option value="">Auto</option>
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="json">json</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold">Description</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Daily AI generation limit" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/50">
                <Button type="submit" disabled={upsertMutation.isPending} className="bg-primary text-white rounded-xl text-xs font-bold gap-2">
                  <Save size={12} /> Save Setting
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : !settings || settings.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex size-14 bg-gray-50 text-gray-400 rounded-full items-center justify-center">
              <Settings size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900">No settings configured</h4>
              <p className="text-xs text-gray-500">Add system settings or use the quick-add buttons above.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-extrabold uppercase text-gray-400">
                  <th className="pb-3 pl-2">Key</th>
                  <th className="pb-3">Value</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                {settings.map((s) => (
                  <tr key={s.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-2 font-mono text-xs font-bold text-gray-900">{s.key}</td>
                    <td className="py-4 font-mono text-xs text-gray-600 max-w-[200px] truncate">{s.value}</td>
                    <td className="py-4"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold">{s.type || 'auto'}</span></td>
                    <td className="py-4 text-xs text-gray-500">{s.description || '-'}</td>
                    <td className="py-4 pr-2 text-right">
                      <Button onClick={() => handleDelete(s.key)} variant="outline" className="rounded-xl border-rose-50 text-rose-600 hover:bg-rose-50/50 font-bold text-xs gap-1.5 h-9">
                        <Trash2 size={12} /> Delete
                      </Button>
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
