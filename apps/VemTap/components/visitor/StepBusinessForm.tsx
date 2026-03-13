import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

type PreviewField = {
    id?: string;
    type: string;
    question?: string;
    label?: string;
    options?: string[];
    isRequired?: boolean;
    required?: boolean;
    order?: number;
};

type PreviewForm = {
    id: string;
    title: string;
    description?: string;
    instructions?: string;
    type?: string;
    typeLabel?: string;
    businessName?: string;
    businessLogo?: string;
    branchName?: string;
    redirectLabel?: string;
    redirectUrl?: string;
    fields: PreviewField[];
};

interface StepBusinessFormProps {
    form: PreviewForm;
    onComplete: (answers: Record<string, any>) => void;
    onSkip: () => void;
}

export const StepBusinessForm: React.FC<StepBusinessFormProps> = ({ form, onComplete, onSkip }) => {
    const [answers, setAnswers] = useState<Record<string, any>>({});

    const normalizedFields = useMemo(
        () =>
            [...(form.fields || [])]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((field, index) => ({
                    ...field,
                    key: field.id || `field-${index}`,
                    label: field.question || field.label || `Question ${index + 1}`,
                })),
        [form.fields]
    );

    const requiredMissing = useMemo(() => {
        return normalizedFields.some((field) => {
            if (!(field.isRequired || field.required)) return false;
            const value = answers[field.key];
            if (field.type === 'radio' || field.type === 'select') return !value;
            if (field.type === 'checkbox') return !Array.isArray(value) || value.length === 0;
            return !String(value || '').trim();
        });
    }, [answers, normalizedFields]);

    const updateAnswer = (fieldKey: string, value: any) => {
        setAnswers((prev) => ({ ...prev, [fieldKey]: value }));
    };

    return (
        <motion.div
            key={`dynamic-form-${form.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-[420px] bg-white rounded-tl-[3.5rem] rounded-br-[3.5rem] p-8 pb-10 shadow-xl shadow-primary/10 border border-primary/10 relative overflow-hidden"
        >
            <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">BUSINESS FORM</span>
                <button
                    onClick={onSkip}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                >
                    Skip
                </button>
            </div>

            <div className="mb-6 flex items-center justify-center">
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
                    <div className="size-9 rounded-full bg-white border border-primary/20 overflow-hidden flex items-center justify-center">
                        {form.businessLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={form.businessLogo} alt={form.businessName || form.title} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-black text-primary">{(form.businessName || form.title).charAt(0)}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Business</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{form.businessName || 'Business'}</p>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2 text-center">{form.title}</h2>
            {form.description ? <p className="text-sm text-slate-500 mb-6 text-center">{form.description}</p> : null}
            {form.instructions ? (
                <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                    {form.instructions}
                </div>
            ) : null}

            <div className="space-y-5 text-left">
                {normalizedFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                            {field.label}
                            {field.isRequired || field.required ? ' *' : ''}
                        </label>

                        {(field.type === 'text' || field.type === 'number' || field.type === 'date') && (
                            <input
                                type={field.type === 'text' ? 'text' : field.type}
                                value={answers[field.key] || ''}
                                onChange={(e) => updateAnswer(field.key, e.target.value)}
                                className="w-full bg-primary/5 border-0 focus:ring-2 focus:ring-primary rounded-xl py-3.5 px-4 text-slate-900 placeholder:text-slate-400 transition-all"
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                        )}

                        {field.type === 'textarea' && (
                            <textarea
                                value={answers[field.key] || ''}
                                onChange={(e) => updateAnswer(field.key, e.target.value)}
                                className="w-full min-h-24 bg-primary/5 border-0 focus:ring-2 focus:ring-primary rounded-xl py-3.5 px-4 text-slate-900 placeholder:text-slate-400 transition-all resize-none"
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                        )}

                        {(field.type === 'radio' || field.type === 'select') && (
                            <div className="space-y-2">
                                {(field.options || []).map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => updateAnswer(field.key, option)}
                                        className={`w-full p-4 rounded-xl border-0 text-left text-sm font-semibold transition-all ${
                                            answers[field.key] === option
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-primary/5 text-slate-700 hover:bg-primary/10'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}

                        {field.type === 'checkbox' && (
                            <div className="space-y-2">
                                {(field.options || []).map((option) => {
                                    const selectedOptions: string[] = Array.isArray(answers[field.key]) ? answers[field.key] : [];
                                    const isChecked = selectedOptions.includes(option);
                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => {
                                                const next = isChecked
                                                    ? selectedOptions.filter((item) => item !== option)
                                                    : [...selectedOptions, option];
                                                updateAnswer(field.key, next);
                                            }}
                                            className={`w-full p-4 rounded-xl border-0 text-left text-sm font-semibold transition-all ${
                                                isChecked
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-primary/5 text-slate-700 hover:bg-primary/10'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={() => onComplete(answers)}
                disabled={requiredMissing}
                className="mt-8 w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-full shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Submit Form
            </button>

            {form.redirectLabel || form.redirectUrl ? (
                <p className="mt-3 text-center text-[11px] font-medium text-slate-400">
                    After submit, customers continue to {form.redirectLabel || form.redirectUrl}.
                </p>
            ) : null}
        </motion.div>
    );
};
