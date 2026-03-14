"use client";

import React from 'react';
import { LoyaltyTemplateManager, LoyaltyTemplateDraft } from '@/components/loyalty/admin/LoyaltyTemplateManager';
import { useLoyaltyTemplates, useLoyaltyTemplateStore } from '@/services/loyalty/templates';

export default function AdminLoyaltyPage() {
    const templates = useLoyaltyTemplates() as LoyaltyTemplateDraft[];
    const addTemplate = useLoyaltyTemplateStore((s) => s.addTemplate);
    const updateTemplate = useLoyaltyTemplateStore((s) => s.updateTemplate);
    const deleteTemplate = useLoyaltyTemplateStore((s) => s.deleteTemplate);

    return (
        <div className="p-8 space-y-10">
            <LoyaltyTemplateManager
                templates={templates}
                onCreate={(template) => addTemplate(template)}
                onUpdate={(id, updates) => updateTemplate(id, updates)}
                onDelete={(id) => deleteTemplate(id)}
            />
        </div>
    );
}
