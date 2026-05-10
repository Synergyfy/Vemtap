"use client";

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, LayoutTemplate, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useLoyaltyTemplates, useDeleteLoyaltyTemplate } from '@/services/loyalty/hooks';
import { notify } from '@/lib/notify';

export default function AdminLoyaltyTemplatesPage() {
    const { data: templates = [], isLoading } = useLoyaltyTemplates();
    const deleteMutation = useDeleteLoyaltyTemplate();

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await deleteMutation.mutateAsync(id);
        } catch (err) {
            // Error handled by hook
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-900">Reward Templates</h2>
                    <p className="text-sm text-gray-500">Preset loyalty programs businesses can adopt with one click.</p>
                </div>
                <Button className="h-12 px-6 rounded-2xl bg-primary text-white gap-2 font-bold shadow-lg shadow-primary/20">
                    <Plus size={18} /> Create Template
                </Button>
            </div>

            {templates.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4">
                        <LayoutTemplate size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No templates yet</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Create your first loyalty template to help businesses get started quickly.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <motion.div
                            key={template.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 relative group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                    <Gift size={24} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(template.id)}
                                        className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                                    {template.isActive && <Badge variant="success">Active</Badge>}
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{template.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-50">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rule</p>
                                    <p className="text-sm font-semibold text-gray-700">{template.pointsRule || 'Standard'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</p>
                                    <p className="text-sm font-semibold text-primary uppercase">{template.rewardType.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
