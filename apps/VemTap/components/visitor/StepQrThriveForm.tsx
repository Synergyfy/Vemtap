import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
    ChevronLeft, 
    Send, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    Info
} from 'lucide-react';
import { presets } from './presets';
import { VisitorHeader } from './VisitorHeader';

interface StepQrThriveFormProps {
    shortId: string;
    storeName: string;
    logoUrl?: string | null;
    isAuthenticated: boolean;
    onRequireAuth: (action: () => void) => void;
    onBack: () => void;
    onSuccess: () => void;
}

export const StepQrThriveForm: React.FC<StepQrThriveFormProps> = ({
    shortId,
    storeName,
    logoUrl,
    isAuthenticated,
    onRequireAuth,
    onBack,
    onSuccess
}) => {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { data: form, isLoading, error } = useQuery<any>({
        queryKey: ['qr-thrive-form', shortId],
        queryFn: async () => {
            return await api.get(`/qr-thrive/public/forms/${shortId}`);
        },
        enabled: !!shortId
    });

    const submitMutation = useMutation({
        mutationFn: async (payload: any) => {
            return await api.post(`/qr-thrive/public/forms/${shortId}/submit`, payload);
        },
        onSuccess: () => {
            setIsSubmitted(true);
        }
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm({
        mode: 'onChange'
    });

    const onFormSubmit = (data: any) => {
        const performSubmit = () => {
            submitMutation.mutate({ answers: data });
        };

        if (!isAuthenticated) {
            onRequireAuth(performSubmit);
        } else {
            performSubmit();
        }
    };

    if (isLoading) {
        return (
            <div className={presets.card}>
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="size-8 text-primary animate-spin mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Form...</p>
                </div>
            </div>
        );
    }

    if (error || !form) {
        return (
            <div className={presets.card}>
                <div className="text-center py-20 px-6">
                    <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
                    <p className="text-base font-bold text-slate-900">Oops! Form not found.</p>
                    <button onClick={onBack} className="mt-4 text-xs font-black text-primary uppercase underline underline-offset-4">Go back</button>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={presets.card}>
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="size-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="size-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">
                        Thank You!
                    </h2>
                    <p className="text-sm font-medium text-slate-500 max-w-[280px]">
                        Your response has been successfully submitted via QR-Thrive.
                    </p>

                    <div className="mt-10 w-full">
                        <button 
                            onClick={onSuccess}
                            className={presets.button}
                        >
                            <span>Continue</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={presets.card}>
            <button
                onClick={onBack}
                disabled={submitMutation.isPending}
                className="absolute top-8 right-8 size-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors group disabled:opacity-50"
            >
                <ChevronLeft className="size-4 text-gray-400 group-hover:text-primary transition-colors" />
            </button>

            <VisitorHeader logoUrl={logoUrl} storeName={storeName} />

            <div className="mb-8">
                <span className={presets.tag}>{form.type === 'booking' ? 'Reservation' : 'Fill Form'}</span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                    {form.name}
                </h1>
                <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                    "Please fill out the details below to proceed."
                </p>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-4">
                {form.fields?.map((field: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                        </label>

                        {field.type === 'text' || field.type === 'number' || field.type === 'email' || field.type === 'date' || field.type === 'time' ? (
                            <input
                                type={field.type}
                                {...register(field.label, { required: field.required })}
                                placeholder={field.placeholder || field.label}
                                className={presets.input}
                            />
                        ) : field.type === 'textarea' ? (
                            <textarea
                                {...register(field.label, { required: field.required })}
                                rows={3}
                                placeholder="..."
                                className={`${presets.input} py-3 h-auto resize-none`}
                            />
                        ) : field.type === 'select' ? (
                            <select
                                {...register(field.label, { required: field.required })}
                                className={presets.input}
                            >
                                <option value="">Select an option...</option>
                                {field.options?.map((opt: string) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : field.type === 'radio' ? (
                            <div className="grid grid-cols-1 gap-2">
                                {field.options?.map((opt: string) => (
                                    <label key={opt} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary/20 transition-all cursor-pointer group">
                                        <input
                                            type="radio"
                                            value={opt}
                                            {...register(field.label, { required: field.required })}
                                            className="size-4 accent-primary"
                                        />
                                        <span className="text-sm font-bold text-slate-600 group-hover:text-primary">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ) : field.type === 'checkbox' ? (
                            <div className="grid grid-cols-1 gap-2">
                                {field.options?.map((opt: string) => (
                                    <label key={opt} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary/20 transition-all cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            value={opt}
                                            {...register(`${field.label}.${opt}`, { required: field.required })}
                                            className="size-4 accent-primary"
                                        />
                                        <span className="text-sm font-bold text-slate-600 group-hover:text-primary">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ))}

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={!isValid || submitMutation.isPending} 
                        className={presets.button}
                    >
                        {submitMutation.isPending ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : (
                            <>
                                <span>Submit Response</span>
                                <Send className="size-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};
