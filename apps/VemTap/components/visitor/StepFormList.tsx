import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
    ClipboardList, 
    ArrowRight,
    ChevronLeft,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { presets } from './presets';
import { VisitorHeader } from './VisitorHeader';
import type { BusinessForm } from '@/services/business-forms/types';

interface StepFormListProps {
    branchId: string;
    storeName: string;
    logoUrl?: string | null;
    onSelect: (form: BusinessForm) => void;
    onBack: () => void;
}

export const StepFormList: React.FC<StepFormListProps> = ({
    branchId,
    storeName,
    logoUrl,
    onSelect,
    onBack
}) => {
    const { data: forms, isLoading, error } = useQuery<BusinessForm[]>({
        queryKey: ['visitor-forms', branchId],
        queryFn: async () => {
            const response = await api.get(`/visitor-forms/branch/${branchId}`);
            return Array.isArray(response) ? response : (response as any)?.data || [];
        },
        enabled: !!branchId
    });

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={presets.card}
        >
            <button
                onClick={onBack}
                className="absolute top-8 right-8 size-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors group"
            >
                <ChevronLeft className="size-4 text-gray-400 group-hover:text-primary transition-colors" />
            </button>

            <VisitorHeader logoUrl={logoUrl} storeName={storeName} />

            <div className="mb-8">
                <span className={presets.tag}>Fill Feedback</span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                    Share your Thoughts
                </h1>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Select a form below to let us know how we're doing.
                </p>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="size-8 text-primary animate-spin mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Forms...</p>
                </div>
            ) : error ? (
                <div className="text-center py-12 px-6">
                    <p className="text-sm font-bold text-red-500">Failed to load forms.</p>
                    <button onClick={onBack} className="mt-4 text-xs font-black text-primary uppercase underline underline-offset-4">Go back</button>
                </div>
            ) : forms?.length === 0 ? (
                <div className="text-center py-12 px-6">
                    <p className="text-sm font-bold text-slate-400">No active forms available.</p>
                    <button onClick={onBack} className="mt-4 text-xs font-black text-primary uppercase underline underline-offset-4">Go back</button>
                </div>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {forms?.map((form) => (
                        <button
                            key={form.id}
                            onClick={() => onSelect(form)}
                            className="w-full flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white hover:border-primary/20 hover:bg-slate-50/50 transition-all group text-left"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <ClipboardList className="size-4 text-primary" />
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary">
                                        {form.title}
                                    </h3>
                                </div>
                                {form.description && (
                                    <p className="text-[11px] font-medium text-slate-400 line-clamp-1">
                                        {form.description}
                                    </p>
                                )}
                            </div>
                            <div className="size-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all ml-4">
                                <ArrowRight className="size-4 text-slate-400 group-hover:text-white" />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <p className="text-[10px] font-bold text-slate-400 leading-tight italic">
                    Your feedback helps us provide a better experience for everyone.
                </p>
            </div>
        </motion.div>
    );
};
