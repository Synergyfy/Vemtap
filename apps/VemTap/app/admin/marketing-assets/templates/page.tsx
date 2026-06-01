"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useMarketingTemplates, useDeleteMarketingTemplate, useUpdateMarketingTemplate, useCreateMarketingTemplate } from '@/services/marketing-assets/hooks';
import { Layers, Plus, Trash2, Edit, CheckCircle, XCircle, Copy } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminTemplatesListPage() {
  const { data: templates, isLoading } = useMarketingTemplates(undefined, undefined, true);
  const deleteMutation = useDeleteMarketingTemplate();
  const updateMutation = useUpdateMarketingTemplate();
  const createMutation = useCreateMarketingTemplate();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template from the platform catalog?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Template deleted from catalog');
    } catch (e) {
      toast.error('Failed to delete template');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { isActive: !currentStatus } });
      toast.success(`Template ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (e) {
      toast.error('Failed to update template status');
    }
  };

  const handleDuplicate = async (template: any) => {
    try {
      const payload = {
        name: `${template.name} (Copy)`,
        category: template.category,
        type: template.type,
        thumbnailUrl: template.thumbnailUrl,
        layoutConfig: template.layoutConfig,
        qrCodeConfig: template.qrCodeConfig,
        isActive: template.isActive
      };
      await createMutation.mutateAsync(payload);
      toast.success('Template duplicated successfully');
    } catch (e) {
      toast.error('Failed to duplicate template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers className="text-primary size-5" />
            Base Design Presets Catalog
          </h3>
          <Link href="/admin/marketing-assets/templates/create">
            <Button className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2">
              <Plus size={16} className="stroke-[3px]" />
              New Template
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !templates || templates.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex size-14 bg-gray-50 text-gray-400 rounded-full items-center justify-center">
              <Layers size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900">No template presets created yet</h4>
              <p className="text-xs text-gray-500">
                Click the button above to define your first layout canvas preset.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-extrabold uppercase text-gray-400">
                  <th className="pb-3 pl-2">Template Preset</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Design Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                {templates.map((template) => (
                  <tr key={template.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-2 font-bold text-gray-900">
                      {template.name}
                    </td>
                    <td className="py-4 font-mono text-xs uppercase text-gray-500">
                      {template.category}
                    </td>
                    <td className="py-4 capitalize">
                      {template.type.replace('_', ' ')}
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleToggleActive(template.id, template.isActive)}
                        className="focus:outline-none hover:scale-[1.05] transition-transform text-left"
                        title="Click to toggle status"
                      >
                        {template.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">
                            <CheckCircle size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400 border border-gray-200">
                            <XCircle size={12} />
                            Disabled
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-4 pr-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          onClick={() => handleDuplicate(template)}
                          variant="outline" 
                          className="rounded-xl border-gray-100 text-gray-700 hover:bg-gray-50 font-bold text-xs gap-1.5 h-9"
                        >
                          <Copy size={12} />
                          Duplicate
                        </Button>
                        <Link href={`/admin/marketing-assets/templates/${template.id}`}>
                          <Button variant="outline" className="rounded-xl border-gray-100 text-gray-700 hover:bg-gray-50 font-bold text-xs gap-1 h-9">
                            <Edit size={12} />
                            Edit Builder
                          </Button>
                        </Link>
                        <Button 
                          onClick={() => handleDelete(template.id)}
                          variant="outline" 
                          className="rounded-xl border-rose-50 text-rose-600 hover:bg-rose-50/50 font-bold text-xs gap-1.5 h-9"
                        >
                          <Trash2 size={12} />
                          Delete
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
