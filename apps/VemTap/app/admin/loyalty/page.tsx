"use client";

import PageHeader from '@/components/dashboard/PageHeader';
import { LoyaltyTemplateManager } from '@/components/loyalty/admin/LoyaltyTemplateManager';
import { useLoyaltyTemplates, useCreateLoyaltyTemplate, useUpdateLoyaltyTemplate, useDeleteLoyaltyTemplate } from '@/services/loyalty/hooks';
import { Loader2 } from 'lucide-react';

export default function AdminLoyaltyPage() {
    const { data: templates = [], isLoading } = useLoyaltyTemplates();
    const createMutation = useCreateLoyaltyTemplate();
    const updateMutation = useUpdateLoyaltyTemplate();
    const deleteMutation = useDeleteLoyaltyTemplate();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-24">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10">
            <LoyaltyTemplateManager
                templates={templates}
                onCreate={(template) => createMutation.mutate(template)}
                onUpdate={(id, updates) => updateMutation.mutate({ id, updates })}
                onDelete={(id) => deleteMutation.mutate(id)}
            />
        </div>
    );
}
