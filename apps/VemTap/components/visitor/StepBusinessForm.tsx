import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { presets } from './presets';

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
            className={presets.card}
        >
            <div className="flex items-center justify-between mb-6">
                <span className={presets.tag}>BUSINESS FORM</span>
                <button
                    onClick={onSkip}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                >
                    Skip
                </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2">
                    <div className="size-10 rounded-xl bg-white border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                        {form.businessLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={form.businessLogo} alt={form.businessName || form.title} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-base font-black text-slate-900">{(form.businessName || form.title).charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business</p>
                        <p className="text-sm font-bold text-slate-900">{form.businessName || 'Business'}</p>
                    </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</p>
                    <p className="text-sm font-bold text-slate-900">{form.branchName || 'Main Branch'}</p>
                </div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">{form.title}</h2>
            {form.description ? <p className="text-sm text-slate-500 mb-4">{form.description}</p> : null}
            {form.instructions ? (
                <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                    {form.instructions}
                </div>
            ) : null}

            <div className="space-y-5 text-left">
                {normalizedFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                            {field.label}
                            {field.isRequired || field.required ? ' *' : ''}
                        </label>

                        {(field.type === 'text' || field.type === 'number' || field.type === 'date') && (
                            <input
                                type={field.type === 'text' ? 'text' : field.type}
                                value={answers[field.key] || ''}
                                onChange={(e) => updateAnswer(field.key, e.target.value)}
                                className="w-full h-12 p-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none text-sm font-medium"
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                        )}

                        {field.type === 'textarea' && (
                            <textarea
                                value={answers[field.key] || ''}
                                onChange={(e) => updateAnswer(field.key, e.target.value)}
                                className="w-full min-h-24 p-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none text-sm font-medium"
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                        )}

                        {(field.type === 'radio' || field.type === 'select') && (
                            <div className="space-y-2">
                                {(field.options || []).map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => updateAnswer(field.key, option)}
                                        className={`w-full p-3 rounded-xl border text-left text-sm font-bold transition-all ${answers[field.key] === option
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-gray-100 bg-gray-50 text-slate-700 hover:border-primary/30'
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
                                            className={`w-full p-3 rounded-xl border text-left text-sm font-bold transition-all ${isChecked
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-gray-100 bg-gray-50 text-slate-700 hover:border-primary/30'
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
                className={`${presets.button} mt-8 disabled:opacity-50 disabled:cursor-not-allowed`}
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
